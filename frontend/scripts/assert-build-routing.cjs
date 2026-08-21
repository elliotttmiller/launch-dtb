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
