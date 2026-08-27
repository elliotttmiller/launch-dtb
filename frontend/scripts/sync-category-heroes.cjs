'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const sourceDir = path.join(repoRoot, 'products', 'launch', 'media', 'categories', 'heroes');
const destinationDir = path.join(frontendRoot, 'src', 'assets', 'media', 'catalog', 'category-heroes');
const managedExtension = '.webp';

function fail(message) {
  process.stderr.write(`[category-heroes] ${message}\n`);
  process.exitCode = 1;
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function filesEqual(sourcePath, destinationPath) {
  if (!fs.existsSync(destinationPath)) return false;

  const sourceStat = fs.statSync(sourcePath);
  const destinationStat = fs.statSync(destinationPath);
  if (!sourceStat.isFile() || !destinationStat.isFile()) return false;
  if (sourceStat.size !== destinationStat.size) return false;

  return sha256(sourcePath) === sha256(destinationPath);
}

function validateFilename(filename) {
  const basename = path.basename(filename, managedExtension);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(basename)) {
    throw new Error(
      `Invalid category hero filename "${filename}". Use lowercase kebab-case: <category-slug>.webp`,
    );
  }
}

if (!fs.existsSync(sourceDir)) {
  fail(`Canonical source directory does not exist: ${sourceDir}`);
} else {
  try {
    fs.mkdirSync(destinationDir, { recursive: true });

    const sourceFiles = fs.readdirSync(sourceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === managedExtension)
      .map((entry) => entry.name)
      .sort();

    if (sourceFiles.length === 0) {
      throw new Error(`No ${managedExtension} category hero assets found in ${sourceDir}`);
    }

    sourceFiles.forEach(validateFilename);
    const expected = new Set(sourceFiles);

    const existingManagedFiles = fs.readdirSync(destinationDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === managedExtension)
      .map((entry) => entry.name);

    for (const filename of existingManagedFiles) {
      if (!expected.has(filename)) {
        fs.rmSync(path.join(destinationDir, filename));
        process.stdout.write(`[category-heroes] removed stale mirror: ${filename}\n`);
      }
    }

    let copied = 0;
    let unchanged = 0;

    for (const filename of sourceFiles) {
      const sourcePath = path.join(sourceDir, filename);
      const destinationPath = path.join(destinationDir, filename);

      if (filesEqual(sourcePath, destinationPath)) {
        unchanged += 1;
        continue;
      }

      fs.copyFileSync(sourcePath, destinationPath);
      copied += 1;
      process.stdout.write(`[category-heroes] synced: ${filename}\n`);
    }

    process.stdout.write(
      `[category-heroes] complete: ${sourceFiles.length} canonical asset(s), ${copied} copied, ${unchanged} unchanged.\n`,
    );
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
