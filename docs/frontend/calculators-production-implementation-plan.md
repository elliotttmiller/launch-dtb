# Drywall Toolbox Calculators — Production Revision and Implementation Plan

**Status:** Approved implementation blueprint / pre-code execution plan  
**Date:** 2026-09-03  
**Repository:** `elliotttmiller/launch-dtb`  
**Owning module:** `frontend/`  
**Current-state baseline:** `docs/frontend/calculators-current-architecture-audit.md`  
**Standards disposition baseline:** `docs/frontend/calculators-primary-source-validation.md`  
**Implementation source of truth:** active files under `frontend/src/components/calculators/`

---

# 1. Purpose

This document defines the end-to-end implementation plan for rebuilding the Drywall Toolbox Calculator Hub into a production-ready, professionally structured drywall estimating engine whose logic, terminology, UI, workflow, persistence, reports, and source claims are truthful, testable, maintainable, and explicitly bounded by the standards and product data that actually govern each rule.

The objective is **not** to make the calculator merely look more polished. The implementation must correct calculation authority, eliminate unsupported standards claims, separate installed quantities from purchasing allowances, normalize project geometry, centralize cross-calculator contracts, make manufacturer-specific consumption values data-driven, and redesign every calculator tab around a coherent contractor estimating workflow.

The final system must be able to answer, for every material result:

1. What project input produced this result?
2. What calculation rule was used?
3. Is that rule geometry, a standards requirement, a manufacturer/product value, or a user-selected estimating allowance?
4. What source/version governs it?
5. What assumptions or exclusions remain?
6. Can the same inputs reproduce the same result deterministically?
7. Can the result be regression-tested independently of React?
8. Is the displayed purchase quantity distinct from the installed/base requirement?

---

# 2. Governing design principles

## 2.1 One calculation authority

React components must no longer contain authoritative drywall formulas.

The calculation authority will be a pure domain package under:

```text
frontend/src/domain/calculators/
```

UI components will collect validated inputs and render domain outputs. The report will consume canonical outputs. No report, tab, summary card, or persistence adapter may independently recalculate a material quantity.

## 2.2 Standards are not estimating-factor tables

GA-216 / ASTM C840 rules must be represented as installation/application constraints only where the researched source supports them.

User or DTB purchasing allowances such as waste/overage must be represented as estimating allowances.

Manufacturer consumption or package data must be represented as manufacturer/product data.

The UI must never label an estimator heuristic as “ASTM,” “GA,” or “industry standard.”

## 2.3 Installed requirement and purchase quantity are separate concepts

Every applicable material must expose two stages:

```text
required / installed quantity
        ↓
user or product purchasing allowance
        ↓
purchase quantity
        ↓
package rounding
```

Examples:

```text
installedPanelCount
purchasePanelCount

requiredTapeLinearFt
purchaseTapeLinearFt
purchaseTapeRolls

requiredFasteners
purchaseFasteners
purchaseFastenerPackages

requiredCompoundVolume
purchaseCompoundVolume
purchaseCompoundPackages
```

A downstream calculator must consume the correct installed/project geometry quantity, never another calculator's already-inflated purchase quantity unless the downstream material itself genuinely depends on purchased units.

## 2.4 Project geometry is authoritative and reusable

A single normalized project geometry model will own walls, openings, ceiling dimensions, framing context, and corner/angle geometry.

Individual calculators must not maintain competing geometry interpretations.

## 2.5 Product-specific values are data

The following must not remain generic constants when they materially vary by product:

- joint compound coverage;
- compound package volume/weight;
- tape roll length;
- tape/compound compatibility;
- screw type and length applicability;
- screws per package;
- corner bead stock lengths;
- corner bead installation/attachment constraints.

Initially, DTB may ship a small curated product/reference registry based only on verified primary manufacturer sources. Unsupported combinations must fall back to a clearly labeled generic/manual mode rather than inventing data.

## 2.6 Generic estimates are not installation specifications

The calculator must explicitly distinguish:

- generic non-rated estimating mode;
- known product/system mode;
- tested/listed assembly requirements.

It must not claim that generic calculations satisfy a fire-rated, sound-rated, shear, shaftwall, tile-backup, specialty-panel, or proprietary assembly.

## 2.7 Version every durable calculation contract

Project schema, calculation result schema, rule registry, product data registry, and standards-source registry must all carry explicit versions.

## 2.8 Determinism before optimization

Every calculator result must be reproducible from serialized project input + registry version. UI state must not affect result math.

---

# 3. Target architecture

## 3.1 Runtime architecture

```text
/calculators
    ↓
CalculatorHub UI
    ↓
CalculatorProjectProvider / reducer
    ↓
Validated CalculatorProject schema
    ↓
calculateProject(project, registries)
    ↓
┌──────────────────────────────────────┐
│ Pure Calculator Domain Kernel        │
│                                      │
│ geometry                             │
│ board takeoff                        │
│ joints / tape                        │
│ finishing / compound                 │
│ fasteners                            │
│ corner bead                          │
│ purchase/package conversion          │
│ compatibility validation             │
│ source metadata                      │
└──────────────────────────────────────┘
    ↓
Canonical CalculatorResult
    ├── Sheets tab
    ├── Compound tab
    ├── Tape tab
    ├── Corner Bead tab
    ├── Fasteners tab
    ├── Project Summary
    └── Report / print
```

No server dependency is required for the first production revision. Calculator ownership remains in `frontend/`.

## 3.2 Target source structure

