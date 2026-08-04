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
$font    = function_exists( 'dtb_email_font_stack' ) ? dtb_email_font_stack() : "'Nunito',Arial,sans-serif";

// Keep WooCommerce's preview-mode filter contract even though DTB brand
// tokens, rather than WooCommerce color transients, own this presentation.
$is_email_preview = (bool) apply_filters( 'woocommerce_is_email_preview', false );
unset( $is_email_preview );
?>
body {
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	margin: 0;
	padding: 0;
	text-align: center;
}

#outer_wrapper {
	background-color: <?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;
	border-collapse: collapse;
	margin: 0;
	width: 100%;
}

#wrapper {
	margin: 0 auto;
	padding: 24px 0;
	-webkit-text-size-adjust: none !important;
	width: 100%;
	max-width: 680px;
}

#inner_wrapper {
	background-color: <?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;
	border: 1px solid #e4eaf2;
	border-radius: 16px;
	overflow: hidden;
}

#template_header {
	background-color: <?php echo esc_attr( $palette['header_bg'] ?? '#000000' ); ?>;
	border-collapse: collapse;
}

#template_header_image {
	padding: 22px 32px 20px;
}

h1 {
	color: #ffffff;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 36px;
	font-weight: 800;
	line-height: 116%;
	margin: 0;
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

h2 {
	color: <?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;
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
	color: <?php echo esc_attr( $palette['intro'] ?? '#344054' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 15px;
	line-height: 150%;
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

#body_content_inner_cell {
	padding: 0 0 8px;
}

#body_content_inner > p,
#body_content_inner > h2 {
	margin-left: 32px;
	margin-right: 32px;
}

#body_content p {
	margin: 0 0 16px;
}

a,
.link {
	color: <?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;
	font-weight: 600;
	text-decoration: underline;
}

.td {
	color: <?php echo esc_attr( $palette['text'] ?? '#667085' ); ?>;
	border: 0;
	vertical-align: middle;
}

.email-order-details td,
.email-order-details th {
	padding: 14px 6px;
}

.email-order-details thead th {
	padding: 10px 6px;
	border-top: 1px solid #e4eaf2;
	border-bottom: 1px solid #e4eaf2;
	background: #fbfcfe;
	color: #344054;
	font-size: 11px;
	font-weight: 800;
	line-height: 16px;
	text-transform: uppercase;
}

.dtb-mobile-label {
	display: none;
}

.email-order-details tbody tr.order_item td {
	border-bottom: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>;
}

.email-order-details tbody tr.order_item:last-child td {
	border-bottom: 0;
}

.email-order-details tbody tr.order_item > td:nth-child(2) {
	width: 52px;
	color: #667085;
	font-size: 13px;
}

.email-order-details tbody tr.order_item > td:last-child {
	width: 88px;
	color: #101828;
	font-size: 16px;
	font-weight: 800;
}

.email-order-totals tr.order-totals td,
.email-order-totals tr.order-totals th {
	padding: 6px 4px;
	font-size: 14px;
}

.email-order-totals tr.order-totals th {
	padding-left: 0 !important;
	color: #101828;
	font-weight: 600;
	text-align: <?php echo is_rtl() ? 'right' : 'left'; ?>;
}

.email-order-totals tr.order-totals td {
	color: #101828;
	white-space: nowrap;
}

.order-totals-total td,
.order-totals-total th {
	font-weight: 800;
	font-size: 18px;
	color: <?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;
	border-top: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>;
	padding-top: 14px !important;
}

.address {
	color: #344054;
	font-style: normal;
	line-height: 150%;
	padding: 4px 0;
}

.address-title {
	color: <?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;
	font-family: <?php echo $font; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	font-size: 12px;
	font-weight: 800;
	text-transform: uppercase;
}

.fulfillment-status {
	background: <?php echo esc_attr( $palette['accent_soft_bg'] ?? '#e8f1ff' ); ?>;
	color: <?php echo esc_attr( $palette['accent_soft_tx'] ?? '#2255ee' ); ?>;
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
	border: 0;
	border-bottom: 1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>;
	height: 0;
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
	padding: 26px 32px 30px;
}

.email-additional-content {
	padding: 4px 32px 18px;
}

#template_footer #credit a {
	color: <?php echo esc_attr( $palette['footer_link'] ?? '#2255ee' ); ?>;
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

	.dtb-email-shell-gutter {
		display: none !important;
		width: 0 !important;
	}

	.dtb-email-shell-cell {
		display: table-cell !important;
		width: 100% !important;
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
		padding: 30px 24px 32px !important;
	}

	.dtb-email-hero h1 {
		font-size: 29px !important;
		line-height: 118% !important;
	}

	#body_content_inner_cell {
		padding: 0 0 6px !important;
	}

	#body_content_inner > p,
	#body_content_inner > h2 {
		margin-left: 18px !important;
		margin-right: 18px !important;
	}

	.dtb-email-card,
	.dtb-support-card,
	.dtb-email-progress {
		width: calc(100% - 28px) !important;
		max-width: none !important;
		margin-left: 14px !important;
		margin-right: 14px !important;
	}

	.dtb-email-card > tbody > tr > td {
		padding: 18px 16px !important;
	}

	.dtb-progress-marker > table td {
		width: 34px !important;
		height: 36px !important;
		padding: 0 4px !important;
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
		width: 60px !important;
		padding-right: 8px !important;
	}

	.order-item-data img {
		width: 52px !important;
		height: 52px !important;
	}

	.email-order-details tbody tr.order_item {
		display: block !important;
		width: 100% !important;
		border-bottom: 1px solid #e4eaf2 !important;
	}

	.email-order-details thead {
		display: none !important;
	}

	.email-order-details tbody tr.order_item > td {
		box-sizing: border-box !important;
		border-bottom: 0 !important;
	}

	.email-order-details tbody tr.order_item > td:first-child {
		display: block !important;
		width: 100% !important;
		padding: 14px 0 8px !important;
	}

	.email-order-details tbody tr.order_item > td:nth-child(2),
	.email-order-details tbody tr.order_item > td:last-child {
		display: inline-block !important;
		width: 49% !important;
		padding: 4px 0 12px !important;
		font-size: 13px !important;
	}

	.email-order-details tbody tr.order_item > td:nth-child(2) {
		text-align: left !important;
	}

	.dtb-mobile-label {
		display: inline !important;
	}

	.email-order-totals tr.order-totals th {
		padding-left: 0 !important;
	}

	#addresses > tbody > tr > td,
	.dtb-support-message,
	.dtb-support-action {
		display: block !important;
		width: 100% !important;
		box-sizing: border-box !important;
		padding: 0 0 14px !important;
	}

	.dtb-support-action {
		padding-top: 14px !important;
	}

	.email-additional-content {
		padding: 4px 18px 16px !important;
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
