<?php
/**
 * Plugin Name: DTB Sitemap Admin Recovery Guard
 * Description: Prevents the public sitemap runtime from initializing inside wp-admin while the SiteGround fatal is isolated.
 * Version: 1.0.0
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/*
 * MU plugins load alphabetically. This guard intentionally loads before
 * 00-dtb-loader.php. The canonical sitemap service file already returns when
 * DTB_SitemapService exists, so defining this no-op admin sentinel prevents
 * public routing hooks and side effects from entering the wp-admin control
 * plane. Public storefront requests continue to load the real implementation.
 */
if ( is_admin() && ! class_exists( 'DTB_SitemapService', false ) ) {
	final class DTB_SitemapService {
		private function __construct() {}
	}
}