```text
frontend/src/domain/calculators/
├── index.js
├── projectSchema.js
├── resultSchema.js
├── normalizeProject.js
├── calculateProject.js
├── constants/
│   ├── calculatorVersions.js
│   └── units.js
├── geometry/
│   ├── calculateAreas.js
│   ├── calculateOpenings.js
│   ├── calculateAngles.js
│   ├── calculateArches.js
│   └── geometryValidation.js
├── sheets/
│   ├── calculateSheetLayout.js
│   ├── calculateSheetPurchase.js
│   ├── panelCompatibility.js
│   └── sheetTypes.js
├── tape/
│   ├── calculateTapeRequirement.js
│   ├── calculateTapePurchase.js
│   └── tapeCompatibility.js
├── compound/
│   ├── calculateCompoundRequirement.js
│   ├── calculateCompoundPurchase.js
│   ├── finishLevels.js
│   └── compoundCompatibility.js
├── fasteners/
│   ├── calculateFasteners.js
│   ├── calculateFastenerPurchase.js
│   ├── fastenerRules.js
│   └── fastenerCompatibility.js
├── bead/
│   ├── calculateBeadRuns.js
│   ├── optimizeBeadStock.js
│   ├── calculateArchLength.js
│   └── beadCompatibility.js
├── registry/
│   ├── standardsRegistry.js
│   ├── productsRegistry.js
│   └── estimatingDefaults.js
└── validation/
    ├── validateProject.js
    ├── validateCompatibility.js
    └── validationCodes.js
```

UI components remain under:

```text
frontend/src/components/calculators/
```

but are refactored into presentation/workflow components rather than formula owners.

Recommended UI structure:

```text
frontend/src/components/calculators/
├── CalculatorHub.jsx
├── CalculatorProjectProvider.jsx
├── tabs/
│   ├── ProjectSetupTab.jsx
│   ├── SheetsTab.jsx
│   ├── CompoundTab.jsx
│   ├── TapeTab.jsx
│   ├── CornerBeadTab.jsx
│   ├── FastenersTab.jsx
│   └── SummaryTab.jsx
├── project/
│   ├── RoomGeometryEditor.jsx
│   ├── WallEditor.jsx
│   ├── OpeningEditor.jsx
│   ├── CeilingEditor.jsx
│   ├── FramingEditor.jsx
│   └── AssemblyScopeNotice.jsx
├── shared/
│   ├── CalculatorSection.jsx
│   ├── CalculatorField.jsx
│   ├── CalculatorSelect.jsx
│   ├── QuantityResult.jsx
│   ├── MaterialBreakdown.jsx
│   ├── SourceBadge.jsx
│   ├── AssumptionNotice.jsx
│   ├── CompatibilityNotice.jsx
│   └── PurchasingAllowance.jsx
└── report/
    ├── CalculatorReport.jsx
    ├── calculatorReportModel.js
    └── calculator-report.css
```

Exact final file names may be adjusted to existing repository conventions during implementation, but the ownership boundaries must remain.

---

# 4. Canonical project model

The current individual-tab state model must be replaced with a single canonical project input contract.

Conceptual schema:

```text
CalculatorProject
├── schemaVersion
├── project
│   ├── jobName
│   ├── jobAddress
│   ├── contractorName
│   ├── estimatorName
│   └── notes
├── scope
│   ├── mode                 generic | product-aware | assembly-aware
│   ├── ratedAssembly        false | reference
│   └── assumptionsAcknowledged
├── geometry
│   ├── walls[]
│   │   ├── id
│   │   ├── lengthFt
│   │   ├── heightFt
│   │   ├── framing
│   │   │   ├── material     wood | steel | unknown
│   │   │   ├── spacingIn
│   │   │   └── direction
│   │   └── openings[]
│   │       ├── id
│   │       ├── type
│   │       ├── widthFt
│   │       ├── heightFt
│   │       └── position?    future advanced layout
│   ├── ceiling
│   │   ├── included
│   │   ├── lengthFt
│   │   ├── widthFt
│   │   ├── joistSpacingIn
│   │   ├── joistDirection
│   │   └── framingMaterial
│   ├── insideAngles[]
│   └── outsideCorners[]
│       ├── type             straight | semicircle | circular-segment | measured
│       └── geometry
├── board
│   ├── panelId | genericPanel
│   ├── widthIn
│   ├── lengthIn
│   ├── thicknessIn
│   ├── layerCount
│   ├── wallOrientation
│   └── ceilingOrientation
├── finish
│   ├── level
│   ├── compoundProductId
│   ├── tapeProductId
│   └── skimProductId
├── bead
│   ├── productId
│   └── customMeasuredRuns[]
├── fasteners
│   ├── productId
│   └── attachmentMethod
└── allowances
    ├── panelWastePct
    ├── tapeWastePct
    ├── fastenerOveragePct
    ├── beadWastePct
    └── compoundReservePct
```

Not every input must appear in the UI at once. Progressive disclosure will keep the workflow usable while preserving a complete domain contract.

---

# 5. Canonical result model

The result object must preserve provenance and separate base/purchase quantities.

Conceptual structure:

