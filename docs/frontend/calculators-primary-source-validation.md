# Drywall Toolbox Calculators — Primary-Source Standards Validation

**Status:** Pre-implementation research and rule classification  
**Date:** 2026-09-03  
**Scope:** Current Drywall Sheets, Joint Compound, Tape, Corner Bead, Screw, cross-calculator, persistence, summary, and report rules  
**Baseline:** `docs/frontend/calculators-current-architecture-audit.md`  
**Implementation source of truth:** `frontend/src/components/calculators/`  

## Purpose

This document performs the standards-validation phase that follows the current-state architecture audit. It does **not** alter calculator implementation. Its purpose is to determine, rule by rule, what should survive into the implementation-hardening phase.

Every current rule is classified as one of:

- **KEEP** — technically defensible as implemented, subject only to wording/tests.
- **MODIFY** — underlying approach is useful, but inputs, scope, wording, assumptions, or formula must change.
- **REPLACE** — current rule is materially wrong or structurally inadequate and should be replaced by a different model.
- **REMOVE** — no defensible need or primary-source basis for the rule; it should not remain as an authoritative calculation rule.
- **NEEDS PRODUCT DATA** — no single universal value exists; the calculation must be driven by selected manufacturer/product/system data rather than a global constant.

The classifications intentionally distinguish **installation standards** from **estimating factors**. GA-216 and ASTM C840 govern application/installation and finishing requirements. They do not, by themselves, establish universal purchase-waste percentages, gallons-per-area factors for every finish level, screws-per-box values, or generic stock-piece yields.

---

# 1. Source hierarchy used for this validation

## Tier 1 — Current industry/application standards

### Gypsum Association GA-216-2024

**Title:** Application and Finishing of Gypsum Panel Products  
**Authority:** Gypsum Association  
**Current edition confirmed:** 2024  
**Primary role:** panel application, framing constraints, panel orientation/layout requirements, fastener selection/spacing, joints, openings, accessories, arches/curves, and finishing application.

Official source:

- https://gypsum.org/2019/04/ga-216-2018-application-and-finishing-of-gypsum-panel-products/
- https://gypsum.org/ga-216-application-and-finishing-of-gypsum-panel-products/

The Gypsum Association states that GA-216-2024 is the current edition and that it guides wallboard layout, fastener selection, fastener spacing, panel application at outside corners/arches/curves, and placement of joints around openings.

### ASTM C840

**Title:** Standard Specification for Application and Finishing of Gypsum Board  
**Authority:** ASTM International  
**Current active edition confirmed by ASTM catalog:** C840-25  
**Primary role:** minimum requirements for application and finishing of gypsum board, including assembly-specific framing and fastener requirements.

Official source:

- https://store.astm.org/c0840-23.html

ASTM's catalog identifies C840-25 as the active version. Public catalog material also makes an essential limitation explicit: fire-rated and sound-control construction must follow the applicable tested/listed assembly, and application requirements vary by construction system.

### Gypsum Association GA-214-2021

**Title:** Levels of Finish for Gypsum Panel Products  
**Authority:** Gypsum Association  
**Current edition confirmed:** 2021  
**Primary role:** definition and intended use of Levels 0 through 5.

Official source:

- https://gypsum.org/2023/09/ga-214-2021-levels-of-finish-for-gypsum-panel-products-translated-into-spanish-and-french/

GA explicitly describes GA-214-2021 as the Levels of Finish document covering Levels 0 through 5.

## Tier 2 — Primary manufacturer estimating and installation literature

Manufacturer literature is required where a standard does not establish a universal consumption factor.

### USG Sheetrock Installation and Finishing Guide J371

Official source:

- https://www.usg.com/content/dam/USG/pdpmovedocuments/sheetrock-gypsum-panels-installation-guide-en-J371.pdf

Relevant primary-source facts:

- panels may be applied horizontally or vertically;
- horizontal 12-ft wall application is described as advantageous because it can reduce joint footage;
- use the longest practical panel length to minimize joints;
- the estimating table uses approximately **370 ft of joint tape per 1,000 sq ft of gypsum panels**;
- the same guide provides fastener estimating information;
- 1-1/4 in Type W screws are identified for common single-layer 3/8, 1/2, and 5/8 in panels on wood framing;
- actual framing, fastener, and panel requirements remain application dependent.

### USG Sheetrock Paper Joint Tape J1736

Official source:

- https://www.usg.com/content/dam/USG_Marketing_Communications/united_states/product_promotional_materials/finished_assets/sheetrock-paper-joint-tape-submittal-J1736.pdf

Primary-source coverage:

- approximately **370 ft per 1,000 sq ft** of gypsum panels;
- standard listed rolls include 75 ft, 250 ft, and 500 ft.

### USG Sheetrock Fiberglass Drywall Tape J780A

Official source:

- https://www.usg.com/content/dam/USG_Marketing_Communications/united_states/product_promotional_materials/finished_assets/sheetrock-fiberglass-drywall-tape-submittal-J780A.pdf

Primary-source coverage:

