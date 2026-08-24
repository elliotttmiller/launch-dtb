import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const REGISTRY_PATH = '.agents/registry.json';

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

export function loadRegistry() {
  return readJson(REGISTRY_PATH);
}

export function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function riskIndex(registry, risk) {
  const index = registry.riskOrder.indexOf(risk);
  if (index < 0) throw new Error(`unknown risk: ${risk}`);
  return index;
}

export function maxRisk(registry, ...risks) {
  const normalized = risks.filter(Boolean);
  if (!normalized.length) return 'low';
  return normalized.reduce((current, candidate) => (
    riskIndex(registry, candidate) > riskIndex(registry, current) ? candidate : current
  ), normalized[0]);
}

export function resolveTask({ intent, domain, flags = [], risk = 'low' }, registry = loadRegistry()) {
  const normalizedFlags = unique(normalizeList(flags));
  const workflowId = registry.intents[intent];
  if (!workflowId) throw new Error(`unknown intent: ${intent}`);

  const workflow = registry.workflows[workflowId];
  if (!workflow) throw new Error(`intent ${intent} references unknown workflow: ${workflowId}`);

  const roleId = registry.domains[domain];
  if (!roleId) throw new Error(`unknown domain: ${domain}`);

  const role = registry.roles[roleId];
  if (!role) throw new Error(`domain ${domain} references unknown role: ${roleId}`);

  let effectiveRisk = maxRisk(registry, risk, role.minimumRisk || 'low');
  const skillIds = [...(role.requiredSkills || [])];
  const reviewerIds = [...(role.alwaysReviewers || [])];

  for (const flag of normalizedFlags) {
    const rule = registry.flags[flag];
    if (!rule) throw new Error(`unknown flag: ${flag}`);
    skillIds.push(...(rule.skills || []));
    reviewerIds.push(...(rule.reviewers || []));
    if (rule.minimumRisk) effectiveRisk = maxRisk(registry, effectiveRisk, rule.minimumRisk);
  }

  reviewerIds.push(...(registry.riskReviewers[effectiveRisk] || []));

  const reviewers = unique(reviewerIds)
    .filter((reviewerId) => reviewerId !== roleId)
    .map((reviewerId) => {
      const reviewer = registry.roles[reviewerId];
      if (!reviewer) throw new Error(`unknown reviewer role: ${reviewerId}`);
      return { id: reviewerId, path: reviewer.path, mode: reviewer.mode };
    });

  const skills = unique(skillIds).map((skillId) => {
    const skillPath = registry.skills[skillId];
    if (!skillPath) throw new Error(`unknown skill: ${skillId}`);
    return { id: skillId, path: skillPath };
  });

  return {
    registryVersion: registry.version,
    intent,
    domain,
    flags: normalizedFlags,
    requestedRisk: risk,
    effectiveRisk,
    workflow: { id: workflowId, path: workflow },
    role: { id: roleId, path: role.path, mode: role.mode },
    skills,
    reviewers,
    context: ['AGENTS.md', '.agents/README.md', workflow, role.path, ...skills.map((item) => item.path)],
  };
}

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function validateTaskManifest(manifest, registry = loadRegistry()) {
  const errors = [];
  for (const field of ['schemaVersion', 'taskId', 'title', 'intent', 'domain', 'risk', 'routing']) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      errors.push(`missing required field: ${field}`);
    }
  }
  if (errors.length) return errors;

  if (manifest.schemaVersion !== 1) errors.push(`unsupported schemaVersion: ${manifest.schemaVersion}`);
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(manifest.taskId)) errors.push('taskId must be 3-81 lowercase alphanumeric/hyphen characters');

  let resolved;
  try {
    resolved = resolveTask({
      intent: manifest.intent,
      domain: manifest.domain,
      flags: manifest.flags || [],
      risk: manifest.risk,
    }, registry);
  } catch (error) {
    errors.push(error.message);
    return errors;
  }

  const routing = manifest.routing || {};
  if (routing.registryVersion !== resolved.registryVersion) errors.push('routing.registryVersion is stale');
  if (routing.workflow !== resolved.workflow.id) errors.push(`routing.workflow must be ${resolved.workflow.id}`);
  if (routing.role !== resolved.role.id) errors.push(`routing.role must be ${resolved.role.id}`);
  if (routing.effectiveRisk !== resolved.effectiveRisk) errors.push(`routing.effectiveRisk must be ${resolved.effectiveRisk}`);

  const expectedSkills = resolved.skills.map((item) => item.id).sort();
  const actualSkills = unique(routing.skills || []).sort();
  if (JSON.stringify(expectedSkills) !== JSON.stringify(actualSkills)) errors.push(`routing.skills must resolve to: ${expectedSkills.join(', ') || '(none)'}`);

  const expectedReviewers = resolved.reviewers.map((item) => item.id).sort();
  const actualReviewers = unique(routing.reviewers || []).sort();
  if (JSON.stringify(expectedReviewers) !== JSON.stringify(actualReviewers)) errors.push(`routing.reviewers must resolve to: ${expectedReviewers.join(', ') || '(none)'}`);

  return errors;
}
