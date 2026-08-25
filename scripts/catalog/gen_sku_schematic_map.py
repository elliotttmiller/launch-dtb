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
            # Asgard schematics are retired, and the Sanders category is
            # discontinued (see DTB_RETIRED_SCHEMATIC_UPLOAD_SKUS'
            # COL-SANDER-HEAD entry) — neither may enter runtime maps.
            # Recorded (not just skipped) so DTB_RETIRED_SCHEMATIC_IDS can deny
            # them even via the {schematic-id}--page-{n} passthrough upload
            # pattern, which bypasses DTB_SKU_SCHEMATIC_MAP /
            # DTB_VERBOSE_SCHEMATIC_ID_MAP entirely.
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
print(f"[retired ids] Asgard schematic ids denylisted: {len(retired_schematic_ids)}", file=sys.stderr)

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

# Exact legacy source basenames that do not encode a SKU or schematic id.
# Keep this list narrow: every entry must be traceable to one unique source asset.
legacy_filename_map = {
    "mud-pump-sub-assemblies-2022-enhanced": ("columbia-mud-pump", 1),
    "tall-boy-mud-pump-sub-assemblies-2022-enhanced": ("columbia-tall-boy-mud-pump", 1),
    "schematic_page_1": ("tapetech-17tt", 1),
}

# =====================================================================
# Part 3: DTB_SCHEMATIC_BRAND_CATEGORY_MAP (canonical schematic id -> brand/category)
#   Publication eligibility (Domain/SchematicPublicationRules.php) requires a
#   non-empty brand_id and category_id on every schematic record, but the
#   reconciliation pipeline (Application/ReconcileSchematicSource.php) never
#   set either when creating a record, so every record was stuck un-publishable
#   in Draft. brand/schematic_category are both present per-row in the master
#   CSV; this resolves each row's raw (verbose or SKU-keyed) schematic_id to
#   its canonical dtb id via the same verbose_map/sku_map already built above,
#   so the mapping can't drift from the id resolution the backend itself uses.
# =====================================================================


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

brand_category_votes = {}  # canonical_id -> Counter[(brand_id, category_id)]
brand_name_votes = {}       # canonical_id -> Counter[customer-facing brand name]
category_name_votes = {}    # canonical_id -> Counter[customer-facing category name]
title_votes = {}            # canonical_id -> Counter[customer-facing schematic title]
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

# Catalog link metadata is the customer-facing authority when available. It
# corrects source-folder categories such as TapeTech "07TT" to storefront
# categories such as "Automatic Tapers" without changing schematic identity.
catalog_brand_category_votes = {}
for entry in catalog.values():
    canonical_id = (entry.get("schematicId") or "").strip()
    brand = (entry.get("brand") or "").strip()
    category = (entry.get("category") or "").strip()
    title = (entry.get("title") or "").strip()
    if not canonical_id or not brand or not category:
        continue
    brand_id, brand_name = canonical_schematic_brand(brand)
    catalog_brand_category_votes.setdefault(canonical_id, Counter())[(brand_id, to_kebab(category))] += 1
    brand_name_votes.setdefault(canonical_id, Counter())[brand_name] += 1
    category_name_votes.setdefault(canonical_id, Counter())[category] += 1
    if title:
        title_votes.setdefault(canonical_id, Counter())[title] += 1

brand_category_map = {}
for canonical_id, votes in brand_category_votes.items():
    (brand_id, category_id), _count = votes.most_common(1)[0]
    brand_category_map[canonical_id] = (brand_id, category_id)

for canonical_id, votes in catalog_brand_category_votes.items():
    (brand_id, category_id), _count = votes.most_common(1)[0]
    brand_category_map[canonical_id] = (brand_id, category_id)

# Fallback for canonical ids with no master-CSV row at all (e.g. Surpro,
# Dura-Stilts Dura III): productSchematicLinks.generated.js entries already
# carry their own brand/category fields.
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
    brand_name_votes.setdefault(canonical_id, Counter())[brand_name] += 1
    category_name_votes.setdefault(canonical_id, Counter())[category] += 1
    title = (entry.get("title") or "").strip()
    if title:
        title_votes.setdefault(canonical_id, Counter())[title] += 1
    catalog_fallback_added += 1

display_map = {}
for canonical_id, (brand_id, category_id) in brand_category_map.items():
    brand_name = brand_name_votes.get(canonical_id, Counter()).most_common(1)
    category_name = category_name_votes.get(canonical_id, Counter()).most_common(1)
    title = title_votes.get(canonical_id, Counter()).most_common(1)
    display_map[canonical_id] = {
        "brand_name": brand_name[0][0] if brand_name else humanize_identifier(brand_id),
        "category_name": category_name[0][0] if category_name else humanize_identifier(category_id),
        "title": title[0][0] if title else humanize_identifier(canonical_id),
    }

