'use strict';

const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(frontendRoot, '..');
const manifestPath = path.join(frontendRoot, 'public', 'site.webmanifest');
const indexPath = path.join(frontendRoot, 'index.html');
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

const indexHtml = fs.readFileSync(indexPath, 'utf8');
if (!indexHtml.includes("searchParams.delete('source')")) {
  fail('frontend/index.html must strip legacy source=pwa launches before app boot.');
}

if (!indexHtml.includes("data-dtb-app-mounted")) {
  fail('frontend/index.html must use the explicit app-mounted marker for blank-page recovery.');
}

const htaccess = fs.readFileSync(htaccessPath, 'utf8');
if (!/<FilesMatch "\^site\\\.webmanifest\$">[\s\S]*?Cache-Control "no-cache, no-store, must-revalidate"/.test(htaccess)) {
  fail('drywalltoolbox/.htaccess must prevent stale browser caching of site.webmanifest.');
}

process.stdout.write('PWA mobile launch hardening verified.\n');