- approximately **370 ft per 1,000 sq ft** of gypsum panels.

### USG Matching Joint Compound with the Proper Joint Tape J2140

Official source:

- https://www.usg.com/content/dam/USG_Marketing_Communications/united_states/product_promotional_materials/finished_assets/matching-joint-compound-with-proper-joint-tape-white-paper-en-usa-J2140.pdf

Primary-source conclusion:

- paper tape is compatible with drying- and setting-type compounds;
- fiberglass tape should be used with setting-type compound;
- USG does not recommend drying-type compound with fiberglass tape.

### USG Sheetrock Total Joint Compound J1508 / USG FAQ

Official sources:

- https://www.usg.com/content/dam/USG_Marketing_Communications/united_states/product_promotional_materials/finished_assets/sheetrock-total-all-purpose-joint-compound-submittal-J1508.pdf
- https://assemblies-tools.usg.com/content/usgcom/en/resource-center/faqs/1977.html

Primary-source coverage examples:

- Sheetrock Total Joint Compound: approximately **10 gal/1,000 sq ft** of gypsum panels;
- UltraLightweight All Purpose: approximately two 4.5-gal pails per 1,000 sq ft, or about **9 gal/1,000 sq ft**.

These figures demonstrate why a single universal gallons-per-area constant cannot truthfully represent every compound/product/finish system.

### USG / CGC estimating literature

Official source:

- https://www.usg.com/content/dam/USG_Marketing_Communications/canada/product_promotional_materials/finished_assets/cgc-construction-handbook-ch03-cladding-can-en.pdf

Primary-source joint treatment estimate:

- approximately 370 ft joint tape per 1,000 sq ft;
- compound consumption differs materially between conventional setting powder, lightweight setting powder, conventional ready-mix, and lightweight ready-mix.

### National Gypsum Drywall Materials Calculator

Official source:

- https://www.nationalgypsum.com/calculator

National Gypsum's calculator explicitly states that its estimate does **not include allowance for waste** and is based on manufacturer recommended installation guidelines. It supports 4x8, 4x10, and 4x12 panel alternatives and calculates board, compound, tape, and fasteners.

This is useful evidence that waste is an estimating decision rather than a universal GA/ASTM requirement.

### Corner-bead product instructions

USG Sheetrock Installation and Finishing Guide:

- https://www.usg.com/content/dam/USG/pdpmovedocuments/sheetrock-gypsum-panels-installation-guide-en-J371.pdf

USG Dur-A-Bead installation calls for nail attachment at 9 in on each flange for that specific bead/application.

Trim-Tex official FAQ and product installation literature:

- https://www.trim-tex.com/faq
- https://files.trim-tex.com/production/media/Small-Bullnose-Corner-Bead_Installation-Guide.pdf

Trim-Tex vinyl products use different attachment systems; for example, many products use adhesive plus 1/2-in staples at 6-8 in spacing, while alternative attachment methods use different spacing.

**Conclusion:** corner-bead fastening is product/system specific and must not be represented as one universal rule.

---

# 2. Global findings

## 2.1 Standards are not estimating-factor tables

The largest systemic issue in the existing implementation is attribution.

Current code repeatedly describes formulas as "ASTM C840," "GA-216," "industry standard," or "production-grade" when the referenced standards govern **installation requirements**, not the particular DTB purchasing formula.

Examples that are not universal ASTM/GA estimating rules include:

- 10% board waste;
- dynamic waste based on seam count;
- 5% tape waste;
- 5% corner-bead splice waste;
- 10% screw overage;
- 0.38 tape ft/sq ft attributed to ASTM;
- finish-level-specific gallons-per-100-sq-ft constants;
- 40/35/25 compound coat-volume allocation;
- screws-per-pound constants;
- generic corner-bead fastening spacing across bead types.

These may sometimes be useful estimating assumptions, but they must be represented as such.

## 2.2 Rated assemblies override generic calculator assumptions

ASTM C840 expressly recognizes tested/listed construction requirements. GA-216 likewise distinguishes application systems by panel type, framing, layer count, orientation, and use.

Therefore the future calculator must not imply that a generic result is an installation specification for:

- fire-rated assemblies;
- sound-rated assemblies;
- shear/braced assemblies;
- specialty panels;
- tile substrates;
- multilayer systems;
- adhesive-assisted systems;
- shaftwall or proprietary systems.

The calculator may estimate materials for a declared generic non-rated application, or it must accept an explicit assembly/system profile.

---

# 3. Drywall Sheet Calculator rule matrix

## SHEET-01 — Supported 4x8, 4x10, and 4x12 board choices

**Current rule:** only 32, 40, and 48 sq-ft sheets are selectable and are interpreted as 4x8, 4x10, and 4x12.

**Classification: KEEP**

These are legitimate and common panel sizes and are also the three alternatives exposed by National Gypsum's official materials calculator.

**Required wording change:** describe them as **DTB-supported conventional 48-in-wide panel sizes**, not as every panel size available in the industry.

---

