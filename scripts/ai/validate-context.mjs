#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function walk(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function fail(message) { failures.push(message); }

const required = [
  'AGENTS.md',
  '.agents/README.md',
  '.agents/roles/explorer.md',
  '.agents/roles/architect.md',
  '.agents/roles/frontend-engineer.md',
  '.agents/roles/wordpress-backend-engineer.md',
  '.agents/roles/commerce-checkout-engineer.md',
  '.agents/roles/catalog-data-engineer.md',
  '.agents/roles/code-reviewer.md',
  '.agents/roles/security-reviewer.md',
  '.agents/roles/integration-reviewer.md',
  '.agents/roles/test-verifier.md',
  '.agents/workflows/implementation.md',
  'docs/work/README.md',
];
for (const file of required) if (!exists(file)) fail(`missing required AI governance file: ${file}`);

const canonicalFiles = [
  ...walk('.agents/context'),
  ...walk('.agents/roles'),
  ...walk('.agents/skills'),
  ...walk('.agents/workflows'),
].filter((p) => /\.(md|yml|yaml|json)$/.test(p));

for (const file of canonicalFiles) {
  const text = read(file);
  if (/\.claude\//i.test(text) || /\.codex\//i.test(text)) {
    fail(`${file}: canonical knowledge must not depend on vendor adapter paths`);
  }
  if (/\b(model\s*:\s*(sonnet|opus)|gpt-\d)/i.test(text)) {
    fail(`${file}: vendor/model selection belongs in adapters, not canonical knowledge`);
  }
  if (/(<reasoning>|show your chain[- ]of[- ]thought|reveal your chain[- ]of[- ]thought|show your private reasoning)/i.test(text)) {
    fail(`${file}: canonical instructions must not require private reasoning disclosure`);
  }
}

const adapterFiles = [
  ...walk('.claude/agents'),
  ...walk('.claude/skills').filter((p) => p.endsWith('/SKILL.md')),
  ...walk('.codex/agents'),
  '.github/copilot-instructions.md',
].filter((p) => exists(p));
for (const file of adapterFiles) {
  const text = read(file);
  if (!text.includes('.agents/')) fail(`${file}: assistant adapter must point to canonical .agents/ knowledge`);
  if (/source precedence/i.test(text)) fail(`${file}: assistant adapter must not redefine source precedence`);
}

const loaderPath = 'drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php';
if (exists(loaderPath) && exists('AGENTS.md')) {
  const loader = read(loaderPath);
  const agents = read('AGENTS.md');
  const modules = [...loader.matchAll(/\/(dtb-[a-z0-9-]+)\/bootstrap\.php/gi)].map((m) => m[1]);
  for (const moduleName of [...new Set(modules)]) {
    if (!agents.includes(`\`${moduleName}\``)) fail(`AGENTS.md: missing active MU-plugin module ${moduleName}`);
  }
}

for (const memoryFile of walk('memory-bank').filter((p) => p.endsWith('.md'))) {
  const text = read(memoryFile);
  if (/embedded in the React SPA via iframe|checkout is embedded via a bridge|native checkout is embedded/i.test(text)) {
    fail(`${memoryFile}: obsolete embedded/bridge checkout description detected`);
  }
}

for (const forbidden of ['TODO_dtb-seo.md', 'TODO_refactoring-expert.md', 'progress.md']) {
  if (exists(forbidden)) fail(`${forbidden}: global mutable AI task-state file is prohibited; use docs/work/<task-id>/`);
}

if (failures.length) {
  console.error('DTB AI context validation failed:\n');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`DTB AI context validation passed (${canonicalFiles.length} canonical files, ${adapterFiles.length} adapters checked).`);
