<?php
/**
 * DTB branded email header.
 *
 * Traced against WooCommerce core emails/email-header.php v10.7.0.
 * Uses conservative table markup and inline styles so Gmail, Outlook, and
 * other clients render the same shell without depending on web fonts,
 * advanced CSS, or client-specific dark-mode behavior.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$store_name       = $store_name ?? get_bloginfo( 'name', 'display' );
$header_image_url = apply_filters( 'woocommerce_email_header_image_url', home_url() );
$logo_url         = function_exists( 'dtb_email_logo_url' ) ? dtb_email_logo_url() : '';

// Preserve WooCommerce's preview-mode extension point. DTB's deterministic
// logo remains presentation authority, so preview transients cannot replace it.
$is_email_preview = (bool) apply_filters( 'woocommerce_is_email_preview', false );
unset( $is_email_preview );
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=<?php bloginfo( 'charset' ); ?>" />
		<meta content="width=device-width, initial-scale=1.0" name="viewport">
		<meta name="x-apple-disable-message-reformatting">
		<meta name="color-scheme" content="light">
		<meta name="supported-color-schemes" content="light">
		<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
		<title><?php echo esc_html( $store_name ); ?></title>
	</head>
	<body <?php echo is_rtl() ? 'rightmargin' : 'leftmargin'; ?>="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin:0;padding:0;background-color:#f2f3f5;">
		<table width="100%" id="outer_wrapper" border="0" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#f2f3f5" style="width:100%;margin:0;padding:0;border-collapse:collapse;background-color:#f2f3f5;">
			<tr>
				<td align="center" valign="top" style="padding:24px 12px;">
					<table class="dtb-email-shell-cell" border="0" cellpadding="0" cellspacing="0" width="680" role="presentation" align="center" style="width:100%;max-width:680px;border-collapse:separate;background-color:#ffffff;">
						<tr>
							<td align="center" valign="top">
								<div id="wrapper" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>" style="width:100%;margin:0 auto;-webkit-text-size-adjust:100%;">
									<table border="0" cellpadding="0" cellspacing="0" width="100%" id="inner_wrapper" role="presentation" bgcolor="#ffffff" style="width:100%;border-collapse:separate;background-color:#ffffff;">
										<tr>
											<td align="center" valign="top">
												<!-- Header: deterministic solid brand chrome. -->
												<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_header" role="presentation" bgcolor="#000000" style="width:100%;background-color:#000000;border-collapse:collapse;">
													<tr>
														<td id="template_header_image" align="center" bgcolor="#000000" style="padding:20px 24px;background-color:#000000;">
															<?php if ( $logo_url ) : ?>
																<?php if ( $header_image_url ) : ?>
																	<a href="<?php echo esc_url( $header_image_url ); ?>" style="display:inline-block;text-decoration:none;" target="_blank"><img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="190" style="display:block;width:190px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"></a>
																<?php else : ?>
																	<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="190" style="display:block;width:190px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
																<?php endif; ?>
															<?php else : ?>
																<p class="email-logo-text" style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;line-height:28px;"><?php echo esc_html( $store_name ); ?></p>
															<?php endif; ?>
														</td>
													</tr>
												</table>
												<!-- End Header -->
												<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_container" role="presentation" style="width:100%;border-collapse:collapse;">
													<tr>
														<td align="center" valign="top">
															<!-- Body -->
															<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_body" role="presentation" style="width:100%;border-collapse:collapse;">
																<tr>
																	<td valign="top" id="body_content" bgcolor="#ffffff" style="background-color:#ffffff;">
																		<!-- Content -->
																		<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width:100%;border-collapse:collapse;">
																			<tr>
																				<td valign="top" id="body_content_inner_cell">
																					<div id="body_content_inner">