## SHEET-02 — Every supported panel has a fixed 4-ft short dimension

**Current rule:** `SHEET_SHORT_DIM = 4`.

**Classification: MODIFY**

For the three supported conventional products, the assumption is valid. It should become an explicit supported-input contract rather than a universal statement that all gypsum panels are 48 in wide.

**Future rule:** panel dimensions should be represented directly as width and length, even if the initial UI continues to expose only 48x96, 48x120, and 48x144 in products.

---

## SHEET-03 — Horizontal and vertical panel orientation are both permitted choices

**Classification: KEEP**

USG installation literature expressly permits horizontal or vertical application in applicable systems.

**Constraint:** whether an orientation is allowable depends on panel thickness, framing spacing, wall/ceiling use, layer count, and the applicable tested/listed assembly.

---

## SHEET-04 — UI description says horizontal is generally recommended and vertical is for tall walls >12 ft

**Classification: REPLACE**

Horizontal application can reduce joint footage, and USG illustrates this advantage, but the current wording creates an unsupported universal rule. Vertical application is not limited to walls over 12 ft.

**Future wording:** explain joint-minimization benefits while making orientation dependent on project framing/system requirements.

---

## SHEET-05 — Per-wall full-panel grid formula

Current horizontal model:

```text
ceil(wallLength / panelLength) * ceil(wallHeight / panelWidth)
```

Current vertical model:

```text
ceil(wallLength / panelWidth) * ceil(wallHeight / panelLength)
```

**Classification: MODIFY**

The math correctly describes a simple rectangular full-panel grid. It does not model:

- staggered end joints;
- reusable offcuts;
- openings;
- partial sheets;
- framing-member locations;
- joints that must avoid opening corners;
- different panel widths;
- rated-system constraints.

It should be retained as a **basic geometric takeoff mode**, not described as GA-216/ASTM compliance.

---

## SHEET-06 — Field joint footage derived from the simple rectangular grid

**Classification: MODIFY**

The formula is mathematically consistent with the simplified grid, but it is not an ASTM formula and cannot be described as "exact" once openings, cuts, staggered joints, offcuts, and framing constraints are omitted.

Rename to **layout-estimated field joint footage** unless/until the layout engine models actual panel cuts and placement.

---

## SHEET-07 — Ceiling layout is hard-coded independently of framing direction

Current model always maps the 4-ft dimension to `roomLength` and panel length to `roomWidth`.

**Classification: REPLACE**

Panel orientation on ceilings must account for joist/framing direction, panel thickness, framing spacing, application system, and applicable assembly requirements.

**Future model:** collect framing direction and select/validate parallel or perpendicular orientation. Quantity optimization may occur only among permitted orientations.

---

## SHEET-08 — Default door deduction = 21 sq ft and default window deduction = 15 sq ft, attributed to GA-216 / ASTM C1396

**Classification: REMOVE**

No primary-source evidence was found that GA-216 or ASTM C1396 establishes these as standard opening deduction areas. A 3x7 door and 3x5 window are merely dimensional examples.

**Future behavior:** either require actual opening dimensions or clearly label optional estimator defaults as DTB assumptions with no standards attribution.

---

## SHEET-09 — Gross area minus opening area produces net board surface area

**Classification: KEEP**

This is valid geometry when actual opening dimensions are supplied.

**Required change:** remove standards attribution from arbitrary opening defaults.

---

## SHEET-10 — Opening deductions reduce downstream net area but do not reduce layout-derived panel count

**Classification: MODIFY**

This is defensibly conservative for a coarse panel takeoff because openings do not translate directly into whole-sheet savings. However, it is not a universal estimating rule and can overstate or understate depending on layout and offcut reuse.

**Future model:** basic mode may retain non-deduction with explicit disclosure; advanced mode should incorporate opening geometry into panel placement/cut optimization.

---

## SHEET-11 — User-selectable waste factors of 5%, 10%, 15%, 20%, or custom

**Classification: MODIFY**

Waste allowance is an estimating decision, not a GA-216/ASTM requirement. National Gypsum explicitly separates its manufacturer-guideline estimate from waste allowance.

**Future rule:** retain as a clearly labeled **user purchasing allowance**, default configurable, with no "standard/complex/heavy" industry-authority labels unless DTB later documents a separate estimating methodology.

---

## SHEET-12 — Dynamic waste = 10% + 2% per vertical seam after the first, capped at 25%

**Classification: REMOVE**

No primary-source basis was found for this heuristic. Seam count alone is not an adequate waste predictor and can cause severe overstatement on ordinary multi-wall rooms.

Delete it as an authoritative recommendation.

---

## SHEET-13 — Final purchase quantity = ceil(base installed sheets x (1 + user waste))

**Classification: KEEP**

This is correct arithmetic for a user-selected purchasing allowance.

**Terminology:** distinguish `installed/base panels` from `purchase panels`.

---

## SHEET-14 — Wall and ceiling framing direction is not captured

**Classification: REPLACE**

A standards-aware layout cannot validate panel orientation or fastener layout without framing direction and framing spacing.

