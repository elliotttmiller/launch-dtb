<?php
/**
 * Plugin Name: DTB Temporary Email Delivery Diagnostics
 * Description: Redacted, temporary tracing for WooCommerce order email and WordPress mail delivery.
 * Version: 1.0.0
 *
 * This MU-plugin creates WP_CONTENT_DIR/email-debug.log. It observes the
 * order/payment/email/PHPMailer/queue path without changing mail transport,
 * recipients, WooCommerce settings, order state, or queue execution.
 *
 * Remove this file and email-debug.log after diagnosis. Logging expires seven
 * days after its first request unless DTB_EMAIL_DEBUG_FORCE is defined true.
 * Define DTB_EMAIL_DEBUG_ENABLED false to disable it immediately.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_EMAIL_DEBUG_LOG_FILE' ) ) {
	define( 'DTB_EMAIL_DEBUG_LOG_FILE', WP_CONTENT_DIR . '/email-debug.log' );
}

if ( ! defined( 'DTB_EMAIL_DEBUG_MAX_BYTES' ) ) {
	define( 'DTB_EMAIL_DEBUG_MAX_BYTES', 8 * MB_IN_BYTES );
}

if ( ! defined( 'DTB_EMAIL_DEBUG_RETENTION_SECONDS' ) ) {
	define( 'DTB_EMAIL_DEBUG_RETENTION_SECONDS', 7 * DAY_IN_SECONDS );
}

const DTB_EMAIL_DEBUG_STARTED_OPTION = 'dtb_email_debug_started_at';

/** Determine whether temporary email diagnostics are active. */
function dtb_email_debug_is_enabled(): bool {
	if ( defined( 'DTB_EMAIL_DEBUG_ENABLED' ) && ! (bool) DTB_EMAIL_DEBUG_ENABLED ) {
		return false;
	}

	if ( defined( 'DTB_EMAIL_DEBUG_FORCE' ) && (bool) DTB_EMAIL_DEBUG_FORCE ) {
		return true;
	}

	$started_at = (int) get_option( DTB_EMAIL_DEBUG_STARTED_OPTION, 0 );
	if ( $started_at <= 0 ) {
		$started_at = time();
		add_option( DTB_EMAIL_DEBUG_STARTED_OPTION, $started_at, '', false );
	}

	return time() <= $started_at + (int) DTB_EMAIL_DEBUG_RETENTION_SECONDS;
}

/** Return a request correlation identifier without exposing session data. */
function dtb_email_debug_request_id(): string {
	static $request_id = '';

	if ( '' === $request_id ) {
		$request_id = function_exists( 'wp_generate_uuid4' )
			? substr( str_replace( '-', '', wp_generate_uuid4() ), 0, 16 )
			: substr( hash( 'sha256', uniqid( '', true ) ), 0, 16 );
	}

	return $request_id;
}

/** Remove credentials, addresses, URLs, paths, and identifiers from free text. */
function dtb_email_debug_scrub_string( string $value ): string {
	$value = wp_strip_all_tags( $value );
	$value = preg_replace( '/[A-Z0-9._%+\-]+@([A-Z0-9.\-]+\.[A-Z]{2,})/i', '[redacted-email@$1]', $value ) ?? $value;
	$value = preg_replace( '/\bpi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+\b/', '[redacted-payment-client-secret]', $value ) ?? $value;
	$value = preg_replace( '/\bwc_order_[A-Za-z0-9]+\b/', '[redacted-order-key]', $value ) ?? $value;
	$value = preg_replace( '/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+\b/', '[redacted-provider-key]', $value ) ?? $value;
	$value = preg_replace( '/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+\/=\-]+/i', '[redacted-authorization]', $value ) ?? $value;
	$value = preg_replace( '#https?://[^\s]+#i', '[redacted-url]', $value ) ?? $value;
	$value = preg_replace( '/\b(?:\d{1,3}\.){3}\d{1,3}\b/', '[redacted-ip]', $value ) ?? $value;

	if ( defined( 'ABSPATH' ) && '' !== ABSPATH ) {
		$value = str_replace( wp_normalize_path( ABSPATH ), '[ABSPATH]/', wp_normalize_path( $value ) );
	}

	$value = preg_replace( '/[\r\n\t]+/', ' ', $value ) ?? $value;
	$value = preg_replace( '/\s{2,}/', ' ', $value ) ?? $value;

	return substr( trim( $value ), 0, 1000 );
}

