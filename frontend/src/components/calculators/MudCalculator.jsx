import { useEffect, useMemo, useState } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'
import WasteSelector from './shared/WasteSelector'
import { calculateCompound, COMPOUND_PROFILES } from '../../lib/calculators'

const LS_KEY = 'dwCalc_mud'
const finishLevels = [0, 1, 2, 3, 4, 5].map((value) => ({
  value,
  label: `Level ${value}`,
  description: value === 0 ? 'No finishing' : value === 5 ? 'Level 4 joint treatment + full-surface skim coat' : 'GA-214 finish level',
}))
const profileOptions = Object.entries(COMPOUND_PROFILES).map(([value, profile]) => ({
  value,
  label: profile.label,
  description: `${profile.gallonsPer1000} gal / 1,000 sq ft planning coverage`,
}))

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

export default function MudCalculator({ onUpdate, sheetData }) {
  const saved = loadSaved()
  const [area, setArea] = useState(saved.area ?? 800)
  const [finishLevel, setFinishLevel] = useState(saved.finishLevel ?? 4)
  const [profile, setProfile] = useState(saved.profile ?? 'lightweight')
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.05)
  const [level5SkimGallonsPer1000, setLevel5SkimGallonsPer1000] = useState(saved.level5SkimGallonsPer1000 ?? 0)

  const syncedFromSheets = Number.isFinite(Number(sheetData?.net)) && Number(sheetData?.net) > 0
  const effectiveArea = syncedFromSheets ? Number(sheetData.net) : area
  const results = useMemo(() => calculateCompound({ areaSqFt: effectiveArea, finishLevel, profile, wastePct, level5SkimGallonsPer1000 }), [effectiveArea, finishLevel, profile, wastePct, level5SkimGallonsPer1000])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ area, finishLevel, profile, wastePct, level5SkimGallonsPer1000 }))
  }, [area, finishLevel, profile, wastePct, level5SkimGallonsPer1000])

  useEffect(() => {
    onUpdate?.({
      totalGallons: results.requiredGallons,
      purchaseGallons: results.purchaseGallons,
      buckets5gal: results.packages,
      buckets1gal: Math.ceil(results.purchaseGallons),
      finishLevel,
      compoundType: profile,
      coats: null,
      area: effectiveArea,
      syncedFromSheets,
      packageGallons: results.product.packageGallons,
      skimGallons: results.skimGallons,
      wastePct,
    })
  }, [results, finishLevel, profile, effectiveArea, syncedFromSheets, wastePct, onUpdate])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Joint compound estimate</p>
        <h2 className="text-lg font-semibold text-gray-900">How much compound should I buy?</h2>
        <p className="text-sm text-gray-500 mt-1">Uses published ready-mix planning coverage instead of a universal gallons-by-finish-level formula.</p>
      </section>

      {syncedFromSheets && <div className="px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-700"><strong>Using Sheets calculation</strong> · {effectiveArea.toLocaleString()} sq ft net finishable area.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-medium text-gray-600">Area (sq ft)
          <input type="number" min="0" value={effectiveArea} readOnly={syncedFromSheets} onChange={(e) => !syncedFromSheets && setArea(+e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white read-only:bg-gray-50" />
        </label>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Finish level</label><CalcDropdown value={finishLevel} onChange={(value) => setFinishLevel(+value)} options={finishLevels} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Compound profile</label><CalcDropdown value={profile} onChange={setProfile} options={profileOptions} /></div>
      </div>

      {finishLevel === 5 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Level 5 skim coat</p>
          <p className="text-xs text-amber-800 mt-1">GA Level 5 requires a full-surface skim coat over a Level 4 finish, but primary guidance does not define one universal skim thickness or gallons-per-area value. Enter a project/product planning rate only if you have one.</p>
          <label className="block text-xs font-medium text-amber-900 mt-3">Optional skim allowance (gal / 1,000 sq ft)
            <input type="number" min="0" step="0.1" value={level5SkimGallonsPer1000} onChange={(e) => setLevel5SkimGallonsPer1000(+e.target.value)} className="mt-1.5 w-full max-w-xs px-3 py-2.5 border border-amber-300 rounded-xl bg-white" />
          </label>
        </section>
      )}

      <section><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Purchasing allowance</p><WasteSelector value={wastePct} onChange={setWastePct} /></section>

      <section className="border-t border-gray-200 pt-6" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResultCard label="Packages to buy" value={results.packages} sub={`${results.product.packageGallons}-gal ${results.product.label.toLowerCase()}`} hero />
          <ResultCard label="Required compound" value={results.requiredGallons.toFixed(1)} sub="gal before purchasing allowance" />
          <ResultCard label="Purchase volume" value={results.purchaseGallons.toFixed(1)} sub={`gal · ${Math.round(wastePct * 100)}% allowance`} />
        </div>
        <InfoBox>
          Planning coverage is based on published ready-mix manufacturer coverage, not a GA/ASTM gallons-per-finish-level table. Levels 1–4 use conservative conventional joint-finishing coverage. Actual consumption varies by product, application, joint layout and workmanship. Level 5 skim material is separate and is included only when a skim planning rate is supplied.
        </InfoBox>
      </section>
    </div>
  )
}
