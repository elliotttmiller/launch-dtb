import csv, json, os, re, sys
from urllib.parse import urlencode

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def php_str(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def normalize_key(s):
    return re.sub(r"[^a-z0-9]+", "", s.lower())


SCHEMATIC_BRANDS = {
    "columbia": ("columbia", "Columbia Taping Tools"),
    "columbiatools": ("columbia", "Columbia Taping Tools"),
    "columbiatapingtools": ("columbia", "Columbia Taping Tools"),
    "tapetech": ("tape-tech", "TapeTech"),
    "surpro": ("sur-pro", "SurPro"),
    "platinum": ("platinum", "Platinum Drywall Tools"),
    "platinumtools": ("platinum", "Platinum Drywall Tools"),
    "platinumdrywalltools": ("platinum", "Platinum Drywall Tools"),
    "durastilts": ("dura-stilts", "Dura-Stilts"),
    "durastilt": ("dura-stilts", "Dura-Stilts"),
    "level5": ("level5", "Level5"),
    "level5tools": ("level5", "Level5"),
}


def canonical_schematic_brand(value):
    key = normalize_key(value)
    if key in SCHEMATIC_BRANDS:
        return SCHEMATIC_BRANDS[key]
    return to_kebab(value), value.strip()


def humanize_identifier(value):
    return " ".join(part.capitalize() for part in re.split(r"[-_]+", value) if part)


def canonical_product_schematic_url(entry):
    brand_id, _ = canonical_schematic_brand(entry.get("brand", ""))
    params = {
        "brand": brand_id,
        "category": to_kebab(entry.get("category", "")),
        "schematic": entry["schematicId"],
    }
    if entry.get("variant") not in (None, ""):
        params["variant"] = entry["variant"]
    if entry.get("page") not in (None, ""):
        params["page"] = entry["page"]
    return "/schematics?" + urlencode(params)


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
schematic_source_rows = []
retired_schematic_ids = set()
with open(csv_path, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        sku = (row.get("product_sku") or "").strip()
        sid = (row.get("schematic_id") or "").strip()
        brand = (row.get("brand") or "").strip()
        category = (row.get("schematic_category") or "").strip()
        src_rel = (row.get("source_file_from_brands") or "").strip()
        if sid and (brand == "Asgard" or category == "Sanders"):
            retired_schematic_ids.add(sid.lower())
            continue
        if not sid:
            continue
        if src_rel:
            schematic_source_rows.append(
                {
                    "schematic_id": sid,
                    "sku": sku,
                    "source": src_rel.replace("\\", "/"),
                }
            )
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
print(f"[retired ids] Asgard schematic ids denylisted: {len(retired_schematic_ids)}", file=sys.stderr)

verbose_map_json_path = f"{REPO}/scripts/catalog/data/schematic_verbose_id_map.json"
with open(verbose_map_json_path, encoding="utf-8") as f:
    verbose_map_source = json.load(f)

verbose_map = {}
for key, (schematic_id, page) in verbose_map_source.items():
    verbose_map[normalize_key(key)] = (schematic_id, page)


def _needs_verbose_resolution(sid):
    meta = csv_by_schematic_id[sid]
    return meta["brand"] not in ("Asgard", "Level5") and bool(meta["source_file_from_brands"])


unresolved = [
    sid for sid in csv_by_schematic_id
    if _needs_verbose_resolution(sid) and normalize_key(sid) not in verbose_map
]
stale = sorted(set(verbose_map) - {normalize_key(sid) for sid in csv_by_schematic_id if _needs_verbose_resolution(sid)})
for key in stale:
    print(f"  STALE (in JSON, no longer in CSV): {key}", file=sys.stderr)

print(f"[verbose map] loaded from JSON: {len(verbose_map)}, unresolved (new, needs manual JSON entry): {len(unresolved)}", file=sys.stderr)
for sid in unresolved:
    print(f"  UNRESOLVED: {sid} | {csv_by_schematic_id[sid]['source_file_from_brands']}", file=sys.stderr)

legacy_filename_map = {
    "mud-pump-sub-assemblies-2022-enhanced": ("columbia-mud-pump", 1),
    "tall-boy-mud-pump-sub-assemblies-2022-enhanced": ("columbia-tall-boy-mud-pump", 1),
    "schematic_page_1": ("tapetech-17tt", 1),
}


def to_kebab(s):
    s = re.sub(r"(?<!^)(?=[A-Z])", "-", s.strip())
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def resolve_row_canonical_id(sid, sku):
    verbose_key = normalize_key(sid)
    if verbose_key in verbose_map:
        return verbose_map[verbose_key][0]
    if sku:
        sku_key = sku.upper()
        if sku_key in sku_map:
            return sku_map[sku_key]["schematic_id"]
    return None


from collections import Counter  # noqa: E402

brand_category_votes = {}
brand_name_votes = {}
category_name_votes = {}
title_votes = {}
with open(csv_path, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        brand = (row.get("brand") or "").strip()
        if brand in ("", "Asgard"):
            continue
        sid = (row.get("schematic_id") or "").strip()
        sku = (row.get("product_sku") or "").strip()
        category = (row.get("schematic_category") or "").strip()
        if not sid or not category:
            continue
        canonical_id = resolve_row_canonical_id(sid, sku)
        if not canonical_id or canonical_id in retired_schematic_ids:
            continue
        brand_id, brand_name = canonical_schematic_brand(brand)
        pair = (brand_id, to_kebab(category))
        brand_category_votes.setdefault(canonical_id, Counter())[pair] += 1
        brand_name_votes.setdefault(canonical_id, Counter())[brand_name] += 1
        category_name_votes.setdefault(canonical_id, Counter())[category] += 1

# Catalog link metadata is the customer-facing authority whenever it exists.
# Keep its display-name votes separate from source-folder labels; otherwise a
# single catalog category (for example TapeTech "Pumps") can lose a tie to a
# source folder/model token (for example "76TT") simply because the CSV vote
# was inserted first. The canonical category id already uses catalog
# precedence below, and the display label must follow the same authority.
catalog_brand_category_votes = {}
catalog_brand_name_votes = {}
catalog_category_name_votes = {}
for entry in catalog.values():
    canonical_id = (entry.get("schematicId") or "").strip()
    brand = (entry.get("brand") or "").strip()
    category = (entry.get("category") or "").strip()
    title = (entry.get("title") or "").strip()
    if not canonical_id or not brand or not category:
        continue
    brand_id, brand_name = canonical_schematic_brand(brand)
    catalog_brand_category_votes.setdefault(canonical_id, Counter())[(brand_id, to_kebab(category))] += 1
    catalog_brand_name_votes.setdefault(canonical_id, Counter())[brand_name] += 1
    catalog_category_name_votes.setdefault(canonical_id, Counter())[category] += 1
    if title:
        title_votes.setdefault(canonical_id, Counter())[title] += 1

brand_category_map = {}
for canonical_id, votes in brand_category_votes.items():
    (brand_id, category_id), _count = votes.most_common(1)[0]
    brand_category_map[canonical_id] = (brand_id, category_id)

for canonical_id, votes in catalog_brand_category_votes.items():
    (brand_id, category_id), _count = votes.most_common(1)[0]
    brand_category_map[canonical_id] = (brand_id, category_id)

catalog_fallback_added = 0
for entry in catalog.values():
    canonical_id = entry.get("schematicId")
    if not canonical_id or canonical_id in brand_category_map:
        continue
    brand = (entry.get("brand") or "").strip()
    category = (entry.get("category") or "").strip()
    if not brand or not category:
        continue
    brand_id, brand_name = canonical_schematic_brand(brand)
    brand_category_map[canonical_id] = (brand_id, to_kebab(category))
    catalog_brand_name_votes.setdefault(canonical_id, Counter())[brand_name] += 1
    catalog_category_name_votes.setdefault(canonical_id, Counter())[category] += 1
    title = (entry.get("title") or "").strip()
    if title:
        title_votes.setdefault(canonical_id, Counter())[title] += 1
    catalog_fallback_added += 1

display_map = {}
for canonical_id, (brand_id, category_id) in brand_category_map.items():
    brand_name = catalog_brand_name_votes.get(canonical_id, Counter()).most_common(1)
    if not brand_name:
        brand_name = brand_name_votes.get(canonical_id, Counter()).most_common(1)
    category_name = catalog_category_name_votes.get(canonical_id, Counter()).most_common(1)
    if not category_name:
        category_name = category_name_votes.get(canonical_id, Counter()).most_common(1)
    title = title_votes.get(canonical_id, Counter()).most_common(1)
    display_map[canonical_id] = {
        "brand_name": brand_name[0][0] if brand_name else humanize_identifier(brand_id),
        "category_name": category_name[0][0] if category_name else humanize_identifier(category_id),
        "title": title[0][0] if title else humanize_identifier(canonical_id),
    }

print(f"[brand/category map] resolved from CSV: {len(brand_category_map) - catalog_fallback_added}, from generated.js fallback: {catalog_fallback_added}, total: {len(brand_category_map)}", file=sys.stderr)

family_by_schematic = {}
label_by_schematic = {}
variant_options_by_schematic = {}
with open(official_catalog_path, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        sid = (row.get("Meta: _dtb_schematic_id") or "").strip()
        parent = (row.get("Meta: _dtb_parent_product_sku") or "").strip()
        label = (row.get("Meta: _dtb_variation_label") or "").strip()
        variant_key = (row.get("Meta: _dtb_schematic_variant") or "").strip()
        sku = (row.get("SKU") or "").strip()
        if not sid or not parent:
            continue
        family_by_schematic.setdefault(sid, set()).add(parent)
        if label:
            label_by_schematic.setdefault(sid, set()).add(label)
        if variant_key and label and sku:
            variant_options_by_schematic.setdefault(sid, {})[variant_key] = {
                "key": variant_key,
                "label": label,
                "sku": sku,
            }

family_map = {}
shared_variant_map = {}
family_conflicts = []
for sid, parents in family_by_schematic.items():
    if len(parents) != 1:
        family_conflicts.append((sid, sorted(parents)))
        continue
    parent = next(iter(parents))
    labels = label_by_schematic.get(sid, set())
    variant_label = next(iter(labels)) if len(labels) == 1 else ""
    family_id = re.sub(r"[^a-z0-9]+", "-", parent.lower()).strip("-")
    family_map[sid] = (family_id, variant_label)
    options = list(variant_options_by_schematic.get(sid, {}).values())
    if len(options) > 1:
        shared_variant_map[sid] = options

known_canonical_ids = {
    entry.get("schematicId") for entry in catalog.values() if entry.get("schematicId")
}
known_canonical_ids.update(brand_category_map.keys())
hotspot_source_map = {}
for source_row in schematic_source_rows:
    sid = source_row["schematic_id"]
    source = source_row["source"]
    source_abs = os.path.join(REPO, "frontend", "public", "brands", *source.split("/"))
    if not os.path.isfile(source_abs):
        continue
    canonical_id = resolve_row_canonical_id(sid, source_row["sku"])
    if not canonical_id and sid in known_canonical_ids:
        canonical_id = sid
    if not canonical_id or canonical_id in retired_schematic_ids:
        continue
    verbose_entry = verbose_map.get(normalize_key(sid))
    page = verbose_entry[1] if verbose_entry and verbose_entry[1] is not None else 1
    reference = "brands/" + source
    hotspot_source_map.setdefault(canonical_id, {})[reference] = int(page)

hotspot_path_overrides = {
    "Columbia/Schematics/Handles/MatrixBoxHandle/BoxHandle/schematic_data.json": ("columbia-matrix", 1),
    "Columbia/Schematics/Handles/MatrixBoxHandle/Head/schematic_data.json": ("columbia-matrix", 2),
    "Columbia/Schematics/Handles/MatrixBoxHandle/Lever/schematic_data.json": ("columbia-matrix", 3),
    "Columbia/Schematics/Handles/MatrixBoxHandle/Pinchbox/schematic_data.json": ("columbia-matrix", 4),
    "Columbia/Schematics/Handles/MatrixBoxHandle/ExtensionHousing/schematic_data.json": ("columbia-matrix", 5),
    "Columbia/Schematics/AutomaticTapers/PredatorTaper/Body/schematic_data.json": ("columbia-predator-taper", 1),
    "Columbia/Schematics/AutomaticTapers/PredatorTaper/Head/schematic_data.json": ("columbia-predator-taper", 2),
    "Columbia/Schematics/Applicators/InsideCornerApplicator/2Wheel/schematic_data.json": ("columbia-inside-corner-applicator", 1),
    "Columbia/Schematics/Applicators/InsideCornerApplicator/4Wheel/schematic_data.json": ("columbia-inside-corner-applicator", 2),
    "TapeTech/Schematics/EZ07TT/schematic_data.json": ("tapetech-easyclean-finishing-box", 1),
    "TapeTech/Schematics/EZ10TT/schematic_data.json": ("tapetech-easyclean-finishing-box", 2),
    "TapeTech/Schematics/EZ12TT/schematic_data.json": ("tapetech-easyclean-finishing-box", 3),
    "TapeTech/Schematics/EZ15TT/schematic_data.json": ("tapetech-easyclean-finishing-box", 4),
    "TapeTech/Schematics/EHC07/schematic_data.json": ("tapetech-maxxbox-ehc", 1),
    "TapeTech/Schematics/EHC10/schematic_data.json": ("tapetech-maxxbox-ehc", 2),
    "TapeTech/Schematics/EHC12/schematic_data.json": ("tapetech-maxxbox-ehc", 3),
    "TapeTech/Schematics/PAHC07/schematic_data.json": ("tapetech-power-assist-maxxbox", 1),
    "TapeTech/Schematics/PAHC10/schematic_data.json": ("tapetech-power-assist-maxxbox", 2),
    "TapeTech/Schematics/PAHC12/schematic_data.json": ("tapetech-power-assist-maxxbox", 3),
    "TapeTech/Schematics/QB06-QSX/schematic_data.json": ("tapetech-quickbox-qsx", 1),
    "TapeTech/Schematics/QB08-QSX/schematic_data.json": ("tapetech-quickbox-qsx", 2),
    "TapeTech/Schematics/88TTE/schematic_data.json": ("tapetech-88tte", 1),
}
for source, (canonical_id, page) in hotspot_path_overrides.items():
    source_abs = os.path.join(REPO, "frontend", "public", "brands", *source.split("/"))
    if os.path.isfile(source_abs):
        reference = "brands/" + source
        for mapped_id in list(hotspot_source_map):
            hotspot_source_map[mapped_id].pop(reference, None)
            if not hotspot_source_map[mapped_id]:
                del hotspot_source_map[mapped_id]
        hotspot_source_map.setdefault(canonical_id, {})[reference] = page

print(
    f"[hotspot source map] records: {len(hotspot_source_map)}, "
    f"files: {sum(len(entries) for entries in hotspot_source_map.values())}",
    file=sys.stderr,
)
print(f"[family map] resolved: {len(family_map)}, skipped (schematic id spans >1 parent SKU): {len(family_conflicts)}", file=sys.stderr)
for sid, parents in family_conflicts:
    print(f"  SKIPPED (multi-parent): {sid} -> {parents}", file=sys.stderr)

lines = []
lines.append("<?php")
lines.append("/**")
lines.append(" * Schematic filename -> schematic id/page lookups, generated from:")
lines.append(" *   - frontend/src/data/productSchematicLinks.generated.js (catalog SKUs)")
lines.append(" *   - scripts/catalog/data/schematic_verbose_id_map.json (tool id / page ordering)")
lines.append(" *   - products/launch/universal_parts/references/all_brands_schematic_parts_master.csv")
lines.append(" * Regenerate with scripts/catalog/gen_sku_schematic_map.py whenever any source changes.")
lines.append(" *")
lines.append(" * @package drywall-toolbox")
lines.append(" */")
lines.append("")
lines.append("defined( 'ABSPATH' ) || exit;")
lines.append("")
lines.append("const DTB_SKU_SCHEMATIC_MAP = [")
for sku in sorted(sku_map.keys()):
    entry = sku_map[sku]
    page = entry["page"]
    page_php = "null" if page is None else str(int(page))
    lines.append(f"\t'{php_str(sku)}' => [ 'schematic_id' => '{php_str(entry['schematic_id'])}', 'page' => {page_php} ],")
lines.append("];")
lines.append("")
lines.append("const DTB_VERBOSE_SCHEMATIC_ID_MAP = [")
for key in sorted(verbose_map.keys()):
    schematic_id, page = verbose_map[key]
    page_php = "null" if page is None else str(int(page))
    lines.append(f"\t'{php_str(key)}' => [ 'schematic_id' => '{php_str(schematic_id)}', 'page' => {page_php} ],")
lines.append("];")
lines.append("")
lines.append("const DTB_LEGACY_SCHEMATIC_FILENAME_MAP = [")
for basename in sorted(legacy_filename_map.keys()):
    schematic_id, page = legacy_filename_map[basename]
    lines.append(f"\t'{php_str(basename)}' => [ 'schematic_id' => '{php_str(schematic_id)}', 'page' => {int(page)} ],")
lines.append("];")
lines.append("")
lines.append("const DTB_RETIRED_SCHEMATIC_IDS = [")
for schematic_id in sorted(retired_schematic_ids):
    lines.append(f"\t'{php_str(schematic_id)}',")
lines.append("];")
lines.append("")
lines.append("const DTB_SCHEMATIC_BRAND_CATEGORY_MAP = [")
for canonical_id in sorted(brand_category_map.keys()):
    brand_id, category_id = brand_category_map[canonical_id]
    lines.append(f"\t'{php_str(canonical_id)}' => [ 'brand_id' => '{php_str(brand_id)}', 'category_id' => '{php_str(category_id)}' ],")
lines.append("];")
lines.append("")
lines.append("const DTB_SCHEMATIC_DISPLAY_MAP = [")
for canonical_id in sorted(display_map.keys()):
    entry = display_map[canonical_id]
    lines.append(
        f"\t'{php_str(canonical_id)}' => [ 'brand_name' => '{php_str(entry['brand_name'])}', "
        f"'category_name' => '{php_str(entry['category_name'])}', 'title' => '{php_str(entry['title'])}' ],"
    )
lines.append("];")
lines.append("")
lines.append("const DTB_SCHEMATIC_FAMILY_MAP = [")
for canonical_id in sorted(family_map.keys()):
    family_id, variant_label = family_map[canonical_id]
    lines.append(
        f"\t'{php_str(canonical_id)}' => [ 'family_id' => '{php_str(family_id)}', "
        f"'variant_label' => '{php_str(variant_label)}' ],"
    )
lines.append("];")
lines.append("")
lines.append("const DTB_SCHEMATIC_SHARED_VARIANT_MAP = [")
for canonical_id in sorted(shared_variant_map.keys()):
    lines.append(f"\t'{php_str(canonical_id)}' => [")
    for option in shared_variant_map[canonical_id]:
        lines.append(
            f"\t\t[ 'key' => '{php_str(option['key'])}', 'label' => '{php_str(option['label'])}', "
            f"'sku' => '{php_str(option['sku'])}' ],"
        )
    lines.append("\t],")
lines.append("];")
lines.append("")
lines.append("const DTB_SCHEMATIC_HOTSPOT_SOURCE_MAP = [")
for canonical_id in sorted(hotspot_source_map.keys()):
    lines.append(f"\t'{php_str(canonical_id)}' => [")
    for reference, page in sorted(hotspot_source_map[canonical_id].items(), key=lambda item: (item[1], item[0])):
        lines.append(
            f"\t\t[ 'reference' => '{php_str(reference)}', 'page' => {int(page)} ],"
        )
    lines.append("\t],")
lines.append("];")
lines.append("")

out_path = f"{REPO}/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php"
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print(f"Wrote {out_path}")