/** Recursively constrain diagnostic context to log-safe scalar metadata. */
function dtb_email_debug_sanitize_context( $value, int $depth = 0 ) {
	if ( $depth > 6 ) {
		return '[depth-limited]';
	}

	if ( null === $value || is_bool( $value ) || is_int( $value ) || is_float( $value ) ) {
		return $value;
	}

	if ( is_string( $value ) ) {
		return dtb_email_debug_scrub_string( $value );
	}

	if ( $value instanceof WP_Error ) {
		return [
			'error_code'    => sanitize_key( (string) $value->get_error_code() ),
			'error_message' => dtb_email_debug_scrub_string( $value->get_error_message() ),
		];
	}

	if ( $value instanceof Throwable ) {
		return [
			'exception_class'   => get_class( $value ),
			'exception_code'    => (int) $value->getCode(),
			'exception_message' => dtb_email_debug_scrub_string( $value->getMessage() ),
		];
	}

	if ( is_object( $value ) ) {
		return [ 'object_class' => get_class( $value ) ];
	}

	if ( is_array( $value ) ) {
		$safe = [];
		foreach ( array_slice( $value, 0, 30, true ) as $key => $item ) {
			$safe[ sanitize_key( (string) $key ) ] = dtb_email_debug_sanitize_context( $item, $depth + 1 );
		}
		if ( count( $value ) > 30 ) {
			$safe['_truncated_items'] = count( $value ) - 30;
		}
		return $safe;
	}

	return dtb_email_debug_scrub_string( (string) $value );
}

/** Rotate the bounded temporary log before appending another event. */
function dtb_email_debug_rotate_log(): void {
	$log_file = (string) DTB_EMAIL_DEBUG_LOG_FILE;
	if ( ! is_file( $log_file ) || (int) filesize( $log_file ) < (int) DTB_EMAIL_DEBUG_MAX_BYTES ) {
		return;
	}

	$previous = $log_file . '.1';
	if ( is_file( $previous ) ) {
		@unlink( $previous );
	}
	@rename( $log_file, $previous );
}

/** Append one structured, redacted diagnostic event. */
function dtb_email_debug_log( string $event, array $context = [] ): void {
	if ( ! dtb_email_debug_is_enabled() ) {
		return;
	}

	dtb_email_debug_rotate_log();

	$payload = [
		'ts'         => gmdate( 'c' ),
		'source'     => 'dtb-email-debug',
		'event'      => sanitize_key( $event ),
		'request_id' => dtb_email_debug_request_id(),
		'context'    => dtb_email_debug_sanitize_context( $context ),
	];

	$line = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES );
	if ( ! is_string( $line ) ) {
		return;
	}

	$created = ! is_file( DTB_EMAIL_DEBUG_LOG_FILE );
	$written = @file_put_contents( DTB_EMAIL_DEBUG_LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX );
	if ( false === $written ) {
		error_log( '[DTB Email Debug] Unable to write wp-content/email-debug.log. Check WP_CONTENT_DIR ownership and permissions.' );
		return;
	}
	if ( $created && is_file( DTB_EMAIL_DEBUG_LOG_FILE ) ) {
		@chmod( DTB_EMAIL_DEBUG_LOG_FILE, 0600 );
	}
}

/** Return recipient domains only; never persist complete email addresses. */
function dtb_email_debug_recipient_domains( $recipients ): array {
	$values  = is_array( $recipients ) ? $recipients : [ $recipients ];
	$domains = [];

	foreach ( $values as $value ) {
		if ( ! is_scalar( $value ) ) {
			continue;
		}
		if ( preg_match_all( '/@([A-Z0-9.\-]+\.[A-Z]{2,})/i', (string) $value, $matches ) ) {
			foreach ( $matches[1] as $domain ) {
				$domains[] = strtolower( rtrim( (string) $domain, '. ' ) );
			}
		}
	}

	return array_values( array_unique( array_filter( $domains ) ) );
}

