import csv, json, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- Source 1: frontend catalog map (SKU -> schematicId, page) ---
js_path = f"{REPO}/frontend/src/data/productSchematicLinks.generated.js"
with open(js_path, encoding="utf-8") as f:
    src = f.read()
start = src.index("{")
end = src.rindex("};")
catalog = json.loads(src[start:end + 1])

merged = {}
for sku, entry in catalog.items():
    merged[sku.upper()] = {
        "schematic_id": entry["schematicId"],
        "page": entry.get("page"),
    }

# --- Source 2: master parts CSV (product_sku -> schematic_id) ---
csv_path = f"{REPO}/products/launch/universal_parts/references/all_brands_schematic_parts_master.csv"
csv_rows = {}
with open(csv_path, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        sku = (row.get("product_sku") or "").strip()
        sid = (row.get("schematic_id") or "").strip()
        brand = (row.get("brand") or "").strip()
        if not sku or not sid:
            continue
        key = sku.upper()
        if key in csv_rows and csv_rows[key]["schematic_id"] != sid:
            print(f"CSV CONFLICT: {key} -> {csv_rows[key]['schematic_id']} vs {sid}", file=sys.stderr)
            continue
        csv_rows[key] = {"schematic_id": sid, "brand": brand}

added, overridden = 0, 0
for key, row in csv_rows.items():
    # Frontend uses a short 'asgard-{sku_lower}' id for all Asgard "-AD" tools,
    # not the verbose auto-generated schematic_id in the master CSV.
    if row["brand"] == "Asgard" or key.endswith("-AD"):
        resolved_id = "asgard-" + key.lower()
    else:
        resolved_id = row["schematic_id"]

    if key in merged:
        if merged[key]["schematic_id"] != resolved_id:
            print(f"CATALOG/CSV MISMATCH for {key}: catalog={merged[key]['schematic_id']} csv={resolved_id} (keeping catalog)", file=sys.stderr)
        continue

    merged[key] = {"schematic_id": resolved_id, "page": None}
    added += 1

print(f"catalog entries: {len(catalog)}", file=sys.stderr)
print(f"csv entries added: {added}", file=sys.stderr)
print(f"total merged: {len(merged)}", file=sys.stderr)

# --- Emit PHP ---
lines = []
lines.append("<?php")
lines.append("/**")
lines.append(" * SKU -> schematic id/page lookup, generated from:")
lines.append(" *   - frontend/src/data/productSchematicLinks.generated.js (catalog SKUs)")
lines.append(" *   - products/launch/universal_parts/references/all_brands_schematic_parts_master.csv")
lines.append(" *     (Level5 spare-part codes and Asgard '-AD' diagram codes, not in the catalog)")
lines.append(" * Regenerate with scripts/gen_sku_schematic_map.py whenever either source changes.")
lines.append(" *")
lines.append(" * @package drywall-toolbox")
lines.append(" */")
lines.append("")
lines.append("defined( 'ABSPATH' ) || exit;")
lines.append("")
lines.append("const DTB_SKU_SCHEMATIC_MAP = [")


def php_str(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


for sku in sorted(merged.keys()):
    entry = merged[sku]
    page = entry["page"]
    page_php = "null" if page is None else str(int(page))
    lines.append(f"\t'{php_str(sku)}' => [ 'schematic_id' => '{php_str(entry['schematic_id'])}', 'page' => {page_php} ],")

lines.append("];")
lines.append("")

out_path = f"{REPO}/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php"
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print("wrote", out_path, file=sys.stderr)
