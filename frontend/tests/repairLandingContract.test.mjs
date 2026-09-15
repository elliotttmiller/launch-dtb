import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const frontendRoot = new URL('frontend/', repoRoot);
const REPAIR_LANDING = new URL('src/pages/RepairLanding.jsx', frontendRoot);

async function readRepairLanding() {
  return readFile(REPAIR_LANDING, 'utf8');
}

test('repair landing sources supported brands from the repair catalog authority', async () => {
  const source = await readRepairLanding();

  assert.match(source, /getOfficialRepairBrands/);
  assert.match(source, /from '\.\.\/data\/repairCatalogMap\.js'/);
  assert.doesNotMatch(source, /SCHEMATIC_DEFINITIONS/);
});

test('repair landing preserves the canonical customer repair routes', async () => {
  const source = await readRepairLanding();

  assert.match(source, /to="\/repairs\/start"/);
  assert.match(source, /to="\/repairs\/packages"/);
  assert.match(source, /to="\/repairs\/track"/);
  assert.match(source, /to="\/repairs\/start\?package=diagnose_and_quote"/);
  assert.match(source, /to="\/schematics"/);
  assert.match(source, /to="\/parts"/);
});

test('repair landing does not route inbound repair packing guidance to the storefront shipping policy', async () => {
  const source = await readRepairLanding();

  assert.match(source, /Before You Ship/);
  assert.doesNotMatch(source, /to="\/shipping-policy"/);
});

test('repair landing keeps inspection and approval expectations explicit without fixed turnaround claims', async () => {
  const source = await readRepairLanding();

  assert.match(source, /Physical inspection before quote-first work/);
  assert.match(source, /Additional quote-first work waits for your authorization/);
  assert.match(source, /final repair scope is determined after the tool is physically inspected/i);
  assert.doesNotMatch(source, /\b\d+\s*[-–]\s*\d+\s*(business\s+)?days\b/i);
  assert.doesNotMatch(source, /\b\d+\s*[-–]\s*\d+\s*weeks?\b/i);
});

test('repair FAQ retains customer evidence, old-parts preference, and grouped semantics', async () => {
  const source = await readRepairLanding();

  assert.match(source, /title: 'Repair & Parts'/);
  assert.match(source, /Can I upload photos of the problem\?/);
  assert.match(source, /Can replaced parts be returned with my tool\?/);
  assert.match(source, /aria-labelledby=\{groupId\}/);
});
