<?php
/**
 * DTB branded email CSS (inlined into the final HTML by WC_Emails::style_inline()).
 *
 * Traced against WooCommerce core emails/email-styles.php v10.8.0
 * (wp-content/plugins/woocommerce/templates/emails/email-styles.php).
 * DTB customization: colors/typography come from the shared
 * dtb_email_palette() brand tokens (dtb-platform) instead of the
 * WooCommerce admin color-picker options — brand visuals are DTB-owned per
 * the email redesign brief; WooCommerce settings remain authoritative for
 * enablement/recipients/CC/BCC/subject/heading/additional-content only.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$palette = function_exists( 'dtb_email_palette' ) ? dtb_email_palette( 'light' ) : [];
$font    = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
?>
body {
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;
	padding: 0;
	text-align: center;
}

#outer_wrapper {
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;
}

#wrapper {
	margin: 0 auto;
	padding: 28px 0;
	-webkit-text-size-adjust: none !important;
	width: 100%;
	max-width: 680px;
}

#inner_wrapper {
	background-color: <?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;
	border: 1px solid #e2e5ea;
	border-radius: 20px;
	overflow: hidden;
}

#template_header {
	background-color: <?php echo esc_attr( $palette['header_bg'] ?? '#000000' ); ?>;
}

#template_header_image {
	padding: 24px 32px 22px;
}

/* h1 no longer renders inside the dark #template_header band (that band is
 * logo-only now — see email-header.php) — it only ever appears inside
 * dtb_email_hero()'s white-body markup, which already sets its own explicit
 * inline color/alignment. This rule is the non-inline fallback for that same
 * context (dark-on-white, centered), not the old header-band styling
 * (light-on-dark, left-aligned) it used to describe. */