Add explicit wall framing and ceiling joist direction/system inputs or scope the calculator as a non-installation takeoff.

---

# 4. Joint Compound Calculator rule matrix

## MUD-01 — GA Levels 0 through 5 are exposed

**Classification: KEEP**

GA-214-2021 is the appropriate primary authority for Levels 0-5.

---

## MUD-02 — Each finish level maps to one scalar "coat count"

Current map:

```text
0:0, 1:1, 2:2, 3:3, 4:3, 5:4
```

**Classification: REPLACE**

GA-214 defines treatment separately for joints/interior angles, fastener heads, accessories, and the full surface. A single scalar coat count is not an accurate representation of the specification.

**Future model:** represent finish requirements by treatment surface/category rather than one number.

---

## MUD-03 — Current finish-level descriptions/applications

**Classification: MODIFY**

The general Level 0-5 concept is sound, but text must be normalized against GA-214-2021 and should not add unsupported absolutes.

Examples:

- Level 2 is commonly used as a substrate for tile, but wet-area treatment must follow the applicable substrate/tile system.
- Level 5 is Level 4 treatment plus a skim coat over the entire surface, but selection depends on final decoration and lighting conditions.

Use source-qualified GA-214 language.

---

## MUD-04 — Fixed gallons per 100 sq ft by finish level

Current values:

```text
L1 .60
L2 1.00
L3 1.25
L4 1.40
L5 1.80
```

**Classification: NEEDS PRODUCT DATA**

These are not GA-214 material-consumption requirements.

Primary manufacturer evidence shows materially different coverage by compound product/type. USG examples are approximately 9-10 gal per 1,000 sq ft for common ready-mix joint finishing, while CGC data differentiates conventional ready-mix, lightweight ready-mix, and setting powders.

**Future model:** coverage must be attached to a selected compound product or verified manufacturer coverage profile. Level 5 skim-coat consumption requires a separate skim-coat coverage component.

---

## MUD-05 — Compound type does not affect quantity

**Classification: NEEDS PRODUCT DATA**

Manufacturer literature proves the opposite: conventional ready-mix, lightweight ready-mix, conventional setting compound, lightweight setting compound, and specialized skim products have different packaging and coverage characteristics.

---

## MUD-06 — Coat volume split 40% / 35% / 25%

**Classification: REMOVE**

No primary-source basis was found for this generic volumetric allocation.

---

## MUD-07 — Level 5 four-coat volume split with 35% first / 15% skim / remaining 50%

**Classification: REMOVE**

This is an implementation-created allocation, not a GA-214 requirement or manufacturer coverage model.

---

## MUD-08 — Five-gallon bucket count = ceil(total gallons / 5)

**Classification: NEEDS PRODUCT DATA**

Packaging is product-specific. Primary USG data includes 3.5-gal cartons and 4.5-gal pails as well as other packages. A generic "5-gal" package cannot be assumed.

Future output should calculate packages from selected SKU/package volume.

---

## MUD-09 — One-gallon equivalent = ceil(total gallons)

**Classification: MODIFY**

It is mathematically valid as an abstract gallon-equivalent, but must not imply a purchasable 1-gal package unless the selected product actually has one.

---

## MUD-10 — Blanket 24-hour dry time between coats

**Classification: REPLACE**

Drying-type compound cure/dry time is affected by temperature, humidity, thickness, ventilation, and product. Setting-type compounds chemically set according to their product-specific working/set time and still have drying considerations before decoration.

Use manufacturer/product instructions rather than a universal 24-hour rule.

---

## MUD-11 — Level 5 uses approximately 29% more compound than Level 4

**Classification: REMOVE**

The value is only a ratio of DTB's unsupported constants (1.8 / 1.4). It is not a GA-214 rule or manufacturer universal.

---

## MUD-12 — When Sheet data exists, use net installed gypsum surface area

**Classification: KEEP**

Manufacturer coverage is commonly stated per area of gypsum panels being finished. Using actual installed finish surface area is a reasonable upstream contract.

**Future refinement:** do not use purchase/waste area; use finishable installed surface area and account separately for accessories/Level 5 skim/product coverage where required.

---

# 5. Tape Calculator rule matrix

## TAPE-01 — Prefer layout-derived joint footage when Sheet layout data exists

**Classification: KEEP**

Geometry-derived footage is preferable to a broad estimating factor.

**Terminology change:** until the layout engine models actual cuts/openings/staggered placement, call it **layout-estimated joint footage**, not exact ASTM footage.

---

## TAPE-02 — Manual fallback = 0.38 linear ft per sq ft

**Classification: MODIFY**

USG primary literature repeatedly publishes approximately **370 ft per 1,000 sq ft**, or **0.37 lf/sq ft**, for both paper and fiberglass tape.

Future fallback:

```text
approximateTapeFt = panelArea * 0.37
```

This should be labeled a **USG manufacturer estimating factor**, not an ASTM C840 formula.

---

## TAPE-03 — Inside-corner footage = insideCornerCount x ceilingHeight

