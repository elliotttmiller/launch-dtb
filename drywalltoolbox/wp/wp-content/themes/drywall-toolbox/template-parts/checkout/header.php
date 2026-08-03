<?php
/**
 * Drywall Toolbox checkout header.
 *
 * Presentation-only markup. Payment Plugins for Stripe retains ownership of
 * every provider surface and payment lifecycle.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;
?>
<header class="dtb-checkout-header">
	<div class="dtb-checkout-header__inner">
		<a class="dtb-checkout-header__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<img
				src="<?php echo esc_url( home_url( '/logo-white.svg' ) ); ?>"
				alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>"
				width="3000"
				height="917"
			>
		</a>
		<span class="dtb-checkout-header__security">
			<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path fill="currentColor" d="M8 0a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V3a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 3v2h-3V3A1.5 1.5 0 0 1 8 1.5Z"/>
			</svg>
			<img
				src="<?php echo esc_url( home_url( '/logos/powered_by_stripe.svg' ) ); ?>"
				alt="<?php esc_attr_e( 'Powered by Stripe', 'drywall-toolbox' ); ?>"
			>
		</span>
	</div>
</header>
