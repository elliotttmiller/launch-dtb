import { useEffect, useMemo, useState } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'
import WasteSelector from './shared/WasteSelector'
import { calculateCornerBead } from '../../lib/calculators'

const LS_KEY = 'dwCalc_bead'
const beadTypeOptions = [
  { value: 'metal', label: 'Metal corner bead', description: 'Conventional outside corners' },
  { value: 'vinyl', label: 'Vinyl corner bead', description: 'Follow product-specific attachment instructions' },
  { value: 'bullnose', label: 'Bullnose bead', description: 'Rounded outside corner profile' },
  { value: 'flex', label: 'Flexible / arch bead', description: 'Curved or irregular runs' },
]
const stockLengthOptions = [8, 10, 12].map((value) => ({ value, label: `${value} ft`, description: `${value}-ft stock section` }))

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY)) || {}
    if (data.beadType === 'standard') data.beadType = 'metal'
    return data
  } catch { return {} }
}

export default function CornerBeadCalculator({ onUpdate }) {
  const saved = loadSaved()
  const [corners, setCorners] = useState(saved.corners ?? 4)
  const [height, setHeight] = useState(saved.height ?? 9)
  const [measuredArchFt, setMeasuredArchFt] = useState(saved.measuredArchFt ?? 0)
  const [beadType, setBeadType] = useState(saved.beadType ?? 'metal')
  const [stockLength, setStockLength] = useState(saved.stockLength ?? 10)
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.05)

  const results = useMemo(() => calculateCornerBead({
    straightCorners: corners,
    heightFt: height,
    measuredArchFt,
    stockLengthFt: stockLength,
    wastePct,
  }), [corners, height, measuredArchFt, stockLength, wastePct])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ corners, height, measuredArchFt, beadType, stockLength, wastePct }))
  }, [corners, height, measuredArchFt, beadType, stockLength, wastePct])

  useEffect(() => {
    onUpdate?.({
      sections: results.sections,
      beadType,
      stockLength,
      totalFeet: results.requiredLinearFt,
      purchaseFeet: results.purchaseLinearFt,
      standardFeet: results.straightFt,
      archFeet: results.archFt,
      wastePct,
    })
  }, [results, beadType, stockLength, wastePct, onUpdate])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Corner bead estimate</p>
        <h2 className="text-lg font-semibold text-gray-900">How many bead sections do I need?</h2>
        <p className="text-sm text-gray-500 mt-1">Use straight-corner height plus measured curved runs. This avoids assuming every arch is a semicircle.</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-medium text-gray-600">Straight outside corners
          <input type="number" min="0" value={corners} onChange={(e) => setCorners(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white" />
        </label>
        <label className="text-xs font-medium text-gray-600">Corner height (ft)
          <input type="number" min="0" step="0.5" value={height} onChange={(e) => setHeight(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white" />
        </label>
        <label className="text-xs font-medium text-gray-600">Measured curved / arch bead (ft)
          <input type="number" min="0" step="0.5" value={measuredArchFt} onChange={(e) => setMeasuredArchFt(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Bead type</label><CalcDropdown value={beadType} onChange={setBeadType} options={beadTypeOptions} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Stock length</label><CalcDropdown value={stockLength} onChange={(value) => setStockLength(+value)} options={stockLengthOptions} /></div>
      </div>

      <section><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Purchasing allowance</p><WasteSelector value={wastePct} onChange={setWastePct} /></section>

      <section className="border-t border-gray-200 pt-6" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResultCard label="Sections to buy" value={results.sections} sub={`${stockLength}-ft sections`} hero />
          <ResultCard label="Required bead" value={results.requiredLinearFt.toFixed(1)} sub="linear ft before allowance" />
          <ResultCard label="Purchase footage" value={results.purchaseLinearFt.toFixed(1)} sub={`linear ft · ${Math.round(wastePct * 100)}% allowance`} />
        </div>
        <InfoBox>
          Section count is a purchasing estimate based on total footage and stock length; verify long individual runs and offcut usability before ordering. Attachment methods and spacing vary by bead product and manufacturer, so this calculator does not present one generic fastening rule as an industry standard.
        </InfoBox>
      </section>
    </div>
  )
}