**Classification: MODIFY**

The math is valid for vertical wall-to-wall inside angles of uniform height. The UI currently also describes the input as including wall-to-ceiling transitions; that is incorrect because wall-to-ceiling footage is perimeter length, not height.

Future model must separate:

- vertical inside corners;
- wall-to-ceiling inside angles/perimeter;
- other angles/soffits as applicable.

---

## TAPE-04 — Fiberglass/mesh tape receives a 15% consumption multiplier for "stretch"

**Classification: REMOVE**

USG lists approximately the same 370 ft/1,000 sq ft coverage for its paper and fiberglass tapes. No primary source supports adding 15% because mesh physically stretches.

---

## TAPE-05 — Add 5% tape waste and attribute it to ASTM C840

**Classification: MODIFY**

No primary-source ASTM basis was established for a universal 5% purchase allowance.

If retained, it must be a clearly labeled user-configurable purchasing allowance with no ASTM attribution.

---

## TAPE-06 — Paper tape may be used with drying- or setting-type compound

**Classification: KEEP**

USG J2140 supports this compatibility.

---

## TAPE-07 — Fiberglass tape should use setting-type compound

**Classification: KEEP**

USG testing specifically recommends setting-type joint compound with fiberglass tape and does not recommend drying-type compound with fiberglass tape.

The future UI should enforce or warn on incompatible tape/compound combinations across calculator tabs.

---

## TAPE-08 — Generic roll sizes 75, 250, and 500 ft

**Classification: NEEDS PRODUCT DATA**

Those are valid USG paper-tape packages, but a generic calculator should not assume every tape SKU has those lengths.

Use product/package data when calculating rolls to purchase. A manufacturer-neutral planning mode may continue to offer them as explicitly labeled nominal roll lengths.

---

## TAPE-09 — One tape type value `flex` covers flexible inside/outside corners

**Classification: NEEDS PRODUCT DATA**

Flexible reinforced tapes and corner products have product-specific widths, lengths, applications, and installation requirements. Do not fold them into paper/mesh coverage logic without a selected product profile.

---

# 6. Corner Bead Calculator rule matrix

## BEAD-01 — Straight corner footage = number of corners x corner height

**Classification: KEEP**

This is correct geometry for equal-height straight outside corners.

Future advanced mode should permit per-corner heights.

---

## BEAD-02 — Arch length = arches x pi x `archHeight`, where the UI calls the same input radius/rise

**Classification: REPLACE**

`pi * r` is the arc length of a semicircle only when the supplied number is actually the radius. An arch rise is not generally equal to radius.

Future geometry must collect an arch shape and sufficient dimensions, for example:

- semicircle: radius or span;
- circular segment: span/chord + rise;
- quarter circle: radius;
- custom curve: measured linear footage.

---

## BEAD-03 — 5% straight-run splice waste is an "industry standard"

**Classification: MODIFY**

No universal primary-source 5% requirement was established.

Retain only as an optional user purchasing allowance, without "industry standard" attribution.

---

## BEAD-04 — Sections to buy = ceil(total aggregate footage / stock length)

**Classification: REPLACE**

This can undercount because stock sections are discrete pieces and every physical run has its own cut requirement. Aggregate footage assumes offcuts can always be reused or that splicing is always acceptable.

Future model should allocate stock pieces per run and then optimize reusable offcuts subject to product/system splice rules.

---

## BEAD-05 — Metal, bullnose, vinyl, and flex bead all use the same quantity/attachment assumptions

**Classification: NEEDS PRODUCT DATA**

Primary manufacturer instructions vary materially by product.

Examples:

- USG Dur-A-Bead metal corner bead: nail attachment at 9 in on each flange for the cited product/application;
- many Trim-Tex vinyl beads: adhesive plus staples 6-8 in, with different spacing when adhesive is omitted;
- paper-faced tape-on products use joint compound rather than the same mechanical fastening model.

Future calculation needs selected bead product/profile/stock length/installation method.

---

## BEAD-06 — Metal bead tip says fasten every 6-9 in alternating sides

**Classification: REPLACE**

This mixes manufacturer systems into a generic rule. USG and Trim-Tex instructions demonstrate that spacing and attachment method are product-specific.

---

## BEAD-07 — Flex bead generic fastening rules 4-6 in, or 2-3 in for tight radii

**Classification: NEEDS PRODUCT DATA**

This must come from the selected flexible bead manufacturer/product installation guide.

---

## BEAD-08 — Generic 8, 10, 12 ft stock lengths

**Classification: NEEDS PRODUCT DATA**

Stock length is SKU/product specific. It may remain a manual planning input, but purchasing results should use catalog/product data.

---

# 7. Screw Calculator rule matrix

## SCREW-01 — Generic applications: wall, ceiling, or both

**Classification: MODIFY**

The categories are useful, but they are insufficient to determine compliant fastening.

Future calculation must also know at minimum:

