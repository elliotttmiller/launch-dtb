#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveTask, ROOT } from './lib/routing.mjs';

const args = parseArgs(process.argv.slice(2));
for (const required of ['id', 'title', 'intent', 'domain']) {
  if (!args[required]) {
    console.error('Usage: node scripts/ai/create-task.mjs --id <task-id> --title <title> --intent <intent> --domain <domain> [--flags a,b] [--risk low|medium|high|critical]');
    process.exit(2);
  }
}

if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(args.id)) {
  console.error('Task id must be 3-81 lowercase alphanumeric/hyphen characters.');
  process.exit(2);
}

const taskDir = path.join(ROOT, 'docs', 'work', args.id);
if (fs.existsSync(taskDir)) {
  console.error(`Task directory already exists: docs/work/${args.id}`);
  process.exit(1);
}

let resolved;
try {
  resolved = resolveTask({
    intent: args.intent,
    domain: args.domain,
    flags: args.flags || [],
    risk: args.risk || 'low',
  });
} catch (error) {
  console.error(`DTB AI task creation failed: ${error.message}`);
  process.exit(1);
}

fs.mkdirSync(taskDir, { recursive: true });

const manifest = {
  schemaVersion: 1,
  taskId: args.id,
  title: args.title,
  intent: args.intent,
  domain: args.domain,
  flags: resolved.flags,
  risk: resolved.requestedRisk,
  routing: {
    registryVersion: resolved.registryVersion,
    workflow: resolved.workflow.id,
    role: resolved.role.id,
    effectiveRisk: resolved.effectiveRisk,
    skills: resolved.skills.map((item) => item.id),
    reviewers: resolved.reviewers.map((item) => item.id)
  }
};

fs.writeFileSync(path.join(taskDir, 'task.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(taskDir, 'brief.md'), `# ${args.title}\n\n## Objective\n\nDescribe the requested outcome.\n\n## Acceptance criteria\n\n- Define observable completion criteria.\n\n## Non-goals\n\n- Record intentionally excluded scope.\n`);
fs.writeFileSync(path.join(taskDir, 'evidence.md'), '# Evidence\n\nRecord repository paths, symbols, runtime evidence, external evidence, and provenance.\n');
fs.writeFileSync(path.join(taskDir, 'decisions.md'), '# Decisions\n\nRecord material architecture decisions, rejected alternatives, and invariants.\n');
fs.writeFileSync(path.join(taskDir, 'status.md'), '# Status\n\n- State: planned\n- Completed:\n- In progress:\n- Blocked:\n');
fs.writeFileSync(path.join(taskDir, 'verification.md'), '# Verification\n\nRecord checks run, results, unverified behavior, and residual risks.\n');

console.log(`Created docs/work/${args.id}`);
console.log(JSON.stringify(resolved, null, 2));
