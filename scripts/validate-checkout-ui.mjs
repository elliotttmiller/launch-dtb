import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  js: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.js'),
  css: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css'),
  desktop: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css'),
  template: path.join(root, 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'),
  versioner: path.join(root, 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-checkout-asset-version.php'),
};

const source = Object.fromEntries(Object.entries(files).map(([key, filename]) => [key, fs.readFileSync(filename, 'utf8')]));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(!source.js.includes("panels[ 0 ].parentNode.insertBefore"), 'Accordion headers must not be inserted into WooCommerce-managed panel parents.');
assert(!source.js.includes('max-height: 2400px'), 'Fixed accordion height ceilings are forbidden.');
assert(source.js.includes("root.parentNode.insertBefore( chrome.nav, root )"), 'Accordion navigation must be mounted outside the WooCommerce root.');
assert(source.js.includes('availableSteps'), 'Optional checkout sections must be derived dynamically.');
assert(source.js.includes("root.addEventListener( 'invalid'"), 'Native invalid events must reveal the owning section.');
assert(source.js.includes("root.addEventListener( 'submit'"), 'Form submit paths must be covered.');
assert(source.js.includes("panel.hidden = true"), 'Collapsed mobile checkout panels must use deterministic native visibility.');
assert(source.js.includes("panel.hidden = false"), 'Expanded mobile checkout panels must restore native visibility before focus/validation.');
assert(!source.js.includes('panel.scrollHeight'), 'Accordion code must not measure WooCommerce React panel heights.');
assert(!source.js.includes("panel.style.height"), 'Accordion code must not write inline heights into WooCommerce React panels.');
assert(!source.js.includes('ResizeObserver'), 'Checkout navigation must not couple WooCommerce rendering to ResizeObserver reconciliation.');
assert(!source.js.includes("window.dispatchEvent( new Event( 'resize' )"), 'Checkout navigation must not synthesize resize events for payment surfaces.');
assert(!source.js.includes("window.wp.data.subscribe"), 'Checkout navigation must not auto-advance from WooCommerce store churn.');
assert(!source.js.includes('controlledAdvance'), 'Checkout sections must not auto-advance while WooCommerce asynchronously validates/recalculates.');
assert(!source.css.includes('.wp-block-woocommerce-checkout-payment-block legend {\n\tdisplay: none'), 'Payment fieldset legends must remain accessible.');
assert(!/var\(--dtb-(surface|border|radius|shadow)/.test(source.desktop), 'Desktop CSS contains retired checkout token names.');
assert(!/max-height:\s*calc\(100dvh/.test(source.desktop), 'Desktop order summary must not create an internal viewport scroll container.');
assert(!source.template.includes('dtb-checkout__breadcrumb'), 'Static checkout breadcrumb must be removed.');
assert(!source.template.includes('dtb-checkout__trust'), 'Static trust claims must be removed.');
assert(source.versioner.includes('filemtime'), 'Checkout-owned assets must use file modification times for cache invalidation.');

const defined = new Set([...source.css.matchAll(/(--dtb-checkout-[\w-]+)\s*:/g)].map((match) => match[1]));
const used = new Set([...`${source.css}\n${source.desktop}`.matchAll(/var\((--dtb-checkout-[\w-]+)/g)].map((match) => match[1]));
for (const token of used) {
  assert(defined.has(token), `Undefined checkout CSS token: ${token}`);
}

if (failures.length) {
  console.error('Checkout UI contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Checkout UI contract validation passed.');
