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
const heroPath = path.join(outputRoot, 'home', 'hero-drywall-tool.webp');
const robotsPath = path.join(outputRoot, 'robots.txt');

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

if (appEnv === 'staging') {
  if (!/^\s*RewriteRule\s+\^\s+index\.html\s+\[QSA,L\]$/m.test(emitted)) {
    throw new Error('The staging .htaccess must provide the HostGator subdirectory SPA fallback.');
  }
  if (!/^\s*Header\s+always\s+set\s+X-Robots-Tag\s+"noindex, nofollow"\s*$/m.test(emitted)) {
    throw new Error('The staging .htaccess must enforce X-Robots-Tag: noindex, nofollow.');
  }
  if (!emitted.includes('RewriteRule ^wp-json/(.*)$ /wp/index.php?rest_route=/$1 [QSA,L]')) {
    throw new Error('Staging REST aliases must route to the shared root WordPress runtime.');
  }
  if (!emitted.includes('RewriteRule ^checkout/?$ /checkout/ [R=302,L,NE]')) {
    throw new Error('Staging checkout must redirect to root-owned WooCommerce checkout.');
  }
  if (/RewriteRule[^\r\n]+\s+wp\/index\.php/.test(emitted)) {
    throw new Error('Staging routing must not target a nonexistent local staging wp/index.php.');
  }
} else {
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

if (appEnv === 'staging') {
  if (!fs.existsSync(heroPath)) {
    throw new Error('The staging artifact is missing home/hero-drywall-tool.webp.');
  }
  if (!fs.existsSync(robotsPath)) {
    throw new Error('The staging artifact is missing robots.txt.');
  }

  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (!/^Allow:\s*\/$/m.test(robots)) {
    throw new Error('The staging robots.txt must allow crawling for authorized SEO audits.');
  }
  if (/^Disallow:\s*\/$/m.test(robots) || /^Disallow:\s*\/staging\/2972\/$/m.test(robots)) {
    throw new Error('The staging robots policy must not block the staging audit surface.');
  }
  if (/^Sitemap:/mi.test(robots)) {
    throw new Error('The staging robots.txt must not advertise a staging sitemap.');
  }

  const javascriptAssets = Object.values(manifest.files || {})
    .filter((assetPath) => /\.js$/i.test(assetPath))
    .map((assetPath) => path.join(outputRoot, assetPath.replace(/^\/staging\/2972\//, '')));
  const compiledJavascript = javascriptAssets
    .filter((assetPath) => fs.existsSync(assetPath))
    .map((assetPath) => fs.readFileSync(assetPath, 'utf8'))
    .join('\n');

  if (!compiledJavascript.includes('REACT_APP_API_BASE_URL:"https://drywalltoolbox.com"')) {
    throw new Error('The staging bundle must target the shared root WordPress API origin.');
  }
  if (compiledJavascript.includes('https://drywalltoolbox.com/staging/2972/wp-json')) {
    throw new Error('The staging bundle contains the obsolete staging-prefixed REST authority.');
  }
  if (compiledJavascript.includes('https://drywalltoolbox.com/staging/2972/wp/wp-content')) {
    throw new Error('The staging bundle contains the obsolete staging WordPress media path.');
  }
}

process.stdout.write(
  `Routing contract verified: ${path.relative(repositoryRoot, emittedPath)} ` +
  `matches ${path.relative(repositoryRoot, sourcePath)}.\n`
);