/** Identify reserved .test recipients that cannot receive public Internet mail. */
function dtb_email_debug_has_reserved_test_recipient( $recipients ): bool {
	foreach ( dtb_email_debug_recipient_domains( $recipients ) as $domain ) {
		if ( 'test' === $domain || str_ends_with( $domain, '.test' ) ) {
			return true;
		}
	}

	return false;
}

/** Resolve a WooCommerce order from a hook argument when possible. */
function dtb_email_debug_resolve_order( $value ) {
	if ( class_exists( 'WC_Order' ) && $value instanceof WC_Order ) {
		return $value;
	}

	if ( is_object( $value ) && isset( $value->object ) && $value->object instanceof WC_Order ) {
		return $value->object;
	}

	$order_id = is_numeric( $value ) ? absint( $value ) : 0;
	return $order_id > 0 && function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
}

/** Build a privacy-safe order state snapshot. */
function dtb_email_debug_order_context( $value ): array {
	$order = dtb_email_debug_resolve_order( $value );
	if ( ! $order instanceof WC_Order ) {
		return [ 'order_id' => is_numeric( $value ) ? absint( $value ) : 0 ];
	}

	return [
		'order_id'                         => (int) $order->get_id(),
		'status'                           => (string) $order->get_status(),
		'created_via'                      => (string) $order->get_created_via(),
		'payment_method'                   => (string) $order->get_payment_method(),
		'is_paid'                          => (bool) $order->is_paid(),
		'has_paid_date'                    => null !== $order->get_date_paid(),
		'customer_recipient_domains'       => dtb_email_debug_recipient_domains( $order->get_billing_email() ),
		'customer_recipient_is_test_domain' => dtb_email_debug_has_reserved_test_recipient( $order->get_billing_email() ),
		'order_type'                       => (string) $order->get_meta( '_dtb_order_type', true ),
		'loop_suppress_emails'             => '1' === (string) $order->get_meta( '_dtb_order_loop_suppress_emails', true ),
		'processing_email_sent_marker'     => '' !== (string) $order->get_meta( '_dtb_customer_processing_email_sent_at', true ),
		'admin_new_order_sent_marker'      => '' !== (string) $order->get_meta( '_dtb_admin_new_order_email_sent_at', true ),
		'notification_claim_confirmation' => false !== get_option( 'dtb_order_notification_' . hash( 'sha256', (int) $order->get_id() . ':order-confirmation' ), false ),
		'veeqo_update_guard_active'        => (bool) get_transient( 'dtb_veeqo_webhook_updating_order_' . (int) $order->get_id() ),
	];
}

/** Build a privacy-safe WooCommerce email snapshot. */
function dtb_email_debug_wc_email_context( $email, string $email_id = '' ): array {
	if ( is_object( $email ) && '' === $email_id && isset( $email->id ) ) {
		$email_id = (string) $email->id;
	}

	$context = [
		'email_id'    => sanitize_key( $email_id ),
		'email_class' => is_object( $email ) ? get_class( $email ) : '',
	];

	if ( is_object( $email ) ) {
		$context['configured_enabled'] = isset( $email->enabled ) ? 'yes' === (string) $email->enabled : null;
		$context['recipient_domains']   = method_exists( $email, 'get_recipient' )
			? dtb_email_debug_recipient_domains( $email->get_recipient() )
			: [];
		$context += dtb_email_debug_order_context( $email );
	}

	return $context;
}

/** Categorize the current request without logging its URL or query string. */
function dtb_email_debug_request_kind(): string {
	if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
		return 'cron';
	}
	if ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) {
		return 'ajax';
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return 'rest';
	}
	if ( function_exists( 'is_admin' ) && is_admin() ) {
		return 'admin';
	}
	return 'frontend';
}

