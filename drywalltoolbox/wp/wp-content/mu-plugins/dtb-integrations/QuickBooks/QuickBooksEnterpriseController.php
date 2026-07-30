<?php
/**
 * Enterprise QuickBooks wp-admin read models.
 *
 * Exposes bounded, redacted operational views derived from WooCommerce,
 * QuickBooks projection metadata, and Action Scheduler. Remote accounting writes
 * remain queue-owned by the canonical dtb-orders pipeline.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_QuickBooksEnterpriseController {
	private const REST_NAMESPACE = 'dtb/v1';
	private const MAX_PAGE_SIZE  = 100;

	public static function register(): void {
		add_action( 'rest_api_init', [ self::class, 'register_routes' ] );
	}

	public static function register_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/enterprise',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ self::class, 'rest_view' ],
				'permission_callback' => [ self::class, 'can_manage' ],
				'args'                => [
					'view' => [
						'type'              => 'string',
						'default'           => 'overview',
						'sanitize_callback' => 'sanitize_key',
					],
					'page' => [
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					],
					'limit' => [
						'type'              => 'integer',
						'default'           => 25,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	public static function can_manage(): bool {
		return current_user_can( 'manage_options' );
	}

	public static function rest_view( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return new WP_Error( 'qbo_woocommerce_unavailable', 'WooCommerce order services are unavailable.', [ 'status' => 503 ] );
		}

		$view  = sanitize_key( (string) $request->get_param( 'view' ) );
		$page  = max( 1, absint( $request->get_param( 'page' ) ) );
		$limit = min( self::MAX_PAGE_SIZE, max( 1, absint( $request->get_param( 'limit' ) ) ) );

		$allowed = [ 'overview', 'transactions', 'refunds', 'customers', 'reconciliation', 'activity' ];
		if ( ! in_array( $view, $allowed, true ) ) {
			return new WP_Error( 'qbo_invalid_enterprise_view', 'Unsupported QuickBooks operations view.', [ 'status' => 400 ] );
		}

		$payload = match ( $view ) {
			'overview'       => self::overview(),
			'transactions'   => self::transactions( $page, $limit ),
			'refunds'        => self::refunds( $page, $limit ),
			'customers'      => self::customers( $limit ),
			'reconciliation' => self::reconciliation( $page, $limit ),
			'activity'       => self::activity( $limit ),
		};

		return new WP_REST_Response(
			[
				'ok'          => true,
				'view'        => $view,
				'generatedAt' => gmdate( 'c' ),
				'data'        => $payload,
			],
			200
		);
	}

	private static function overview(): array {
		$orders = wc_get_orders(
			[
				'limit'   => 100,
				'orderby' => 'date',
				'order'   => 'DESC',
				'status'  => array_keys( wc_get_order_statuses() ),
			]
		);

		$gross = 0.0;
		$refunded = 0.0;
		$synced = 0;
		$pending = 0;
		$failed = 0;
		$latest = [];

		foreach ( $orders as $order ) {
			if ( ! $order instanceof WC_Order ) {
				continue;
			}
			$gross += (float) $order->get_total();
			$refunded += abs( (float) $order->get_total_refunded() );
			$state = self::projection_state( $order );
			if ( 'synced' === $state ) {
				++$synced;
			} elseif ( 'failed' === $state ) {
				++$failed;
			} elseif ( $order->get_date_paid() ) {
				++$pending;
			}
			if ( count( $latest ) < 8 ) {
				$latest[] = self::order_row( $order );
			}
		}

		$total = count( $orders );
		$rate  = $total > 0 ? round( ( $synced / $total ) * 100, 1 ) : 0.0;

		return [
			'metrics' => [
				'gross'          => wc_format_decimal( $gross, 2 ),
				'refunded'       => wc_format_decimal( $refunded, 2 ),
				'synced'         => $synced,
				'pending'        => $pending,
				'failed'         => $failed,
				'syncRate'       => $rate,
				'sampleSize'     => $total,
				'currency'       => get_woocommerce_currency(),
			],
			'latest' => $latest,
			'connection' => DTB_QuickBooksAdminController::read_model(),
		];
	}

	private static function transactions( int $page, int $limit ): array {
		$result = wc_get_orders(
			[
				'limit'    => $limit,
				'page'     => $page,
				'paginate' => true,
				'orderby'  => 'date',
				'order'    => 'DESC',
				'status'   => array_keys( wc_get_order_statuses() ),
			]
		);
		$rows = [];
		foreach ( (array) $result->orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$rows[] = self::order_row( $order );
			}
		}
		return [ 'rows' => $rows, 'page' => $page, 'pages' => (int) $result->max_num_pages, 'total' => (int) $result->total ];
	}

	private static function refunds( int $page, int $limit ): array {
		$orders = wc_get_orders(
			[
				'limit'   => min( 100, $limit * 4 ),
				'page'    => $page,
				'orderby' => 'date',
				'order'   => 'DESC',
				'status'  => array_keys( wc_get_order_statuses() ),
			]
		);
		$rows = [];
		foreach ( $orders as $order ) {
			if ( ! $order instanceof WC_Order ) {
				continue;
			}
			foreach ( $order->get_refunds() as $refund ) {
				if ( ! $refund instanceof WC_Order_Refund ) {
					continue;
				}
				$entity_id = (string) $order->get_meta( dtb_qbo_refund_meta_key( $refund->get_id() ), true );
				$rows[] = [
					'id'          => $refund->get_id(),
					'orderId'     => $order->get_id(),
					'orderNumber' => $order->get_order_number(),
					'amount'      => wc_format_decimal( abs( (float) $refund->get_amount() ), 2 ),
					'currency'    => $order->get_currency(),
					'reason'      => sanitize_text_field( $refund->get_reason() ),
					'date'        => $refund->get_date_created() ? gmdate( 'c', $refund->get_date_created()->getTimestamp() ) : '',
					'entityId'    => $entity_id,
					'state'       => '' !== $entity_id ? 'synced' : 'pending',
				];
				if ( count( $rows ) >= $limit ) {
					break 2;
				}
			}
		}
		return [ 'rows' => $rows, 'page' => $page ];
	}

	private static function customers( int $limit ): array {
		$orders = wc_get_orders( [ 'limit' => min( 250, $limit * 5 ), 'orderby' => 'date', 'order' => 'DESC', 'status' => array_keys( wc_get_order_statuses() ) ] );
		$customers = [];
		foreach ( $orders as $order ) {
			if ( ! $order instanceof WC_Order ) {
				continue;
			}
			$email = sanitize_email( $order->get_billing_email() );
			$key   = '' !== $email ? strtolower( $email ) : 'order-' . $order->get_id();
			if ( ! isset( $customers[ $key ] ) ) {
				$customers[ $key ] = [
					'name'       => sanitize_text_field( trim( $order->get_formatted_billing_full_name() ) ),
					'email'      => $email,
					'orders'     => 0,
					'total'      => 0.0,
					'entityId'   => sanitize_text_field( (string) $order->get_meta( '_dtb_qbo_customer_id', true ) ),
					'lastOrder'  => '',
				];
			}
			++$customers[ $key ]['orders'];
			$customers[ $key ]['total'] += (float) $order->get_total();
			if ( '' === $customers[ $key ]['lastOrder'] && $order->get_date_created() ) {
				$customers[ $key ]['lastOrder'] = gmdate( 'c', $order->get_date_created()->getTimestamp() );
			}
		}
		$rows = array_slice( array_values( $customers ), 0, $limit );
		foreach ( $rows as &$row ) {
			$row['total'] = wc_format_decimal( $row['total'], 2 );
			$row['state'] = '' !== $row['entityId'] ? 'synced' : 'unmapped';
		}
		unset( $row );
		return [ 'rows' => $rows ];
	}

	private static function reconciliation( int $page, int $limit ): array {
		$result = self::transactions( $page, $limit );
		$rows = [];
		foreach ( $result['rows'] as $row ) {
			if ( 'synced' !== $row['state'] ) {
				$rows[] = $row;
			}
		}
		return [ 'rows' => $rows, 'page' => $page, 'pages' => $result['pages'], 'total' => count( $rows ) ];
	}

	private static function activity( int $limit ): array {
		$rows = [];
		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'group'    => 'dtb-orders',
					'per_page' => $limit,
					'orderby'  => 'date',
					'order'    => 'DESC',
				],
				'OBJECT'
			);
			foreach ( (array) $actions as $action ) {
				if ( ! is_object( $action ) || ! method_exists( $action, 'get_hook' ) ) {
					continue;
				}
				$hook = sanitize_key( (string) $action->get_hook() );
				if ( ! str_contains( $hook, 'quickbooks' ) && ! str_contains( $hook, 'qbo' ) ) {
					continue;
				}
				$date = method_exists( $action, 'get_schedule' ) ? $action->get_schedule()->get_date() : null;
				$rows[] = [
					'hook'   => $hook,
					'status' => method_exists( $action, 'get_status' ) ? sanitize_key( (string) $action->get_status() ) : 'unknown',
					'date'   => $date instanceof DateTimeInterface ? $date->format( DATE_ATOM ) : '',
				];
			}
		}
		return [ 'rows' => $rows ];
	}

	private static function order_row( WC_Order $order ): array {
		$entity_id = (string) ( $order->get_meta( '_dtb_quickbooks_entity_id', true ) ?: $order->get_meta( '_dtb_qbo_receipt_id', true ) );
		return [
			'id'          => $order->get_id(),
			'number'      => $order->get_order_number(),
			'date'        => $order->get_date_created() ? gmdate( 'c', $order->get_date_created()->getTimestamp() ) : '',
			'customer'    => sanitize_text_field( trim( $order->get_formatted_billing_full_name() ) ),
			'email'       => sanitize_email( $order->get_billing_email() ),
			'total'       => wc_format_decimal( (float) $order->get_total(), 2 ),
			'currency'    => $order->get_currency(),
			'orderStatus' => sanitize_key( $order->get_status() ),
			'paid'        => (bool) $order->get_date_paid(),
			'entityId'    => sanitize_text_field( $entity_id ),
			'docNumber'   => function_exists( 'dtb_qbo_order_doc_number' ) ? dtb_qbo_order_doc_number( $order ) : 'DTB-' . $order->get_id(),
			'state'       => self::projection_state( $order ),
			'adminUrl'    => esc_url_raw( $order->get_edit_order_url() ),
		];
	}

	private static function projection_state( WC_Order $order ): string {
		if ( (string) $order->get_meta( '_dtb_qbo_synced', true ) === '1' || '' !== (string) $order->get_meta( '_dtb_quickbooks_entity_id', true ) ) {
			return 'synced';
		}
		$error = (string) $order->get_meta( '_dtb_qbo_last_error', true );
		if ( '' !== $error ) {
			return 'failed';
		}
		return $order->get_date_paid() ? 'pending' : 'ineligible';
	}
}

DTB_QuickBooksEnterpriseController::register();
