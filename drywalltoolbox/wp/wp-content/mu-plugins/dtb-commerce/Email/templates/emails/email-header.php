<?php
/**
 * DTB branded email header.
 *
 * Traced against WooCommerce core emails/email-header.php v10.7.0.
 * The header is intentionally a solid black brand band. Pattern artwork is
 * owned exclusively by dtb_email_hero(); rendering the same cover image in two
 * adjacent tables causes each email client to crop/scale it independently and
 * creates a broken seam on mobile.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$store_name = $store_name ?? get_bloginfo( 'name', 'display' );
$header_image_url = apply_filters( 'woocommerce_email_header_image_url', home_url() );
$logo_url = function_exists( 'dtb_email_logo_url' ) ? dtb_email_logo_url() : '';

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
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
		<title><?php echo esc_html( $store_name ); ?></title>
	</head>
	<body <?php echo is_rtl() ? 'rightmargin' : 'leftmargin'; ?>="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
		<table width="100%" id="outer_wrapper" border="0" cellpadding="0" cellspacing="0" role="presentation">
			<tr>
				<td class="dtb-email-shell-gutter"><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
				<td class="dtb-email-shell-cell" width="680">
					<div id="wrapper" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>">
						<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="inner_wrapper" role="presentation">
							<tr>
								<td align="center" valign="top">
									<!-- Header: deterministic solid brand chrome. -->
									<table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_header" role="presentation" bgcolor="#000000" style="background-color:#000000;background:#000000;border-collapse:collapse;">
										<tr>
											<td id="template_header_image" align="center" bgcolor="#000000" style="background-color:#000000;">
												<?php if ( $logo_url ) : ?>
													<?php if ( $header_image_url ) : ?>
														<p style="margin:0;"><a href="<?php echo esc_url( $header_image_url ); ?>" style="display:inline-block;text-decoration:none;" target="_blank"><img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="230" style="display:block;width:230px;max-width:72%;height:auto;border:0;outline:none;text-decoration:none;"></a></p>
													<?php else : ?>
														<p style="margin:0;"><img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $store_name ); ?>" width="230" style="display:block;width:230px;max-width:72%;height:auto;border:0;outline:none;text-decoration:none;"></p>
													<?php endif; ?>
												<?php else : ?>
													<p class="email-logo-text" style="margin:0;color:#ffffff;"><?php echo esc_html( $store_name ); ?></p>
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