/** Capture runtime mail and WooCommerce configuration once per process. */
function dtb_email_debug_runtime_snapshot(): void {
	if ( get_transient( 'dtb_email_debug_runtime_snapshot_v1' ) ) {
		return;
	}

	$module_root = WPMU_PLUGIN_DIR;
	$modules     = [
		'loader'                  => $module_root . '/00-dtb-loader.php',
		'order_platform'          => $module_root . '/dtb-order-platform/bootstrap.php',
		'order_queue'             => $module_root . '/dtb-order-platform/Infrastructure/OrderQueue.php',
		'order_email_idempotency' => $module_root . '/dtb-order-platform/Email/OrderEmailIdempotency.php',
		'commerce_email_templates' => $module_root . '/dtb-commerce/Email/TemplateOverride.php',
	];
	$module_state = [];
	foreach ( $modules as $name => $path ) {
		$module_state[ $name ] = is_readable( $path );
	}

	$active_plugins   = array_map( 'strval', (array) get_option( 'active_plugins', [] ) );
	$sitewide_plugins = array_map( 'strval', array_keys( (array) get_site_option( 'active_sitewide_plugins', [] ) ) );
	$active_plugins   = array_values( array_unique( array_merge( $active_plugins, $sitewide_plugins ) ) );
	$mail_plugins = array_values(
		array_filter(
			$active_plugins,
			static fn( string $plugin ): bool => (bool) preg_match( '/(?:smtp|mail|postmark|sendgrid|ses)/i', $plugin )
		)
	);

	dtb_email_debug_log(
		'runtime_snapshot',
		[
			'request_kind'          => dtb_email_debug_request_kind(),
			'home_host'             => (string) wp_parse_url( home_url(), PHP_URL_HOST ),
			'wp_version'            => (string) get_bloginfo( 'version' ),
			'woocommerce_version'   => defined( 'WC_VERSION' ) ? (string) WC_VERSION : '',
			'php_version'           => PHP_VERSION,
			'wp_cron_disabled'      => defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON,
			'php_mail_callable'     => is_callable( 'mail' ),
			'php_sendmail_configured' => '' !== trim( (string) ini_get( 'sendmail_path' ) ),
			'mail_transport_plugins' => $mail_plugins,
			'module_files_readable' => $module_state,
			'order_queue_available' => function_exists( 'dtb_order_enqueue_job' ),
			'email_marker_available' => function_exists( 'dtb_order_email_was_successfully_sent' ),
		]
	);

	if ( ! function_exists( 'WC' ) || ! WC() || ! WC()->mailer() ) {
		dtb_email_debug_log( 'woocommerce_mailer_unavailable' );
		return;
	}

	$email_settings = [];
	foreach ( WC()->mailer()->get_emails() as $email ) {
		if ( ! is_object( $email ) || ! isset( $email->id ) ) {
			continue;
		}
		$email_settings[] = dtb_email_debug_wc_email_context( $email, (string) $email->id );
	}

	dtb_email_debug_log(
		'woocommerce_email_settings_snapshot',
		[
			'from_domain' => dtb_email_debug_recipient_domains( get_option( 'woocommerce_email_from_address', '' ) ),
			'emails'      => $email_settings,
		]
	);

	set_transient( 'dtb_email_debug_runtime_snapshot_v1', '1', 15 * MINUTE_IN_SECONDS );
}
add_action( 'wp_loaded', 'dtb_email_debug_runtime_snapshot', PHP_INT_MAX );

/** Log that the observer loaded and the dedicated file path is writable. */
function dtb_email_debug_loaded(): void {
	if ( get_transient( 'dtb_email_debug_loaded_v1' ) ) {
		return;
	}

	dtb_email_debug_log(
		'diagnostic_loaded',
		[
			'request_kind' => dtb_email_debug_request_kind(),
			'log_directory_writable' => is_writable( WP_CONTENT_DIR ),
			'expires_at'   => gmdate( 'c', (int) get_option( DTB_EMAIL_DEBUG_STARTED_OPTION, time() ) + (int) DTB_EMAIL_DEBUG_RETENTION_SECONDS ),
		]
	);
	set_transient( 'dtb_email_debug_loaded_v1', '1', 15 * MINUTE_IN_SECONDS );
}
add_action( 'muplugins_loaded', 'dtb_email_debug_loaded', PHP_INT_MAX );

/** Observe checkout and order lifecycle milestones. */
function dtb_email_debug_log_order_event( string $event, $order ): void {
	dtb_email_debug_log( $event, dtb_email_debug_order_context( $order ) );
}