```text
CalculatorResult
├── schemaVersion
├── engineVersion
├── registryVersion
├── generatedAt
├── validity
│   ├── status          valid | warning | blocked
│   ├── warnings[]
│   └── errors[]
├── geometry
│   ├── grossWallSqFt
│   ├── ceilingSqFt
│   ├── openingSqFt
│   ├── finishableSqFt
│   ├── fieldJointLinearFt
│   ├── insideAngleLinearFt
│   └── outsideCornerRuns[]
├── sheets
│   ├── installedPanels
│   ├── purchasePanels
│   ├── purchaseAllowancePct
│   ├── layoutMode
│   ├── wallLayouts[]
│   ├── ceilingLayout
│   └── assumptions[]
├── tape
│   ├── fieldJointFt
│   ├── insideAngleFt
│   ├── requiredLinearFt
│   ├── purchaseLinearFt
│   ├── rolls
│   └── source
├── compound
│   ├── finishLevel
│   ├── requirementBasis
│   ├── requiredVolume
│   ├── purchaseVolume
│   ├── packages
│   └── productSource
├── bead
│   ├── requiredRuns[]
│   ├── requiredLinearFt
│   ├── stockPlan[]
│   ├── stockPieces
│   └── productSource
├── fasteners
│   ├── requiredFasteners
│   ├── purchaseFasteners
│   ├── packages
│   ├── ruleProfile
│   └── source
└── provenance[]
    ├── ruleId
    ├── authorityType
    ├── authority
    ├── edition
    ├── reference
    └── note
```

The report mapper may format this result, but must not modify it.

---

# 6. Standards and product source registry

Create a structured rule provenance registry rather than leaving source claims in comments.

Example conceptual record:

```text
ruleId: TAPE-GENERIC-COVERAGE-USG-001
authorityType: manufacturer-estimating
authority: USG
publication: Sheetrock Paper Joint Tape J1736
value: 370
unit: linear-ft-per-1000-sq-ft
verifiedDate: 2026-09-03
appliesTo: [paper-tape]
```

Standards records must not contain copyrighted normative text. Store metadata, rule identifiers, concise internal descriptions, edition, and the implementation consequence.

The registry should distinguish:

```text
standard-requirement
manufacturer-installation
manufacturer-estimating
product-data
geometry
user-allowance
DTB-default
```

The UI/report can then truthfully display labels such as:

- “Geometry-derived”
- “USG estimating factor”
- “GA Level 4 finish specification”
- “User allowance: 10%”
- “Product package size”

---

# 7. Project Setup workflow

A production calculator should not begin with material-specific tabs before the shared geometry is known.

Add a first workflow step/tab: **Project Setup**.

## 7.1 Project Setup UI

Sections:

### Project information

Optional project/report metadata.

### Room / wall geometry

Allow:

- rectangular room quick-start;
- individual wall mode;
- add/remove walls;
- per-wall height where required;
- editable opening dimensions.

### Openings

Replace count-only door/window deductions with actual dimensions.

Fast entry UX:

```text
Door 1     3' 0" × 7' 0"
Window 1   3' 0" × 5' 0"
```

Users can duplicate openings for repeated sizes.

### Ceiling

Collect:

- include ceiling;
- length and width;
- joist direction;
- joist spacing;
- framing material where required.

### Framing / system context

Minimum generic inputs:

- wood / steel / unknown;
- 16 in / 24 in / custom spacing;
- wall vs ceiling framing context.

### Scope selector

A restrained notice should establish:

```text
Generic material estimate
```

with an explicit warning that fire-rated, sound-rated, specialty, or listed assemblies require their specified system requirements.

Do not overwhelm normal users with code language. Place technical detail in expandable “Why this matters” disclosure.

## 7.2 Project Setup validation

Block calculation only for structurally invalid input:

- missing required dimensions;
- zero/negative dimensions;
- opening area greater than wall area when the opening is assigned to a wall;
- impossible arch geometry;
- unsupported orientation/system combination when enough data exists to know it is invalid.

Warnings, rather than blocks, should cover:

- unknown framing material;
- unknown assembly profile;
- generic product selection;
- user-entered allowances outside a normal estimating range.

---

# 8. Sheets tab redesign

## 8.1 Calculation logic

Implement in two stages.

### Phase A production baseline

Support a deterministic rectangular layout model using explicit dimensions and permitted orientations.

Per wall, calculate:

- gross wall area;
- opening area;
- net finishable area;
- panel grid by selected orientation;
- base installed panel count;
- layout-estimated field joint footage.

Do **not** claim advanced cut optimization.

### Phase B advanced layout

Only after baseline correctness is stable, add:

- opening position;
- joint avoidance around opening corners;
- reusable offcut inventory;
- staggered end-joint optimization;
- cut plan / panel placement visualization.

Do not delay the production baseline waiting for a full nesting optimizer.

## 8.2 Ceiling layout

Replace hard-coded orientation with explicit ceiling joist direction and permitted panel orientation.

If both orientations are permitted, the engine may compare them and offer:

```text
Recommended layout: perpendicular to joists
Reason: permitted configuration and lower joint footage
```

The engine must never optimize into an orientation that is prohibited by the selected/system profile.

## 8.3 Waste

Remove dynamic seam-based waste completely.

Use:

```text
Installed panels: N
Purchasing allowance: X%
Purchase quantity: ceil(N × (1 + X))
```

Default allowance should be described as a **DTB estimating default**, not “industry standard.”

Recommended production UI:

```text
Purchasing allowance
[ 0% ] [ 5% ] [ 10% ] [ Custom ]

DTB default: 10%
Adjust for cut complexity, handling damage, and field conditions.
```

The standards-validation document does not support declaring 10% mandatory or universal.

## 8.4 Sheet results UI

Primary hierarchy:

