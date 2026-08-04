<?php
/**
 * DTB branded email footer.
 *
 * Traced against WooCommerce core emails/email-footer.php v10.4.0
 * (wp-content/plugins/woocommerce/templates/emails/email-footer.php).
 * DTB customization: dark footer band (bookending the dark header) with
 * confirmed-real social links (dtb_email_social_icons() — see that
 * function's own comment on why fabricated profile URLs are refused) above
 * settings-backed Terms/Privacy/Contact links. The
 * woocommerce_email_footer_text filter and $email context still execute for
 * extension compatibility, but free-form footer text is intentionally not
 * rendered so an address or unrelated copy cannot escape the approved footer.
 *
 * Terms and Privacy render only when WooCommerce/WordPress has an
 * authoritative page configured; no route is fabricated by this template.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

$email = $email ?? null;

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
															<?php echo function_exists( 'dtb_email_social_icons' ) ? dtb_email_social_icons() : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
															<p style="margin:0 0 6px;">
																<?php
																/* translators: %s: current year. */
																printf( esc_html__( '© %s Drywall Toolbox. All rights reserved.', 'drywall-toolbox' ), esc_html( gmdate( 'Y' ) ) );
																?>
															</p>
																	<p style="margin:0 0 10px;"><?php echo function_exists( 'dtb_email_footer_link_html' ) ? dtb_email_footer_link_html() : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>
															<?php
															$email_footer_text = get_option( 'woocommerce_email_footer_text' );
															if ( apply_filters( 'woocommerce_is_email_preview', false ) ) {
																$text_transient    = get_transient( 'woocommerce_email_footer_text' );
																$email_footer_text = false !== $text_transient ? $text_transient : $email_footer_text;
															}
																	/**
																	 * Preserve the upstream filter invocation while DTB owns the visible footer.
																	 */
																	$email_footer_text = apply_filters( 'woocommerce_email_footer_text', $email_footer_text, $email );
																	unset( $email_footer_text );
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
				<td class="dtb-email-shell-gutter"><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
			</tr>
		</table>
	</body>
</html>