add_action(
	'woocommerce_checkout_order_created',
	static function ( $order ): void {
		dtb_email_debug_log_order_event( 'checkout_order_created', $order );
	},
	PHP_INT_MAX,
	1
);

add_action(
	'woocommerce_checkout_order_processed',
	static function ( $order_id, $posted_data = [], $order = null ): void {
		dtb_email_debug_log_order_event( 'checkout_order_processed', $order instanceof WC_Order ? $order : $order_id );
	},
	PHP_INT_MAX,
	3
);

add_action(
	'woocommerce_new_order',
	static function ( $order_id, $order = null ): void {
		dtb_email_debug_log_order_event( 'woocommerce_new_order', $order instanceof WC_Order ? $order : $order_id );
	},
	PHP_INT_MAX,
	2
);

add_action(
	'woocommerce_payment_complete',
	static function ( $order_id ): void {
		dtb_email_debug_log_order_event( 'woocommerce_payment_complete', $order_id );
	},
	PHP_INT_MAX,
	1
);

add_action(
	'woocommerce_order_status_changed',
	static function ( $order_id, $from, $to, $order = null ): void {
		dtb_email_debug_log(
			'woocommerce_order_status_changed',
			[
				'from' => sanitize_key( (string) $from ),
				'to'   => sanitize_key( (string) $to ),
			] + dtb_email_debug_order_context( $order instanceof WC_Order ? $order : $order_id )
		);
	},
	PHP_INT_MAX,
	4
);

/** Observe WooCommerce's final email eligibility result without changing it. */
function dtb_email_debug_observe_email_enabled( bool $enabled, $object = null, $email = null ): bool {
	$email_id = str_replace( 'woocommerce_email_enabled_', '', current_filter() );
	$context  = dtb_email_debug_wc_email_context( $email, $email_id );
	$context['final_enabled'] = $enabled;
	$context += dtb_email_debug_order_context( $object );
	dtb_email_debug_log( 'woocommerce_email_eligibility', $context );
	return $enabled;
}

$dtb_email_debug_ids = [
	'new_order',
	'cancelled_order',
	'failed_order',
	'customer_on_hold_order',
	'customer_processing_order',
	'customer_completed_order',
	'customer_refunded_order',
	'customer_invoice',
	'customer_invoice_paid',
	'customer_note',
	'customer_new_account',
	'customer_reset_password',
	'customer_fulfillment_created',
	'customer_fulfillment_updated',
];
foreach ( $dtb_email_debug_ids as $dtb_email_debug_id ) {
	add_filter( 'woocommerce_email_enabled_' . $dtb_email_debug_id, 'dtb_email_debug_observe_email_enabled', PHP_INT_MAX, 3 );
}
unset( $dtb_email_debug_id, $dtb_email_debug_ids );

/** Observe WooCommerce 10.9+ explicit disabled/skipped outcomes. */
add_action(
	'woocommerce_email_disabled',
	static function ( string $email_id, $email ): void {
		dtb_email_debug_log( 'woocommerce_email_disabled', dtb_email_debug_wc_email_context( $email, $email_id ) );
	},
	PHP_INT_MAX,
	2
);

add_action(
	'woocommerce_email_skipped',
	static function ( string $reason, string $email_id, $email ): void {
		dtb_email_debug_log(
			'woocommerce_email_skipped',
			[ 'reason' => sanitize_key( $reason ) ] + dtb_email_debug_wc_email_context( $email, $email_id )
		);
	},
	PHP_INT_MAX,
	3
);

add_action(
	'woocommerce_email_sent',
	static function ( bool $sent, string $email_id, $email ): void {
		dtb_email_debug_log(
			'woocommerce_email_sent',
			[ 'transport_result' => $sent ] + dtb_email_debug_wc_email_context( $email, $email_id )
		);
	},
	PHP_INT_MAX,
	3
);