print(f"[brand/category map] resolved from CSV: {len(brand_category_map) - catalog_fallback_added}, from generated.js fallback: {catalog_fallback_added}, total: {len(brand_category_map)}", file=sys.stderr)

# =====================================================================
# Part 4: DTB_SCHEMATIC_FAMILY_MAP (canonical schematic id -> family_id/variant_label)
#   Several WooCommerce parent products (e.g. COL-AUTOMATIC-FLAT-BOX, sizes
#   8/10/12/14) either (a) share one schematic diagram/canonical id across
#   all size variations (the WooCommerce variation carries its own
#   `Meta: _dtb_schematic_variant` value, e.g. "8"), or (b) have a genuinely
#   distinct diagram per size (e.g. Level5's 7/10/12-inch flat boxes are
#   separate schematic ids under one LV5-FLAT-BOX-STANDARD parent). Both
#   cases are grouped consistently by keying off the shared WooCommerce
#   parent SKU (`Meta: _dtb_parent_product_sku` in
#   products/launch/official/dtb_official_catalog.csv) rather than trying to
#   string-parse a trailing size/variant token off the schematic id itself —
#   canonical ids don't follow one consistent suffix convention (compare
#   "columbia-automatic-flat-box" [no suffix at all] against
#   "level5-10-inch-flat-box-4-765" [size embedded mid-string]), while the
#   parent SKU is an explicit, already-authoritative WooCommerce signal.
#
#   A `variant_label` is only ever emitted when every WooCommerce row that
#   resolves to a given schematic id agrees on one
#   `Meta: _dtb_variation_label` value — i.e. when the schematic id
#   unambiguously represents exactly one size/variant (case (b) above, or a
#   product with no size variation at all). When a schematic id is shared by
#   multiple distinct variants (case (a) above), no single label describes
#   the record, so variant_label is left empty. Those exact variation keys,
#   labels, and SKUs are emitted separately in
#   DTB_SCHEMATIC_SHARED_VARIANT_MAP for the public detail projection.
#
#   A schematic id observed under more than one distinct parent SKU (a
#   handful of SurPro Manual/Automatic head schematic ids, shared across two
#   separate parent product lines) is a genuine one-to-many case, not a data
#   error — rather than arbitrarily picking one parent, no family_id is
#   emitted for it; these are reported below for manual review.
# =====================================================================

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
    # Parent SKUs are already hyphen-separated and all-caps (e.g.
    # "COL-AUTOMATIC-FLAT-BOX") — a straight lowercase, not to_kebab()
    # (which assumes CamelCase input and would insert a hyphen before every
    # letter of an all-caps string), is the correct normalization here.
    family_id = re.sub(r"[^a-z0-9]+", "-", parent.lower()).strip("-")
    family_map[sid] = (family_id, variant_label)
    options = list(variant_options_by_schematic.get(sid, {}).values())
    if len(options) > 1:
        shared_variant_map[sid] = options

# =====================================================================
# Part 5: DTB_SCHEMATIC_HOTSPOT_SOURCE_MAP
#
# Exact canonical-record -> source JSON/page relationships. The master parts
# CSV is authoritative for source_file_from_brands; the same verbose-id map
# used for diagram assets resolves those source rows to canonical IDs/pages.
# Only files that actually exist in frontend/public/brands are emitted, so
# stale master references cannot become runtime pointers.
# =====================================================================

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

# Preserve the legacy viewer's explicit multi-page family ownership where the
# source export's numeric schematic IDs are blank or reused across families.
# Directory identities are exact source contracts; they are never fuzzy title
# matches. Removing a reference from its ID-derived owner first prevents an
# ambiguous export ID from projecting one JSON file into two records.
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
lines.append(" * Regenerate with scripts/catalog/gen_sku_schematic_map.py whenever any source changes.")
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
lines.append("// Retired-brand (Asgard) schematic ids, sourced from")
lines.append("// all_brands_schematic_parts_master.csv rows with brand=Asgard. Denylisted")
lines.append("// regardless of which upload filename pattern resolves to them, including")
lines.append("// the {schematic-id}--page-{n} passthrough pattern that bypasses every")
lines.append("// other map above.")
lines.append("const DTB_RETIRED_SCHEMATIC_IDS = [")
for sid in sorted(retired_schematic_ids):
    lines.append(f"\t'{php_str(sid)}' => true,")
