const CATEGORY_INTENT_CONFIG = {
  'automatic-tools': {
    eyebrow: 'Shop by workflow',
    title: 'Build the system around the work.',
    description: 'Move from the task you need to complete into the authoritative product category. These links organize discovery only; WooCommerce remains the catalog authority.',
    intents: [
      { label: 'Tape', description: 'Apply tape and compound in a single pass.', targetSlugs: ['automatic-tapers', 'automatic-taping-tools'] },
      { label: 'Load', description: 'Move compound into tapers, boxes, and corner tools.', targetSlugs: ['pumps', 'mud-pans-and-pumps'] },
      { label: 'Finish flats', description: 'Finish flat joints with controlled compound application.', targetSlugs: ['finishing-boxes', 'flat-boxes'] },
      { label: 'Finish corners', description: 'Roll, apply, and finish inside corners.', targetSlugs: ['corner-tools', 'angle-heads', 'automatic-angle-heads'] },
      { label: 'Complete systems', description: 'Shop coordinated tool sets for a complete workflow.', targetSlugs: ['automatic-tool-sets', 'tool-sets-and-kits', 'toolsets'] },
    ],
  },
  'semi-automatic-tools': {
    eyebrow: 'Choose your setup',
    title: 'Semi-automatic tools by job.',
    description: 'Choose the tool family that matches how your crew tapes, applies compound, and finishes corners.',
    intents: [
      { label: 'Banjo tapers', description: 'A lower-investment step up from hand taping.', targetSlugs: ['banjo-tapers', 'semi-automatic-tapers'] },
      { label: 'Compound tubes', description: 'Manual-pressure compound delivery for finishing tools.', targetSlugs: ['compound-tubes', 'automatic-compound-tubes'] },
      { label: 'Applicator heads', description: 'Pair compatible heads with compound delivery tools.', targetSlugs: ['applicator-heads', 'compound-applicators', 'automatic-compound-applicators'] },
      { label: 'Corner flushers', description: 'Finish inside corners efficiently after application.', targetSlugs: ['corner-flushers', 'automatic-corner-flushers'] },
    ],
    guide: {
      title: 'Where semi-automatic tools fit',
      items: [
        { label: 'Starting out', detail: 'A practical step up when faster taping matters but a full automatic system is not yet necessary.' },
        { label: 'Working contractor', detail: 'Useful for crews that want repeatable production while retaining familiar hand-finishing methods.' },
        { label: 'Production crew', detail: 'Consider a complete automatic system when daily throughput, loading speed, and system integration are the priority.' },
      ],
    },
  },
  'automatic-tool-sets': {
    eyebrow: 'Choose a system',
    title: 'Start with the work your crew performs.',
    description: 'Use these buying intents to narrow the set you need, then compare the actual products, included tools, price, and availability in the catalog below.',
    intents: [
      { label: 'Complete automatic systems', description: 'Taping, loading, flat finishing, and corner finishing in one coordinated setup.', filterHint: 'complete-system' },
      { label: 'Taping sets', description: 'Automatic taper plus the equipment required to load and run it.', filterHint: 'taping' },
      { label: 'Flat finishing sets', description: 'Finishing boxes, compatible handles, and loading equipment.', filterHint: 'flat-finishing' },
      { label: 'Corner finishing sets', description: 'Rollers, applicators, corner finishers, and compatible handles.', filterHint: 'corner-finishing' },
      { label: 'Starter / upgrade sets', description: 'Focused systems for contractors moving beyond hand tools.', filterHint: 'starter' },
      { label: 'Production crew sets', description: 'Broader systems for high-volume professional finishing.', filterHint: 'production' },
    ],
    guide: {
      title: 'Compare sets on what is actually included',
      items: [
        { label: 'System coverage', detail: 'Taper, pump, boxes, corner tools, handles, cases, and required adapters.' },
        { label: 'Working range', detail: 'Box sizes, corner-finisher sizes, and fixed or extendable handle ranges.' },
        { label: 'Commerce facts', detail: 'Current price, availability, warranty, and any real set savings should come from authoritative product data.' },
      ],
    },
  },
  toolsets: {
    aliasOf: 'automatic-tool-sets',
  },
  'tool-sets-and-kits': {
    aliasOf: 'automatic-tool-sets',
  },
};

function normalizeSlug(value = '') {
  return String(value).trim().toLowerCase().replace(/_/g, '-');
}

export function getCategoryMerchandising(category = {}) {
  const candidates = [category.slug, category.key, category.id].filter(Boolean).map(normalizeSlug);
  for (const candidate of candidates) {
    const config = CATEGORY_INTENT_CONFIG[candidate];
    if (!config) continue;
    if (config.aliasOf) return CATEGORY_INTENT_CONFIG[config.aliasOf] || null;
    return config;
  }
  return null;
}

export function resolveIntentTarget(intent, children = []) {
  if (!Array.isArray(children) || !Array.isArray(intent?.targetSlugs)) return null;
  const targets = new Set(intent.targetSlugs.map(normalizeSlug));
  return children.find((child) => {
    const candidates = [child?.slug, child?.key, child?.id].filter(Boolean).map(normalizeSlug);
    return candidates.some((candidate) => targets.has(candidate));
  }) || null;
}
