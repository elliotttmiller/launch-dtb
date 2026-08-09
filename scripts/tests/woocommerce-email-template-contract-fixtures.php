<?php
/**
 * Static contract fixtures for DTB WooCommerce classic HTML email overrides.
 *
 * Run: php scripts/tests/woocommerce-email-template-contract-fixtures.php
 */

declare(strict_types=1);

$root         = dirname(__DIR__, 2);
$commerce     = $root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Email';
$platform     = $root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Support/Email.php';
$templates    = $commerce . '/templates/emails';
$upstream     = $root . '/drywalltoolbox/wp/wp-content/woocommerce/woo-email-templates/emails';
$icons        = $root . '/drywalltoolbox/logos/email-icons';
$resolver     = $commerce . '/TemplateOverride.php';
$preview      = $commerce . '/Preview/EmailPreviewService.php';
$assertions   = 0;

/** @param mixed $condition */
function assert_contract($condition, string $message): void {
	global $assertions;
	++$assertions;
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");
		exit(1);
	}
}

function read_fixture(string $path): string {
	$content = file_get_contents($path);
	assert_contract(false !== $content, "Unable to read {$path}");
	return (string) $content;
}

/** @return list<string> */
function extension_points(string $content): array {
	preg_match_all('/(?:do_action|apply_filters)\(\s*[\'\"]([^\'\"]+)[\'\"]/', $content, $matches);
	return array_values(array_unique($matches[1] ?? []));
}

$resolver_source = read_fixture($resolver);
preg_match_all(
	"/'emails\\/([^']+)'\\s*=>\\s*\\[\\s*'file'\\s*=>\\s*'([^']+)'\\s*,\\s*'source_version'\\s*=>\\s*'([^']+)'/",
	$resolver_source,
	$map_matches,
	PREG_SET_ORDER
);

assert_contract(24 === count($map_matches), 'Expected 24 allowlisted classic HTML templates.');
assert_contract(!str_contains($resolver_source, "emails/plain/" . "customer"), 'Plain-text templates must not be mapped.');
assert_contract(!str_contains($resolver_source, "'emails/customer-fulfillment-deleted.php'"), 'Fulfillment-deleted must remain unmapped.');

foreach ($map_matches as $mapping) {
	$template_name = $mapping[1];
	$file_name     = $mapping[2];
	$map_version   = $mapping[3];
	$override_path = $templates . '/' . $file_name;
	assert_contract(is_file($override_path), "Mapped override is missing: {$file_name}");

	$upstream_path = $upstream . '/' . $template_name;
	if (!is_file($upstream_path)) {
		continue;
	}
	preg_match('/@version\s+([^\s*]+)/', read_fixture($upstream_path), $version_match);
	assert_contract($map_version === ($version_match[1] ?? ''), "{$file_name} source version does not match its upstream export");

	$source_points   = extension_points(read_fixture($upstream_path));
	$override_points = extension_points(read_fixture($override_path));
	$last_position   = -1;
	foreach ($source_points as $point) {
		$position = array_search($point, $override_points, true);
		assert_contract(false !== $position, "{$file_name} is missing upstream extension point {$point}");
		assert_contract($position > $last_position, "{$file_name} changes upstream extension-point order at {$point}");
		$last_position = $position;
	}
}

$platform_source = read_fixture($platform);
preg_match('/\$allowed\s*=\s*\[([^;]+)\];/', $platform_source, $allowed_match);
preg_match_all("/'([a-z0-9-]+)'/", $allowed_match[1] ?? '', $allowed_names);
$allowed_icons = array_values(array_unique($allowed_names[1] ?? []));

assert_contract(10 === count($allowed_icons), 'Expected ten allowlisted reusable email icons.');
foreach ($allowed_icons as $icon) {
	assert_contract(is_file($icons . '/' . $icon . '.png'), "Allowlisted icon is missing: {$icon}.png");
}
assert_contract(!is_file($icons . '/enhanced-email-icons.png'), 'Composite icon source sheet must not be deployed.');
assert_contract(!is_file($icons . '/ChatGPT Image Aug 4, 2026, 01_46_27 AM.png'), 'Generated icon source sheet must not be deployed.');

