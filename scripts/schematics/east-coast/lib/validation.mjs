export function validateSchematic(record) {
  const errors = [];
  const warnings = [];
  const incomplete = [];
  if (!record.pages.length) errors.push('schematic_has_no_pages');
  if (!record.occurrences.length) errors.push('schematic_has_no_occurrences');
  if (record.declaredPageCount != null && record.declaredPageCount !== record.pages.length) {
    errors.push(`page_count_mismatch:${record.declaredPageCount}:${record.pages.length}`);
  }
  for (const occurrence of record.occurrences) {
    const g = occurrence.normalizedGeometry;
    if (!occurrence.callout) warnings.push(`missing_callout:${occurrence.occurrenceIndex}`);
    if (!g) {
      errors.push(`missing_geometry:${occurrence.occurrenceIndex}`);
      continue;
    }
    for (const [key, value] of Object.entries({ xPct: g.xPct, yPct: g.yPct, widthPct: g.widthPct, heightPct: g.heightPct })) {
      if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`invalid_geometry:${occurrence.occurrenceIndex}:${key}:${value}`);
    }
    const resolution = occurrence.productResolution;
    if (resolution.status === 'invalid_or_annotation_handle') warnings.push(`annotation_or_invalid_handle:${occurrence.productHandle || occurrence.callout || occurrence.occurrenceIndex}`);
    else if (resolution.status === 'source_part_only') warnings.push(`source_part_without_online_product:${occurrence.productHandle}`);
    else if (resolution.status === 'source_product_resolution_incomplete') incomplete.push(`product_resolution_incomplete:${occurrence.productHandle}:${resolution.classification}`);
    else if (resolution.status === 'source_product_resolved' && resolution.identityEvidence?.status === 'ambiguous') warnings.push(`product_identity_ambiguous:${occurrence.sourcePartNumber}:${occurrence.productHandle}`);
  }
  let status = 'PASS';
  if (errors.length) status = 'FAIL';
  else if (incomplete.length) status = 'INCOMPLETE';
  else if (warnings.length) status = 'PASS_WITH_WARNINGS';
  return {
    status,
    errors: [...new Set(errors)],
    incomplete: [...new Set(incomplete)],
    warnings: [...new Set(warnings)],
    counts: {
      pages: record.pages.length,
      occurrences: record.occurrences.length,
      uniqueParts: new Set(record.occurrences.map((item) => item.sourcePartNumber).filter(Boolean)).size,
      validProductHandles: new Set(record.occurrences.filter((item) => item.sourceIdentity.handleValid).map((item) => item.productHandle)).size,
      resolvedOccurrences: record.occurrences.filter((item) => item.productResolution.status === 'source_product_resolved').length,
      sourceOnlyOccurrences: record.occurrences.filter((item) => item.productResolution.status === 'source_part_only').length,
      incompleteOccurrences: record.occurrences.filter((item) => item.productResolution.status === 'source_product_resolution_incomplete').length,
      invalidOrAnnotationOccurrences: record.occurrences.filter((item) => item.productResolution.status === 'invalid_or_annotation_handle').length,
    },
  };
}
