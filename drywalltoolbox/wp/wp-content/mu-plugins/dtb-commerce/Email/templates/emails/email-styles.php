<?php
/**
 * DTB branded email CSS (inlined into the final HTML by WC_Emails::style_inline()).
 *
 * Traced against WooCommerce core emails/email-styles.php v10.8.0.
 * Brand visuals are DTB-owned; WooCommerce settings remain authoritative for
 * enablement, recipients, subject, heading, and additional content.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
$palette = function_exists( 'dtb_email_palette' ) ? dtb_email_palette( 'light' ) : [];
$font = function_exists( 'dtb_email_font_stack' ) ? dtb_email_font_stack() : "'Nunito',Arial,sans-serif";
$is_email_preview = (bool) apply_filters( 'woocommerce_is_email_preview', false );
unset( $is_email_preview );
?>
body { background-color:<?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;font-family:<?php echo $font; ?>;margin:0;padding:0;text-align:center; }
#outer_wrapper { background-color:<?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;border-collapse:collapse;margin:0;width:100%; }
#wrapper { margin:0 auto;padding:24px 0;-webkit-text-size-adjust:none !important;width:100%;max-width:680px; }
#inner_wrapper { background-color:<?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;border:1px solid #e4eaf2;border-radius:20px;overflow:hidden;box-shadow:0 1px 2px rgba(2,8,23,.04),0 16px 40px rgba(2,8,23,.10); }
#template_header { background:#000000 !important;background-color:#000000 !important;border-collapse:collapse; }
#template_header_image { background:#000000 !important;background-color:#000000 !important;padding:22px 32px 20px; }
h1 { color:#ffffff;font-family:<?php echo $font; ?>;font-size:36px;font-weight:800;line-height:116%;margin:0;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
h2 { color:<?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;font-family:<?php echo $font; ?>;font-size:18px;font-weight:760;line-height:140%;margin:0 0 14px;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
#body_content { background-color:<?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>; }
#body_content_inner { color:<?php echo esc_attr( $palette['intro'] ?? '#344054' ); ?>;font-family:<?php echo $font; ?>;font-size:15px;line-height:150%;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
#body_content_inner_cell { padding:0 0 8px; }
#body_content_inner > p,#body_content_inner > h2 { margin-left:32px;margin-right:32px; }
#body_content p { margin:0 0 16px; }
a,.link { color:<?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;font-weight:600;text-decoration:underline; }
.td { color:<?php echo esc_attr( $palette['text'] ?? '#667085' ); ?>;border:0;vertical-align:middle; }
.email-order-details { table-layout:auto; }
.email-order-details td,.email-order-details th { padding:14px 6px; }
.email-order-details thead th { padding:10px 6px;border-top:1px solid #e4eaf2;border-bottom:1px solid #e4eaf2;background:#fbfcfe;color:#344054;font-size:11px;font-weight:800;line-height:16px;text-transform:uppercase; }
.dtb-mobile-label { display:none; }
.email-order-details tbody tr.order_item td { border-bottom:1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>; }
.email-order-details tbody tr.order_item:last-child td { border-bottom:0; }
.email-order-details tbody tr.order_item > td:first-child { width:auto;min-width:0; }
.email-order-details tbody tr.order_item > td:nth-child(2) { width:52px;color:#667085;font-size:13px;white-space:nowrap; }
.email-order-details tbody tr.order_item > td:last-child { width:88px;color:#101828;font-size:16px;font-weight:800;white-space:nowrap; }
.order-item-data { table-layout:auto;width:100%; }
.order-item-data td { min-width:0; }
.dtb-order-item-image { width:82px; }
.email-order-totals tr.order-totals td,.email-order-totals tr.order-totals th { padding:6px 4px;font-size:14px; }
.email-order-totals tr.order-totals th { padding-left:0 !important;color:#101828;font-weight:600;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
.email-order-totals tr.order-totals td { color:#101828;white-space:nowrap; }
.order-totals-total td,.order-totals-total th { font-weight:800;font-size:18px;color:<?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;border-top:1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>;padding-top:14px !important; }
.address { color:#344054;font-style:normal;line-height:150%;padding:4px 0; }
.address-title { color:<?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;font-family:<?php echo $font; ?>;font-size:12px;font-weight:800;text-transform:uppercase; }
.fulfillment-status { background:<?php echo esc_attr( $palette['accent_soft_bg'] ?? '#e8f1ff' ); ?>;color:<?php echo esc_attr( $palette['accent_soft_tx'] ?? '#2255ee' ); ?>;padding:2px 8px; }

/* Shared DTB component spacing. Section surfaces intentionally merge into the
 * white email body; hierarchy comes from spacing, typography and restrained
 * internal dividers rather than outlined cards. */
.dtb-email-hero { margin:0 0 28px !important; }
.dtb-email-card { margin-left:32px !important;margin-right:32px !important;width:auto !important; }
.dtb-email-card > tbody > tr > td { border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#ffffff !important;background-color:#ffffff !important; }
.dtb-email-progress { margin-left:32px !important;margin-right:32px !important;width:auto !important; }
.email-additional-content { padding:8px 32px 24px; }

@media screen and (max-width:600px) {
	#wrapper { padding:0 !important;max-width:none !important; }
	.dtb-email-shell-gutter { display:none !important;width:0 !important; }
	.dtb-email-shell-cell { width:100% !important; }
	#inner_wrapper { border:0 !important;border-radius:0 !important;box-shadow:none !important; }
	#template_header_image { padding:18px 20px 16px !important; }
	#template_header_image img { width:150px !important;max-width:62% !important;height:auto !important; }
	.dtb-email-hero-cell { padding:28px 24px 32px !important; }
	.dtb-email-hero h1,h1 { font-size:30px !important;line-height:118% !important; }
	#body_content_inner > p,#body_content_inner > h2 { margin-left:20px !important;margin-right:20px !important; }
	.dtb-email-card,.dtb-email-progress { margin-left:14px !important;margin-right:14px !important;width:auto !important; }
	.dtb-email-card > tbody > tr > td { padding:18px 10px !important; }
	.email-additional-content { padding-left:20px !important;padding-right:20px !important; }

	/* Preserve the semantic three-column order table on narrow clients. Do not
	 * convert cells to display:block: that forces image/name, quantity and price
	 * into a vertical stack and breaks the intended compact commerce summary. */
	.dtb-mobile-label { display:none !important; }
	.email-order-details thead { display:none !important; }
	.email-order-details tbody tr.order_item td { display:table-cell !important;text-align:inherit !important; }
	.email-order-details tbody tr.order_item > td:first-child { width:auto !important;padding-left:0 !important;padding-right:4px !important; }
	.email-order-details tbody tr.order_item > td:nth-child(2) { width:34px !important;padding-left:2px !important;padding-right:2px !important;text-align:center !important;font-size:12px !important; }
	.email-order-details tbody tr.order_item > td:last-child { width:66px !important;padding-left:4px !important;padding-right:0 !important;text-align:right !important;font-size:14px !important; }
	.order-item-data { width:100% !important;table-layout:auto !important; }
	.order-item-data td { display:table-cell !important; }
	.dtb-order-item-image { width:58px !important;padding-right:8px !important; }
	.dtb-order-item-image img { width:54px !important;max-width:54px !important;height:auto !important; }
	.dtb-order-item-sku,.email-order-item-meta { overflow-wrap:anywhere !important;word-break:break-word !important; }
	.email-order-totals tr.order-totals td,.email-order-totals tr.order-totals th { display:table-cell !important; }
}
