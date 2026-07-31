'use strict';

const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(frontendRoot, '..');
const appEnv = String(process.env.APP_ENV || '').trim().toLowerCase();
const publicUrl = String(process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');

if (appEnv !== 'production') {
  throw new Error('APP_ENV must be production for routing validation.');
}

if (publicUrl !== '') {
  throw new Error('Production routing must be root-mounted with PUBLIC_URL=/ (normalized to empty).');
}

const outputRoot = path.join(repositoryRoot, 'dist');
const emittedPath = path.join(outputRoot, '.htaccess');
const sourcePath = path.join(repositoryRoot, 'drywalltoolbox', '.htaccess');

const expected = fs.readFileSync(sourcePath, 'utf8');
const emitted = fs.readFileSync(emittedPath, 'utf8');

if (emitted !== expected) {
  throw new Error(
    `${path.relative(repositoryRoot, emittedPath)} does not match its canonical ` +
    `routing source ${path.relative(repositoryRoot, sourcePath)}.`
  );
}

if (/^\s*RewriteRule\s+\^cart/m.test(emitted)) {
  throw new Error('The emitted .htaccess incorrectly routes the React /cart page to WordPress.');
}

if (!/^\s*RewriteRule\s+\^checkout\/\?\$\s+wp\/index\.php\?pagename=checkout\s+\[QSA,L\]$/m.test(emitted)) {
  throw new Error('The emitted .htaccess does not route native /checkout/ to WordPress.');
}

process.stdout.write(
  `Routing contract verified: ${path.relative(repositoryRoot, emittedPath)} ` +
  `matches ${path.relative(repositoryRoot, sourcePath)}.\n`
);
