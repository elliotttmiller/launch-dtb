#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, ROOT, loadRegistry, validateTaskManifest } from './lib/routing.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.id) {
  console.error('Usage: node scripts/ai/validate-task.mjs --id <task-id>');
  process.exit(2);
}

const taskDir = path.join(ROOT, 'docs', 'work', args.id);
const requiredFiles = ['task.json', 'brief.md', 'evidence.md', 'decisions.md', 'status.md', 'verification.md'];
const errors = [];

if (!fs.existsSync(taskDir)) {
  console.error(`Task directory does not exist: docs/work/${args.id}`);
  process.exit(1);
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(taskDir, file))) errors.push(`missing task file: ${file}`);
}

if (!errors.length) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(taskDir, 'task.json'), 'utf8'));
    errors.push(...validateTaskManifest(manifest, loadRegistry()));
  } catch (error) {
    errors.push(`task.json is invalid JSON: ${error.message}`);
  }
}

if (errors.length) {
  console.error(`DTB AI task validation failed for ${args.id}:\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`DTB AI task validation passed: docs/work/${args.id}`);
