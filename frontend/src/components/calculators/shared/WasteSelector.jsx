import { useState } from 'react'

const QUICK_LEVELS = [0.05, 0.10, 0.15, 0.20]

export default function WasteSelector({ value, onChange }) {
  const isCustom = !QUICK_LEVELS.includes(value)
  const [showCustom, setShowCustom] = useState(isCustom)
  const [customInput, setCustomInput] = useState(isCustom ? String(Math.round(value * 100)) : '')

  const handleQuickPick = (next) => {
    setShowCustom(false)
    onChange(next)
  }

  const handleCustomToggle = () => {
    setShowCustom((current) => {
      if (!current) setCustomInput(String(Math.round(value * 100)))
      return !current
    })
  }

  const handleCustomChange = (raw) => {
    setCustomInput(raw)
    const number = Number.parseFloat(raw)
    if (Number.isFinite(number) && number >= 0 && number <= 100) onChange(number / 100)
    if (raw === '') onChange(0)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="group" aria-label="Purchasing allowance">
        {QUICK_LEVELS.map((level) => (
          <button
            type="button"
            key={level}
            aria-pressed={!showCustom && value === level}
            className={`px-2 py-2.5 text-sm rounded-xl border transition-all text-center font-semibold ${
              !showCustom && value === level
                ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300'
            }`}
            onClick={() => handleQuickPick(level)}
          >
            {Math.round(level * 100)}%
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showCustom}
          className={`px-2 py-2.5 text-sm rounded-xl border transition-all text-center font-semibold ${
            showCustom ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300'
          }`}
          onClick={handleCustomToggle}
        >
          {showCustom && customInput !== '' ? `${customInput}%` : 'Custom'}
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            aria-label="Custom purchasing allowance percent"
            type="number"
            min={0}
            max={100}
            step={1}
            value={customInput}
            onChange={(event) => handleCustomChange(event.target.value)}
            placeholder="e.g. 12"
            className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
          />
          <span className="text-sm text-gray-500">% purchasing allowance</span>
        </div>
      )}
      <p className="text-xs text-gray-400">Optional estimator allowance for cuts, damage, breakage and field conditions; not a GA/ASTM requirement.</p>
    </div>
  )
}
