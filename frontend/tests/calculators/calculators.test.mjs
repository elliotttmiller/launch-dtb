import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateSheets,
  calculateTape,
  calculateCompound,
  calculateCornerBead,
  calculateScrews,
} from '../../src/lib/calculators/index.js'

test('sheet takeoff separates installed and purchase quantities', () => {
  const result = calculateSheets({
    walls: [{ length: 12 }, { length: 14 }, { length: 12 }, { length: 14 }],
    ceilingHeight: 9,
    sheetSize: 48,
    orientation: 'horizontal',
    includeCeiling: false,
    doors: 1,
    doorSqFt: 21,
    windows: 2,
    windowSqFt: 15,
    wastePct: 0.10,
  })
  assert.equal(result.installedSheets, 18)
  assert.equal(result.purchaseSheets, 20)
  assert.equal(result.netArea, 417)
  assert.ok(result.purchaseSheets >= result.installedSheets)
})

test('sheet purchasing allowance never changes installed quantity', () => {
  const base = {
    walls: [{ length: 12 }, { length: 12 }, { length: 12 }, { length: 12 }],
    ceilingHeight: 8,
    sheetSize: 32,
    orientation: 'horizontal',
  }
  const noAllowance = calculateSheets({ ...base, wastePct: 0 })
  const allowance = calculateSheets({ ...base, wastePct: 0.20 })
  assert.equal(noAllowance.installedSheets, allowance.installedSheets)
  assert.ok(allowance.purchaseSheets >= noAllowance.purchaseSheets)
})

test('tape manual fallback uses 0.37 linear ft per square ft', () => {
  const result = calculateTape({ areaSqFt: 1000, rollSizeFt: 500, wastePct: 0 })
  assert.equal(result.fieldLinearFt, 370)
  assert.equal(result.requiredLinearFt, 370)
  assert.equal(result.rolls, 1)
})

test('tape separates field joints, vertical corners, and ceiling perimeter', () => {
  const result = calculateTape({
    fieldJointLinearFt: 200,
    verticalInsideCorners: 4,
    ceilingHeight: 9,
    ceilingPerimeterFt: 52,
    rollSizeFt: 250,
    wastePct: 0,
  })
  assert.equal(result.fieldLinearFt, 200)
  assert.equal(result.verticalCornerFt, 36)
  assert.equal(result.ceilingPerimeterFt, 52)
  assert.equal(result.requiredLinearFt, 288)
  assert.equal(result.rolls, 2)
})

test('compound uses manufacturer planning coverage and keeps Level 5 skim separate', () => {
  const level4 = calculateCompound({ areaSqFt: 1000, finishLevel: 4, profile: 'lightweight', wastePct: 0 })
  const level5 = calculateCompound({ areaSqFt: 1000, finishLevel: 5, profile: 'lightweight', wastePct: 0, level5SkimGallonsPer1000: 3 })
  assert.equal(level4.requiredGallons, 9)
  assert.equal(level4.skimGallons, 0)
  assert.equal(level5.requiredGallons, 12)
  assert.equal(level5.skimGallons, 3)
})

test('corner bead uses measured curved footage rather than assumed arch geometry', () => {
  const result = calculateCornerBead({ straightCorners: 4, heightFt: 9, measuredArchFt: 8, stockLengthFt: 10, wastePct: 0 })
  assert.equal(result.straightFt, 36)
  assert.equal(result.archFt, 8)
  assert.equal(result.requiredLinearFt, 44)
  assert.equal(result.sections, 5)
})

test('screws use installed sheets and application-specific conventional spacing', () => {
  const walls = calculateScrews({ installedSheets: 10, sheetSize: 48, application: 'wall', framingSpacingIn: 16, boxSize: 875, wastePct: 0 })
  const ceilings = calculateScrews({ installedSheets: 10, sheetSize: 48, application: 'ceiling', framingSpacingIn: 16, boxSize: 875, wastePct: 0 })
  assert.equal(walls.perSheet, 40)
  assert.equal(ceilings.perSheet, 52)
  assert.ok(ceilings.requiredScrews > walls.requiredScrews)
})