lines.append("];")
lines.append("")
lines.append("// Canonical schematic id -> brand_id/category_id, sourced from brand/")
lines.append("// schematic_category columns in all_brands_schematic_parts_master.csv.")
lines.append("// Consumed by Application/ReconcileSchematicSource.php to populate the")
lines.append("// publication-required brand_id/category_id fields")
lines.append("// (Domain/SchematicPublicationRules.php) on record create and backfill,")
lines.append("// which the reconciliation pipeline previously never set.")
lines.append("const DTB_SCHEMATIC_BRAND_CATEGORY_MAP = [")
for canonical_id in sorted(brand_category_map.keys()):
    brand_id, category_id = brand_category_map[canonical_id]
    lines.append(f"\t'{php_str(canonical_id)}' => [ 'brand_id' => '{php_str(brand_id)}', 'category_id' => '{php_str(category_id)}' ],")
lines.append("];")
lines.append("")
lines.append("// Canonical schematic id -> customer-facing display metadata. Catalog link")
lines.append("// metadata wins over source-folder labels; reconciliation persists this")
lines.append("// projection and the public API uses it as a compatibility fallback.")
lines.append("const DTB_SCHEMATIC_DISPLAY_MAP = [")
for canonical_id in sorted(display_map.keys()):
    metadata = display_map[canonical_id]
    lines.append(
        f"\t'{php_str(canonical_id)}' => [ "
        f"'brand_name' => '{php_str(metadata['brand_name'])}', "
        f"'category_name' => '{php_str(metadata['category_name'])}', "
        f"'title' => '{php_str(metadata['title'])}' ],"
    )
lines.append("];")
lines.append("")
lines.append("// Canonical schematic id -> family_id/variant_label, sourced from")
lines.append("// Meta: _dtb_parent_product_sku / Meta: _dtb_variation_label columns in")
lines.append("// products/launch/official/dtb_official_catalog.csv. Consumed by")
lines.append("// Application/ReconcileSchematicSource.php to populate")
lines.append("// DTB_Schematic_Record_Entity::$family_id/$variant_label so the public")
lines.append("// API/frontend can group size/variant siblings of one WooCommerce parent")
lines.append("// product under a single schematic family. variant_label is only present")
lines.append("// when every variant row observed for that schematic id agrees on one")
lines.append("// label (i.e. the schematic id unambiguously represents one variant).")
lines.append("const DTB_SCHEMATIC_FAMILY_MAP = [")
for canonical_id in sorted(family_map.keys()):
    family_id, variant_label = family_map[canonical_id]
    lines.append(f"\t'{php_str(canonical_id)}' => [ 'family_id' => '{php_str(family_id)}', 'variant_label' => '{php_str(variant_label)}' ],")
lines.append("];")
lines.append("")
lines.append("// Canonical schematic id -> WooCommerce variations that intentionally share")
lines.append("// one diagram record. This is a generated public projection used by the")
lines.append("// detail API to render the legacy size/model navigator without making React")
lines.append("// an authority for product or variation existence.")
lines.append("const DTB_SCHEMATIC_SHARED_VARIANT_MAP = [")
for canonical_id in sorted(shared_variant_map.keys()):
    lines.append(f"\t'{php_str(canonical_id)}' => [")
    for option in shared_variant_map[canonical_id]:
        lines.append(
            f"\t\t[ 'key' => '{php_str(option['key'])}', 'label' => '{php_str(option['label'])}', 'sku' => '{php_str(option['sku'])}' ],"
        )
    lines.append("\t],")
lines.append("];")
lines.append("")
lines.append("// Canonical schematic id -> exact hotspot JSON source/page relationships,")
lines.append("// sourced from all_brands_schematic_parts_master.csv and resolved through")
lines.append("// DTB_VERBOSE_SCHEMATIC_ID_MAP. Runtime migration uses this deterministic")
lines.append("// map before any compatibility locator.")
lines.append("const DTB_SCHEMATIC_HOTSPOT_SOURCE_MAP = [")
for canonical_id in sorted(hotspot_source_map.keys()):
    lines.append(f"\t'{php_str(canonical_id)}' => [")
    for reference, page in sorted(hotspot_source_map[canonical_id].items(), key=lambda item: (item[1], item[0])):
        lines.append(f"\t\t[ 'reference' => '{php_str(reference)}', 'page' => {int(page)} ],")
    lines.append("\t],")
lines.append("];")
lines.append("")

out_path = f"{REPO}/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php"
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print("wrote", out_path, file=sys.stderr)

for entry in catalog.values():
    entry["url"] = canonical_product_schematic_url(entry)

catalog_header = """/*
 * Catalog product-to-schematic relationships. The relationship fields are
 * curated catalog data; scripts/catalog/gen_sku_schematic_map.py normalizes
 * every URL through the canonical schematic brand/category identity contract.
 * Runtime consumers also rebuild URLs from these fields rather than trusting
 * a stored legacy URL.
 */

"""
with open(js_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(catalog_header)
    f.write("export const PRODUCT_SCHEMATIC_LINKS = ")
    json.dump(catalog, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print("wrote", js_path, file=sys.stderr)
