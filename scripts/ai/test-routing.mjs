#!/usr/bin/env node
import assert from 'node:assert/strict';
import { loadRegistry, resolveTask } from './lib/routing.mjs';

const registry = loadRegistry();

const frontend = resolveTask({
  intent: 'implement',
  domain: 'frontend',
  flags: ['ui', 'responsive'],
  risk: 'medium',
}, registry);
assert.equal(frontend.workflow.id, 'implementation');
assert.equal(frontend.role.id, 'frontend-engineer');
assert.equal(frontend.role.mode, 'write');
assert.equal(frontend.subjectRole.id, 'frontend-engineer');
assert.equal(frontend.effectiveRisk, 'medium');
assert.deepEqual(frontend.skills.map((item) => item.id).sort(), [
  'dtb-design-system',
  'dtb-react-engineering',
  'dtb-responsive-ui-engineering',
  'dtb-ui-design-critique',
].sort());
assert(frontend.reviewers.some((item) => item.id === 'code-reviewer'));

const frontendReview = resolveTask({
  intent: 'review',
  domain: 'frontend',
  flags: [],
  risk: 'low',
}, registry);
assert.equal(frontendReview.workflow.id, 'review');
assert.equal(frontendReview.role.id, 'code-reviewer');
assert.equal(frontendReview.role.mode, 'read');
assert.equal(frontendReview.subjectRole.id, 'frontend-engineer');

const checkout = resolveTask({
  intent: 'fix',
  domain: 'checkout',
  flags: ['payment', 'provider'],
  risk: 'low',
}, registry);
assert.equal(checkout.role.id, 'commerce-checkout-engineer');
assert.equal(checkout.effectiveRisk, 'critical');
assert(checkout.reviewers.some((item) => item.id === 'security-reviewer'));
assert(checkout.reviewers.some((item) => item.id === 'integration-reviewer'));
assert(checkout.reviewers.some((item) => item.id === 'test-verifier'));

const checkoutVerification = resolveTask({
  intent: 'verify',
  domain: 'checkout',
  flags: ['payment'],
  risk: 'high',
}, registry);
assert.equal(checkoutVerification.role.id, 'test-verifier');
assert.equal(checkoutVerification.role.mode, 'read');
assert.equal(checkoutVerification.subjectRole.id, 'commerce-checkout-engineer');
assert.equal(checkoutVerification.effectiveRisk, 'critical');

const architecture = resolveTask({
  intent: 'architecture',
  domain: 'checkout',
  flags: ['ownership-change'],
  risk: 'medium',
}, registry);
assert.equal(architecture.workflow.id, 'architecture');
assert.equal(architecture.role.id, 'architect');
assert.equal(architecture.role.mode, 'read');
assert.equal(architecture.subjectRole.id, 'commerce-checkout-engineer');
assert.equal(architecture.effectiveRisk, 'critical');
assert(!architecture.reviewers.some((item) => item.id === 'architect'));

const marketResearch = resolveTask({
  intent: 'research',
  domain: 'market-research',
  flags: [],
  risk: 'low',
}, registry);
assert.equal(marketResearch.role.id, 'market-intelligence-analyst');
assert(marketResearch.skills.some((item) => item.id === 'dtb-market-research'));

const frontendInvestigation = resolveTask({
  intent: 'investigate',
  domain: 'frontend',
  flags: [],
  risk: 'low',
}, registry);
assert.equal(frontendInvestigation.role.id, 'explorer');
assert.equal(frontendInvestigation.role.mode, 'read');
assert.equal(frontendInvestigation.subjectRole.id, 'frontend-engineer');

assert.throws(() => resolveTask({ intent: 'implement', domain: 'unknown', risk: 'low' }, registry), /unknown domain/);
assert.throws(() => resolveTask({ intent: 'implement', domain: 'frontend', flags: ['unknown'], risk: 'low' }, registry), /unknown flag/);

console.log('DTB AI routing tests passed.');