foreach (glob($templates . '/*.php') ?: [] as $template_path) {
	$template_source = read_fixture($template_path);
	preg_match_all("/'icon'\s*=>\s*'([a-z0-9-]+)'/", $template_source, $icon_matches);
	foreach ($icon_matches[1] ?? [] as $icon) {
		assert_contract(in_array($icon, $allowed_icons, true), basename($template_path) . " references unmapped icon {$icon}");
	}
}

$styles = read_fixture($templates . '/email-styles.php');
assert_contract((bool) preg_match('/max-width:\s*680px/', $styles), 'Email shell must retain the 680px desktop maximum.');
assert_contract((bool) preg_match('/@media\s+screen\s+and\s+\(max-width:\s*600px\)/', $styles), 'Mobile email breakpoint is missing.');
assert_contract(str_contains($styles, '#2255ee'), 'Primary brand blue is missing from email CSS.');
assert_contract(str_contains($platform_source, "'Geist',Arial,sans-serif"), 'Geist with an email-safe fallback is required.');
assert_contract(!str_contains($platform_source, "'Nunito'"), 'Shared email helpers must not reference Nunito.');

$customer_details = read_fixture($templates . '/email-customer-details.php');
assert_contract(str_contains($customer_details, "[ 'billing_email', 'billing_phone' ]"), 'Customer details must not repeat contact fields already rendered in the address section.');
assert_contract(str_contains($customer_details, 'dtb-customer-details'), 'Customer details must use the responsive detail table.');
assert_contract(!str_contains($customer_details, '<ul'), 'Customer details must not fall back to a generic bulleted list.');

$tracking_links = read_fixture($root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-tracking-links.php');
assert_contract(str_contains($tracking_links, 'dtb_email_font_stack'), 'Order-tracking email links must use the shared email font authority.');
assert_contract(!str_contains($tracking_links, 'Nunito'), 'Order-tracking email links must not reference Nunito.');
assert_contract(str_contains($platform_source, "'done' === \$state ? '&#10003;'"), 'Completed progress steps must render a checkmark.');
assert_contract(str_contains($platform_source, 'dtb-progress-connector'), 'Progress steps must reserve deterministic connector width for responsive labels.');
$progress_start  = strpos($platform_source, 'function dtb_email_progress_steps(');
$progress_end    = strpos($platform_source, "if ( ! function_exists( 'dtb_email_card_chrome_style' )", (int) $progress_start);
$progress_source = false !== $progress_start && false !== $progress_end
	? substr($platform_source, $progress_start, $progress_end - $progress_start)
	: '';
assert_contract('' !== $progress_source, 'Progress helper source could not be isolated.');
assert_contract(!str_contains($progress_source, 'dtb_email_icon('), 'Progress steps must not render hosted icons.');
foreach (glob($templates . '/customer-*.php') ?: [] as $template_path) {
	$template_source = read_fixture($template_path);
	if (str_contains($template_source, 'dtb_email_progress_steps')) {
		assert_contract(!str_contains($template_source, "'icon' =>"), basename($template_path) . ' must not pass progress icons.');
	}
}
assert_contract(str_contains($platform_source, '/logos/email-background-pattern.png'), 'Hero background asset mapping is missing.');
assert_contract(str_contains($platform_source, 'width:680px'), 'Outlook VML hero width must match the shell.');

$order_items = read_fixture($templates . '/email-order-items.php');
assert_contract(str_contains($order_items, 'get_qty_refunded_for_item'), 'Refunded item quantity handling is missing.');
assert_contract(str_contains($order_items, 'woocommerce_email_order_item_quantity'), 'Order-item quantity filter is missing.');

$preview_source = read_fixture($preview);
assert_contract(str_contains($preview_source, '$email->get_content()'), 'Preview must use the registered WC_Email renderer.');
assert_contract(str_contains($preview_source, '$email->style_inline( $html )'), 'Preview must use WooCommerce CSS inlining.');
assert_contract(!str_contains($preview_source, '$email->trigger('), 'Preview must never trigger email delivery.');
assert_contract(!str_contains($preview_source, '$email->send('), 'Preview must never invoke email transport.');

fwrite(STDOUT, "WooCommerce email template contracts verified ({$assertions} assertions).\n");
