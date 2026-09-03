const clampNonNegative = (value) => Math.max(0, Number(value) || 0)
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

export const SUPPORTED_SHEET_SIZES = {
  32: { widthFt: 4, lengthFt: 8, label: '4×8 ft' },
  40: { widthFt: 4, lengthFt: 10, label: '4×10 ft' },
  48: { widthFt: 4, lengthFt: 12, label: '4×12 ft' },
}

export function calculateSheets({
  walls = [],
  ceilingHeight = 0,
  sheetSize = 48,
  orientation = 'horizontal',
  includeCeiling = false,
  roomLength = 0,
  roomWidth = 0,
  doors = 0,
  doorSqFt = 21,
  windows = 0,
  windowSqFt = 15,
  wastePct = 0.10,
}) {
  const panel = SUPPORTED_SHEET_SIZES[sheetSize] || SUPPORTED_SHEET_SIZES[48]
  const wallHeight = clampNonNegative(ceilingHeight)
  const across = orientation === 'vertical' ? panel.widthFt : panel.lengthFt
  const vertical = orientation === 'vertical' ? panel.lengthFt : panel.widthFt

  const wallLayouts = walls.map((wall, index) => {
    const length = clampNonNegative(wall?.length)
    const sheetsAcross = length > 0 ? Math.ceil(length / across) : 0
    const sheetsVertical = wallHeight > 0 ? Math.ceil(wallHeight / vertical) : 0
    const installedSheets = sheetsAcross * sheetsVertical
    const horizontalJointFt = Math.max(0, sheetsVertical - 1) * length
    const verticalJointFt = Math.max(0, sheetsAcross - 1) * wallHeight
    return {
      id: wall?.id ?? index,
      length,
      sheetsAcross,
      sheetsVertical,
      installedSheets,
      jointLinearFt: horizontalJointFt + verticalJointFt,
    }
  })

  const wallArea = walls.reduce((total, wall) => total + clampNonNegative(wall?.length) * wallHeight, 0)
  const wallSheets = wallLayouts.reduce((total, wall) => total + wall.installedSheets, 0)
  const wallJointLinearFt = wallLayouts.reduce((total, wall) => total + wall.jointLinearFt, 0)

  const ceilingArea = includeCeiling ? clampNonNegative(roomLength) * clampNonNegative(roomWidth) : 0
  let ceilingSheets = 0
  let ceilingJointLinearFt = 0
  if (ceilingArea > 0) {
    const layouts = [
      {
        across: Math.ceil(clampNonNegative(roomLength) / panel.widthFt),
        vertical: Math.ceil(clampNonNegative(roomWidth) / panel.lengthFt),
      },
      {
        across: Math.ceil(clampNonNegative(roomLength) / panel.lengthFt),
        vertical: Math.ceil(clampNonNegative(roomWidth) / panel.widthFt),
      },
    ].map((layout) => ({
      ...layout,
      sheets: layout.across * layout.vertical,
      joints:
        Math.max(0, layout.across - 1) * clampNonNegative(roomWidth) +
        Math.max(0, layout.vertical - 1) * clampNonNegative(roomLength),
    }))
    const selected = layouts.sort((a, b) => a.sheets - b.sheets || a.joints - b.joints)[0]
    ceilingSheets = selected.sheets
    ceilingJointLinearFt = selected.joints
  }

  const grossArea = wallArea + ceilingArea
  const openingArea = clampNonNegative(doors) * clampNonNegative(doorSqFt) + clampNonNegative(windows) * clampNonNegative(windowSqFt)
  const netArea = Math.max(0, grossArea - openingArea)
  const installedSheets = wallSheets + ceilingSheets
  const purchaseSheets = Math.ceil(installedSheets * (1 + clampNonNegative(wastePct)))

  return {
    panel,
    wallLayouts,
    wallArea: round2(wallArea),
    ceilingArea: round2(ceilingArea),
    grossArea: round2(grossArea),
    openingArea: round2(openingArea),
    netArea: round2(netArea),
    installedSheets,
    purchaseSheets,
    wastePct: clampNonNegative(wastePct),
    fieldJointLinearFt: round2(wallJointLinearFt + ceilingJointLinearFt),
    ceilingPerimeterFt: includeCeiling ? round2(2 * (clampNonNegative(roomLength) + clampNonNegative(roomWidth))) : 0,
  }
}

