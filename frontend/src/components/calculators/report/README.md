# Calculator report workflow

This directory owns the customer-facing Calculator Hub report/export presentation.

## Contract

`calculatorReportModel.js` is the canonical presentation mapper from `CalculatorHub` summary state into the report model. The Summary tab and printable report must consume that model rather than maintaining separate label maps or export-specific calculations.

Authoritative arithmetic lives in `frontend/src/lib/calculators/index.js`. The report layer may normalize labels, units, dates and grouping, but it must never recalculate quantities.

The report model is schema version 3 and reflects the revised calculator contract:

- installed/required quantities are distinguished from purchase quantities;
- user purchasing allowances are displayed as estimator choices;
- Compound package size is no longer hard-coded as a 5-gal bucket;
- Level 5 skim material is reported separately when supplied;
- Tape separates field joints, vertical inside corners and ceiling perimeter;
- Screws report required fasteners separately from purchase fasteners and consume installed sheet quantity;
- stale dynamic-waste and generic coat-count fields are not reported.

`CalculatorReport.jsx` renders report groups as structured tables and must not introduce calculation logic.

`calculator-report.css` owns Letter-size preview and print rules. Print isolation is activated only while `body.dtb-calculator-report-printing` is present, preventing hidden SPA layout from generating trailing report pages.

## Save as PDF / print flow

1. User completes one or more calculator tabs and opens Summary.
2. Project metadata remains browser-local with `dwCalc_state`.
3. `buildCalculatorReport()` maps calculator outputs into the canonical report model.
4. **Export / Save PDF** opens the dedicated report preview.
5. **Save / Print PDF** invokes the browser print dialog using the dedicated print-only report root.
6. The temporary print body class and document title are restored after printing.

No calculator report data is sent to WordPress or an external PDF service.

## Invariants

- Supported conventional sheet sizes are 4×8, 4×10 and 4×12.
- Joint Compound appears in the visible summary and report.
- Required/installed and purchase quantities must not be conflated.
- Purchasing allowances must not be described as GA/ASTM requirements.
- Report values must come from calculator outputs.
- Calculator sections preserve semantic grouping.
- Existing `dwCalc_state` project/report metadata remains backward compatible.
- The report disclaimer must preserve the calculator's conventional-planning scope and tell users to verify manufacturer and tested/listed assembly requirements where applicable.