```text
Purchase quantity        28 sheets
Installed layout         25 sheets
Allowance                +10% → +3 sheets
```

Secondary breakdown:

- walls;
- ceiling;
- gross area;
- openings;
- finishable area;
- estimated joint footage;
- selected panel dimensions;
- orientation.

Add a compact “Calculation basis” disclosure rather than embedding standards claims into the result card.

---

# 9. Joint Compound tab redesign

## 9.1 Separate finish specification from product consumption

The tab must have two distinct conceptual sections:

```text
Finish specification
        ↓
Material product / coverage
```

GA finish level tells the user **what finish is required**; the selected manufacturer/product tells the engine **how much material is estimated**.

## 9.2 Finish level model

Keep Levels 0–5 but replace one scalar `coatCount` with semantic requirements.

Conceptual output:

```text
Level 4
- joint tape embedded
- additional joint coats as required by finish definition
- interior angle treatment
- fastener/accessory treatment
- no full-surface skim coat
```

Level 5:

```text
Level 4 requirements
+ full-surface skim coat
```

Do not manufacture an artificial universal “3 coats” or “4 coats” scalar where the finish definition is surface-specific.

## 9.3 Product/coverage registry

Start with curated primary-source records only.

Each product record should expose:

```text
id
manufacturer
name
compoundClass
packageSize
coverageBasis
coverageValue
compatibleTapeClasses
source
```

If a user selects “Generic / enter coverage manually,” require an explicit coverage value and label it user-supplied.

## 9.4 Coverage workflow

Recommended calculation flow:

```text
finishable area
+ applicable joint/skim requirement
+ selected product coverage basis
= required compound

required compound
+ user reserve allowance
= purchase volume

purchase volume / package volume
= packages to buy
```

Do not retain the unsupported 40/35/25 allocation.

## 9.5 Level 5

Model the skim coat separately from joint treatment.

If the selected product does not provide a verified skim-coat coverage basis, mark Level 5 quantity as:

```text
Needs product coverage data
```

rather than silently extrapolating a percentage increase.

## 9.6 Compound UX

Top section:

```text
Finish level
Level 4 — standard painted finish
```

Then:

```text
Joint compound
USG Sheetrock Total All Purpose
Coverage source: manufacturer technical data
```

Result:

```text
Required volume       8.4 gal
Reserve allowance     5%
Purchase volume       8.8 gal
Packages              2 × 4.5/5-gal pails
```

Add compatibility warnings inline, not as generic informational cards.

---

# 10. Tape tab redesign

## 10.1 Geometry authority

Tape must consume project geometry and sheet-layout results.

Separate:

```text
field joints
inside wall-to-wall angles
wall-to-ceiling angles
other measured joints
```

Do not use one `insideCorners × height` number for both vertical and ceiling angles.

## 10.2 Manual fallback

If the Sheet/geometry workflow is incomplete, allow a manual estimating mode based on the researched manufacturer factor:

```text
370 lf / 1,000 sq ft
```

The UI must label this:

```text
Manufacturer estimating fallback
```

not “ASTM formula.”

## 10.3 Tape type compatibility

Remove the mesh 15% multiplier.

Implement compatibility validation:

```text
paper + drying compound       valid
paper + setting compound      valid
fiberglass + setting compound valid
fiberglass + drying compound  warning/blocked according to selected product guidance
```

Compatibility must be product-aware when product data exists.

## 10.4 Waste

Retain configurable tape purchasing allowance only as an estimator allowance.

Default may be 5% as a DTB default if product intent accepts it, but must not be described as ASTM-mandated.

## 10.5 Tape result UX

```text
Tape required          342 lf
Field joints           218 lf
Inside angles          124 lf
Allowance              +5% = 359 lf
Purchase               2 × 250-ft rolls
```

Show the package selection separately from geometric requirement.

---

# 11. Corner Bead tab redesign

## 11.1 Geometry model

Represent each outside corner as a run.

Straight run:

```text
length = wall/corner height
```

Curved runs must explicitly identify geometry.

Supported production forms:

```text
Straight
Semicircle
Circular segment
Measured length
```

### Semicircle

Collect span or radius and derive arc length correctly.

### Circular segment

Collect chord/span + rise and calculate radius/central angle before arc length.

### Measured

Allow field-measured linear footage as the authoritative input for irregular geometry.

Remove the ambiguous `arch radius / rise` field.

## 11.2 Stock optimization

Replace:

```text
ceil(total footage / stock length)
```

with a run allocation algorithm.

The baseline stock optimizer should:

1. sort required runs descending;
2. allocate each run to available stock;
3. retain usable offcuts;
4. reuse offcuts only when a splice is permitted by the selected product/workflow;
5. return stock pieces + waste/offcuts.

This is a bounded bin-packing/cut-stock problem and can remain deterministic.

## 11.3 Product-specific bead data

Bead product records should define:

```text
profile
material
available stock lengths
curvable
splice policy
attachment method / source metadata
```

Do not attempt to turn the calculator into an installation-instruction replacement. Attachment information should be contextual guidance sourced from the selected product.

## 11.4 Bead result UX

```text
Required runs          6
Required length        52.0 ft
Stock plan             6 × 10-ft pieces
Estimated offcut       8.0 ft
```

Expandable run plan:

```text
Corner 1   9.0 ft → Piece 1
Corner 2   9.0 ft → Piece 2
...
```

---

# 12. Fasteners tab redesign

This is the most significant domain replacement.

## 12.1 Required inputs