/** Trace WordPress mail handoff without storing subject, body, headers, or addresses. */
function dtb_email_debug_mail_metadata( array $mail_data ): array {
	$to          = $mail_data['to'] ?? [];
	$attachments = $mail_data['attachments'] ?? [];
	$headers     = $mail_data['headers'] ?? [];
	$subject     = (string) ( $mail_data['subject'] ?? '' );

	return [
		'recipient_count'          => is_array( $to ) ? count( array_filter( $to ) ) : ( '' !== trim( (string) $to ) ? substr_count( (string) $to, ',' ) + 1 : 0 ),
		'recipient_domains'        => dtb_email_debug_recipient_domains( $to ),
		'recipient_is_test_domain' => dtb_email_debug_has_reserved_test_recipient( $to ),
		'subject_hash'             => '' !== $subject ? substr( hash( 'sha256', $subject ), 0, 16 ) : '',
		'has_headers'              => ! empty( $headers ),
		'attachment_count'         => is_array( $attachments ) ? count( $attachments ) : ( '' !== (string) $attachments ? 1 : 0 ),
	];
}

add_filter(
	'pre_wp_mail',
	static function ( $return, array $atts ) {
		dtb_email_debug_log(
			null === $return ? 'wp_mail_attempt' : 'wp_mail_preempted',
			[ 'preempt_result' => $return ] + dtb_email_debug_mail_metadata( $atts )
		);
		return $return;
	},
	PHP_INT_MAX,
	2
);

add_action(
	'phpmailer_init',
	static function ( $phpmailer ): void {
		$to = method_exists( $phpmailer, 'getToAddresses' ) ? $phpmailer->getToAddresses() : [];
		$to_values = [];
		foreach ( (array) $to as $recipient ) {
			$to_values[] = is_array( $recipient ) ? (string) ( $recipient[0] ?? '' ) : '';
		}

		dtb_email_debug_log(
			'phpmailer_initialized',
			[
				'mailer'            => isset( $phpmailer->Mailer ) ? (string) $phpmailer->Mailer : '',
				'smtp_auth'         => isset( $phpmailer->SMTPAuth ) ? (bool) $phpmailer->SMTPAuth : false,
				'smtp_secure'       => isset( $phpmailer->SMTPSecure ) ? (string) $phpmailer->SMTPSecure : '',
				'smtp_port'         => isset( $phpmailer->Port ) ? (int) $phpmailer->Port : 0,
				'from_domain'       => isset( $phpmailer->From ) ? dtb_email_debug_recipient_domains( $phpmailer->From ) : [],
				'recipient_domains' => dtb_email_debug_recipient_domains( $to_values ),
			]
		);
	},
	PHP_INT_MAX,
	1
);

add_action(
	'wp_mail_succeeded',
	static function ( array $mail_data ): void {
		dtb_email_debug_log( 'wp_mail_succeeded', dtb_email_debug_mail_metadata( $mail_data ) );
	},
	PHP_INT_MAX,
	1
);

add_action(
	'wp_mail_failed',
	static function ( WP_Error $error ): void {
		$data = $error->get_error_data();
		dtb_email_debug_log(
			'wp_mail_failed',
			[
				'error' => $error,
				'mail'  => is_array( $data ) ? dtb_email_debug_mail_metadata( $data ) : [],
			]
		);
	},
	PHP_INT_MAX,
	1
);

/** Resolve privacy-safe Action Scheduler metadata for relevant mail/order jobs. */
function dtb_email_debug_action_context( int $action_id ): array {
	$context = [ 'action_id' => $action_id ];
	try {
		if ( ! class_exists( 'ActionScheduler' ) ) {
			return $context + [ 'scheduler_available' => false ];
		}

		$store  = ActionScheduler::store();
		$action = $store->fetch_action( $action_id );
		if ( ! is_object( $action ) ) {
			return $context + [ 'action_found' => false ];
		}

		$context['hook']   = method_exists( $action, 'get_hook' ) ? sanitize_key( (string) $action->get_hook() ) : '';
		$context['group']  = method_exists( $action, 'get_group' ) ? sanitize_key( (string) $action->get_group() ) : '';
		$context['status'] = method_exists( $store, 'get_status' ) ? sanitize_key( (string) $store->get_status( $action_id ) ) : '';
	} catch ( Throwable $error ) {
		$context['lookup_error'] = $error;
	}

	return $context;
}

