<?php
define( 'ABSPATH', __DIR__ . '/' );
function add_filter() {}
function sanitize_key( $v ) { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( (string) $v ) ); }
function sanitize_text_field( $v ) { return trim( strip_tags( (string) $v ) ); }
function sanitize_textarea_field( $v ) { return trim( strip_tags( (string) $v ) ); }
function sanitize_hex_color( $v ) { return preg_match( '/^#[0-9a-f]{6}$/i', (string) $v ) ? $v : null; }
function home_url( $path = '' ) { return 'http://127.0.0.1:8099' . $path; }
function esc_url( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES ); }
function esc_attr( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES ); }
function esc_html( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES ); }
function wp_kses_post( $v ) { return (string) $v; }
function wp_kses_allowed_html() { return []; }
function wp_kses( $v ) { return (string) $v; }
function __( $v ) { return $v; }
function is_rtl() { return false; }
require __DIR__ . '/wp/wp-content/mu-plugins/dtb-platform/Support/Email.php';
ob_start();
include __DIR__ . '/wp/wp-content/mu-plugins/dtb-commerce/Email/templates/emails/email-styles.php';
$css = ob_get_clean();
$logo = '/logos/email-logo-white.png';
?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style><?php echo $css; ?></style></head><body><table id="outer_wrapper" width="100%" role="presentation"><tr><td><table id="wrapper" width="100%" role="presentation"><tr><td><table id="inner_wrapper" width="100%" role="presentation"><tr><td><table id="template_header" width="100%" role="presentation"><tr><td id="template_header_image" align="center"><img src="<?php echo $logo; ?>" width="230" alt="Drywall Toolbox"></td></tr></table><table id="template_container" width="100%" role="presentation"><tr><td id="body_content"><table width="100%" role="presentation"><tr><td id="body_content_inner_cell"><div id="body_content_inner">
<?php
echo dtb_email_hero( 'Thank you for your order!', "Your payment has been confirmed and we're getting your tools ready for shipment. We'll notify you as soon as they're on the way.", 'Order #5987' );
echo dtb_email_progress_steps( [ [ 'label' => 'Payment received', 'state' => 'done', 'icon' => 'payment' ], [ 'label' => 'Being prepared', 'state' => 'active', 'icon' => 'package' ], [ 'label' => 'On the way soon', 'state' => 'upcoming', 'icon' => 'truck' ] ] );
echo dtb_email_card_open( 'Order summary', 'August 4, 2026' );
?>
<table class="email-order-details" width="100%" role="presentation"><tr><td width="70"><img src="/logos/email-logo-white.png" width="58"></td><td><strong>Complete Taping Tool Kit - 12&quot;</strong><br><small>SKU: DTB-12KIT</small></td><td width="40" align="center">1</td><td width="90" align="right"><strong>$383.28</strong></td></tr></table>
<table class="email-order-details email-order-totals" width="100%" role="presentation"><tr><td>Subtotal</td><td align="right">$383.28</td></tr><tr><td>Shipping</td><td align="right">Free</td></tr><tr><td>Tax</td><td align="right">$31.20</td></tr><tr><td>Total</td><td align="right">$414.48</td></tr></table>
<?php echo dtb_email_button( '#order', 'View your order' ); echo dtb_email_card_close(); ?>
<?php echo dtb_email_card_open( 'Billing & shipping addresses', '', 'location' ); ?>
<table width="100%" role="presentation"><tr><td width="50%" valign="top"><strong>BILLING ADDRESS</strong><br>Elliott Miller<br>14725 31st Ave N<br>Minneapolis, MN 55447<br><a href="#phone">7635283228</a></td><td width="50%" valign="top"><strong>SHIPPING ADDRESS</strong><br>Elliott Miller<br>14725 31st Ave N<br>Minneapolis, MN 55447</td></tr></table>
<?php echo dtb_email_card_close(); echo dtb_email_support_card( "We're here for you.", '#support', 'Contact support', 'support', 'Need help?' ); ?>
</div></td></tr></table></td></tr></table><table id="template_footer" width="100%" role="presentation"><tr><td><div id="credit">© 2026 Drywall Toolbox. All rights reserved.</div></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>