- wood vs steel framing;
- panel thickness/type;
- number of layers;
- framing spacing;
- panel orientation;
- adhesive-assisted vs mechanical-only attachment where applicable;
- rated/listed assembly override.

---

## SCREW-02 — Generic screw spacing = 8 in at panel edges, 16 in wall field, 12 in ceiling field and attributed to ASTM C840-23

**Classification: REPLACE**

The current model is not a safe universal representation of ASTM C840 or GA-216.

USG's common installation/estimating guidance uses application-specific spacing such as 16 in on common wall applications and 12 in on common ceiling applications, while its system catalogs demonstrate that spacing changes with system, framing, layer, and attachment method.

There is no basis for the current calculator to universally impose a separate 8-in screw pattern on both panel edge lines.

Future implementation must use an explicit application/system rule table with source/version metadata.

---

## SCREW-03 — Framing choices limited to 16 or 24 in on center

**Classification: MODIFY**

These are common framing spacings and useful choices, but allowable spacing is conditional. GA guidance explicitly states that framing spacing depends on panel thickness, panel orientation, wall/ceiling use, layer count, tested system, panel type, finish, and adhesives.

Do not label 24 in as generically valid for every panel/application.

---

## SCREW-04 — Stud-line count = floor(48 / framingSpacing) + 1

**Classification: MODIFY**

The formula can describe framing lines crossing a 48-in-wide panel in one orientation, but it assumes:

- a 48-in panel width;
- panel placement aligned to framing in a particular direction;
- no offset edge condition;
- no different orientation;
- all framing lines require the same fastening pattern.

It should be derived from actual panel orientation and framing geometry rather than hard-coded as a universal rule.

---

## SCREW-05 — Screws-per-sheet formula applies 8-in edge and 16/12-in field spacing

**Classification: REPLACE**

Because the underlying spacing rule is invalid as a universal rule, the derived per-sheet count must also be replaced.

Future model should calculate fasteners along actual supporting framing lines using the applicable sourced system spacing.

---

## SCREW-06 — `walls + ceiling` uses arithmetic average of wall and ceiling screws per sheet

**Classification: REPLACE**

An unweighted mean has no physical basis.

Future calculation must separately compute:

```text
wall fasteners + ceiling fasteners
```

from actual wall and ceiling installed panel layouts.

---

## SCREW-07 — Screw calculation synchronizes from final Sheet purchase quantity including board waste

**Classification: REPLACE**

Fasteners should correspond to installed panel layout, not spare/purchase-waste panels. Applying screw overage after using already waste-inflated panel count compounds allowances.

Future upstream contract must supply **installed/base panels or actual installed framing runs**, not purchase quantity.

---

## SCREW-08 — Add 10% screw overage for stripping/breakage

**Classification: MODIFY**

This is an estimating allowance, not an ASTM/GA fastening requirement.

If retained, make it user-configurable and clearly separate:

- required installation fasteners;
- purchasing overage;
- package rounding.

---

## SCREW-09 — Screw length choices 1-1/4, 1-5/8, 2-1/2, 3 in are selected independently of panel/substrate system

**Classification: REPLACE**

Primary manufacturer literature ties screw type/length to panel thickness, number of layers, and wood/steel framing.

For example, USG identifies 1-1/4 in Type W screws for common single-layer 3/8, 1/2, and 5/8 in panels on wood framing, while Type S products and longer screws are used for different steel/multilayer conditions.

Future calculator should derive allowable screw types/lengths from the selected construction system rather than treat length as cosmetic input.

---

## SCREW-10 — Result always labels selected screws "coarse thread"

**Classification: REMOVE**

Coarse-thread/Type W is not universal. Steel framing applications use different screw types. Output must use the selected/system-required fastener specification.

---

## SCREW-11 — 1 lb = 175 screws, 5 lb = 875, 10 lb = 1,750 for every screw length/type

**Classification: NEEDS PRODUCT DATA**

Screw count per pound changes with diameter, length, head, thread, and manufacturer. Purchasing package count must come from actual SKU/package data.

---

## SCREW-12 — Boxes = ceil(total screws / generic box-size count)

**Classification: NEEDS PRODUCT DATA**

The arithmetic is fine only after a real package quantity is known. Replace global package constants with selected product packaging.

---

# 8. Cross-calculator workflow classifications

## FLOW-01 — Sheet calculator acts as upstream geometry source

**Classification: KEEP**

This is the correct architectural direction. Geometry should be calculated once and consumed downstream.

**Implementation refinement:** separate geometry outputs from purchasing outputs.

Recommended future upstream model:

```text
geometry
├── wallSurfaceArea
├── ceilingSurfaceArea
├── finishableArea
├── panelPlacements / estimated layout
├── installedPanelCount
├── purchasePanelCount
├── flatJointFootage
├── verticalInsideAngleFootage
├── ceilingPerimeterAngleFootage
├── outsideCornerRuns
├── wallPanelAllocation
└── ceilingPanelAllocation
```

---

## FLOW-02 — Mud consumes Sheet net surface area

**Classification: KEEP**

Use finishable installed surface area, not board purchasing waste.

