const SHEET_SIZE_LABELS = { 32: '4×8 ft', 40: '4×10 ft', 48: '4×12 ft' }
const HANG_DIRECTION_LABELS = { horizontal: 'Horizontal', vertical: 'Vertical' }
const COMPOUND_TYPE_LABELS = { standard: 'Standard ready-mix', lightweight: 'Lightweight ready-mix' }
const TAPE_TYPE_LABELS = { paper: 'Paper tape', mesh: 'Fiberglass mesh' }
const BEAD_TYPE_LABELS = { metal: 'Metal corner bead', bullnose: 'Bullnose bead', vinyl: 'Vinyl corner bead', flex: 'Flexible / arch bead' }
const APPLICATION_LABELS = { wall: 'Walls', ceiling: 'Ceiling' }
const EMPTY_VALUE = '—'

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function numberValue(value, maximumFractionDigits = 2) {
  if (!hasValue(value) || Number.isNaN(Number(value))) return EMPTY_VALUE
  return Number(value).toLocaleString(undefined, { maximumFractionDigits })
}

function valueWithUnit(value, unit, maximumFractionDigits = 2) {
  const formatted = numberValue(value, maximumFractionDigits)
  return formatted === EMPTY_VALUE ? EMPTY_VALUE : `${formatted} ${unit}`
}

function percentage(value) {
  if (!hasValue(value) || Number.isNaN(Number(value))) return EMPTY_VALUE
  return `${Math.round(Number(value) * 100)}%`
}

function safeText(value, fallback = EMPTY_VALUE) {
  const text = String(value ?? '').trim()
  return text || fallback
}

function localDateParts(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return {
    iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    label: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
  }
}

function primary(label, value, unit) {
  const formatted = numberValue(value, 2)
  return { label, value: formatted, unit: formatted === EMPTY_VALUE ? '' : unit }
}

function detail(label, value) {
  return { label, value: hasValue(value) ? String(value) : EMPTY_VALUE }
}

function group(key, title, rows) {
  return { key, title, rows }
}

function makeSection({ key, eyebrow, title, primaryResult, groups }) {
  return { key, eyebrow, title, primary: primaryResult, groups, details: groups.flatMap((item) => item.rows) }
}

