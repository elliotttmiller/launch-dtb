#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadRegistry, validateTaskManifest } from './lib/routing.mjs';

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
  'CLAUDE.md',
  '.agents/README.md',
  '.agents/registry.json',
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
  'scripts/ai/lib/routing.mjs',
  'scripts/ai/resolve-task.mjs',
  'scripts/ai/create-task.mjs',
  'scripts/ai/validate-task.mjs',
  'scripts/ai/test-routing.mjs',
];
for (const file of required) if (!exists(file)) fail(`missing required AI governance file: ${file}`);

const canonicalFiles = [
  '.agents/registry.json',
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
  'CLAUDE.md',
  ...walk('.claude/agents').filter((p) => p.endsWith('.md')),
  ...walk('.claude/skills').filter((p) => p.endsWith('/SKILL.md')),
  ...walk('.codex/agents').filter((p) => p.endsWith('.toml')),
  '.github/copilot-instructions.md',
].filter((p) => exists(p));
for (const file of adapterFiles) {
  const text = read(file);
  if (!text.includes('.agents/')) fail(`${file}: assistant adapter must point to canonical .agents/ knowledge`);
  if (/source precedence/i.test(text)) fail(`${file}: assistant adapter must not redefine source precedence`);
}

let registry;
try {
  registry = loadRegistry();
} catch (error) {
  fail(`.agents/registry.json: invalid registry JSON: ${error.message}`);
}

if (registry) {
  if (registry.version !== 1) fail(`.agents/registry.json: unsupported registry version ${registry.version}`);
  if (!Array.isArray(registry.riskOrder) || JSON.stringify(registry.riskOrder) !== JSON.stringify(['low', 'medium', 'high', 'critical'])) {
    fail('.agents/registry.json: riskOrder must be low, medium, high, critical');
  }

  for (const [workflowId, workflowPath] of Object.entries(registry.workflows || {})) {
    if (!exists(workflowPath)) fail(`.agents/registry.json: workflow ${workflowId} references missing file ${workflowPath}`);
  }

  for (const [intent, rule] of Object.entries(registry.intents || {})) {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      fail(`.agents/registry.json: intent ${intent} must be an object`);
      continue;
    }
    if (!registry.workflows?.[rule.workflow]) fail(`.agents/registry.json: intent ${intent} references unknown workflow ${rule.workflow}`);
    if (rule.role && !registry.roles?.[rule.role]) fail(`.agents/registry.json: intent ${intent} references unknown role ${rule.role}`);
    for (const [domain, roleId] of Object.entries(rule.domainRoleOverrides || {})) {
      if (!registry.domains?.[domain]) fail(`.agents/registry.json: intent ${intent} override references unknown domain ${domain}`);
      if (!registry.roles?.[roleId]) fail(`.agents/registry.json: intent ${intent} override references unknown role ${roleId}`);
    }
  }

  for (const [domain, roleId] of Object.entries(registry.domains || {})) {
    if (!registry.roles?.[roleId]) fail(`.agents/registry.json: domain ${domain} references unknown role ${roleId}`);
  }

  for (const [roleId, role] of Object.entries(registry.roles || {})) {
    if (!exists(role.path)) fail(`.agents/registry.json: role ${roleId} references missing file ${role.path}`);
    if (!['read', 'write'].includes(role.mode)) fail(`.agents/registry.json: role ${roleId} has invalid mode ${role.mode}`);
    if (role.minimumRisk && !registry.riskOrder.includes(role.minimumRisk)) fail(`.agents/registry.json: role ${roleId} has invalid minimumRisk ${role.minimumRisk}`);
    for (const skillId of role.requiredSkills || []) {
      if (!registry.skills?.[skillId]) fail(`.agents/registry.json: role ${roleId} references unknown skill ${skillId}`);
    }
    for (const reviewerId of role.alwaysReviewers || []) {
      if (!registry.roles?.[reviewerId]) fail(`.agents/registry.json: role ${roleId} references unknown reviewer ${reviewerId}`);
      else if (registry.roles[reviewerId].mode !== 'read') fail(`.agents/registry.json: reviewer ${reviewerId} must be read-only`);
    }
  }

  for (const [skillId, skillPath] of Object.entries(registry.skills || {})) {
    if (!exists(skillPath)) fail(`.agents/registry.json: skill ${skillId} references missing file ${skillPath}`);
  }

  for (const [flag, rule] of Object.entries(registry.flags || {})) {
    for (const skillId of rule.skills || []) {
      if (!registry.skills?.[skillId]) fail(`.agents/registry.json: flag ${flag} references unknown skill ${skillId}`);
    }
    for (const reviewerId of rule.reviewers || []) {
      if (!registry.roles?.[reviewerId]) fail(`.agents/registry.json: flag ${flag} references unknown reviewer ${reviewerId}`);
      else if (registry.roles[reviewerId].mode !== 'read') fail(`.agents/registry.json: reviewer ${reviewerId} must be read-only`);
    }
    if (rule.minimumRisk && !registry.riskOrder.includes(rule.minimumRisk)) fail(`.agents/registry.json: flag ${flag} has invalid minimumRisk ${rule.minimumRisk}`);
  }

  for (const [risk, reviewerIds] of Object.entries(registry.riskReviewers || {})) {
    if (!registry.riskOrder.includes(risk)) fail(`.agents/registry.json: unknown riskReviewers level ${risk}`);
    for (const reviewerId of reviewerIds) {
      if (!registry.roles?.[reviewerId]) fail(`.agents/registry.json: risk ${risk} references unknown reviewer ${reviewerId}`);
      else if (registry.roles[reviewerId].mode !== 'read') fail(`.agents/registry.json: reviewer ${reviewerId} must be read-only`);
    }
  }

  const roleIdsByPath = new Map();
  for (const [roleId, role] of Object.entries(registry.roles || {})) {
    if (roleIdsByPath.has(role.path)) fail(`.agents/registry.json: roles ${roleIdsByPath.get(role.path)} and ${roleId} share ${role.path}`);
    roleIdsByPath.set(role.path, roleId);
  }

  const taskJsonFiles = walk('docs/work').filter((p) => p.endsWith('/task.json'));
  for (const taskPath of taskJsonFiles) {
    try {
      const manifest = JSON.parse(read(taskPath));
      for (const error of validateTaskManifest(manifest, registry)) fail(`${taskPath}: ${error}`);
      const taskDir = path.posix.dirname(taskPath);
      for (const requiredTaskFile of ['brief.md', 'evidence.md', 'decisions.md', 'status.md', 'verification.md']) {
        if (!exists(path.posix.join(taskDir, requiredTaskFile))) fail(`${taskDir}: missing ${requiredTaskFile}`);
      }
    } catch (error) {
      fail(`${taskPath}: invalid JSON: ${error.message}`);
    }
  }
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
