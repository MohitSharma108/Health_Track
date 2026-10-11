import { round1, round0, calcPct } from '@/lib/macros'

/**
 * Macro progress ring using SVG
 * Similar to Apple Fitness rings but for calories/macros
 */
export function MacroRing({ current, goal, size = 120, strokeWidth = 10, label, sublabel }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0)
  const offset = circ - (pct / 100) * circ
  const over = current > goal

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={over ? '#ef4444' : '#ff6b6b'}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-[#1a1a2e]">{round0(current)}</span>
          <span className="text-xs text-[#6b7280]">/ {round0(goal)}</span>
        </div>
      </div>
      {label && <span className="text-xs font-bold text-[#1a1a2e]">{label}</span>}
      {sublabel && <span className="text-xs text-[#6b7280]">{sublabel}</span>}
    </div>
  )
}

/**
 * Linear macro progress bar
 */
export function MacroBar({ label, current, goal, color = '#ff6b6b', unit = 'g' }) {
  const pct = calcPct(current, goal)
  const over = current > goal
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-[#6b7280]">{label}</span>
        <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-[#1a1a2e]'}`}>
          {round1(current)}<span className="text-[#6b7280] font-normal">/{round0(goal)}{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: over ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}

/**
 * MFP-style nutrition summary card
 */
export function NutritionSummaryCard({ macros = {}, goals = {}, showRemaining = true }) {
  const { cal = 0, p = 0, c = 0, fat = 0, fib = 0 } = macros
  const remaining = Math.max(0, (goals.cal || 2000) - cal)

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-sm">
      {/* Calorie equation */}
      {showRemaining && (
        <div className="flex items-center justify-between text-sm font-semibold mb-4 pb-3 border-b border-[#f3f4f6]">
          <span className="text-[#6b7280]">Goal: <span className="text-[#1a1a2e]">{round0(goals.cal || 2000)}</span></span>
          <span className="text-[#6b7280]">Food: <span className="text-[#ff6b6b]">{round0(cal)}</span></span>
          <span className="text-[#6b7280]">Left: <span className={cal > (goals.cal || 2000) ? 'text-red-500' : 'text-[#00c9a7]'}>{round0(remaining)}</span></span>
        </div>
      )}

      {/* Macro bars */}
      <div className="flex flex-col gap-3">
        <MacroBar label="Protein" current={p}   goal={goals.p   || 140} color="#4e9af1" />
        <MacroBar label="Carbs"   current={c}   goal={goals.c   || 250} color="#f59e0b" />
        <MacroBar label="Fat"     current={fat} goal={goals.fat || 65}  color="#f97316" />
        {fib > 0 && <MacroBar label="Fiber" current={fib} goal={goals.fib || 25} color="#10b981" />}
      </div>
    </div>
  )
}
