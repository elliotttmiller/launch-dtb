import { useEffect, useMemo, useState } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'
import WasteSelector from './shared/WasteSelector'
import { calculateTape } from '../../lib/calculators'

const LS_KEY = 'dwCalc_tape'
const tapeTypes = [
  { value: 'paper', label: 'Paper tape', description: 'Conventional joint tape' },
  { value: 'mesh', label: 'Fiberglass mesh', description: 'Use with compatible setting-type compound' },
]
const rollSizes = [75, 250, 500].map((value) => ({ value, label: `${value} ft`, description: `${value}-ft roll` }))

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

export default function TapeCalculator({ onUpdate, sheetData }) {
  const saved = loadSaved()
  const [area, setArea] = useState(saved.area ?? 800)
  const [verticalCorners, setVerticalCorners] = useState(saved.verticalCorners ?? saved.insideCorners ?? saved.corners ?? 4)
  const [ceilHeight, setCeilHeight] = useState(saved.ceilHeight ?? 9)
  const [ceilingPerimeterFt, setCeilingPerimeterFt] = useState(saved.ceilingPerimeterFt ?? 0)
  const [tapeType, setTapeType] = useState(saved.tapeType ?? 'paper')
  const [rollSize, setRollSize] = useState(saved.rollSize ?? 500)
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.05)

  const syncedFromSheets = Number(sheetData?.totalJointLinearFeet) > 0
  const effectiveArea = Number(sheetData?.net) > 0 ? Number(sheetData.net) : area
  const effectiveHeight = Number(sheetData?.ceilHeight) > 0 ? Number(sheetData.ceilHeight) : ceilHeight
  const effectiveCeilingPerimeter = Number(sheetData?.ceilingPerimeterFt) > 0 ? Number(sheetData.ceilingPerimeterFt) : ceilingPerimeterFt

  const results = useMemo(() => calculateTape({
    areaSqFt: effectiveArea,
    fieldJointLinearFt: syncedFromSheets ? Number(sheetData.totalJointLinearFeet) : null,
    verticalInsideCorners: verticalCorners,
    ceilingHeight: effectiveHeight,
    ceilingPerimeterFt: effectiveCeilingPerimeter,
    rollSizeFt: rollSize,
    wastePct,
  }), [effectiveArea, syncedFromSheets, sheetData, verticalCorners, effectiveHeight, effectiveCeilingPerimeter, rollSize, wastePct])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ area, verticalCorners, ceilHeight, ceilingPerimeterFt, tapeType, rollSize, wastePct }))
  }, [area, verticalCorners, ceilHeight, ceilingPerimeterFt, tapeType, rollSize, wastePct])

  useEffect(() => {
    onUpdate?.({
      rolls: results.rolls,
      tapeType,
      rollSize,
      totalFeet: Math.round(results.purchaseLinearFt),
      requiredFeet: Math.round(results.requiredLinearFt),
      seamFeet: Math.round(results.fieldLinearFt),
      cornerFeet: Math.round(results.verticalCornerFt),
      ceilingPerimeterFt: Math.round(results.ceilingPerimeterFt),
      syncedFromSheets,
      wastePct,
    })
  }, [results, tapeType, rollSize, syncedFromSheets, wastePct, onUpdate])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Joint tape estimate</p>
        <h2 className="text-lg font-semibold text-gray-900">How many rolls of tape do I need?</h2>
        <p className="text-sm text-gray-500 mt-1">Uses layout-derived field joints when available; otherwise uses the published planning factor of about 370 linear ft per 1,000 sq ft.</p>
      </section>

      {syncedFromSheets && <div className="px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-700"><strong>Using Sheets calculation</strong> · {Math.round(sheetData.totalJointLinearFeet)} ft estimated field joints.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs font-medium text-gray-600">Area (sq ft)
          <input type="number" min="0" value={effectiveArea} readOnly={syncedFromSheets} onChange={(e) => !syncedFromSheets && setArea(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white read-only:bg-gray-50" />
        </label>
        <label className="text-xs font-medium text-gray-600">Vertical inside corners
          <input type="number" min="0" value={verticalCorners} onChange={(e) => setVerticalCorners(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white" />
        </label>
        <label className="text-xs font-medium text-gray-600">Ceiling height (ft)
          <input type="number" min="0" step="0.5" value={effectiveHeight} readOnly={Number(sheetData?.ceilHeight) > 0} onChange={(e) => setCeilHeight(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white read-only:bg-gray-50" />
        </label>
        <label className="text-xs font-medium text-gray-600">Wall-to-ceiling perimeter (ft)
          <input type="number" min="0" step="0.5" value={effectiveCeilingPerimeter} readOnly={Number(sheetData?.ceilingPerimeterFt) > 0} onChange={(e) => setCeilingPerimeterFt(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white read-only:bg-gray-50" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tape type</label><CalcDropdown value={tapeType} onChange={setTapeType} options={tapeTypes} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Roll size</label><CalcDropdown value={rollSize} onChange={(value) => setRollSize(+value)} options={rollSizes} /></div>
      </div>

      <section><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Purchasing allowance</p><WasteSelector value={wastePct} onChange={setWastePct} /></section>

      <section className="border-t border-gray-200 pt-6" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResultCard label="Rolls to buy" value={results.rolls} sub={`${rollSize}-ft ${tapeType === 'paper' ? 'paper' : 'mesh'} rolls`} hero />
          <ResultCard label="Required tape" value={Math.round(results.requiredLinearFt).toLocaleString()} sub="linear ft before allowance" />
          <ResultCard label="Purchase footage" value={Math.round(results.purchaseLinearFt).toLocaleString()} sub={`linear ft · ${Math.round(wastePct * 100)}% allowance`} />
        </div>
        <InfoBox>
          {tapeType === 'mesh' ? 'Fiberglass mesh does not receive a special stretch multiplier. Use it only with a compatible setting-type compound where required by the tape manufacturer. ' : ''}
          Field joints, vertical inside corners, and wall-to-ceiling perimeter are calculated separately. The 0.37 lf/sq-ft area factor is only a manufacturer planning fallback when a sheet layout has not been completed.
        </InfoBox>
      </section>
    </div>
  )
}
