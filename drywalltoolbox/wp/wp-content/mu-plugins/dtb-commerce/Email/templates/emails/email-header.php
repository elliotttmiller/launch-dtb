<?php
/**
 * DTB branded email header.
 *
 * Traced against WooCommerce core emails/email-header.php v10.7.0
 * (wp-content/plugins/woocommerce/templates/emails/email-header.php).
 * DTB customization: dark navy header carrying only the DTB logo (centered,
 * no heading text) replaces WooCommerce's configurable header image/color +
 * inline heading; document structure and the woocommerce_email_header_image_url
 * filter are preserved unchanged. $email_heading is still received (WooCommerce
 * core always passes it to this template) but is intentionally not rendered
 * here — dtb_email_hero() renders it inside the white body instead, as the
 * first thing each template outputs after this header, so the top band reads
 * as brand chrome only. See docs/dtb-email-design-system.md.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$store_name = $store_name ?? get_bloginfo( 'name', 'display' );

/**
 * Filter the URL used for the email header image/logo link.
 *
 * Preserved from WooCommerce core for extension compatibility.
 *
 * @param string $url The URL to link to. Defaults to the site home URL.
 */
$header_image_url = apply_filters( 'woocommerce_email_header_image_url', home_url() );

$palette  = function_exists( 'dtb_email_palette' ) ? dtb_email_palette( 'light' ) : [];
$logo_url = function_exists( 'dtb_email_logo_url' ) ? dtb_email_logo_url() : '';
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=<?php bloginfo( 'charset' ); ?>" />
		<meta content="width=device-width, initial-scale=1.0" name="viewport">
		<meta name="x-apple-disable-message-reformatting">
		<meta name="color-scheme" content="light">
		<meta name="supported-color-schemes" content="light">
		<title><?php echo esc_html( $store_name ); ?></title>
	</head>
	<body <?php echo is_rtl() ? 'rightmargin' : 'leftmargin'; ?>="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
		<table width="100%" id="outer_wrapper" role="presentation">
			<tr>
				<td><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
				<td width="680">
					<div id="wrapper" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>">
						<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="inner_wrapper" role="presentation">
							<tr>
								<td align="center" valign="top">
									<!-- Header -->
									<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_header" role="presentation">
										<tr>
											<td id="template_header_image" align="center">
												<?php if ( $logo_url ) : ?>
													<?php if ( $header_image_url ) : ?>
														<p style="margin:0;"><a href="<?php echo esc_url( $header_image_url ); ?>" style="display:inline-block;text-decoration:none;" target="_blank"><img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="300" style="display:block;width:300px;max-width:78%;height:auto;"></a></p>
													<?php else : ?>
														<p style="margin:0;"><img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="300" style="display:block;width:300px;max-width:78%;height:auto;"></p>
													<?php endif; ?>
												<?php else : ?>
													<p class="email-logo-text" style="margin:0;"><?php echo esc_html( $store_name ); ?></p>
												<?php endif; ?>
											</td>
										</tr>
									</table>
									<!-- End Header -->
									<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_container" role="presentation">
										<tr>
											<td align="center" valign="top">
												<!-- Body -->
												<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_body" role="presentation">
													<tr>
														<td valign="top" id="body_content">
															<!-- Content -->
													<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
																<tr>
																	<td valign="top" id="body_content_inner_cell">
																		<div id="body_content_inner">
