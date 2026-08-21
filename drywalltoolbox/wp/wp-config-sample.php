<?php

/**
 * Drywall Toolbox production WordPress configuration template.
 *
 * Copy this file to the server-owned wp-config.php and replace every
 * CHANGE_ME value there. Never commit the populated runtime file.
 *
 * WordPress core lives physically under /wp while the public site, wp-admin,
 * authentication entry points, and REST API are exposed from the root origin.
 */

define( 'WP_CACHE', true ); // Managed by SiteGround Speed Optimizer.

/**
 * Database.
 */
define( 'DB_NAME', 'CHANGE_ME_DATABASE_NAME' );
define( 'DB_USER', 'CHANGE_ME_DATABASE_USER' );
define( 'DB_PASSWORD', 'CHANGE_ME_DATABASE_PASSWORD' );
define( 'DB_HOST', 'CHANGE_ME_DATABASE_HOST' );

define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

/**
 * Authentication keys and salts.
 *
 * Generate unique production values at:
 * https://api.wordpress.org/secret-key/1.1/salt/
 */
define( 'AUTH_KEY',         'CHANGE_ME_UNIQUE_PHRASE' );
define( 'SECURE_AUTH_KEY',  'CHANGE_ME_UNIQUE_PHRASE' );
define( 'LOGGED_IN_KEY',    'CHANGE_ME_UNIQUE_PHRASE' );
define( 'NONCE_KEY',        'CHANGE_ME_UNIQUE_PHRASE' );
define( 'AUTH_SALT',        'CHANGE_ME_UNIQUE_PHRASE' );
define( 'SECURE_AUTH_SALT', 'CHANGE_ME_UNIQUE_PHRASE' );
define( 'LOGGED_IN_SALT',   'CHANGE_ME_UNIQUE_PHRASE' );
define( 'NONCE_SALT',       'CHANGE_ME_UNIQUE_PHRASE' );

define( 'WP_CACHE_KEY_SALT', 'CHANGE_ME_UNIQUE_CACHE_SALT' );

/**
 * Database table prefix.
 *
 * This must match the installed database. Changing it on an existing site
 * disconnects WordPress from its current tables.
 */
$table_prefix = 'vaa_';

/**
 * Drywall Toolbox HostGator staging topology.
 */
define( 'WP_HOME', 'https://drywalltoolbox.com/staging/2972' );
define( 'WP_SITEURL', 'https://drywalltoolbox.com/staging/2972/wp' );
define( 'DRYWALL_ALLOWED_ORIGIN', 'https://drywalltoolbox.com' );

/**
 * The staging frontend and WordPress aliases share this scoped cookie path.
 * Do not define COOKIE_DOMAIN without a reviewed multi-subdomain requirement.
 */
define( 'COOKIEPATH', '/staging/2972/' );
define( 'SITECOOKIEPATH', '/staging/2972/' );
define( 'ADMIN_COOKIE_PATH', '/staging/2972/wp/' );

/**
 * Existing narrowly scoped topology compatibility switches.
 */
define( 'DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT', true );

/**
 * HTTPS and production hardening.
 */
define( 'FORCE_SSL_ADMIN', true );
define( 'DISALLOW_FILE_EDIT', true );
define( 'WP_ENVIRONMENT_TYPE', 'production' );
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

/**
 * Veeqo integration.
 *
 * Keep resource IDs at 0 until each live identifier is verified. Keep webhook
 * verification disabled unless Veeqo's live signing contract is verified.
 */
define( 'DTB_VEEQO_API_KEY', 'CHANGE_ME_SERVER_SIDE_VEEQO_API_KEY' );
define( 'DTB_VEEQO_CHANNEL_ID', 0 );
define( 'DTB_VEEQO_WAREHOUSE_ID', 0 );
define( 'DTB_VEEQO_DELIVERY_METHOD_ID', 0 );
define( 'DTB_VEEQO_WEBHOOK_SECRET', '' );
define( 'DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS', false );
define( 'DTB_VEEQO_DEBUG', false );

/**
 * Production-safe debug defaults.
 *
 * Enable WP_DEBUG and WP_DEBUG_LOG only for a bounded diagnostic window.
 */
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'WP_DEBUG_LOG', false );
define( 'SCRIPT_DEBUG', false );

@ini_set( 'display_errors', '0' );

/**
 * QuickBooks Online sandbox integration.
 */
define( 'DTB_QBO_ENVIRONMENT', 'sandbox' );
define( 'DTB_QBO_CLIENT_ID', 'CHANGE_ME_SERVER_SIDE_QBO_CLIENT_ID' );
define( 'DTB_QBO_CLIENT_SECRET', 'CHANGE_ME_SERVER_SIDE_QBO_CLIENT_SECRET' );
define( 'DTB_QBO_SANDBOX_WEBHOOK_VERIFIER_TOKEN', 'CHANGE_ME_QBO_WEBHOOK_VERIFIER_TOKEN' );

/**
 * Deployment Center / Release Management.
 *
 * The webhook secret must exactly match the GitHub Actions repository secret.
 * The GitHub token must be repository-scoped with Actions write, Contents read,
 * and Pull requests read permissions.
 */
define( 'DTB_DEPLOYMENT_WEBHOOK_SECRET', 'CHANGE_ME_64_CHARACTER_HEX_SECRET' );
define( 'DTB_GITHUB_DEPLOYMENT_TOKEN', 'CHANGE_ME_FINE_GRAINED_GITHUB_PAT' );
define( 'DTB_GITHUB_REPO_OWNER', 'elliotttmiller' );
define( 'DTB_GITHUB_REPO_NAME', 'launch-dtb' );
define( 'DTB_GITHUB_RELEASE_WORKFLOW_FILE', 'release-siteground.yml' );

/* That's all, stop editing! Happy publishing. */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

@include_once '/var/lib/sec/wp-settings-pre.php';

require_once ABSPATH . 'wp-settings.php';

@include_once '/var/lib/sec/wp-settings.php';