h1 {
	color: <?php echo esc_attr( $palette['title'] ?? '#0f172a' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 30px;
	font-weight: 800;
	line-height: 130%;
	margin: 0;
	text-align: center;
}

h2 {
	color: <?php echo esc_attr( $palette['title'] ?? '#0f172a' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 18px;
	font-weight: 760;
	line-height: 140%;
	margin: 0 0 14px;
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

#body_content {
	background-color: <?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;
}

#body_content_inner {
	color: <?php echo esc_attr( $palette['intro'] ?? '#475569' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 15px;
	line-height: 155%;
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

#body_content_inner_cell {
	padding: 20px 48px 8px;
}

#body_content p {
	margin: 0 0 16px;
}

a,
.link {
	color: <?php echo esc_attr( $palette['accent'] ?? '#2563eb' ); ?>;
	font-weight: 600;
	text-decoration: underline;
}

.td {
	color: <?php echo esc_attr( $palette['text'] ?? '#64748b' ); ?>;
	border: 0;
	vertical-align: middle;
}

.email-order-details td,
.email-order-details th {
	padding: 14px 4px;
}

.email-order-details thead th {
	border: 0;
}

.email-order-details tbody tr.order_item td {
	border-bottom: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#dce6f3' ); ?>;
}

.email-order-details tbody tr.order_item > td:nth-child(2) {
	width: 64px;
	color: #64748b;
	font-size: 13px;
}

.email-order-details tbody tr.order_item > td:last-child {
	width: 96px;
	color: #0f172a;
	font-size: 16px;
	font-weight: 800;
}

.email-order-totals tr.order-totals td,
.email-order-totals tr.order-totals th {
	padding: 5px 4px;
	font-size: 14px;
}

.email-order-totals tr.order-totals th {
	padding-left: 54% !important;
}

.order-totals-total td,
.order-totals-total th {
	font-weight: 800;
	font-size: 18px;
	color: <?php echo esc_attr( $palette['accent'] ?? '#2563eb' ); ?>;
	border-top: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#dce6f3' ); ?>;
	padding-top: 14px !important;
}

.address {
	color: <?php echo esc_attr( $palette['text'] ?? '#64748b' ); ?>;
	font-style: normal;
	line-height: 145%;
	padding: 4px 0;
}

.address-title {
	color: <?php echo esc_attr( $palette['title'] ?? '#0f172a' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 12px;
	font-weight: 760;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.fulfillment-status {
	background: <?php echo esc_attr( $palette['accent_soft_bg'] ?? '#e8f1ff' ); ?>;
	color: <?php echo esc_attr( $palette['accent_soft_tx'] ?? '#1e4fd8' ); ?>;
	padding: 2px 8px;
	border-radius: 6px;
	font-weight: 700;
}

.font-family {
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
}

.text-align-left {
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

.text-align-right {
	text-align: <?php echo is_rtl() ? 'left' : 'right'; ?>;
}

.hr {
	border-bottom: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#dce6f3' ); ?>;
	margin: 16px 0;
}

#template_footer {
	background: <?php echo esc_attr( $palette['footer_bg'] ?? '#000000' ); ?>;
	background-color: <?php echo esc_attr( $palette['footer_bg'] ?? '#000000' ); ?>;
}

#template_footer td {
	padding: 0;
}

#template_footer #credit {
	color: <?php echo esc_attr( $palette['footer_text'] ?? '#94a3b8' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 12px;
	line-height: 150%;
	text-align: center;
	padding: 28px 32px 32px;
}

#template_footer #credit a {
	color: <?php echo esc_attr( $palette['footer_link'] ?? '#8bb7ff' ); ?>;
}

@media screen and (max-width: 600px) {
	body,
	#outer_wrapper {
		background-color: #ffffff !important;
	}

	#wrapper {
		max-width: 100% !important;
		padding: 0 !important;
	}

	#inner_wrapper {
		border: 0 !important;
		border-radius: 0 !important;
	}

	#template_header_image {
		padding: 18px !important;
	}

	#template_header_image img {
		width: 190px !important;
		max-width: 72% !important;
	}

	.dtb-email-hero {
		margin-bottom: 18px !important;
		background-position: 62% center !important;
	}

	.dtb-email-hero-cell {
		padding: 28px 22px 32px !important;
	}

	.dtb-email-hero h1 {
		font-size: 29px !important;
		line-height: 118% !important;
	}

	.dtb-email-hero-copy {
		font-size: 14px !important;
		line-height: 150% !important;
	}

	#body_content_inner_cell {
		padding: 0 14px 6px !important;
	}

	.dtb-progress-marker > table td {
		width: 38px !important;
		height: 38px !important;
		padding: 0 6px !important;
	}

	.dtb-progress-marker img {
		width: 22px !important;
		height: 22px !important;
	}

	.dtb-progress-label span {
		width: 72px !important;
		font-size: 10px !important;
	}

	.order-item-data td:first-child {
		width: 84px !important;
		padding-right: 10px !important;
	}

	.order-item-data img {
		width: 72px !important;
		height: 56px !important;
	}

	.email-order-details tbody tr.order_item > td:nth-child(2) {
		width: 42px !important;
		padding-left: 2px !important;
		padding-right: 2px !important;
		font-size: 11px !important;
	}

	.email-order-details tbody tr.order_item > td:last-child {
		width: 72px !important;
		padding-left: 4px !important;
		font-size: 13px !important;
	}

	.email-order-totals tr.order-totals th {
		padding-left: 28% !important;
	}

	#addresses > tbody > tr > td,
	.dtb-support-action {
		display: block !important;
		width: 100% !important;
		box-sizing: border-box !important;
		padding: 0 0 14px !important;
	}

	.dtb-support-action {
		padding-top: 14px !important;
	}

	.dtb-next-step {
		display: block !important;
		width: 100% !important;
		box-sizing: border-box !important;
		padding: 8px 0 14px !important;
	}

	#template_footer #credit {
		padding: 24px 18px 28px !important;
	}
}
