#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveTask, ROOT, validateTaskManifest, loadRegistry } from './lib/routing.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.id) {
  console.error('Usage: node scripts/ai/update-task.mjs --id <task-id> [--title <title>] [--intent <intent>] [--domain <domain>] [--flags a,b] [--risk low|medium|high|critical]');
  process.exit(2);
}

const taskDir = path.join(ROOT, 'docs', 'work', args.id);
const taskPath = path.join(taskDir, 'task.json');
if (!fs.existsSync(taskPath)) {
  console.error(`Task manifest does not exist: docs/work/${args.id}/task.json`);
  process.exit(1);
}

let current;
try {
  current = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
} catch (error) {
  console.error(`Existing task.json is invalid JSON: ${error.message}`);
  process.exit(1);
}

const next = {
  ...current,
  title: args.title || current.title,
  intent: args.intent || current.intent,
  domain: args.domain || current.domain,
  flags: args.flags !== undefined ? String(args.flags).split(',').map((item) => item.trim()).filter(Boolean) : (current.flags || []),
  risk: args.risk || current.risk,
};

let resolved;
try {
  resolved = resolveTask({
    intent: next.intent,
    domain: next.domain,
    flags: next.flags,
    risk: next.risk,
  });
} catch (error) {
  console.error(`DTB AI task rerouting failed: ${error.message}`);
  process.exit(1);
}

next.routing = {
  registryVersion: resolved.registryVersion,
  workflow: resolved.workflow.id,
  role: resolved.role.id,
  subjectRole: resolved.subjectRole.id,
  effectiveRisk: resolved.effectiveRisk,
  skills: resolved.skills.map((item) => item.id),
  reviewers: resolved.reviewers.map((item) => item.id),
};

const errors = validateTaskManifest(next, loadRegistry());
if (errors.length) {
  console.error('Updated task manifest would be invalid:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const tempPath = `${taskPath}.tmp`;
fs.writeFileSync(tempPath, `${JSON.stringify(next, null, 2)}\n`);
fs.renameSync(tempPath, taskPath);

console.log(`Updated routing for docs/work/${args.id}`);
console.log(JSON.stringify(resolved, null, 2));
