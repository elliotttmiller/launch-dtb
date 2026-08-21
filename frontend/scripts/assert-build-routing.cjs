'use strict';

const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(frontendRoot, '..');
const appEnv = String(process.env.APP_ENV || '').trim().toLowerCase();
const publicUrl = String(process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
const deployTarget = String(process.env.DTB_DEPLOY_TARGET || 'siteground').trim().toLowerCase();

if (!['production', 'staging'].includes(appEnv)) {
  throw new Error('APP_ENV must be production or staging for routing validation.');
}

if (appEnv === 'production' && publicUrl !== '') {
  throw new Error('Production routing must be root-mounted with PUBLIC_URL=/ (normalized to empty).');
}
if (appEnv === 'staging' && publicUrl !== '/staging/2972') {
  throw new Error('Staging routing must use PUBLIC_URL=/staging/2972.');
}

const outputRoot = path.join(repositoryRoot, appEnv === 'staging' ? 'dist-staging' : 'dist');
const emittedPath = path.join(outputRoot, '.htaccess');
const routingFilename = appEnv === 'staging'
  ? 'htaccess.hostgator-staging'
  : (deployTarget === 'hostgator' ? 'htaccess.hostgator' : '.htaccess');
const sourcePath = path.join(repositoryRoot, 'drywalltoolbox', routingFilename);
const manifestPath = path.join(outputRoot, 'asset-manifest.json');

const expected = fs.readFileSync(sourcePath, 'utf8');
const emitted = fs.readFileSync(emittedPath, 'utf8');

if (emitted !== expected) {
  throw new Error(
    `${path.relative(repositoryRoot, emittedPath)} does not match its canonical ` +
    `routing source ${path.relative(repositoryRoot, sourcePath)}.`
  );
}

if (appEnv === 'production' && /^\s*RewriteRule\s+\^cart/m.test(emitted)) {
  throw new Error('The emitted .htaccess incorrectly routes the React /cart page to WordPress.');
}

if (appEnv === 'production' && !/^\s*RewriteRule\s+\^checkout\/\?\$\s+wp\/index\.php\?pagename=checkout\s+\[QSA,L\]$/m.test(emitted)) {
  throw new Error('The emitted .htaccess does not route native /checkout/ to WordPress.');
}

if (appEnv === 'staging' && !/^\s*RewriteRule\s+\^\s+index\.html\s+\[QSA,L\]$/m.test(emitted)) {
  throw new Error('The staging .htaccess must provide the HostGator subdirectory SPA fallback.');
}
if (appEnv === 'staging' && !/^\s*Header\s+always\s+set\s+X-Robots-Tag\s+"noindex, nofollow"\s*$/m.test(emitted)) {
  throw new Error('The staging .htaccess must enforce X-Robots-Tag: noindex, nofollow.');
}

const sitemapIndexRule = 'RewriteRule ^sitemap\\.xml$ wp/index.php?dtb_sitemap=index [QSA,L]';
const sitemapChildRule = 'RewriteRule ^sitemaps/([a-z0-9-]+)-([1-9][0-9]*)\\.xml$ wp/index.php?dtb_sitemap=$1&dtb_sitemap_page=$2 [QSA,L]';
const xmlGuardMarker = 'RewriteCond %{REQUEST_URI} \\.(?:css|js|mjs|map|json|webmanifest';
const sitemapIndexPosition = emitted.indexOf(sitemapIndexRule);
const sitemapChildPosition = emitted.indexOf(sitemapChildRule);
const xmlGuardPosition = emitted.indexOf(xmlGuardMarker);

if (sitemapIndexPosition < 0 || sitemapChildPosition < 0) {
  throw new Error('The emitted .htaccess must route DTB sitemap index and child XML requests to WordPress.');
}
if (xmlGuardPosition < 0 || sitemapIndexPosition > xmlGuardPosition || sitemapChildPosition > xmlGuardPosition) {
  throw new Error('DTB sitemap rewrites must run before the generic missing-static-asset XML 404 guard.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const logicalName of ['main.js', 'main.css', 'runtime.js']) {
  const assetPath = manifest.files?.[logicalName];
  if (!assetPath || !/\.[a-f0-9]{8}\.(?:js|css)$/i.test(assetPath)) {
    throw new Error(`${logicalName} must resolve to a content-hashed production asset.`);
  }
  if (appEnv === 'staging' && !assetPath.startsWith('/staging/2972/')) {
    throw new Error(`${logicalName} must be emitted below /staging/2972/.`);
  }
}

const lazyAssets = Object.values(manifest.files || {}).filter((assetPath) => /\.chunk\.(?:js|css)$/i.test(assetPath));
if (lazyAssets.length === 0 || lazyAssets.some((assetPath) => !/\.[a-f0-9]{8}\.chunk\.(?:js|css)$/i.test(assetPath))) {
  throw new Error('Every lazy JavaScript/CSS chunk must use a content-hashed production URL.');
}

process.stdout.write(
  `Routing contract verified: ${path.relative(repositoryRoot, emittedPath)} ` +
  `matches ${path.relative(repositoryRoot, sourcePath)}.\n`
);
