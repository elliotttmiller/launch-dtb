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
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#eef3f9' ); ?>;
	padding: 0;
	text-align: center;
}

#outer_wrapper {
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#eef3f9' ); ?>;
}

#wrapper {
	margin: 0 auto;
	padding: 24px 0;
	-webkit-text-size-adjust: none !important;
	width: 100%;
	max-width: 600px;
}

#inner_wrapper {
	background-color: <?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;
	border-radius: 16px;
	overflow: hidden;
}

#template_header {
	background-color: <?php echo esc_attr( $palette['header_bg'] ?? '#071126' ); ?>;
}

#template_header_image {
	padding: 28px 32px;
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
	font-size: 26px;
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
	border: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#dce6f3' ); ?>;
	vertical-align: middle;
}

.email-order-details td,
.email-order-details th {
	padding: 10px 12px;
}

.email-order-details thead th {
	background: <?php echo esc_attr( $palette['accent_soft_bg'] ?? '#e8f1ff' ); ?>;
	color: <?php echo esc_attr( $palette['accent_soft_tx'] ?? '#1e4fd8' ); ?>;
	font-size: 12px;
	font-weight: 760;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	border: 0;
}

.order-totals-total td,
.order-totals-total th {
	font-weight: 760;
	font-size: 17px;
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
	background: <?php echo esc_attr( $palette['footer_bg'] ?? '#071126' ); ?>;
	background-color: <?php echo esc_attr( $palette['footer_bg'] ?? '#071126' ); ?>;
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
	#template_header_image {
		padding: 20px 18px !important;
	}

	h1 {
		font-size: 22px !important;
	}

	#body_content table td {
		padding: 14px 18px !important;
	}
}