export function buildCalculatorReport(data = {}, generatedAt = new Date()) {
  const { project = {}, sheets = {}, mud = {}, tape = {}, bead = {}, screws = {} } = data
  const generatedDate = localDateParts(generatedAt)
  const openingDeductions = hasValue(sheets.gross) && hasValue(sheets.net)
    ? Math.max(0, Number(sheets.gross) - Number(sheets.net))
    : null
  const compoundPackageGallons = Number(mud.packageGallons) || 5

  return {
    schemaVersion: 3,
    generatedAt: generatedAt.toISOString(),
    generatedDate: generatedDate.iso,
    generatedDateLabel: generatedDate.label,
    project: {
      jobName: safeText(project.jobName, 'Untitled project'),
      jobAddress: safeText(project.jobAddress),
      contractorName: safeText(project.contractorName, ''),
      estimatorName: safeText(project.estimatorName, ''),
      notes: String(project.notes ?? '').trim(),
    },
    summaryItems: [
      { key: 'sheets', label: 'Drywall Sheets', quantity: numberValue(sheets.sheets, 0), unit: 'sheets' },
      { key: 'mud', label: 'Joint Compound', quantity: numberValue(mud.buckets5gal, 0), unit: `${compoundPackageGallons}-gal packages` },
      { key: 'tape', label: 'Joint Tape', quantity: numberValue(tape.rolls, 0), unit: 'rolls' },
      { key: 'bead', label: 'Corner Bead', quantity: numberValue(bead.sections, 0), unit: 'sections' },
      { key: 'screws', label: 'Drywall Screws', quantity: numberValue(screws.boxes, 0), unit: 'boxes' },
    ],
    sections: [
      makeSection({
        key: 'sheets', eyebrow: 'Board takeoff', title: 'Drywall Sheets', primaryResult: primary('Purchase quantity', sheets.sheets, 'sheets'),
        groups: [
          group('inputs', 'Project inputs', [
            detail('Sheet size', SHEET_SIZE_LABELS[sheets.sheetSize] || EMPTY_VALUE),
            detail('Wall orientation', HANG_DIRECTION_LABELS[sheets.hangDir] || EMPTY_VALUE),
            detail('Wall count', numberValue(sheets.numWalls, 0)),
            detail('Ceiling height', valueWithUnit(sheets.ceilHeight, 'ft')),
            detail('Ceiling included', hasValue(sheets.inclCeiling) ? (sheets.inclCeiling ? 'Yes' : 'No') : EMPTY_VALUE),
            detail('Purchasing allowance', percentage(sheets.wastePct)),
          ]),
          group('results', 'Calculated takeoff', [
            detail('Installed sheet estimate', numberValue(sheets.installedSheets ?? sheets.baseSheets, 0)),
            detail('Wall area', valueWithUnit(sheets.wallArea, 'sq ft', 0)),
            detail('Ceiling area', valueWithUnit(sheets.ceilArea, 'sq ft', 0)),
            detail('Opening deductions', valueWithUnit(openingDeductions, 'sq ft', 0)),
            detail('Net finishable area', valueWithUnit(sheets.net, 'sq ft', 0)),
            detail('Estimated field joints', valueWithUnit(sheets.totalJointLinearFeet, 'lf', 0)),
          ]),
        ],
      }),
      makeSection({
        key: 'mud', eyebrow: 'Finishing material', title: 'Joint Compound', primaryResult: primary('Packages to buy', mud.buckets5gal, 'packages'),
        groups: [
          group('inputs', 'Finish specification', [
            detail('Calculated area', valueWithUnit(mud.area, 'sq ft', 0)),
            detail('Finish level', hasValue(mud.finishLevel) ? `Level ${mud.finishLevel}` : EMPTY_VALUE),
            detail('Compound profile', COMPOUND_TYPE_LABELS[mud.compoundType] || safeText(mud.compoundType)),
            detail('Package size', valueWithUnit(mud.packageGallons, 'gal')),
            detail('Purchasing allowance', percentage(mud.wastePct)),
          ]),
          group('results', 'Material requirement', [
            detail('Required compound', valueWithUnit(mud.totalGallons, 'gal')),
            detail('Purchase volume', valueWithUnit(mud.purchaseGallons, 'gal')),
            detail('Level 5 skim allowance', valueWithUnit(mud.skimGallons, 'gal')),
            detail('Calculation source', mud.syncedFromSheets ? 'Synced from sheet net area' : 'Manual calculator area'),
          ]),
        ],
      }),
      makeSection({
        key: 'tape', eyebrow: 'Joint treatment', title: 'Joint Tape', primaryResult: primary('Rolls to buy', tape.rolls, 'rolls'),
        groups: [
          group('inputs', 'Tape specification', [
            detail('Tape type', TAPE_TYPE_LABELS[tape.tapeType] || safeText(tape.tapeType)),
            detail('Roll size', valueWithUnit(tape.rollSize, 'ft', 0)),
            detail('Purchasing allowance', percentage(tape.wastePct)),
            detail('Calculation source', tape.syncedFromSheets ? 'Layout-derived field joints' : 'Manufacturer area planning factor'),
          ]),
          group('results', 'Coverage requirement', [
            detail('Field joints', valueWithUnit(tape.seamFeet, 'ft', 0)),
            detail('Vertical inside corners', valueWithUnit(tape.cornerFeet, 'ft', 0)),
            detail('Wall-to-ceiling perimeter', valueWithUnit(tape.ceilingPerimeterFt, 'ft', 0)),
            detail('Required tape', valueWithUnit(tape.requiredFeet, 'ft', 0)),
            detail('Purchase footage', valueWithUnit(tape.totalFeet, 'ft', 0)),
          ]),
        ],
      }),
      makeSection({
        key: 'bead', eyebrow: 'Outside corners', title: 'Corner Bead', primaryResult: primary('Sections to buy', bead.sections, 'sections'),
        groups: [
          group('inputs', 'Bead specification', [
            detail('Bead type', BEAD_TYPE_LABELS[bead.beadType] || safeText(bead.beadType)),
            detail('Stock length', valueWithUnit(bead.stockLength, 'ft', 0)),
            detail('Purchasing allowance', percentage(bead.wastePct)),
          ]),
          group('results', 'Linear requirement', [
            detail('Straight corners', valueWithUnit(bead.standardFeet, 'ft', 0)),
            detail('Measured curved / arch bead', valueWithUnit(bead.archFeet, 'ft', 0)),
            detail('Required bead', valueWithUnit(bead.totalFeet, 'ft', 0)),
            detail('Purchase footage', valueWithUnit(bead.purchaseFeet, 'ft', 0)),
          ]),
        ],
      }),
      makeSection({
        key: 'screws', eyebrow: 'Fasteners', title: 'Drywall Screws', primaryResult: primary('Boxes to buy', screws.boxes, 'boxes'),
        groups: [
          group('inputs', 'Fastener estimate', [
            detail('Application', APPLICATION_LABELS[screws.application] || safeText(screws.application)),
            detail('Installed sheets used', numberValue(screws.sheetsUsed, 0)),
            detail('Box quantity', valueWithUnit(screws.boxSize, 'screws', 0)),
            detail('Purchasing allowance', percentage(screws.wastePct)),
          ]),
          group('results', 'Calculated quantity', [
            detail('Screws per sheet', numberValue(screws.perSheet, 0)),
            detail('Required screws', numberValue(screws.requiredScrews, 0)),
            detail('Purchase screws', numberValue(screws.totalScrews, 0)),
            detail('Calculation source', screws.syncedFromSheets ? 'Installed sheet estimate' : 'Manual installed sheet quantity'),
          ]),
        ],
      }),
    ],
    disclaimer: 'Planning estimates for conventional drywall work. Purchasing allowances are estimator-selected, not GA/ASTM requirements. Product coverage and package quantities vary by manufacturer. Verify field conditions and follow the applicable manufacturer or tested/listed assembly requirements before installation or purchase.',
  }
}

export function reportFilename(report) {
  const rawName = report?.project?.jobName || 'Material Estimate'
  const safeName = rawName.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'Material-Estimate'
  const date = report?.generatedDate || localDateParts(new Date()).iso
  return `DTB-Material-Estimate_${safeName}_${date}.pdf`
}
