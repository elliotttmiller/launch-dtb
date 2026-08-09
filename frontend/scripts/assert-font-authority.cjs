const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const forbiddenPattern = new RegExp(['work', 'sans'].join('[\\s-]?'), 'i');
const extensions = new Set(['.css', '.js', '.jsx', '.json', '.mjs', '.cjs']);
const failures = [];

function inspectFile(filename) {
  const relative = path.relative(root, filename).replaceAll('\\', '/');
  const source = fs.readFileSync(filename, 'utf8');
  if (forbiddenPattern.test(source)) {
    failures.push(`${relative} still references the retired secondary font.`);
  }
}

function inspectDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      inspectDirectory(absolute);
    } else if (extensions.has(path.extname(entry.name))) {
      inspectFile(absolute);
    }
  }
}

inspectFile(path.join(root, 'package.json'));
inspectFile(path.join(root, 'package-lock.json'));
inspectDirectory(path.join(root, 'src'));

const mainSource = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const typographySource = fs.readFileSync(path.join(root, 'src/styles/global-typography.css'), 'utf8');

if (!mainSource.includes("@fontsource-variable/geist/wght.css")) {
  failures.push('src/main.jsx must load the Geist variable font.');
}
if (!mainSource.includes("@fontsource-variable/geist/wght-italic.css")) {
  failures.push('src/main.jsx must load the Geist variable italic font.');
}
if (!typographySource.includes('--dtb-font-body: var(--dtb-font-display);')) {
  failures.push('The global body font token must resolve to the Geist display stack.');
}

if (failures.length > 0) {
  console.error('Frontend font authority validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Frontend font authority verified: Geist is the single customer-facing font.');