---

## FLOW-03 — Tape consumes Sheet field-joint footage but also manually adds ambiguous corner count

**Classification: MODIFY**

Sheet geometry should become authoritative for all derivable joint classes, including interior vertical angles and ceiling perimeter when geometry is known.

Manual inputs should exist only for geometry the Sheet model cannot represent.

---

## FLOW-04 — Screws consume Sheet purchase count

**Classification: REPLACE**

Screws must consume installed wall/ceiling layout and framing/system data, not board purchase quantity.

---

## FLOW-05 — Corner Bead is independent of Sheet geometry

**Classification: MODIFY**

Outside corners are geometric project features and should be sharable from the same project geometry model where available. Manual override remains necessary for soffits, returns, arches, nonstandard profiles, and selective bead application.

---

## FLOW-06 — Tape type and compound type are independently selectable with no compatibility enforcement

**Classification: REPLACE**

Primary USG evidence establishes a material compatibility relationship: fiberglass tape should use setting-type compound.

Future state model must validate cross-calculator product compatibility.

---

# 9. Persistence/report/workflow classifications

These are engineering rather than drywall-standard rules, but they affect trustworthy calculation behavior.

## SYS-01 — Calculator formulas execute directly inside React components

**Classification: REPLACE**

Calculation authority should move into pure, independently testable domain modules inside the frontend-owned calculator subsystem. React components should collect inputs and render outputs, not own authoritative formulas.

This does not require a backend service.

---

## SYS-02 — Per-calculator input state plus duplicate `dwCalc_state` output persistence

**Classification: MODIFY**

Adopt one versioned canonical project/input model. Derived outputs should normally be recomputed rather than persisted as a second authority unless intentionally cached with a schema/version/fingerprint.

---

## SYS-03 — Browser localStorage as calculator project persistence

**Classification: KEEP**

Acceptable for a local-only planning tool if clearly scoped as non-authoritative client storage and no sensitive commerce data is stored.

If future product requirements add authenticated project sync, that should be a separate explicit backend contract.

---

## SYS-04 — Report model formats outputs and does not recalculate quantities

**Classification: KEEP**

This is the correct authority boundary.

---

## SYS-05 — Browser Print / Save as PDF report workflow

**Classification: KEEP**

No standards issue was identified. The report should include calculation profile/source/version metadata after the calculation engine is hardened.

---

## SYS-06 — Existing generic disclaimer

**Classification: MODIFY**

Keep the planning disclaimer, but future reports should additionally identify:

- calculation mode;
- standards/manufacturer source versions;
- assumptions and user allowances;
- whether the project is treated as generic non-rated construction;
- product-specific data used;
- explicit warning that tested/listed assembly requirements override generic estimates.

---

# 10. Consolidated disposition dashboard

| Domain | KEEP | MODIFY | REPLACE | REMOVE | NEEDS PRODUCT DATA |
|---|---:|---:|---:|---:|---:|
| Sheets | 5 | 6 | 3 | 2 | 0 |
| Joint Compound | 2 | 3 | 2 | 3 | 3 |
| Tape | 4 | 3 | 0 | 1 | 2 |
| Corner Bead | 1 | 1 | 3 | 0 | 4 |
| Screws | 0 | 4 | 5 | 1 | 2 |
| Cross-calculator | 2 | 2 | 2 | 0 | 0 |
| System/report | 3 | 2 | 1 | 0 | 0 |

The exact counts are less important than the pattern: **geometry and authority boundaries are generally reusable; hard-coded material consumption and generic installation constants require substantial correction.**

---

# 11. Required implementation architecture before formula changes

The research indicates that simply editing constants inside the current JSX components would repeat the same architectural problem.

The simplest complete target is:

```text
frontend/src/components/calculators/
    UI components
        |
        v
frontend/src/lib/calculators/ (or equivalent existing project convention)
    project schema
    geometry engine
    board takeoff engine
    joint/tape engine
    finish requirement engine
    fastener engine
    accessory/bead engine
    packaging engine
    source metadata
        |
        v
    deterministic calculated result model
        |
        +--> CalculatorHub/Summary
        +--> report model
        +--> tests
```

## Required invariants

1. **One geometry authority.**
2. **Installed quantities and purchase quantities are separate fields.**
3. **Waste/overage is never silently compounded across calculators.**
4. **Standards requirements and estimating allowances are separate concepts.**
5. **Manufacturer/package values are data, not universal constants.**
6. **Rated/listed assemblies can override generic rules.**
7. **Every rule exposed as standards-derived has a source ID and edition.**
8. **Reports consume results and never reimplement formulas.**
9. **All formulas are pure and regression-testable outside React.**
10. **Cross-calculator compatibility is validated centrally.**

---

# 12. Proposed implementation phases

No implementation changes should precede this ordering.

## Phase A — Calculation kernel and schemas

Create versioned input/result schemas and pure calculation modules without changing the public UI.

Add fixture-based tests for current behavior first, then standards-correct fixtures for replacement behavior.

