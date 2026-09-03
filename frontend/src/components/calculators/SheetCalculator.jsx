import { useEffect, useMemo, useState } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import WasteSelector from './shared/WasteSelector'
import RoomPresets from './shared/RoomPresets'
import CalcDropdown from './shared/CalcDropdown'
import { calculateSheets } from '../../lib/calculators'

const DEFAULT_WALLS = [
  { id: 1, length: 12 },
  { id: 2, length: 14 },
  { id: 3, length: 12 },
  { id: 4, length: 14 },
]

const LS_KEY = 'dwCalc_sheet'
const sheetSizeOptions = [
  { value: 32, label: '4×8 ft', description: '32 sq ft' },
  { value: 40, label: '4×10 ft', description: '40 sq ft' },
  { value: 48, label: '4×12 ft', description: '48 sq ft · fewer field joints' },
]
const orientationOptions = [
  { value: 'horizontal', label: 'Horizontal', description: 'Often reduces joint footage when permitted' },
  { value: 'vertical', label: 'Vertical', description: 'Use when appropriate for the installation' },
]

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

export default function SheetCalculator({ onUpdate }) {
  const saved = loadSaved()
  const [walls, setWalls] = useState(saved.walls || DEFAULT_WALLS)
  const [ceilHeight, setCeilHeight] = useState(saved.ceilHeight ?? 9)
  const [sheetSize, setSheetSize] = useState(saved.sheetSize ?? 48)
  const [hangDir, setHangDir] = useState(saved.hangDir ?? 'horizontal')
  const [doors, setDoors] = useState(saved.doors ?? 1)
  const [windows, setWindows] = useState(saved.windows ?? 2)
  const [doorSqFt, setDoorSqFt] = useState(saved.doorSqFt ?? 21)
  const [windowSqFt, setWindowSqFt] = useState(saved.windowSqFt ?? 15)
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.10)
  const [inclCeiling, setInclCeiling] = useState(saved.inclCeiling ?? false)
  const [roomLength, setRoomLength] = useState(saved.roomLength ?? 12)
  const [roomWidth, setRoomWidth] = useState(saved.roomWidth ?? 14)
  const [showOpenings, setShowOpenings] = useState(false)

  const results = useMemo(() => calculateSheets({
    walls,
    ceilingHeight: ceilHeight,
    sheetSize,
    orientation: hangDir,
    includeCeiling: inclCeiling,
    roomLength,
    roomWidth,
    doors,
    doorSqFt,
    windows,
    windowSqFt,
    wastePct,
  }), [walls, ceilHeight, sheetSize, hangDir, inclCeiling, roomLength, roomWidth, doors, doorSqFt, windows, windowSqFt, wastePct])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ walls, ceilHeight, sheetSize, hangDir, doors, windows, doorSqFt, windowSqFt, wastePct, inclCeiling, roomLength, roomWidth }))
  }, [walls, ceilHeight, sheetSize, hangDir, doors, windows, doorSqFt, windowSqFt, wastePct, inclCeiling, roomLength, roomWidth])

  useEffect(() => {
    onUpdate?.({
      sheets: results.purchaseSheets,
      installedSheets: results.installedSheets,
      baseSheets: results.installedSheets,
      sheetSize,
      hangDir,
      gross: Math.round(results.grossArea),
      net: Math.round(results.netArea),
      wallArea: Math.round(results.wallArea),
      ceilArea: Math.round(results.ceilingArea),
      wastePct,
      numWalls: walls.length,
      doors,
      windows,
      inclCeiling,
      doorSqFt,
      windowSqFt,
      totalJointLinearFeet: Math.round(results.fieldJointLinearFt),
      ceilingPerimeterFt: Math.round(results.ceilingPerimeterFt),
      ceilHeight,
      roomLength,
      roomWidth,
      wallLayouts: results.wallLayouts,
    })
  }, [results, sheetSize, hangDir, wastePct, walls.length, doors, windows, inclCeiling, ceilHeight, roomLength, roomWidth, doorSqFt, windowSqFt, onUpdate])

  const updateWallLength = (id, length) => setWalls((current) => current.map((wall) => wall.id === id ? { ...wall, length: +length } : wall))
  const addWall = () => setWalls((current) => [...current, { id: Date.now(), length: 10 }])
  const removeWall = (id) => setWalls((current) => current.length > 1 ? current.filter((wall) => wall.id !== id) : current)

  const applyRoomPreset = (preset) => {
    if (Array.isArray(preset.walls)) setWalls(preset.walls.map((wall, index) => ({ id: Date.now() + index, length: wall.length })))
    if (preset.ceilHeight != null) setCeilHeight(preset.ceilHeight)
    if (preset.doors != null) setDoors(preset.doors)
    if (preset.windows != null) setWindows(preset.windows)
    if (preset.inclCeiling != null) setInclCeiling(preset.inclCeiling)
    if (preset.roomLength != null) setRoomLength(preset.roomLength)
    if (preset.roomWidth != null) setRoomWidth(preset.roomWidth)
    if (preset.doorSqFt != null) setDoorSqFt(preset.doorSqFt)
    if (preset.windowSqFt != null) setWindowSqFt(preset.windowSqFt)
  }

  const currentConfig = { walls, ceilHeight, doors, windows, wastePct, inclCeiling, roomLength, roomWidth, doorSqFt, windowSqFt }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Drywall sheet takeoff</p>
        <h2 className="text-lg font-semibold text-gray-900">How many sheets should I buy?</h2>
        <p className="text-sm text-gray-500 mt-1">Enter the room geometry, choose a conventional panel size, then add the purchasing allowance that fits your job.</p>
      </section>

      <RoomPresets onApply={applyRoomPreset} currentConfig={currentConfig} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Ceiling height (ft)</label>
          <input type="number" min="1" step="0.5" value={ceilHeight} onChange={(e) => setCeilHeight(+e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Sheet size</label>
          <CalcDropdown value={sheetSize} onChange={(value) => setSheetSize(+value)} options={sheetSizeOptions} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Wall orientation</label>
          <CalcDropdown value={hangDir} onChange={setHangDir} options={orientationOptions} />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Walls</p>
            <p className="text-xs text-gray-500">Enter each wall length. All walls use the ceiling height above.</p>
          </div>
          <button type="button" onClick={addWall} className="px-3 py-2 text-xs font-semibold rounded-xl border border-primary-200 text-primary-700 hover:bg-primary-50">+ Add wall</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {walls.map((wall, index) => {
            const layout = results.wallLayouts.find((item) => item.id === wall.id)
            return (
              <div key={wall.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold text-gray-900">Wall {index + 1}</span>
                  <span className="text-xs text-gray-500">{layout?.installedSheets || 0} installed sheets</span>
                </div>
                <div className="flex gap-2">
                  <input aria-label={`Wall ${index + 1} length in feet`} type="number" min="0" step="0.5" value={wall.length} onChange={(e) => updateWallLength(wall.id, e.target.value)} className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white" />
                  <button type="button" aria-label={`Remove wall ${index + 1}`} onClick={() => removeWall(wall.id)} disabled={walls.length === 1} className="px-3 rounded-xl border border-gray-200 text-gray-500 disabled:opacity-30">×</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={inclCeiling} onChange={(e) => setInclCeiling(e.target.checked)} />
          Include ceiling
        </label>
        {inclCeiling && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input aria-label="Room length in feet" type="number" min="0" step="0.5" value={roomLength} onChange={(e) => setRoomLength(+e.target.value)} className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl" />
            <input aria-label="Room width in feet" type="number" min="0" step="0.5" value={roomWidth} onChange={(e) => setRoomWidth(+e.target.value)} className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl" />
          </div>
        )}
      </section>

      <section>
        <button type="button" onClick={() => setShowOpenings((value) => !value)} className="text-sm font-medium text-primary-700">{showOpenings ? 'Hide' : 'Edit'} opening deductions</button>
        {showOpenings && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <label className="text-xs text-gray-600">Doors<input type="number" min="0" value={doors} onChange={(e) => setDoors(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-xl" /></label>
            <label className="text-xs text-gray-600">Sq ft / door<input type="number" min="0" step="0.5" value={doorSqFt} onChange={(e) => setDoorSqFt(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-xl" /></label>
            <label className="text-xs text-gray-600">Windows<input type="number" min="0" value={windows} onChange={(e) => setWindows(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-xl" /></label>
            <label className="text-xs text-gray-600">Sq ft / window<input type="number" min="0" step="0.5" value={windowSqFt} onChange={(e) => setWindowSqFt(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-xl" /></label>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Opening values are estimator inputs, not GA/ASTM default opening sizes.</p>
      </section>

      <section>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Purchasing allowance</p>
        <WasteSelector value={wastePct} onChange={setWastePct} />
      </section>

      <section className="border-t border-gray-200 pt-6" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResultCard label="Sheets to buy" value={results.purchaseSheets} sub={`${results.panel.label} · ${Math.round(wastePct * 100)}% allowance`} hero />
          <ResultCard label="Installed estimate" value={results.installedSheets} sub="before purchasing allowance" />
          <ResultCard label="Net finishable area" value={Math.round(results.netArea).toLocaleString()} sub="sq ft after openings" />
        </div>
        <InfoBox>
          Basic geometric takeoff for conventional non-rated drywall work. Panel layout is estimated from rectangular wall/ceiling geometry; openings reduce finishable area but do not automatically create whole-sheet savings. Verify specialty, rated, multilayer, or framing-dependent installations against the applicable system requirements.
        </InfoBox>
      </section>
    </div>
  )
}
