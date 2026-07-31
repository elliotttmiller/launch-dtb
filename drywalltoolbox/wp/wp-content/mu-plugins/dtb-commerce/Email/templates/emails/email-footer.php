<?php
/**
 * DTB branded email footer.
 *
 * Traced against WooCommerce core emails/email-footer.php v10.4.0
 * (wp-content/plugins/woocommerce/templates/emails/email-footer.php).
 * DTB customization: footer copy/link styling only; the
 * woocommerce_email_footer_text filter and $email context are preserved
 * unchanged, closing the document structure opened in email-header.php.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

$email = $email ?? null;

$support_url = function_exists( 'dtb_email_support_url' ) ? dtb_email_support_url() : home_url( '/contact/' );
?>
																		</div>
																	</td>
																</tr>
															</table>
															<!-- End Content -->
														</td>
													</tr>
												</table>
												<!-- End Body -->
											</td>
										</tr>
									</table>
								</td>
							</tr>
							<tr>
								<td align="center" valign="top">
									<!-- Footer -->
									<table border="0" cellpadding="10" cellspacing="0" width="100%" id="template_footer" role="presentation">
										<tr>
											<td valign="top">
												<table border="0" cellpadding="10" cellspacing="0" width="100%" role="presentation">
													<tr>
														<td colspan="2" valign="middle" id="credit">
															<p style="margin:0 0 10px;">
																<a href="<?php echo esc_url( $support_url ); ?>"><?php esc_html_e( 'Contact support', 'drywall-toolbox' ); ?></a>
															</p>
															<?php
															$email_footer_text = get_option( 'woocommerce_email_footer_text' );
															if ( apply_filters( 'woocommerce_is_email_preview', false ) ) {
																$text_transient    = get_transient( 'woocommerce_email_footer_text' );
																$email_footer_text = false !== $text_transient ? $text_transient : $email_footer_text;
															}
															echo wp_kses_post(
																wpautop(
																	wptexturize(
																		/**
																		 * Provides control over the email footer text used for most order emails.
																		 *
																		 * Preserved from WooCommerce core for extension/settings compatibility.
																		 */
																		apply_filters( 'woocommerce_email_footer_text', $email_footer_text, $email )
																	)
																)
															);
															?>
														</td>
													</tr>
												</table>
											</td>
										</tr>
									</table>
									<!-- End Footer -->
								</td>
							</tr>
						</table>
					</div>
				</td>
				<td><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
			</tr>
		</table>
	</body>
</html>
