import { useEffect, useMemo, useState } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'
import WasteSelector from './shared/WasteSelector'
import { calculateScrews } from '../../lib/calculators'

const LS_KEY = 'dwCalc_screws'
const spacingOptions = [16, 24].map((value) => ({ value, label: `${value}" on center`, description: `${value}-in framing spacing` }))
const applicationOptions = [
  { value: 'wall', label: 'Walls', description: 'Conventional wall planning estimate' },
  { value: 'ceiling', label: 'Ceilings', description: 'Conventional ceiling planning estimate' },
]
const sheetSizeOptions = [
  { value: 32, label: '4×8 ft', description: '32 sq ft' },
  { value: 40, label: '4×10 ft', description: '40 sq ft' },
  { value: 48, label: '4×12 ft', description: '48 sq ft' },
]
const boxSizeOptions = [175, 875, 1750].map((value) => ({ value, label: value.toLocaleString(), description: `${value.toLocaleString()} screws / box` }))

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

export default function ScrewCalculator({ onUpdate, sheetData }) {
  const saved = loadSaved()
  const [sheets, setSheets] = useState(saved.sheets ?? 20)
  const [spacing, setSpacing] = useState(saved.spacing ?? 16)
  const [application, setApplication] = useState(saved.application === 'both' ? 'wall' : (saved.application ?? 'wall'))
  const [sheetSize, setSheetSize] = useState(saved.sheetSize ?? 48)
  const [boxSize, setBoxSize] = useState(saved.boxSize ?? 875)
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.10)

  const syncedFromSheets = Number(sheetData?.installedSheets ?? sheetData?.baseSheets) > 0
  const effectiveSheets = syncedFromSheets ? Number(sheetData.installedSheets ?? sheetData.baseSheets) : sheets
  const effectiveSheetSize = syncedFromSheets ? Number(sheetData.sheetSize ?? sheetSize) : sheetSize

  const results = useMemo(() => calculateScrews({
    installedSheets: effectiveSheets,
    sheetSize: effectiveSheetSize,
    application,
    framingSpacingIn: spacing,
    boxSize,
    wastePct,
  }), [effectiveSheets, effectiveSheetSize, application, spacing, boxSize, wastePct])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ sheets, spacing, application, sheetSize, boxSize, wastePct }))
  }, [sheets, spacing, application, sheetSize, boxSize, wastePct])

  useEffect(() => {
    onUpdate?.({
      boxes: results.boxes,
      screwLength: 'Verify for panel/framing system',
      boxSize,
      totalScrews: results.purchaseScrews,
      requiredScrews: results.requiredScrews,
      perSheet: results.perSheet,
      application,
      syncedFromSheets,
      sheetsUsed: effectiveSheets,
      wastePct,
    })
  }, [results, boxSize, application, syncedFromSheets, effectiveSheets, wastePct, onUpdate])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Drywall fastener estimate</p>
        <h2 className="text-lg font-semibold text-gray-900">How many screws should I buy?</h2>
        <p className="text-sm text-gray-500 mt-1">A conventional single-layer planning estimate. Rated, multilayer, specialty and tested assemblies must follow their specified fastener schedule.</p>
      </section>

      {syncedFromSheets && <div className="px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-700"><strong>Using installed Sheets estimate</strong> · {effectiveSheets} sheets. Board purchasing waste is not double-counted into fastener requirements.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs font-medium text-gray-600">Installed sheets
          <input type="number" min="0" value={effectiveSheets} readOnly={syncedFromSheets} onChange={(e) => !syncedFromSheets && setSheets(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white read-only:bg-gray-50" />
        </label>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Sheet size</label><CalcDropdown value={effectiveSheetSize} onChange={(value) => !syncedFromSheets && setSheetSize(+value)} options={sheetSizeOptions} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Application</label><CalcDropdown value={application} onChange={setApplication} options={applicationOptions} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Framing spacing</label><CalcDropdown value={spacing} onChange={(value) => setSpacing(+value)} options={spacingOptions} /></div>
      </div>

      <div className="max-w-sm"><label className="block text-xs font-medium text-gray-600 mb-1.5">Box quantity</label><CalcDropdown value={boxSize} onChange={(value) => setBoxSize(+value)} options={boxSizeOptions} /></div>

      <section><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Purchasing allowance</p><WasteSelector value={wastePct} onChange={setWastePct} /></section>

      <section className="border-t border-gray-200 pt-6" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResultCard label="Boxes to buy" value={results.boxes} sub={`${boxSize.toLocaleString()} screws / box`} hero />
          <ResultCard label="Required screws" value={results.requiredScrews.toLocaleString()} sub="before purchasing allowance" />
          <ResultCard label="Purchase screws" value={results.purchaseScrews.toLocaleString()} sub={`${Math.round(wastePct * 100)}% allowance`} />
        </div>
        <InfoBox>
          This calculator no longer uses a universal 8-in edge / 16-in wall / 12-in ceiling rule or averages walls and ceilings together. It estimates conventional applications at 16 in. wall or 12 in. ceiling spacing along framing lines. Verify screw type, length, framing compatibility and any rated/specialty assembly requirements before installation.
        </InfoBox>
      </section>
    </div>
  )
}
