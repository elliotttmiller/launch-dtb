/**
 * Frontend presentation model for the Universal Toolset Builder.
 *
 * This file intentionally owns only customer-facing workflow copy, ordering,
 * and cardinality hints used to render the in-progress frontend. It is NOT an
 * authority for product eligibility, compatibility, pricing, stock, discounts,
 * cart validity, or checkout. Those rules remain server-owned and will replace
 * these presentation hints through the Toolset Builder API contract.
 */

export const TOOLSET_WORKFLOWS = Object.freeze([
  {
    id: 'full',
    label: 'Complete Automatic Set',
    shortLabel: 'Full Set',
    description: 'Build a complete automatic taping and finishing setup from compatible tools across the catalog.',
    recommendedFor: 'Crews starting or rebuilding a complete automatic tool setup.',
    capabilities: [
      { id: 'taper', label: 'Automatic Taper', toolFamily: 'automatic_taper', minimum: 1, maximum: 1, description: 'Applies tape and compound in one pass.' },
      { id: 'flat-boxes', label: 'Finishing Boxes', toolFamily: 'flat_box', minimum: 1, maximum: 2, description: 'Choose one or two flat boxes for finishing flats.' },
      { id: 'flat-box-handles', label: 'Flat Box Handles', toolFamily: 'flat_box_handle', minimum: 1, maximum: 2, description: 'Handles matched to the finishing-box workflow.' },
      { id: 'angle-heads', label: 'Angle Heads', toolFamily: 'angle_head', minimum: 1, maximum: 2, description: 'Finish inside corners and angles.' },
      { id: 'angle-head-handle', label: 'Angle Head Handle', toolFamily: 'angle_head_handle', minimum: 1, maximum: 1, description: 'Reach and control for angle-head work.' },
      { id: 'corner-tool', label: 'Corner Applicator', toolFamily: 'corner_box', minimum: 1, maximum: 1, description: 'Apply compound through the corner workflow.' },
      { id: 'corner-roller', label: 'Inside Corner Roller', toolFamily: 'corner_roller', minimum: 1, maximum: 1, description: 'Embed tape into inside corners.' },
      { id: 'corner-roller-handle', label: 'Corner Roller Handle', toolFamily: 'corner_roller_handle', minimum: 1, maximum: 1, description: 'Control and extend the corner roller.' },
      { id: 'pump', label: 'Loading Pump', toolFamily: 'pump', minimum: 1, maximum: 1, description: 'Load compound into automatic finishing tools.' },
    ],
  },
  {
    id: 'finishing',
    label: 'Finishing Set',
    shortLabel: 'Finishing',
    description: 'Configure the boxes, angle tools, handles, and loading equipment used after taping.',
    recommendedFor: 'Dedicated finishing crews or contractors upgrading finishing equipment.',
    capabilities: [
      { id: 'flat-boxes', label: 'Finishing Boxes', toolFamily: 'flat_box', minimum: 1, maximum: 2, description: 'Choose one or two finishing boxes.' },
      { id: 'flat-box-handles', label: 'Flat Box Handles', toolFamily: 'flat_box_handle', minimum: 1, maximum: 2, description: 'Handles for your selected finishing boxes.' },
      { id: 'angle-heads', label: 'Angle Heads', toolFamily: 'angle_head', minimum: 1, maximum: 2, description: 'Finish inside corners and angles.' },
      { id: 'angle-head-handle', label: 'Angle Head Handle', toolFamily: 'angle_head_handle', minimum: 1, maximum: 1, description: 'Reach and control for angle-head work.' },
      { id: 'corner-tool', label: 'Corner Applicator', toolFamily: 'corner_box', minimum: 1, maximum: 1, description: 'Apply compound through the corner workflow.' },
      { id: 'corner-roller', label: 'Inside Corner Roller', toolFamily: 'corner_roller', minimum: 1, maximum: 1, description: 'Embed tape into inside corners.' },
      { id: 'corner-roller-handle', label: 'Corner Roller Handle', toolFamily: 'corner_roller_handle', minimum: 1, maximum: 1, description: 'Control and extend the corner roller.' },
      { id: 'pump', label: 'Loading Pump', toolFamily: 'pump', minimum: 1, maximum: 1, description: 'Load compound into finishing tools.' },
    ],
  },
  {
    id: 'taping',
    label: 'Taping Set',
    shortLabel: 'Taping',
    description: 'Build the automatic taping and corner workflow without forcing a manufacturer-specific kit.',
    recommendedFor: 'Taping specialists and crews replacing the taping side of an existing setup.',
    capabilities: [
      { id: 'taper', label: 'Automatic Taper', toolFamily: 'automatic_taper', minimum: 1, maximum: 1, description: 'The core automatic taping tool.' },
      { id: 'angle-head', label: 'Angle Head', toolFamily: 'angle_head', minimum: 1, maximum: 1, description: 'Finish inside corners and angles.' },
      { id: 'angle-head-handle', label: 'Angle Head Handle', toolFamily: 'angle_head_handle', minimum: 1, maximum: 1, description: 'Reach and control for angle-head work.' },
      { id: 'corner-roller', label: 'Inside Corner Roller', toolFamily: 'corner_roller', minimum: 1, maximum: 1, description: 'Embed tape into inside corners.' },
      { id: 'corner-roller-handle', label: 'Corner Roller Handle', toolFamily: 'corner_roller_handle', minimum: 1, maximum: 1, description: 'Control and extend the corner roller.' },
      { id: 'pump', label: 'Loading Pump', toolFamily: 'pump', minimum: 1, maximum: 1, description: 'Load compound into automatic taping tools.' },
      { id: 'gooseneck', label: 'Gooseneck', toolFamily: 'gooseneck', minimum: 1, maximum: 1, description: 'Connect the pump to the taper loading workflow.' },
    ],
  },
  {
    id: 'flatbox',
    label: 'Flat Box Set',
    shortLabel: 'Flat Box',
    description: 'Build a focused finishing-box setup for crews that already own their taping and corner tools.',
    recommendedFor: 'Flat-box upgrades, replacements, and focused finishing setups.',
    capabilities: [
      { id: 'flat-boxes', label: 'Finishing Boxes', toolFamily: 'flat_box', minimum: 1, maximum: 2, description: 'Choose one or two box sizes.' },
      { id: 'flat-box-handles', label: 'Flat Box Handles', toolFamily: 'flat_box_handle', minimum: 1, maximum: 2, description: 'Choose handles for the selected boxes.' },
      { id: 'pump', label: 'Loading Pump', toolFamily: 'pump', minimum: 1, maximum: 1, description: 'Load compound into the finishing boxes.' },
      { id: 'filler-adapter', label: 'Filler Adapter', toolFamily: 'filler_adapter', minimum: 1, maximum: 1, description: 'Connect the pump to the box-loading workflow.' },
    ],
  },
]);

export function getToolsetWorkflow(workflowId) {
  return TOOLSET_WORKFLOWS.find((workflow) => workflow.id === workflowId) || null;
}

export function getCapabilitySelectionCount(selections, capabilityId) {
  const selected = selections?.[capabilityId];
  return Array.isArray(selected) ? selected.length : 0;
}

export function isCapabilityComplete(capability, selections) {
  return getCapabilitySelectionCount(selections, capability.id) >= Number(capability.minimum || 0);
}

export function getWorkflowCompletion(workflow, selections) {
  if (!workflow?.capabilities?.length) {
    return { completed: 0, total: 0, percent: 0, isComplete: false };
  }

  const completed = workflow.capabilities.filter((capability) => isCapabilityComplete(capability, selections)).length;
  const total = workflow.capabilities.length;

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    isComplete: completed === total,
  };
}

export function flattenToolsetSelections(workflow, selections) {
  if (!workflow?.capabilities?.length) return [];

  return workflow.capabilities.flatMap((capability) => {
    const items = Array.isArray(selections?.[capability.id]) ? selections[capability.id] : [];
    return items.map((item, index) => ({
      ...item,
      capabilityId: capability.id,
      capabilityLabel: capability.label,
      sequence: index,
    }));
  });
}
