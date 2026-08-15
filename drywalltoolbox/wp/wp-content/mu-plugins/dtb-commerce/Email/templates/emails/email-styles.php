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
$font = function_exists( 'dtb_email_font_stack' ) ? dtb_email_font_stack() : "Arial,Helvetica,sans-serif";
$is_email_preview = (bool) apply_filters( 'woocommerce_is_email_preview', false );
unset( $is_email_preview );
?>
body { background-color:<?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;font-family:<?php echo $font; ?>;margin:0;padding:0;text-align:center; }
body,table,td,th,p,a,span,div,h1,h2,h3,h4,h5,h6 { font-family:<?php echo $font; ?>; }
#outer_wrapper { background-color:<?php echo esc_attr( $palette['shell_bg'] ?? '#f2f3f5' ); ?>;border-collapse:collapse;margin:0;padding:0;width:100%; }
.dtb-email-shell-cell { background-color:#ffffff; }
#wrapper { margin:0 auto;padding:0;-webkit-text-size-adjust:100%;width:100%;max-width:680px; }
#inner_wrapper { background-color:<?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>;border:0;border-collapse:separate; }
#template_header { background:#000000 !important;background-color:#000000 !important;border-collapse:collapse; }
#template_header_image { background:#000000 !important;background-color:#000000 !important;padding:20px 24px; }
h1 { color:#ffffff;font-family:<?php echo $font; ?>;font-size:34px;font-weight:700;line-height:1.18;margin:0;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
h2 { color:<?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;font-family:<?php echo $font; ?>;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 14px;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
#body_content { background-color:<?php echo esc_attr( $palette['card_bg'] ?? '#ffffff' ); ?>; }
#body_content_inner { color:<?php echo esc_attr( $palette['intro'] ?? '#344054' ); ?>;font-family:<?php echo $font; ?>;font-size:15px;line-height:1.5;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
#body_content_inner_cell { padding:0 0 8px; }
#body_content_inner > p,#body_content_inner > h2 { margin-left:32px;margin-right:32px; }
#body_content p { margin:0 0 16px; }
a,.link { color:<?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;font-weight:600;text-decoration:underline; }
.td { color:<?php echo esc_attr( $palette['text'] ?? '#667085' ); ?>;border:0;vertical-align:middle; }
.email-order-details { table-layout:auto; }
.email-order-details td,.email-order-details th { padding:14px 6px; }
.email-order-details thead th { padding:10px 6px;border-top:1px solid #e4eaf2;border-bottom:1px solid #e4eaf2;background:#fbfcfe;color:#344054;font-size:11px;font-weight:700;line-height:16px;text-transform:uppercase; }
.dtb-mobile-label { display:none; }
.email-order-details tbody tr.order_item td { border-bottom:1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>; }
.email-order-details tbody tr.order_item:last-child td { border-bottom:0; }
.email-order-details tbody tr.order_item > td:first-child { width:auto;min-width:0; }
.email-order-details tbody tr.order_item > td:nth-child(2) { width:52px;color:#667085;font-size:13px;white-space:nowrap; }
.email-order-details tbody tr.order_item > td:last-child { width:88px;color:#101828;font-size:16px;font-weight:700;white-space:nowrap; }
.order-item-data { table-layout:auto;width:100%; }
.order-item-data td { min-width:0; }
.dtb-order-item-image { width:82px; }
.email-order-totals tr.order-totals td,.email-order-totals tr.order-totals th { padding:6px 4px;font-size:14px; }
.email-order-totals tr.order-totals th { padding-left:0 !important;color:#101828;font-weight:600;text-align:<?php echo is_rtl() ? 'right' : 'left'; ?>; }
.email-order-totals tr.order-totals td { color:#101828;white-space:nowrap; }
.order-totals-total td,.order-totals-total th { font-weight:700;font-size:18px;color:<?php echo esc_attr( $palette['accent'] ?? '#2255ee' ); ?>;border-top:1px solid <?php echo esc_attr( $palette['card_border'] ?? '#e4eaf2' ); ?>;padding-top:14px !important; }
.address { color:#344054;font-style:normal;line-height:1.5;padding:4px 0; }
.address-title { color:<?php echo esc_attr( $palette['title'] ?? '#101828' ); ?>;font-family:<?php echo $font; ?>;font-size:12px;font-weight:700;text-transform:uppercase; }
.email-introduction { margin:0 auto 20px;width:92%;max-width:636px; }
.email-introduction > p { margin-left:0 !important;margin-right:0 !important; }
.dtb-customer-details { border-collapse:collapse; }
.dtb-customer-details th,.dtb-customer-details td { padding:11px 0;border-bottom:1px solid #e4eaf2;font-size:14px;line-height:1.5; }
.dtb-customer-details tr:last-child th,.dtb-customer-details tr:last-child td { border-bottom:0; }
.dtb-customer-detail-label { width:34%;padding-right:20px !important;color:#475467;font-weight:700;text-align:left; }
.dtb-customer-detail-value { color:#101828;font-weight:600;text-align:right;overflow-wrap:anywhere; }
.fulfillment-status { background:<?php echo esc_attr( $palette['accent_soft_bg'] ?? '#e8f1ff' ); ?>;color:<?php echo esc_attr( $palette['accent_soft_tx'] ?? '#2255ee' ); ?>;padding:2px 8px; }

.dtb-email-hero { margin:0 0 28px !important; }
.dtb-email-card { margin-left:auto !important;margin-right:auto !important;width:92% !important;max-width:636px !important; }
.dtb-email-card > tbody > tr > td { border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#ffffff !important;background-color:#ffffff !important; }
.dtb-email-section-heading { border-bottom:1px solid #e4eaf2 !important; }
#addresses .dtb-address-billing { padding:0 18px 0 0 !important; }
#addresses .dtb-address-shipping { padding:0 0 0 18px !important;border-left:1px solid #e4eaf2 !important; }
.dtb-email-progress { margin-left:auto !important;margin-right:auto !important;width:92% !important;max-width:636px !important; }
.email-additional-content { padding:8px 32px 24px; }

@media only screen and (max-width:600px) {
	#outer_wrapper > tbody > tr > td { padding:0 !important; }
	#wrapper { padding:0 !important;max-width:none !important; }
	.dtb-email-shell-cell { width:100% !important;max-width:none !important; }
	#inner_wrapper { border:0 !important;border-radius:0 !important;box-shadow:none !important; }
	#template_header_image { padding:16px 20px !important; }
	#template_header_image img { width:148px !important;max-width:100% !important;height:auto !important; }
	.dtb-email-hero-cell { padding:28px 24px 32px !important; }
	.dtb-email-hero h1,h1 { font-size:28px !important;line-height:1.2 !important; }
	#body_content_inner > p,#body_content_inner > h2 { margin-left:20px !important;margin-right:20px !important; }
	.dtb-email-card,.dtb-email-progress,.email-introduction { margin-left:auto !important;margin-right:auto !important;width:calc(100% - 28px) !important; }
	.dtb-email-card > tbody > tr > td { padding:18px 10px !important; }
	.dtb-progress-label span { width:auto !important;max-width:92px !important; }
	#addresses,#addresses tbody,#addresses tr,#addresses td { display:block !important;width:100% !important;box-sizing:border-box !important; }
	#addresses .dtb-address-billing { padding:0 !important; }
	#addresses .dtb-address-shipping { margin-top:18px !important;padding:18px 0 0 !important;border-top:1px solid #e4eaf2 !important;border-left:0 !important; }
	.dtb-customer-details th,.dtb-customer-details td { display:block !important;width:100% !important;box-sizing:border-box !important;text-align:left !important; }
	.dtb-customer-details th { padding:11px 0 2px !important;border-bottom:0 !important;font-size:12px !important;text-transform:uppercase; }
	.dtb-customer-details td { padding:0 0 11px !important; }
	.email-additional-content { padding-left:20px !important;padding-right:20px !important; }
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
	.email-order-totals tr.order-totals-shipping td { white-space:normal !important;overflow-wrap:anywhere !important; }
}