At minimum:

```text
framing material        wood | steel
wall / ceiling
framing spacing
panel thickness
panel dimensions
layer count
panel orientation
attachment method
assembly scope
```

Screw type and length must be derived/validated from these inputs, not treated as a cosmetic selection.

## 12.2 Rule profiles

Create explicit fastener rule profiles in the registry.

A profile should include:

```text
profileId
scope
generic/rated status
framing material
panel constraints
layer constraints
wall/ceiling constraints
spacing requirements
fastener class
minimum length / penetration rule where source-supported
source metadata
```

If DTB cannot resolve a compatible profile from verified data, the calculator should not pretend it can provide an installation-specification count.

Fallback behavior:

```text
Material estimate unavailable for this configuration.
Select a supported generic system or enter a verified assembly profile.
```

## 12.3 Geometry-based fastener count

Once a supported rule profile exists, count fasteners from actual installed panel/framing intersections and spacing, rather than a universal average per sheet.

The count must use **installed/base panels**, not waste-adjusted purchased panels.

Then:

```text
requiredFasteners
+ user overage allowance
= purchaseFasteners
```

## 12.4 Remove wall/ceiling averaging

For combined jobs, calculate wall panels under wall rules and ceiling panels under ceiling rules independently, then sum.

Never use:

```text
(wallPerSheet + ceilingPerSheet) / 2
```

## 12.5 Packaging

Fastener package quantities must be product/package data.

Do not assume 175 screws/lb across every screw length/type.

A generic/manual packaging mode may accept:

```text
package count supplied by user
```

but must not invent a universal count.

## 12.6 Fastener UX

Primary result:

```text
Required fasteners       1,420
Purchasing allowance     +10%
Purchase quantity        1,562
Packages                 2 × 1,000-count boxes
```

Specification block:

```text
Rule profile
Generic single-layer gypsum board on wood framing

Fastener
1-1/4 in Type W screw

Basis
wall panels + ceiling panels calculated separately
```

If selected inputs create incompatibility, show one clear blocking message directly above the result.

---

# 13. Summary tab redesign

The Summary should function as a contractor material takeoff, not a loose collection of calculator cards.

## 13.1 Summary hierarchy

### Project scope

- job name;
- dimensions/scope;
- board/system assumptions;
- finish level.

### Purchase list

A single clean table:

| Material | Specification | Required | Allowance | Purchase |
|---|---|---:|---:|---:|
| Drywall panels | 4×12 | 25 | 10% | 28 sheets |
| Tape | paper, 250-ft | 342 lf | 5% | 2 rolls |
| Compound | selected product | 8.4 gal | 5% | 2 pails |
| Corner bead | selected profile | 52 ft | cut plan | 6 pieces |
| Screws | selected compatible product | 1,420 | 10% | 2 boxes |

### Assumptions and warnings

Show only active assumptions/warnings, grouped by severity.

### Calculation provenance

Provide a concise expandable source section rather than displaying standard names throughout the primary workflow.

## 13.2 No duplicate calculation

The Summary must consume `CalculatorResult` only.

---

# 14. Report / PDF workflow

The existing browser print architecture is fundamentally acceptable and should remain unless a future business requirement demands server-generated immutable reports.

## 14.1 Preserve

- browser-local generation;
- dedicated report model;
- print-only root;
- Letter-size layout;
- Save as PDF through browser print.

## 14.2 Refine report model

Report should include:

```text
Report header
Project scope
Material purchase summary
Detailed calculation sections
Assumptions / exclusions
Source/provenance appendix
Generated date
Calculator engine version
Project schema version
```

## 14.3 Standards wording

Never say:

```text
ASTM compliant quantity
```

unless the implementation has a verified applicable rule profile and sufficient input to make that claim.

Use specific language:

```text
Finish level: GA-214 Level 4
Fastener profile source: [verified source metadata]
Tape fallback: USG estimating factor
Purchasing allowance: user-selected 5%
```

---

# 15. UI/UX design system for all tabs

## 15.1 Overall calculator layout

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Calculator progress / compact tab navigation                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Input / configuration                   Live result summary │
│  60–65% width                            35–40% width         │
│                                                              │
│  grouped sections                        sticky on desktop    │
│                                          normal flow mobile   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Mobile:

```text
progress tabs
input sections
primary result
breakdown
assumptions / source
```

Do not duplicate separate mobile and desktop business logic.

## 15.2 Navigation

Replace the current generic pill-tab row with a clearer step/navigation treatment.

Recommended order:

```text
Project
Sheets
Compound
Tape
Bead
Fasteners
Summary
```

Each tab can show status:

```text
complete
warning
needs input
```

Avoid decorative gradients and oversized cards.

## 15.3 Input controls

Use consistent input primitives:

- label;
- unit suffix;
- helper text only when useful;
- inline validation;
- semantic fieldset/legend for grouped options;
- keyboard accessible selectors;
- no hover-only controls.

For feet/inches measurements, introduce a dedicated measurement input abstraction instead of forcing users to mentally convert every value into decimal feet.

## 15.4 Result cards

Primary result card must communicate:

```text
what to buy
what was required
what allowance was added
```

Avoid showing four equal-weight cards when one result is clearly the purchasing decision.

## 15.5 Source display

Introduce restrained source/provenance badges:

```text
Geometry-derived
Manufacturer data
GA finish specification
User allowance
```

Click/expand reveals exact source metadata.

Do not visually overload normal users with citations.

