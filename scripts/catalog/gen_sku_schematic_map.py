import csv, json, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def php_str(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def normalize_key(s):
    return re.sub(r"[^a-z0-9]+", "", s.lower())


# =====================================================================
# Part 1: DTB_SKU_SCHEMATIC_MAP (SKU -> schematic id/page)
#   - frontend catalog map (purchasable SKUs)
#   - master parts CSV, Level5 spare-part codes
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
        if not sid or brand == "Asgard":
            # Asgard schematics are retired and must not enter runtime maps.
            continue
        if sid not in csv_by_schematic_id:
            csv_by_schematic_id[sid] = {
                "brand": brand,
                "source_file_from_brands": src_rel,
                "diagram_pages": (row.get("diagram_pages") or "").strip(),
            }
        if not sku:
            continue
        key = sku.upper()
        if key in csv_sku_rows and csv_sku_rows[key]["schematic_id"] != sid:
            raise RuntimeError(
                f"CSV CONFLICT: {key} -> {csv_sku_rows[key]['schematic_id']} vs {sid}"
            )
        csv_sku_rows[key] = {"schematic_id": sid, "brand": brand}

added = 0
for key, row in csv_sku_rows.items():
    resolved_id = row["schematic_id"]

    if key in sku_map:
        if sku_map[key]["schematic_id"] != resolved_id:
            raise RuntimeError(
                f"CATALOG/CSV MISMATCH for {key}: "
                f"catalog={sku_map[key]['schematic_id']} csv={resolved_id}"
            )
        continue

    sku_map[key] = {"schematic_id": resolved_id, "page": None}
    added += 1

# ---------------------------------------------------------------------
# Part 1b: fill remaining gaps from the canonical-filename SKU table
#   (scripts/catalog/normalize_schematic_filenames.py PREFERRED_SKU).
#   That table is the source of truth used to *name* the on-disk
#   products/launch/media/schematics files (e.g. "platinum_pt-bh_sch-page-001.webp"),
#   so any SKU it names must also resolve here or every upload for that
#   schematic id is unregisterable. Each SKU is verified against the
#   official WooCommerce catalog CSV before being added, so a typo in
#   PREFERRED_SKU can never silently mint a fake identifier.
# ---------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from normalize_schematic_filenames import PREFERRED_SKU  # noqa: E402

official_catalog_path = f"{REPO}/products/launch/official/dtb_official_catalog.csv"
official_skus = set()
with open(official_catalog_path, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        sku = (row.get("SKU") or "").strip()
        if sku:
            official_skus.add(sku.upper())

preferred_added = 0
preferred_skipped_unknown = []
for schematic_id, preferred_sku in PREFERRED_SKU.items():
    key = preferred_sku.upper()
    if key in sku_map:
        continue
    if key not in official_skus:
        preferred_skipped_unknown.append((preferred_sku, schematic_id))
        continue
    sku_map[key] = {"schematic_id": schematic_id, "page": None}
    preferred_added += 1

print(f"[sku map] PREFERRED_SKU entries added: {preferred_added}", file=sys.stderr)
for sku, schematic_id in preferred_skipped_unknown:
    print(f"  SKIPPED (not in official catalog): {sku} -> {schematic_id}", file=sys.stderr)

# ---------------------------------------------------------------------
# Part 1c: explicit SKU aliases — filename-only SKU tokens that are not
#   themselves purchasable catalog SKUs but denote the same physical
#   product/schematic as an existing mapped SKU (e.g. a model-year export
#   naming variant). Each alias is copied verbatim from its canonical
#   SKU's resolved entry, so it can never drift out of sync with it.
#   Confirmed 2026-08-11 with the catalog owner: TBMP-2022 is the 2022
#   sub-assembly export naming for the same Tall Boy Mud Pump product line
#   as TBMP/TBMP1 (see all_brands_schematic_parts_master.csv,
#   Pumps/TallBoyMudPump rows).
# ---------------------------------------------------------------------
SKU_ALIASES = {
    "TBMP-2022": "TBMP",
}

alias_added = 0
for alias, canonical in SKU_ALIASES.items():
    alias_key = alias.upper()
    canonical_key = canonical.upper()
    if canonical_key not in sku_map:
        raise RuntimeError(
            f"SKU_ALIASES: canonical SKU {canonical_key} (for alias {alias_key}) "
            "is not present in the resolved sku map."
        )
    if alias_key in sku_map:
        continue
    sku_map[alias_key] = dict(sku_map[canonical_key])
    alias_added += 1

print(f"[sku map] SKU_ALIASES entries added: {alias_added}", file=sys.stderr)

print(f"[sku map] catalog entries: {len(catalog)}, csv entries added: {added}, total: {len(sku_map)}", file=sys.stderr)

# =====================================================================
# Part 2: DTB_VERBOSE_SCHEMATIC_ID_MAP (normalized verbose schematic_id -> [id, page])
#   Columbia/TapeTech/Platinum exports use filenames like
#   {verbose-schematic-id}-schematic-page-{n}.webp or
#   platinum_{name}-page-{n}.webp, where {verbose-schematic-id} matches the
#   master CSV's own 'schematic_id' column (not a catalog SKU). The
#   normalized-key -> (schematic_id, page) resolution used to be derived by
#   parsing the now-deleted frontend/src/pages/Schematics.jsx (its
#   '/brands/...' imports and per-tool `id:` blocks encoded the tool/page
#   ordering). That resolution is frozen as static data in
#   scripts/catalog/data/schematic_verbose_id_map.json so this script no
#   longer depends on any frontend page file. Any *new* verbose schematic id
#   that isn't already a key in that JSON cannot be auto-resolved here and
#   is reported below for manual addition to the JSON file.
# =====================================================================

verbose_map_json_path = f"{REPO}/scripts/catalog/data/schematic_verbose_id_map.json"
with open(verbose_map_json_path, encoding="utf-8") as f:
    verbose_map_source = json.load(f)

verbose_map = {}  # normalized_key -> (schematic_id, page)
for key, (schematic_id, page) in verbose_map_source.items():
    verbose_map[key] = (schematic_id, page)

known_keys = {normalize_key(sid) for sid in csv_by_schematic_id}
unresolved = [
    sid for sid in csv_by_schematic_id
    if csv_by_schematic_id[sid]["brand"] not in ("Asgard", "Level5")
    and csv_by_schematic_id[sid]["source_file_from_brands"]
    and normalize_key(sid) not in verbose_map
]

print(f"[verbose map] loaded from JSON: {len(verbose_map)}, unresolved (new, needs manual JSON entry): {len(unresolved)}", file=sys.stderr)
for sid in unresolved:
    print(f"  UNRESOLVED: {sid} | {csv_by_schematic_id[sid]['source_file_from_brands']}", file=sys.stderr)

# Exact legacy source basenames that do not encode a SKU or schematic id.
# Keep this list narrow: every entry must be traceable to one unique source asset.
legacy_filename_map = {
    "mud-pump-sub-assemblies-2022-enhanced": ("columbia-mud-pump", 1),
    "tall-boy-mud-pump-sub-assemblies-2022-enhanced": ("columbia-tall-boy-mud-pump", 1),
    "schematic_page_1": ("tapetech-17tt", 1),
}

# =====================================================================
# Emit PHP
# =====================================================================

lines = []
lines.append("<?php")
lines.append("/**")
lines.append(" * Schematic filename -> schematic id/page lookups, generated from:")
lines.append(" *   - frontend/src/data/productSchematicLinks.generated.js (catalog SKUs)")
lines.append(" *   - scripts/catalog/data/schematic_verbose_id_map.json (tool id / page ordering)")
lines.append(" *   - products/launch/universal_parts/references/all_brands_schematic_parts_master.csv")
lines.append(" *     (Level5 spare-part codes and verbose Columbia/TapeTech/Platinum export")
lines.append(" *     ids, none of which are catalog SKUs)")
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
lines.append("// A numeric 'page' overrides the filename page for one-page component ids;")
lines.append("// null preserves the filename page for ids whose source spans multiple pages.")
lines.append("const DTB_VERBOSE_SCHEMATIC_ID_MAP = [")
for key in sorted(verbose_map.keys()):
    schematic_id, page = verbose_map[key]
    page_php = "null" if page is None else str(int(page))
    lines.append(f"\t'{php_str(key)}' => [ 'schematic_id' => '{php_str(schematic_id)}', 'page' => {page_php} ],")
lines.append("];")
lines.append("")
lines.append("// Exact source basenames that cannot be resolved through a SKU convention.")
lines.append("const DTB_LEGACY_SCHEMATIC_FILENAME_MAP = [")
for basename in sorted(legacy_filename_map.keys()):
    schematic_id, page = legacy_filename_map[basename]
    lines.append(f"\t'{php_str(basename)}' => [ 'schematic_id' => '{php_str(schematic_id)}', 'page' => {int(page)} ],")
lines.append("];")
lines.append("")

out_path = f"{REPO}/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php"
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print("wrote", out_path, file=sys.stderr)
