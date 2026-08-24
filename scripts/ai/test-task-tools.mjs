#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/routing.mjs';

const id = `zz-ai-routing-test-${process.pid}`;
const taskDir = path.join(ROOT, 'docs', 'work', id);

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'ai', script), ...args], {
    cwd: path.join(ROOT, 'scripts'),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

try {
  run('create-task.mjs', [
    '--id', id,
    '--title', 'Routing lifecycle test',
    '--intent', 'review',
    '--domain', 'frontend',
    '--flags', 'ui',
    '--risk', 'low',
  ]);

  assert(fs.existsSync(taskDir));
  for (const file of ['task.json', 'brief.md', 'evidence.md', 'decisions.md', 'status.md', 'verification.md']) {
    assert(fs.existsSync(path.join(taskDir, file)), `${file} should exist`);
  }

  let manifest = JSON.parse(fs.readFileSync(path.join(taskDir, 'task.json'), 'utf8'));
  assert.equal(manifest.taskId, id);
  assert.equal(manifest.routing.role, 'code-reviewer');
  assert.equal(manifest.routing.subjectRole, 'frontend-engineer');
  run('validate-task.mjs', ['--id', id]);

  run('update-task.mjs', [
    '--id', id,
    '--intent', 'implement',
    '--risk', 'high',
    '--clear-flags',
  ]);
  manifest = JSON.parse(fs.readFileSync(path.join(taskDir, 'task.json'), 'utf8'));
  assert.equal(manifest.routing.role, 'frontend-engineer');
  assert.equal(manifest.routing.subjectRole, 'frontend-engineer');
  assert.equal(manifest.routing.effectiveRisk, 'high');
  assert.deepEqual(manifest.flags, []);
  assert(manifest.routing.reviewers.includes('test-verifier'));
  run('validate-task.mjs', ['--id', id]);

  const traversal = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'ai', 'validate-task.mjs'), '--id', '../escape'], {
    cwd: path.join(ROOT, 'scripts'),
    encoding: 'utf8',
  });
  assert.notEqual(traversal.status, 0, 'path-containing task IDs must be rejected');

  console.log('DTB AI task lifecycle tests passed.');
} finally {
  fs.rmSync(taskDir, { recursive: true, force: true });
}
