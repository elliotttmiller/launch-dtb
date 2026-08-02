import csv, json, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def php_str(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def normalize_key(s):
    return re.sub(r"[^a-z0-9]+", "", s.lower())


# =====================================================================
# Part 1: DTB_SKU_SCHEMATIC_MAP (SKU -> schematic id/page)
#   - frontend catalog map (purchasable SKUs)
#   - master parts CSV, Asgard "-AD" diagram codes + Level5 spare-part codes
# =====================================================================

js_path = f"{REPO}/frontend/src/data/productSchematicLinks.generated.js"
with open(js_path, encoding="utf-8") as f:
    src = f.read()
start = src.index("{")
end = src.rindex("};")
catalog = json.loads(src[start:end + 1])

sku_map = {}
for sku, entry in catalog.items():
    sku_map[sku.upper()] = {
        "schematic_id": entry["schematicId"],
        "page": entry.get("page"),
    }

csv_path = f"{REPO}/products/launch/universal_parts/references/all_brands_schematic_parts_master.csv"
csv_sku_rows = {}
csv_by_schematic_id = {}
with open(csv_path, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        sku = (row.get("product_sku") or "").strip()
        sid = (row.get("schematic_id") or "").strip()
        brand = (row.get("brand") or "").strip()
        src_rel = (row.get("source_file_from_brands") or "").strip()
        if not sid:
            continue
        if sid not in csv_by_schematic_id:
            csv_by_schematic_id[sid] = {"brand": brand, "source_file_from_brands": src_rel}
        if not sku:
            continue
        key = sku.upper()
        if key in csv_sku_rows and csv_sku_rows[key]["schematic_id"] != sid:
            print(f"CSV CONFLICT: {key} -> {csv_sku_rows[key]['schematic_id']} vs {sid}", file=sys.stderr)
            continue
        csv_sku_rows[key] = {"schematic_id": sid, "brand": brand}

added = 0
for key, row in csv_sku_rows.items():
    # Frontend uses a short 'asgard-{sku_lower}' id for all Asgard "-AD" tools,
    # not the verbose auto-generated schematic_id in the master CSV.
    if row["brand"] == "Asgard" or key.endswith("-AD"):
        resolved_id = "asgard-" + key.lower()
    else:
        resolved_id = row["schematic_id"]

    if key in sku_map:
        if sku_map[key]["schematic_id"] != resolved_id:
            print(f"CATALOG/CSV MISMATCH for {key}: catalog={sku_map[key]['schematic_id']} csv={resolved_id} (keeping catalog)", file=sys.stderr)
        continue

    sku_map[key] = {"schematic_id": resolved_id, "page": None}
    added += 1

print(f"[sku map] catalog entries: {len(catalog)}, csv entries added: {added}, total: {len(sku_map)}", file=sys.stderr)

# =====================================================================
# Part 2: DTB_VERBOSE_SCHEMATIC_ID_MAP (normalized verbose schematic_id -> [id, page])
#   Columbia/TapeTech/Platinum exports use filenames like
#   {verbose-schematic-id}-schematic-page-{n}.webp or
#   platinum_{name}-page-{n}.webp, where {verbose-schematic-id} matches the
#   master CSV's own 'schematic_id' column (not a catalog SKU). Resolve each
#   to the frontend's actual short schematic id + page by cross-referencing
#   Schematics.jsx: which '/brands/...' JSON import (source_file_from_brands)
#   is referenced inside which tool's `id: '...'` block, and in what order
#   (order = page number, matching diagramPages/pageLabels).
# =====================================================================

jsx_path = f"{REPO}/frontend/src/pages/Schematics.jsx"
with open(jsx_path, encoding="utf-8") as f:
    jsx_src = f.read()
jsx_lines = jsx_src.split("\n")

import_re = re.compile(r"^import\s+(\w+)\s+from\s+'/brands/(.+?)';")
data_var_to_relpath = {}
for line in jsx_lines:
    m = import_re.match(line.strip())
    if m:
        data_var_to_relpath[m.group(1)] = m.group(2)

bpfd_re = re.compile(r"const\s+(\w+)\s*=\s*buildPartsFromData\(\s*(\w+)")
parts_var_to_data_var = {}
for line in jsx_lines:
    m = bpfd_re.search(line)
    if m:
        parts_var_to_data_var[m.group(1)] = m.group(2)

id_re = re.compile(r"^\s*id:\s*'([^']+)',?\s*$")
block_starts = [(i, id_re.match(l).group(1)) for i, l in enumerate(jsx_lines) if id_re.match(l)]
blocks = []
for idx, (start_line, tool_id) in enumerate(block_starts):
    end_line = block_starts[idx + 1][0] if idx + 1 < len(block_starts) else len(jsx_lines)
    blocks.append((tool_id, "\n".join(jsx_lines[start_line:end_line])))

relpath_to_target = {}
for tool_id, block_text in blocks:
    seen_relpaths = []
    for m in re.finditer(r"\b(\w+)\b", block_text):
        w = m.group(1)
        relpath = None
        if w in data_var_to_relpath:
            relpath = data_var_to_relpath[w]
        elif w in parts_var_to_data_var:
            relpath = data_var_to_relpath.get(parts_var_to_data_var[w])
        if relpath is not None and relpath not in seen_relpaths:
            seen_relpaths.append(relpath)
    for page_idx, relpath in enumerate(seen_relpaths, start=1):
        relpath_to_target[relpath] = (tool_id, page_idx)

verbose_map = {}  # normalized_key -> (schematic_id, page)
unresolved = []
for sid, meta in csv_by_schematic_id.items():
    if meta["brand"] in ("Asgard", "Level5") or not meta["source_file_from_brands"]:
        continue
    target = relpath_to_target.get(meta["source_file_from_brands"])
    if target is None:
        unresolved.append((sid, meta["source_file_from_brands"]))
        continue
    key = normalize_key(sid)
    verbose_map[key] = target

print(f"[verbose map] resolved: {len(verbose_map)}, unresolved: {len(unresolved)}", file=sys.stderr)
for sid, relpath in unresolved:
    print(f"  UNRESOLVED: {sid} | {relpath}", file=sys.stderr)

# =====================================================================
# Emit PHP
# =====================================================================

lines = []
lines.append("<?php")
lines.append("/**")
lines.append(" * Schematic filename -> schematic id/page lookups, generated from:")
lines.append(" *   - frontend/src/data/productSchematicLinks.generated.js (catalog SKUs)")
lines.append(" *   - frontend/src/pages/Schematics.jsx (tool id / page ordering)")
lines.append(" *   - products/launch/universal_parts/references/all_brands_schematic_parts_master.csv")
lines.append(" *     (Level5 spare-part codes, Asgard '-AD' diagram codes, and verbose")
lines.append(" *     Columbia/TapeTech/Platinum export ids, none of which are catalog SKUs)")
lines.append(" * Regenerate with scripts/gen_sku_schematic_map.py whenever any source changes.")
lines.append(" *")
lines.append(" * @package drywall-toolbox")
lines.append(" */")
lines.append("")
lines.append("defined( 'ABSPATH' ) || exit;")
lines.append("")
lines.append("// {sku}_SCH-page-{n}.webp / {sku}_SCH-preview.webp uploads.")
lines.append("const DTB_SKU_SCHEMATIC_MAP = [")
for sku in sorted(sku_map.keys()):
    entry = sku_map[sku]
    page = entry["page"]
    page_php = "null" if page is None else str(int(page))
    lines.append(f"\t'{php_str(sku)}' => [ 'schematic_id' => '{php_str(entry['schematic_id'])}', 'page' => {page_php} ],")
lines.append("];")
lines.append("")
lines.append("// {verbose-id}-schematic-page-{n}.webp / {name}-page-{n}.webp uploads.")
lines.append("// Keys are normalized (lowercase, non-alphanumeric stripped) so hyphen- and")
lines.append("// underscore-separated export variants (e.g. Platinum) resolve identically.")
lines.append("// 'page' here always overrides the filename's own page number: each verbose")
lines.append("// id represents exactly one page of the combined frontend tool.")
lines.append("const DTB_VERBOSE_SCHEMATIC_ID_MAP = [")
for key in sorted(verbose_map.keys()):
    schematic_id, page = verbose_map[key]
    lines.append(f"\t'{php_str(key)}' => [ 'schematic_id' => '{php_str(schematic_id)}', 'page' => {int(page)} ],")
lines.append("];")
lines.append("")

out_path = f"{REPO}/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php"
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print("wrote", out_path, file=sys.stderr)
