<?php
/**
 * Stripe Elements Appearance API integration for Payment Plugins for Stripe.
 *
 * Page CSS cannot style Stripe's cross-origin iframe. This adapter mirrors the
 * authoritative checkout visual tokens through the provider-supported
 * wc_stripe_get_element_options filter without changing gateway selection,
 * tokenization, authentication, confirmation or capture.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_StripeElementAppearance {
	private const UPM_GATEWAY_ID = 'stripe_upm';

	public static function register(): void {
		add_filter( 'wc_stripe_get_element_options', [ __CLASS__, 'apply_brand_appearance' ], 10, 2 );
	}

	/**
	 * @param array $options Options passed to Stripe Elements.
	 * @param mixed $gateway Payment gateway instance.
	 * @return array
	 */
	public static function apply_brand_appearance( array $options, $gateway ): array {
		$gateway_id = is_object( $gateway ) ? sanitize_key( (string) ( $gateway->id ?? '' ) ) : '';
		if ( self::UPM_GATEWAY_ID !== $gateway_id ) {
			return $options;
		}

		$existing_theme = is_array( $options['appearance'] ?? null )
			? (string) ( $options['appearance']['theme'] ?? 'stripe' )
			: 'stripe';
		$existing_fonts = is_array( $options['fonts'] ?? null ) ? $options['fonts'] : [];
		$geist_css_src  = 'https://fonts.googleapis.com/css2?family=Geist:wght@500;600;650;700&display=swap';
		$has_geist_font = false;

		foreach ( $existing_fonts as $font_source ) {
			if ( is_array( $font_source ) && $geist_css_src === (string) ( $font_source['cssSrc'] ?? '' ) ) {
				$has_geist_font = true;
				break;
			}
		}

		if ( ! $has_geist_font ) {
			$existing_fonts[] = [ 'cssSrc' => $geist_css_src ];
		}

		$options['fonts'] = $existing_fonts;

		$options['appearance'] = [
			'theme'     => $existing_theme,
			'labels'    => 'floating',
			'variables' => [
				'fontFamily'         => '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				'fontSizeBase'       => '16px',
				'fontSizeSm'         => '15px',
				'fontSizeXs'         => '14px',
				'fontWeightNormal'   => '500',
				'fontWeightMedium'   => '600',
				'fontWeightBold'     => '700',
				'fontLineHeight'     => '1.4',
				'colorPrimary'       => '#2563eb',
				'colorText'          => '#0b0f19',
				'colorTextSecondary' => '#394154',
				'colorBackground'    => '#ffffff',
				'colorDanger'        => '#b42318',
				'borderRadius'       => '8px',
				'spacingUnit'        => '4px',
			],
			'rules'     => [
				'.Tab' => [
					'border'     => '1px solid #e2e8f0',
					'boxShadow'  => 'none',
					'color'      => '#131927',
					'fontSize'   => '15px',
					'fontWeight' => '600',
					'lineHeight' => '1.3',
					'padding'    => '14px 16px',
				],
				'.Tab:hover' => [ 'color' => '#0b0f19' ],
				'.Tab--selected' => [
					'borderColor' => '#2563eb',
					'boxShadow'   => '0 0 0 1px #2563eb',
				],
				'.TabIcon--selected'  => [ 'fill' => '#2563eb' ],
				'.TabLabel' => [
					'color'      => '#131927',
					'fontSize'   => '15px',
					'fontWeight' => '600',
					'lineHeight' => '1.3',
				],
				'.TabLabel--selected' => [
					'color'      => '#1d4ed8',
					'fontWeight' => '700',
				],
				'.AccordionItem' => [
					'color'      => '#131927',
					'fontSize'   => '15px',
					'fontWeight' => '600',
					'lineHeight' => '1.3',
				],
				'.AccordionItem--selected' => [
					'color'      => '#1d4ed8',
					'fontWeight' => '700',
				],
				'.Label'              => [ 'fontWeight' => '600' ],
				'.Input' => [
					'border'    => '1px solid #cbd5e1',
					'boxShadow' => 'none',
				],
				'.Input:focus' => [
					'border'    => '1px solid #2563eb',
					'boxShadow' => '0 0 0 3px rgba(37, 99, 235, 0.18)',
				],
				'.Input--invalid' => [ 'border' => '1px solid #b42318' ],
				'.Error'          => [ 'color' => '#b42318' ],
			],
		];

		return $options;
	}
}

DTB_StripeElementAppearance::register();