## Phase B — Sheet geometry correctness

Implement:

- explicit panel width/length;
- installed vs purchase quantities;
- wall/ceiling allocation;
- framing direction inputs;
- source-qualified orientation validation;
- proper joint classification;
- removal of dynamic seam waste.

## Phase C — Tape and interior-angle model

Implement:

- layout-derived flat joints;
- vertical inside angles;
- ceiling perimeter angles;
- USG 0.37 fallback as a documented manufacturer estimate;
- removal of mesh 15% multiplier;
- user-configurable waste allowance;
- tape/compound compatibility validation.

## Phase D — Fastener system model

Implement explicit construction profiles instead of generic 8/16/12 rules.

At minimum distinguish:

- wood vs steel;
- wall vs ceiling;
- panel thickness;
- layer count;
- framing spacing;
- orientation;
- generic non-rated vs specified tested/listed assembly.

Use installed layout rather than purchase sheets.

## Phase E — Compound/product coverage model

Remove the finish-level gallon constants.

Introduce product/coverage profiles with:

- manufacturer;
- product;
- compound class;
- package size;
- manufacturer coverage basis;
- applicable finishing phase;
- source document/version.

Model Level 5 skim separately from joint-finishing consumption.

## Phase F — Corner bead/run optimization

Implement:

- per-run straight lengths;
- correct arch geometry;
- selected product/profile;
- actual stock lengths;
- per-run cut allocation/offcut reuse;
- product-specific installation notes.

## Phase G — UI/report provenance

Expose concise source/assumption metadata without turning the customer calculator into a specification manual.

Report should state the standards/profile basis and all purchasing allowances.

---

# 13. High-priority defects to correct first

These are the current rules with the greatest combination of incorrect attribution and quantity impact:

1. **REMOVE** Sheet dynamic waste heuristic.
2. **REPLACE** generic Screw 8-in edge / 16-in wall / 12-in ceiling model.
3. **REPLACE** Screw `walls + ceiling` arithmetic average.
4. **REPLACE** Screw synchronization from waste-inflated purchase panel count.
5. **REMOVE** Tape 15% mesh multiplier.
6. **MODIFY** Tape fallback from 0.38 to source-qualified USG 0.37 lf/sq ft.
7. **REPLACE** ambiguous Tape inside-corner / wall-to-ceiling formula.
8. **NEEDS PRODUCT DATA** Compound gallons-per-finish-level table.
9. **REMOVE** Compound 40/35/25 coat-volume split and Level-5 29% claim.
10. **REPLACE** Corner-bead arch formula that conflates radius and rise.
11. **REPLACE** aggregate corner-bead stock division with per-run allocation.
12. **REMOVE** GA/ASTM attribution from 21-sq-ft door and 15-sq-ft window defaults.

---

# 14. Research limitations and confidence

## High confidence

The following conclusions are directly supported by current standards publishers or primary manufacturer literature:

- GA-216-2024 is the current Gypsum Association application/finishing publication.
- ASTM C840-25 is the active ASTM version shown in ASTM's catalog.
- GA-214-2021 is the current GA Levels of Finish publication identified by GA.
- horizontal and vertical panel application are both recognized subject to system requirements;
- 370 ft/1,000 sq ft is a USG published tape estimating/coverage factor;
- USG lists the same approximate coverage for paper and fiberglass tape;
- USG recommends setting-type compound with fiberglass tape;
- compound coverage is product/type dependent;
- corner-bead attachment methods differ by product/manufacturer;
- fastener requirements vary with application/system and cannot be reduced to one generic universal rule;
- tested/listed fire/sound assemblies must be respected.

## Deliberate limitation

Full current ASTM C840-25 normative text is a paid standard and was not reproduced or inferred beyond material made publicly available by ASTM. Numeric installation rules in this document therefore rely on publicly accessible primary manufacturer instructions and GA public materials where appropriate.

Before DTB markets a calculator as **ASTM C840-25 compliant**, the implementation review should be checked against a licensed copy of the current standard and any applicable tested/listed assemblies.

That limitation does **not** justify retaining the present unsupported ASTM attribution. The correct interim behavior is to remove false precision and source claims until the applicable rule is explicitly verified.

---

# 15. Decision

The existing Calculator Hub should **not** be patched by changing a handful of constants.

The research supports retaining:

- the frontend-owned calculator subsystem;
- the Sheet-first geometry dependency direction;
- local planning-state persistence;
- summary/report presentation separation;
- basic geometric area arithmetic;
- GA Level 0-5 selection;
- paper/mesh compatibility concepts;
- user-configurable purchasing allowances when clearly identified as allowances.

It does **not** support retaining the current system of standards-labeled heuristics embedded directly in JSX.

The implementation phase should proceed from a source-qualified, deterministic calculation kernel with explicit project geometry, system/application profiles, product coverage data, package data, and separate installed-vs-purchase quantities.

No calculator result should claim ASTM, GA, manufacturer, or "industry-standard" authority unless the exact rule can identify the applicable source, edition, scope, and assumptions.