## 15.6 Warnings

Three classes:

```text
BLOCKING
Cannot produce a defensible result.

WARNING
Result is available but important assumptions remain.

INFO
Context that does not affect validity.
```

Avoid generic blue/yellow informational boxes scattered throughout every tab.

## 15.7 Accessibility

Mandatory:

- semantic headings;
- `<fieldset>` / `<legend>` where applicable;
- `aria-live` for changed result values without excessive announcements;
- visible focus states;
- all destructive/remove actions keyboard accessible;
- minimum practical touch targets;
- no information conveyed by color alone;
- modal focus containment/restoration for report preview;
- reduced-motion support;
- validation associated with its field using accessible descriptions.

---

# 16. State and persistence redesign

## 16.1 Remove duplicated durable state authority

Current per-tab keys plus `dwCalc_state.summaryData` create duplicated persistence.

Replace with one versioned project record:

```text
dtbCalculatorProject:v3
```

Optional UI-only preferences may remain separate:

```text
dtbCalculatorUi:v1
```

Presets:

```text
dtbCalculatorPresets:v2
```

Do not persist calculated outputs as a second authority. Recalculate outputs deterministically from the project input record on load.

## 16.2 Migration

Create a one-time importer for current keys:

```text
dwCalc_state
dwCalc_sheet
dwCalc_mud
dwCalc_tape
dwCalc_bead
dwCalc_screws
dwCalc_presets
```

Migration must:

1. parse defensively;
2. validate value ranges;
3. map only fields with an unambiguous meaning;
4. discard unsupported calculated output state;
5. preserve project metadata where possible;
6. mark migrated assumptions that need confirmation;
7. write v3 only after successful normalization;
8. remain idempotent.

Old keys can be retained for one release for rollback compatibility, then removed in a later cleanup release.

---

# 17. Validation strategy

## 17.1 Input validation

Domain validation runs before calculation.

Do not rely on HTML `min/max` as calculation protection.

Reject/normalize:

- `NaN`;
- infinities;
- negative dimensions;
- zero dimensions where invalid;
- invalid percentages;
- unknown enum values;
- malformed localStorage payloads;
- incompatible product/system combinations.

## 17.2 Runtime validation

Every public calculation entry point should return a structured validity object rather than throwing for ordinary invalid user input.

Programming/configuration errors may still throw in development/test environments.

---

# 18. Automated test architecture

The current frontend already uses Node's built-in test runner for at least one contract test. The calculator domain should initially use the same dependency-light approach rather than introducing a new test framework solely for this work.

Add:

```text
frontend/tests/calculators/
├── projectSchema.test.mjs
├── geometry.test.mjs
├── sheets.test.mjs
├── tape.test.mjs
├── compound.test.mjs
├── bead.test.mjs
├── fasteners.test.mjs
├── compatibility.test.mjs
├── migration.test.mjs
└── reportModel.test.mjs
```

Add package script:

```text
npm run test:calculators
```

## 18.1 Golden scenarios

Create deterministic fixtures for:

- 12×14 room, 9-ft walls;
- no openings;
- repeated 3×7 doors;
- windows with actual dimensions;
- ceiling on/off;
- 4×8 / 4×10 / 4×12 panels;
- horizontal/vertical orientations where supported;
- 16/24-in framing;
- wood vs steel generic profiles;
- wall-only / ceiling-only / combined jobs;
- Levels 0–5;
- paper vs fiberglass tape compatibility;
- straight bead runs;
- semicircular arch;
- circular-segment arch;
- stock-piece offcut reuse;
- malformed legacy state.

## 18.2 Rule regression tests

Every researched rule that enters the engine must receive:

```text
rule ID
source metadata
fixture
expected result
boundary cases
```

## 18.3 Property/invariant tests

Even without a dedicated property-testing dependency, write loops/fixtures that assert:

- purchase quantity never less than required quantity when allowance >= 0;
- increasing opening area never increases finishable area;
- disabling ceiling never increases ceiling material;
- adding tape waste never decreases purchase tape;
- package count is integer and sufficient for purchase requirement;
- changing report formatting does not change calculator result;
- same normalized project always returns the same result.

---

# 19. Implementation phases

## Phase 0 — Freeze and baseline

Before changing formulas:

1. capture current calculator screenshots at desktop/mobile breakpoints;
2. record representative current results for regression comparison only;
3. confirm current build/lint status;
4. create calculator-specific Node test script;
5. do not use current outputs as correctness expectations when research says they are wrong.

**Exit gate:** current behavior is reproducible enough to identify intentional breaking changes.

## Phase 1 — Domain foundation

Implement:

- project schema;
- result schema;
- normalizer;
- validation codes;
- rule/source registry;
- product registry shape;
- version constants;
- `calculateProject()` orchestration shell.

No UI redesign yet.

**Exit gate:** pure domain API can accept/validate a project and return a stable result envelope.

## Phase 2 — Geometry authority

Implement:

- walls;
- openings with actual dimensions;
- ceiling;
- inside angles;
- outside corner runs;
- framing context.

Replace count-only opening deduction authority.

**Exit gate:** one normalized geometry result feeds all material calculators.

## Phase 3 — Sheets engine

Implement corrected sheet layout, installed/purchase separation, ceiling framing direction, explicit user waste.

Delete dynamic waste heuristic.

**Exit gate:** Sheets no longer depends on component formulas and has comprehensive tests.

## Phase 4 — Tape engine

