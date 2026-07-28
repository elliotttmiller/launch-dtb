<?php
/**
 * QuickBooks webhook ingress and reconciliation queue.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_QuickBooksWebhookController' ) ) {
	return;
}

final class DTB_QuickBooksWebhookController {
	private const REST_NAMESPACE = 'dtb/v1';
	private const ROUTE          = '/webhooks/qbo';
	private const QUEUE_HOOK     = 'dtb_qbo_process_webhook_event';
	private const QUEUE_GROUP    = 'dtb-orders';
	private const MAX_BODY_BYTES = 262144;

	public static function register(): void {
		add_action( 'rest_api_init', [ self::class, 'register_route' ] );
		add_action( self::QUEUE_HOOK, [ self::class, 'process_event' ], 10, 1 );
	}

	public static function register_route(): void {
		register_rest_route( self::REST_NAMESPACE, self::ROUTE, [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ self::class, 'receive' ],
			'permission_callback' => '__return_true',
		] );
	}

	public static function receive( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$verifier = defined( 'DTB_QBO_WEBHOOK_VERIFIER_TOKEN' ) ? trim( (string) DTB_QBO_WEBHOOK_VERIFIER_TOKEN ) : '';
		if ( '' === $verifier ) {
			return new WP_Error( 'qbo_webhook_not_configured', 'QuickBooks webhook verification is not configured.', [ 'status' => 503 ] );
		}

		$body = $request->get_body();
		if ( '' === $body || strlen( $body ) > self::MAX_BODY_BYTES ) {
			return new WP_Error( 'qbo_webhook_invalid_body', 'Invalid QuickBooks webhook body.', [ 'status' => 400 ] );
		}

		$provided = trim( (string) $request->get_header( 'intuit-signature' ) );
		$expected = base64_encode( hash_hmac( 'sha256', $body, $verifier, true ) );
		if ( '' === $provided || ! hash_equals( $expected, $provided ) ) {
			return new WP_Error( 'qbo_webhook_invalid_signature', 'Invalid QuickBooks webhook signature.', [ 'status' => 401 ] );
		}

		$events = json_decode( $body, true );
		if ( ! is_array( $events ) || ! array_is_list( $events ) ) {
			return new WP_Error( 'qbo_webhook_invalid_payload', 'Invalid QuickBooks webhook payload.', [ 'status' => 400 ] );
		}
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			return new WP_Error( 'qbo_webhook_queue_unavailable', 'QuickBooks webhook queue is unavailable.', [ 'status' => 503 ] );
		}

		$accepted = 0;
		foreach ( $events as $event ) {
			$normalized = self::normalize_event( $event );
			if ( null === $normalized ) {
				continue;
			}
			as_enqueue_async_action( self::QUEUE_HOOK, [ $normalized ], self::QUEUE_GROUP, true );
			++$accepted;
		}

		return new WP_REST_Response( [ 'ok' => true, 'accepted' => $accepted ], 200 );
	}

	private static function normalize_event( mixed $event ): ?array {
		if ( ! is_array( $event ) ) {
			return null;
		}
		$id       = sanitize_text_field( (string) ( $event['id'] ?? '' ) );
		$type     = strtolower( sanitize_text_field( (string) ( $event['type'] ?? '' ) ) );
		$entity   = sanitize_text_field( (string) ( $event['intuitentityid'] ?? '' ) );
		$realm    = preg_replace( '/[^0-9]/', '', (string) ( $event['intuitaccountid'] ?? '' ) );
		$occurred = sanitize_text_field( (string) ( $event['time'] ?? '' ) );

		if ( '' === $id || '' === $entity || '' === $realm ) {
			return null;
		}
		if ( ! preg_match( '/^qbo\.(salesreceipt|refundreceipt)\.(created|updated|voided|deleted)\.v[0-9]+$/', $type ) ) {
			return null;
		}

		return [
			'id'            => substr( $id, 0, 191 ),
			'type'          => $type,
			'entity_id'     => substr( $entity, 0, 64 ),
			'realm_id'      => $realm,
			'occurred_at'   => substr( $occurred, 0, 64 ),
			'environment'   => function_exists( 'dtb_qbo_environment' ) ? dtb_qbo_environment() : '',
		];
	}

	public static function process_event( array $event ): void {
		$event_id = sanitize_text_field( (string) ( $event['id'] ?? '' ) );
		if ( '' === $event_id ) {
			return;
		}
		$dedupe_key = 'dtb_qbo_webhook_' . hash( 'sha256', $event_id );
		if ( false !== get_transient( $dedupe_key ) ) {
			return;
		}
		set_transient( $dedupe_key, 1, 30 * DAY_IN_SECONDS );

		$config = function_exists( 'dtb_qbo_config' ) ? dtb_qbo_config() : [];
		if ( (string) ( $config['realm_id'] ?? '' ) !== (string) ( $event['realm_id'] ?? '' ) ) {
			self::audit( 'qbo_webhook_realm_ignored', $event );
			return;
		}

		$type = (string) ( $event['type'] ?? '' );
		preg_match( '/^qbo\.(salesreceipt|refundreceipt)\.(created|updated|voided|deleted)\./', $type, $matches );
		$entity    = $matches[1] ?? '';
		$operation = $matches[2] ?? '';
		if ( '' === $entity || '' === $operation ) {
			return;
		}

		if ( 'salesreceipt' === $entity ) {
			self::reconcile_sales_receipt( (string) $event['entity_id'], $operation, $event );
			return;
		}
		self::audit( 'qbo_refund_webhook_observed', $event + [ 'operation' => $operation ] );
	}

	private static function reconcile_sales_receipt( string $entity_id, string $operation, array $event ): void {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			self::audit( 'qbo_webhook_woocommerce_unavailable', $event );
			return;
		}
		$orders = wc_get_orders( [
			'limit'      => 2,
			'return'     => 'objects',
			'meta_key'   => '_dtb_quickbooks_entity_id',
			'meta_value' => $entity_id,
		] );
		if ( 1 !== count( $orders ) || ! $orders[0] instanceof WC_Order ) {
			self::audit( 'qbo_sales_receipt_webhook_unmapped', $event + [ 'operation' => $operation ] );
			return;
		}
		$order = $orders[0];
		$order->update_meta_data( '_dtb_qbo_last_webhook_event_id', sanitize_text_field( (string) $event['id'] ) );
		$order->update_meta_data( '_dtb_qbo_last_webhook_operation', sanitize_key( $operation ) );
		$order->update_meta_data( '_dtb_qbo_last_webhook_at', sanitize_text_field( (string) ( $event['occurred_at'] ?? '' ) ) );
		if ( in_array( $operation, [ 'updated', 'voided', 'deleted' ], true ) ) {
			$order->update_meta_data( '_dtb_qbo_reconciliation_state', 'external_' . sanitize_key( $operation ) );
		}
		$order->save_meta_data();
		self::audit( 'qbo_sales_receipt_webhook_reconciled', $event + [ 'order_id' => $order->get_id(), 'operation' => $operation ] );
	}

	private static function audit( string $event, array $context ): void {
		$context = [
			'event_id'      => sanitize_text_field( (string) ( $context['id'] ?? '' ) ),
			'entity_id'     => sanitize_text_field( (string) ( $context['entity_id'] ?? '' ) ),
			'realm_suffix'  => substr( preg_replace( '/[^0-9]/', '', (string) ( $context['realm_id'] ?? '' ) ), -4 ),
			'operation'     => sanitize_key( (string) ( $context['operation'] ?? '' ) ),
			'order_id'      => absint( $context['order_id'] ?? 0 ),
		];
		if ( function_exists( 'dtb_ops_audit_log' ) ) {
			dtb_ops_audit_log( $event, $context );
		}
	}
}

DTB_QuickBooksWebhookController::register();
