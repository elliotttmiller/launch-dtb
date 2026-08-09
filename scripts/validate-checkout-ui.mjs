import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  js: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.js'),
  css: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css'),
  summary: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-summary.css'),
  desktop: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css'),
  template: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'),
  versioner: path.join(root, 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-checkout-asset-version.php'),
};

const source = Object.fromEntries(Object.entries(files).map(([key, filename]) => [key, fs.readFileSync(filename, 'utf8')]));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

// Checkout Block is React-managed. DTB mobile behavior must remain passive.
assert(source.js.includes('Intentionally no-op'), 'Mobile checkout behavior must remain an explicit no-op boundary.');
assert(!source.js.includes('MutationObserver'), 'DTB must not observe WooCommerce checkout DOM mutations.');
assert(!source.js.includes('ResizeObserver'), 'DTB must not observe WooCommerce checkout layout changes.');
assert(!source.js.includes('querySelector'), 'DTB checkout JS must not query or orchestrate WooCommerce-managed DOM.');
assert(!source.js.includes('insertBefore'), 'DTB must not inject navigation into the WooCommerce checkout document flow.');
assert(!source.js.includes('.hidden'), 'DTB must not hide WooCommerce checkout sections.');
assert(!source.js.includes('setAttribute'), 'DTB must not mutate accessibility/state attributes on WooCommerce checkout nodes.');
assert(!source.js.includes('.focus('), 'DTB must not take ownership of checkout field focus.');
assert(!source.js.includes('scrollIntoView'), 'DTB must not force checkout scrolling during native input/validation behavior.');
assert(!source.js.includes('requestAnimationFrame'), 'DTB must not schedule DOM reconciliation against Checkout Block renders.');
assert(!source.js.includes('window.wp.data'), 'DTB must not couple presentation to WooCommerce data-store churn.');

assert(!source.css.includes('.wp-block-woocommerce-checkout-payment-block legend {\n\tdisplay: none'), 'Payment fieldset legends must remain accessible.');
assert(!/var\(--dtb-(surface|border|radius|shadow)/.test(source.desktop), 'Desktop CSS contains retired checkout token names.');
assert(!/max-height:\s*calc\(100dvh/.test(source.desktop), 'Desktop order summary must not create an internal viewport scroll container.');
assert(
  source.desktop.includes('body.woocommerce-checkout .wc-block-components-sidebar-layout > .wc-block-components-main'),
  'Desktop main track must outrank WooCommerce Blocks\' late 65% width rule.'
);
assert(
  source.desktop.includes('body.woocommerce-checkout .wc-block-components-sidebar-layout > .wc-block-components-sidebar'),
  'Desktop sidebar track must outrank WooCommerce Blocks\' late 35% width rule.'
);
assert(
  source.desktop.includes('.wc-block-checkout__sidebar .wc-block-components-checkout-order-summary { width: 100%'),
  'Desktop order summary must fill the bounded sidebar track.'
);
assert(!source.template.includes('dtb-checkout__breadcrumb'), 'Static checkout breadcrumb must be removed.');
assert(!source.template.includes('dtb-checkout__trust'), 'Static trust claims must be removed.');
assert(source.template.includes('dtb-checkout__topbar-inner'), 'Checkout header must use a bounded inner layout container.');
assert(!source.template.includes('Secure checkout'), 'Checkout header must not add a redundant Secure checkout label.');
assert(source.template.includes("'Provided by Stripe'"), 'Checkout header must expose the Stripe attribution image with accurate alternative text.');
assert(source.css.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 118px)'), 'Mobile checkout header must reserve a shrink-safe Stripe badge track.');
assert(source.css.includes('.wc-block-components-order-summary-item__description .wc-block-components-product-price'), 'Order summary must suppress duplicate description-column product prices.');
assert(source.css.includes('appearance: none !important;\n\topacity: 0 !important;'), 'Native radio inputs must stay visually hidden while preserving their accessible selection state.');
assert(source.css.includes('.wc-block-components-express-payment :where(fieldset, .wc-block-components-express-payment__content)'), 'Express Checkout structural wrappers must remain unboxed.');
assert(source.summary.includes('border-radius: 0 !important;\n\t\tbox-shadow: none !important;\n\t\toverflow: visible !important;'), 'Mobile order summary must remain an open ledger instead of a card.');
assert(source.versioner.includes('filemtime'), 'Checkout-owned assets must use file modification times for cache invalidation.');

const defined = new Set([...source.css.matchAll(/(--dtb-checkout-[\w-]+)\s*:/g)].map((match) => match[1]));
const used = new Set([...`${source.css}\n${source.summary}\n${source.desktop}`.matchAll(/var\((--dtb-checkout-[\w-]+)/g)].map((match) => match[1]));
for (const token of used) {
  assert(defined.has(token), `Undefined checkout CSS token: ${token}`);
}

if (failures.length) {
  console.error('Checkout UI contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Checkout UI contract validation passed.');