Implement geometry-derived joints/angles, 0.37 fallback, remove mesh multiplier, compatibility validation, user allowance, product roll data.

**Exit gate:** tape results distinguish requirement/purchase/package and pass researched source fixtures.

## Phase 5 — Compound engine

Implement finish-level semantics, product coverage registry, package data, Level 5 separate skim requirement, compatibility.

Remove unsupported universal coverage and coat-split constants.

**Exit gate:** no compound result can be presented as authoritative without either verified product data or explicit manual coverage input.

## Phase 6 — Corner Bead engine

Implement run geometry, explicit arch models, stock optimizer, product stock lengths.

**Exit gate:** aggregate division formula is eliminated and stock plans are deterministic.

## Phase 7 — Fastener engine

Implement compatible rule profiles, framing-aware counts, wall/ceiling separation, installed-panel dependency, user overage, package data.

Remove generic 8/16/12 claim and wall/ceiling averaging.

**Exit gate:** unsupported systems block rather than fabricate a specification result.

## Phase 8 — Unified state + migration

Introduce provider/reducer, one project persistence record, legacy import, presets migration.

**Exit gate:** reloading reconstructs results from input state only; duplicated summary persistence is gone.

## Phase 9 — UI/UX rebuild

Refactor all tabs to the production layout and common design primitives.

Order:

1. Project Setup;
2. Sheets;
3. Compound;
4. Tape;
5. Bead;
6. Fasteners;
7. Summary.

**Exit gate:** desktop/mobile behavior is fluid, accessible, and no calculation logic remains in UI components.

## Phase 10 — Report revision

Update report mapper/template for canonical result + provenance + assumptions + engine version.

**Exit gate:** report is presentation-only and prints without recomputation.

## Phase 11 — Documentation cleanup

Rewrite stale `frontend/src/components/calculators/README.md` to reflect actual architecture.

Keep the current-state audit and research validation as historical design records, but point active developer documentation to the new calculator engine architecture.

**Exit gate:** no stale text-export/share-link/template/formula claims remain.

## Phase 12 — Production validation

Run:

- `npm run lint`;
- `npm run test:calculators`;
- production build;
- staging build where applicable;
- desktop responsive review;
- mobile responsive review;
- keyboard-only review;
- report print/PDF review;
- migrated-state review;
- calculator fixture review against source matrix.

**Exit gate:** all blocking tests pass and all researched rule dispositions are implemented or explicitly deferred as unsupported/product-data-required.

---

# 20. Rule disposition implementation checklist

## REMOVE immediately during owning-engine migration

- dynamic seam-count sheet waste;
- GA/ASTM attribution for 21-sq-ft door and 15-sq-ft window assumptions;
- 15% mesh tape multiplier;
- compound 40/35/25 universal coat split;
- Level-5 “29% more compound” assertion;
- universal “coarse thread” screw output;
- generic ASTM attribution on tape/waste/screw estimating formulas.

## REPLACE

- hard-coded ceiling sheet orientation;
- scalar finish-level coat count as material authority;
- tape vertical-corner formula for ceiling angles;
- arch `π × archHeight` model;
- aggregate bead stock division;
- universal screw 8/16/12 calculation;
- wall/ceiling screw averaging;
- screw calculation based on waste-adjusted panel purchases;
- arbitrary screw-length selection disconnected from system inputs.

## MODIFY

- simple sheet grid as a clearly bounded basic layout;
- field joint footage label/precision claim;
- user board/tape/fastener/bead allowances;
- 0.38 manual tape factor to verified 0.37 manufacturer fallback;
- opening handling;
- framing options;
- generic/manual product modes.

## NEEDS PRODUCT DATA

- compound coverage;
- compound package size;
- compound/tape product compatibility;
- tape roll size where product-specific;
- fastener type/count/package;
- bead stock length/profile/attachment guidance.

---

# 21. Product data acquisition plan

Do not scrape arbitrary retail descriptions into the calculator engine.

For every product value, require:

```text
manufacturer
product name
manufacturer identifier if available
property
value
unit
primary source URL/document
source publication/date where available
verification date
```

Start with a deliberately small verified registry. Accuracy is more important than apparent catalog breadth.

Recommended first registry scope:

- generic supported 4×8 / 4×10 / 4×12 conventional panel dimensions;
- USG paper tape reference;
- USG fiberglass tape reference;
- one or two verified USG compound products already researched;
- verified generic wood/steel fastener profiles only where current source evidence is sufficient;
- selected USG/Trim-Tex bead products only if product-specific guidance is needed in the calculator.

Product registry expansion should be independent from the core geometry engine.

---

# 22. Performance and scalability

The calculator domain is computationally small. Optimize for determinism and clarity rather than premature caching.

Requirements:

- pure synchronous calculations;
- no fetch-per-field or fetch-per-material;
- registries loaded once with the frontend bundle or as one versioned data resource;
- memoize only at the project-result boundary where beneficial;
- avoid storing duplicate derived state in React;
- stock optimizer must be bounded by reasonable project-size limits;
- advanced future panel nesting must have explicit complexity limits.

---

# 23. Security and privacy

The calculator remains browser-local in this plan.

Requirements:

- treat localStorage as untrusted input;
- validate all restored/migrated state;
- never store payment/order/customer credentials;
- project notes/address are local data and must not silently leave the browser;
- do not introduce analytics payloads containing project geometry/address without an explicit separate privacy decision;
- escape report/display output through React's normal rendering model;
- do not use arbitrary HTML from product/source registries.