export function calculateTape({
  areaSqFt = 0,
  fieldJointLinearFt = null,
  verticalInsideCorners = 0,
  ceilingHeight = 0,
  ceilingPerimeterFt = 0,
  rollSizeFt = 500,
  wastePct = 0.05,
}) {
  const fieldFt = fieldJointLinearFt == null
    ? clampNonNegative(areaSqFt) * 0.37
    : clampNonNegative(fieldJointLinearFt)
  const verticalCornerFt = clampNonNegative(verticalInsideCorners) * clampNonNegative(ceilingHeight)
  const requiredLinearFt = fieldFt + verticalCornerFt + clampNonNegative(ceilingPerimeterFt)
  const purchaseLinearFt = requiredLinearFt * (1 + clampNonNegative(wastePct))
  return {
    source: fieldJointLinearFt == null ? 'manufacturer-area-estimate' : 'layout-derived',
    fieldLinearFt: round2(fieldFt),
    verticalCornerFt: round2(verticalCornerFt),
    ceilingPerimeterFt: round2(ceilingPerimeterFt),
    requiredLinearFt: round2(requiredLinearFt),
    purchaseLinearFt: round2(purchaseLinearFt),
    rolls: Math.ceil(purchaseLinearFt / Math.max(1, clampNonNegative(rollSizeFt))),
  }
}

const COMPOUND_PROFILES = {
  standard: { label: 'Standard ready-mix', gallonsPer1000: 10, packageGallons: 5 },
  lightweight: { label: 'Lightweight ready-mix', gallonsPer1000: 9, packageGallons: 4.5 },
}

export function calculateCompound({
  areaSqFt = 0,
  finishLevel = 4,
  profile = 'lightweight',
  wastePct = 0.05,
  level5SkimGallonsPer1000 = 0,
}) {
  const product = COMPOUND_PROFILES[profile] || COMPOUND_PROFILES.lightweight
  if (Number(finishLevel) === 0) {
    return { product, requiredGallons: 0, purchaseGallons: 0, packages: 0, skimGallons: 0 }
  }

  // Manufacturer coverage is published for conventional joint finishing, not as a GA level-by-level table.
  // Levels 1–4 therefore use the same conservative planning coverage. Level 5 adds a separately declared skim allowance.
  const baseGallons = clampNonNegative(areaSqFt) / 1000 * product.gallonsPer1000
  const skimGallons = Number(finishLevel) === 5
    ? clampNonNegative(areaSqFt) / 1000 * clampNonNegative(level5SkimGallonsPer1000)
    : 0
  const requiredGallons = baseGallons + skimGallons
  const purchaseGallons = requiredGallons * (1 + clampNonNegative(wastePct))
  return {
    product,
    requiredGallons: round2(requiredGallons),
    purchaseGallons: round2(purchaseGallons),
    packages: Math.ceil(purchaseGallons / product.packageGallons),
    skimGallons: round2(skimGallons),
    coverageBasis: `${product.gallonsPer1000} gal / 1,000 sq ft manufacturer planning coverage`,
  }
}

export function calculateCornerBead({
  straightCorners = 0,
  heightFt = 0,
  measuredArchFt = 0,
  stockLengthFt = 10,
  wastePct = 0.05,
}) {
  const straightFt = clampNonNegative(straightCorners) * clampNonNegative(heightFt)
  const requiredLinearFt = straightFt + clampNonNegative(measuredArchFt)
  const purchaseLinearFt = requiredLinearFt * (1 + clampNonNegative(wastePct))
  return {
    straightFt: round2(straightFt),
    archFt: round2(measuredArchFt),
    requiredLinearFt: round2(requiredLinearFt),
    purchaseLinearFt: round2(purchaseLinearFt),
    sections: Math.ceil(purchaseLinearFt / Math.max(1, clampNonNegative(stockLengthFt))),
  }
}

export function calculateScrews({
  installedSheets = 0,
  sheetSize = 48,
  application = 'wall',
  framingSpacingIn = 16,
  boxSize = 875,
  wastePct = 0.10,
}) {
  const panel = SUPPORTED_SHEET_SIZES[sheetSize] || SUPPORTED_SHEET_SIZES[48]
  const longIn = panel.lengthFt * 12
  const spacing = Number(framingSpacingIn) === 24 ? 24 : 16
  const framingLines = Math.floor(48 / spacing) + 1

  // Conventional planning model: fasteners at 16 in. on walls or 12 in. on ceilings
  // along each framing line. Specialty/rated/multilayer systems require their assembly specification.
  const fastenerSpacing = application === 'ceiling' ? 12 : 16
  const perLine = Math.floor(longIn / fastenerSpacing) + 1
  const perSheet = framingLines * perLine
  const requiredScrews = clampNonNegative(installedSheets) * perSheet
  const purchaseScrews = Math.ceil(requiredScrews * (1 + clampNonNegative(wastePct)))
  return {
    perSheet,
    requiredScrews: Math.ceil(requiredScrews),
    purchaseScrews,
    boxes: Math.ceil(purchaseScrews / Math.max(1, clampNonNegative(boxSize))),
    supportedScope: 'Conventional single-layer, non-rated drywall planning estimate',
  }
}

export { COMPOUND_PROFILES }
