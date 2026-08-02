const fs = require('fs');
const src = fs.readFileSync('frontend/src/data/productSchematicLinks.generated.js', 'utf8');
const start = src.indexOf('{');
const end = src.lastIndexOf('};');
const jsonLike = src.slice(start, end + 1);
const obj = JSON.parse(jsonLike);

const lines = [];
lines.push('<?php');
lines.push('/**');
lines.push(' * SKU -> schematic id/page lookup, generated from frontend/src/data/productSchematicLinks.generated.js.');
lines.push(' * Regenerate with scripts/gen_sku_schematic_map.js whenever the frontend catalog map changes.');
lines.push(' *');
lines.push(' * @package drywall-toolbox');
lines.push(' */');
lines.push('');
lines.push('defined( \'ABSPATH\' ) || exit;');
lines.push('');
lines.push('const DTB_SKU_SCHEMATIC_MAP = [');
const keys = Object.keys(obj).sort();
for (const sku of keys) {
  const entry = obj[sku];
  const phpSku = sku.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const phpId = entry.schematicId.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const page = (entry.page === null || entry.page === undefined) ? 'null' : String(parseInt(entry.page, 10));
  lines.push(`\t'${phpSku}' => [ 'schematic_id' => '${phpId}', 'page' => ${page} ],`);
}
lines.push('];');
lines.push('');

fs.writeFileSync('drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php', lines.join('\n') + '\n');
console.log('wrote', keys.length, 'entries');
