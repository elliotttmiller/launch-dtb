'use strict';

const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(frontendRoot, '..');
const manifestPath = path.join(frontendRoot, 'public', 'site.webmanifest');
const indexPath = path.join(frontendRoot, 'index.html');
const mobileDebugPath = path.join(frontendRoot, 'public', 'mobile-debug.php');
const storefrontHeaderPath = path.join(frontendRoot, 'src', 'components', 'storefront', 'StorefrontHeader.jsx');
const htaccessPath = path.join(repositoryRoot, 'drywalltoolbox', '.htaccess');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.start_url !== '/') {
  fail('PWA start_url must be "/" so installed mobile launches use the canonical root route.');
}

if (manifest.scope !== '/') {
  fail('PWA scope must be "/" so installed mobile launches do not inherit relative deploy paths.');
}

if (manifest.id !== '/') {
  fail('PWA id must be "/" to keep the installed app identity aligned with the canonical origin root.');
}

if (manifest.display !== 'standalone' || JSON.stringify(manifest.display_override) !== JSON.stringify(['standalone'])) {
  fail('PWA display mode must activate only as a true standalone installed app.');
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
if (!indexHtml.includes("searchParams.delete('source')")) {
  fail('frontend/index.html must strip legacy source=pwa launches before app boot.');
}

if (!indexHtml.includes("data-dtb-display-mode', standalone ? 'standalone' : 'browser'")) {
  fail('frontend/index.html must derive app mode from the actual standalone display signal.');
}

if (!indexHtml.includes("data-dtb-app-mounted")) {
  fail('frontend/index.html must use the explicit app-mounted marker for blank-page recovery.');
}

if (!indexHtml.includes('dtb_frontend_debug') || !indexHtml.includes('dtb_frontend_debug_authorized') || !indexHtml.includes('dtb-boot-debug-panel') || !indexHtml.includes('unhandledrejection')) {
  fail('frontend/index.html must retain query-gated pre-React boot diagnostics.');
}

const mobileDebugPhp = fs.readFileSync(mobileDebugPath, 'utf8');
if (!mobileDebugPhp.includes("current_user_can( 'manage_options' )") || !mobileDebugPhp.includes('inspectAsset') || !mobileDebugPhp.includes('asset-manifest.json')) {
  fail('mobile-debug.php must remain admin-gated and perform browser-side asset checks.');
}

const storefrontHeader = fs.readFileSync(storefrontHeaderPath, 'utf8');
if (!storefrontHeader.includes('const { height } = header.getBoundingClientRect()') || storefrontHeader.includes('const { bottom } = header.getBoundingClientRect()')) {
  fail('Storefront header spacing must use bounded element height, never its viewport-relative bottom coordinate.');
}

const htaccess = fs.readFileSync(htaccessPath, 'utf8');
if (!/<FilesMatch "\^site\\\.webmanifest\$">[\s\S]*?Cache-Control "no-cache, no-store, must-revalidate"/.test(htaccess)) {
  fail('drywalltoolbox/.htaccess must prevent stale browser caching of site.webmanifest.');
}

process.stdout.write('PWA mobile launch hardening verified.\n');