/** Limit queue logging to DTB/order/mail actions to avoid unrelated log noise. */
function dtb_email_debug_action_is_relevant( array $context ): bool {
	$hook  = (string) ( $context['hook'] ?? '' );
	$group = (string) ( $context['group'] ?? '' );
	return str_starts_with( $hook, 'dtb_' )
		|| str_contains( $hook, 'email' )
		|| str_contains( $hook, 'mail' )
		|| str_contains( $hook, 'notification' )
		|| in_array( $group, [ 'dtb-orders', 'dtb-integrations' ], true );
}

add_action(
	'action_scheduler_before_execute',
	static function ( $action_id ): void {
		$context = dtb_email_debug_action_context( absint( $action_id ) );
		if ( dtb_email_debug_action_is_relevant( $context ) ) {
			dtb_email_debug_log( 'action_scheduler_before_execute', $context );
		}
	},
	PHP_INT_MAX,
	1
);

add_action(
	'action_scheduler_after_execute',
	static function ( $action_id ): void {
		$context = dtb_email_debug_action_context( absint( $action_id ) );
		if ( dtb_email_debug_action_is_relevant( $context ) ) {
			dtb_email_debug_log( 'action_scheduler_after_execute', $context );
		}
	},
	PHP_INT_MAX,
	1
);

add_action(
	'action_scheduler_failed_execution',
	static function ( $action_id, $exception = null ): void {
		$context = dtb_email_debug_action_context( absint( $action_id ) );
		$context['exception'] = $exception;
		if ( dtb_email_debug_action_is_relevant( $context ) ) {
			dtb_email_debug_log( 'action_scheduler_failed_execution', $context );
		}
	},
	PHP_INT_MAX,
	2
);

/** Capture fatal rendering/transport failures that bypass normal mail hooks. */
function dtb_email_debug_shutdown(): void {
	$error = error_get_last();
	if ( ! is_array( $error ) || ! in_array( (int) ( $error['type'] ?? 0 ), [ E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR ], true ) ) {
		return;
	}

	dtb_email_debug_log(
		'fatal_shutdown',
		[
			'error_type'    => (int) $error['type'],
			'error_message' => (string) ( $error['message'] ?? '' ),
			'error_file'    => (string) ( $error['file'] ?? '' ),
			'error_line'    => (int) ( $error['line'] ?? 0 ),
		]
	);
}
register_shutdown_function( 'dtb_email_debug_shutdown' );

/**
 * Register an explicit WP-CLI transport probe. Nothing is sent automatically.
 *
 * Usage: wp dtb-email-debug probe recipient@example.com
 */
function dtb_email_debug_register_cli(): void {
	if ( ! defined( 'WP_CLI' ) || ! WP_CLI || ! class_exists( 'WP_CLI' ) ) {
		return;
	}

	WP_CLI::add_command(
		'dtb-email-debug probe',
		static function ( array $args ): void {
			$recipient = sanitize_email( (string) ( $args[0] ?? '' ) );
			if ( '' === $recipient || ! is_email( $recipient ) ) {
				WP_CLI::error( 'Provide one valid probe recipient address.' );
			}

			$probe_id = substr( wp_generate_uuid4(), 0, 8 );
			dtb_email_debug_log(
				'cli_probe_started',
				[
					'probe_id'          => $probe_id,
					'recipient_domains' => dtb_email_debug_recipient_domains( $recipient ),
				]
			);

			$sent = wp_mail(
				$recipient,
				'Drywall Toolbox email transport probe ' . $probe_id,
				'This is an operator-requested Drywall Toolbox mail transport diagnostic. Probe ID: ' . $probe_id,
				[ 'Content-Type: text/plain; charset=UTF-8' ]
			);

			dtb_email_debug_log( 'cli_probe_completed', [ 'probe_id' => $probe_id, 'wp_mail_result' => (bool) $sent ] );
			if ( ! $sent ) {
				WP_CLI::error( 'wp_mail() reported failure. Inspect wp-content/email-debug.log for this probe ID.' );
			}

			WP_CLI::success( 'wp_mail() accepted probe ' . $probe_id . '. This confirms handoff, not inbox delivery; inspect email-debug.log and the recipient mailbox.' );
		}
	);
}
add_action( 'init', 'dtb_email_debug_register_cli', PHP_INT_MAX );
