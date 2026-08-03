<?php
/**
 * Local WooCommerce email rendering adapter.
 *
 * @package DrywallToolbox\EmailPreviewer
 */

declare(strict_types=1);

namespace DrywallToolbox\EmailPreviewer;

use Throwable;
use WC_Email;
use WC_Order;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders an allowlisted order-backed WooCommerce email without sending it.
 */
final class Renderer {
	/**
	 * Email IDs that can be prepared from a WC_Order alone without fabricating
	 * refund, fulfillment, account, or password-reset lifecycle objects.
	 *
	 * @var array<string,string>
	 */
	private const SUPPORTED_EMAILS = array(
		'customer_processing_order' => 'Processing order',
		'customer_completed_order'  => 'Completed order',
		'customer_on_hold_order'    => 'On-hold order',
		'customer_failed_order'     => 'Failed order',
		'customer_cancelled_order'  => 'Cancelled order',
		'customer_invoice'          => 'Customer invoice / order details',
		'customer_note'             => 'Customer note',
		'new_order'                 => 'Admin new order',
		'cancelled_order'           => 'Admin cancelled order',
		'failed_order'              => 'Admin failed order',
	);

	/**
	 * Return the supported email IDs and labels.
	 *
	 * @return array<string,string>
	 */
	public static function supported_emails(): array {
		return self::SUPPORTED_EMAILS;
	}

	/**
	 * Render a final, CSS-inlined WooCommerce HTML email.
	 *
	 * @param int    $order_id WooCommerce order ID.
	 * @param string $email_id Registered WC_Email ID.
	 * @return string|WP_Error
	 */
	public static function render( int $order_id, string $email_id ) {
		if ( ! isset( self::SUPPORTED_EMAILS[ $email_id ] ) ) {
			return new WP_Error(
				'dtb_email_previewer_unsupported_email',
				'That email type requires lifecycle-specific data and is not supported by the minimal local previewer.'
			);
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return new WP_Error( 'dtb_email_previewer_order_not_found', 'The selected WooCommerce order does not exist.' );
		}

		$email = self::find_email( $email_id );
		if ( ! $email instanceof WC_Email ) {
			return new WP_Error( 'dtb_email_previewer_email_not_found', 'WooCommerce did not register the selected email class.' );
		}

		$email = clone $email;
		self::prepare_order_email( $email, $order );

		$email->setup_locale();

		try {
			$html = $email->get_content();
			$html = $email->style_inline( $html );
			$html = apply_filters( 'woocommerce_mail_content', $html, $email );
		} catch ( Throwable $exception ) {
			return new WP_Error(
				'dtb_email_previewer_render_failed',
				'WooCommerce could not render this preview: ' . sanitize_text_field( $exception->getMessage() )
			);
		} finally {
			$email->restore_locale();
		}

		return is_string( $html ) ? $html : '';
	}

	/**
	 * Locate a registered WooCommerce email by its public ID.
	 *
	 * @param string $email_id Email ID.
	 * @return WC_Email|null
	 */
	private static function find_email( string $email_id ): ?WC_Email {
		$mailer = WC()->mailer();

		foreach ( $mailer->get_emails() as $email ) {
			if ( $email instanceof WC_Email && $email_id === (string) $email->id ) {
				return $email;
			}
		}

		return null;
	}

	/**
	 * Populate the same order context consumed by WooCommerce order templates.
	 * No trigger() method is called, so nothing is sent and no lifecycle action
	 * is dispatched.
	 *
	 * @param WC_Email $email Email instance.
	 * @param WC_Order $order Order instance.
	 */
	private static function prepare_order_email( WC_Email $email, WC_Order $order ): void {
		if ( method_exists( $email, 'set_object' ) ) {
			$email->set_object( $order );
		} else {
			$email->object = $order;
		}

		$email->recipient = $order->get_billing_email();

		if ( is_array( $email->placeholders ) ) {
			$email->placeholders['{order_date}']   = $order->get_date_created()
				? wc_format_datetime( $order->get_date_created() )
				: '';
			$email->placeholders['{order_number}'] = $order->get_order_number();
		}
	}
}
