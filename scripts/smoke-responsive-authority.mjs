#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const assertIncludes = (content, value, label) => {
  if (!content.includes(value)) fail(`${label} is missing: ${value}`);
};
const assertNotIncludes = (content, value, label) => {
  if (content.includes(value)) fail(`${label} must not contain: ${value}`);
};

const main = read('frontend/src/main.jsx');
const responsive = read('frontend/src/styles/unified-responsive.css');
const checkoutDesktop = read(
  'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css',
);
const stylesDir = join(root, 'frontend/src/styles');
const styleNames = readdirSync(stylesDir);

const responsiveImport = "import './styles/unified-responsive.css';";
const responsiveImportCount = main.split(responsiveImport).length - 1;
if (responsiveImportCount !== 1) {
  fail(`main.jsx must import unified-responsive.css exactly once; found ${responsiveImportCount}`);
}

const importIndex = main.indexOf(responsiveImport);
const appImportIndex = main.indexOf("import App from './App.jsx';");
if (importIndex < 0 || appImportIndex < 0 || importIndex > appImportIndex) {
  fail('unified-responsive.css must be the final stylesheet import before App');
}

const forbiddenName = /(fix|patch|mockup|polish|mobile-authority|responsive-authority)/i;
for (const name of styleNames) {
  if (name === 'unified-responsive.css') continue;
  if (forbiddenName.test(name)) fail(`obsolete responsive patch naming is prohibited: ${name}`);
}

assertNotIncludes(responsive, 'html {\n  overflow-x:', 'unified-responsive.css');
assertNotIncludes(responsive, 'body,\n#root {\n  overflow-x:', 'unified-responsive.css');
assertNotIncludes(responsive, '.wc-block-checkout', 'React responsive authority');

for (const selector of [
  '.header-mobile-layout',
  '.account-hub__sheet',
  '.product-image-gallery__main',
  '.viewer-active',
  '.schematic-image-wrapper',
]) {
  assertIncludes(responsive, selector, 'unified-responsive.css');
}

for (const contract of [
  '.wc-block-components-sidebar-layout',
  '.wc-block-checkout__main',
  '.wc-block-checkout__sidebar',
  'body.woocommerce-checkout .wc-block-components-sidebar-layout > .wc-block-components-main',
  'body.woocommerce-checkout .wc-block-components-sidebar-layout > .wc-block-components-sidebar',
]) {
  assertIncludes(checkoutDesktop, contract, 'checkout-desktop.css');
}

assertNotIncludes(checkoutDesktop, 'max-height: calc(100dvh', 'checkout-desktop.css');
assertNotIncludes(checkoutDesktop, ':has(', 'checkout-desktop.css');
assertNotIncludes(checkoutDesktop, 'iframe ', 'checkout-desktop.css');

if (!process.exitCode) console.log('PASS: responsive authority contract is intact.');