No calculator endpoint, nonce, CORS, WooCommerce, or MU-plugin change is required for this revision.

---

# 24. Observability

Because calculations are browser-local, production observability should focus on safe non-sensitive error classification if analytics/telemetry already exists elsewhere in the application.

If calculator diagnostics are added later, record only bounded metadata such as:

```text
engineVersion
validationCode
calculator section
migration version
```

Do not log project addresses, notes, raw geometry, or user-entered sensitive text by default.

For developer debugging, provide a development-only structured calculation trace generated from rule IDs rather than console logging ad hoc intermediate values.

---

# 25. Compatibility and rollout strategy

The rebuild should be shipped incrementally behind one internal implementation boundary, not as five disconnected partial formula rewrites.

Recommended branch/PR sequencing:

```text
PR 1  domain schemas + registry + tests
PR 2  geometry + sheet engine
PR 3  tape + compound engines
PR 4  bead + fastener engines
PR 5  unified state + migration
PR 6  Project/Sheets UI
PR 7  Compound/Tape/Bead/Fasteners UI
PR 8  Summary/report + documentation
PR 9  final hardening / accessibility / regression fixes
```

Each PR must leave the repository buildable and testable.

Do not leave two active calculation authorities wired into different tabs. During migration, an adapter may map the new canonical result to the old UI, but the formula itself must have one authority.

---

# 26. Definition of production ready

The Calculator Hub is production ready only when all of the following are true:

## Calculation integrity

- every active formula lives in the domain engine;
- researched REMOVE/REPLACE decisions are complete;
- unsupported systems block or warn truthfully;
- installed and purchase quantities are separated;
- user allowances are explicit;
- manufacturer values are product/source driven;
- no unsupported ASTM/GA claims remain.

## Data integrity

- one canonical project persistence record;
- deterministic recalculation on load;
- migration is idempotent;
- malformed storage cannot corrupt runtime state;
- source/registry versions are recorded.

## UX

- Project Setup establishes shared scope once;
- all tabs use consistent input and result hierarchy;
- contractor can understand what to buy without reading technical commentary;
- warnings are concise and actionable;
- desktop and mobile are fluid;
- no horizontal overflow;
- keyboard and screen-reader basics are satisfied.

## Reports

- Summary and PDF use the same canonical result;
- no report-specific formulas;
- assumptions and provenance are included;
- version metadata is included;
- print output is stable.

## Testing

- calculator domain tests pass;
- fixture coverage exists for all major rule profiles;
- migration tests pass;
- lint passes;
- production build passes;
- responsive/manual review passes.

## Documentation

- architecture docs match implementation;
- stale calculator README is replaced;
- source registry explains every standards/manufacturer rule that is active.

---

# 27. Implementation priority matrix

| Priority | Work | Reason |
|---|---|---|
| P0 | Canonical schema + pure kernel | Prevents further formula drift |
| P0 | Project geometry authority | Upstream dependency for every calculator |
| P0 | Remove unsupported standards claims | Truthfulness/compliance risk |
| P0 | Replace fastener model | Highest technical error risk |
| P0 | Separate installed vs purchase quantities | Prevents compounded allowances |
| P1 | Tape geometry + compatibility | Direct dependency on Sheet geometry |
| P1 | Compound product coverage | Current universal factors unsupported |
| P1 | Bead arch + stock optimizer | Current geometry/packaging can be wrong |
| P1 | Unified persistence + migration | Eliminates duplicate state authority |
| P1 | Project/Summary UX | Defines contractor workflow |
| P2 | Advanced sheet opening/cut optimization | Valuable but not required for honest baseline |
| P2 | Expanded product registry | Extend only after data provenance pipeline is stable |
| P2 | Assembly-aware rule library | Requires controlled verified source expansion |

---

# 28. First implementation slice

The safest first code change after this plan is **not** to immediately restyle all tabs.

The first implementation slice should deliver:

```text
frontend/src/domain/calculators/projectSchema.js
frontend/src/domain/calculators/resultSchema.js
frontend/src/domain/calculators/normalizeProject.js
frontend/src/domain/calculators/calculateProject.js
frontend/src/domain/calculators/registry/standardsRegistry.js
frontend/src/domain/calculators/registry/productsRegistry.js
frontend/src/domain/calculators/validation/*
frontend/tests/calculators/projectSchema.test.mjs
frontend/tests/calculators/geometry.test.mjs
```

Then migrate Sheets into that kernel first because Sheets currently provides geometry-derived values to Compound, Tape, and Screws.

The UI redesign should begin only after the new project/result contracts and Sheet geometry authority are stable. Otherwise the project risks rebuilding the UI twice while the underlying data contracts continue to move.

---

# 29. Final target

The finished Drywall Toolbox Calculator Hub should behave as a professional material-estimating system rather than five unrelated web calculators.

The user experience becomes:

```text
Define project once
        ↓
Select panel/system context
        ↓
Review board takeoff
        ↓
Specify finish/material products
        ↓
Review tape / compound / bead / fasteners
        ↓
Adjust explicit purchasing allowances
        ↓
Resolve compatibility warnings
        ↓
Review one unified material takeoff
        ↓
Print / Save PDF
```

Every material result will be reproducible, provenance-aware, bounded by verified source data, and explicit about assumptions. The frontend remains fast and browser-local, while the calculation architecture becomes modular enough to support future product-registry expansion, tested assembly profiles, saved account projects, supplier pricing, or backend persistence without creating a second calculation authority.
