import { useState, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Check } from 'lucide-react'
import { round1, round0 } from '@/lib/macros'
import { Button, Card, Chip, Input, SectionLabel } from '@/components/ui'
import { NutritionSummaryCard } from '@/components/ui/MacroRing'
import { toast } from '@/components/layout/Toaster'
import useDiaryStore from '@/store/diaryStore'

const HAND_PORTIONS = [
  { label: 'Palm (Protein)', grams: 100, desc: '~100g paneer, chicken, tofu' },
  { label: 'Fist (Carbs/Veg)', grams: 150, desc: '~150g rice, dal, sabzi' },
  { label: 'Cupped Hand (Snacks)', grams: 80, desc: '~80g nuts, makhana' },
  { label: 'Thumb (Fats/Oils)', grams: 15, desc: '~15g ghee, butter, oil' },
]

export default function FoodDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { ensureDraft, addDraftItem } = useDiaryStore()

  const food = location.state?.food || {
    id: id || 'custom',
    name: 'Food Item',
    per100: { cal: 100, p: 5, c: 15, fat: 2, fib: 1 },
    serving: { qty: 100, unit: 'g', grams: 100 },
  }

  const [qty, setQty] = useState(food.serving?.qty || 100)
  const [unit, setUnit] = useState(food.serving?.unit || 'g')
  const [customOverrides, setCustomOverrides] = useState(null)

  // Calculate macros for given qty
  const baseGrams = unit === 'g' || unit === 'ml' ? qty : (food.serving?.grams || 100) * (qty / (food.serving?.qty || 1))
  const ratio = (Number(baseGrams) || 100) / 100

  const calculatedMacros = useMemo(() => {
    if (customOverrides) return customOverrides
    const p100 = food.per100 || {}
    return {
      cal: Math.round((p100.cal || 0) * ratio),
      p: round1((p100.p || 0) * ratio),
      c: round1((p100.c || 0) * ratio),
      fat: round1((p100.fat || 0) * ratio),
      fib: round1((p100.fib || 0) * ratio),
      sug: round1((p100.sug || 0) * ratio),
      sat: round1((p100.sat || 0) * ratio),
      sod: Math.round((p100.sod || 0) * ratio),
    }
  }, [food, ratio, customOverrides])

  const handleStep = (delta) => {
    setCustomOverrides(null)
    setQty((prev) => Math.max(1, Math.round((Number(prev) || 0) + delta)))
  }

  const handleMultiplier = (m) => {
    setCustomOverrides(null)
    const base = food.serving?.qty || 100
    setQty(Math.round(base * m))
  }

  const handleHandPortion = (grams) => {
    setCustomOverrides(null)
    setUnit('g')
    setQty(grams)
  }

  const handleAdd = () => {
    ensureDraft()
    addDraftItem({
      foodId: food.id,
      name: food.name,
      qty: Number(qty) || 100,
      unit,
      macros: calculatedMacros,
      source: 'manual',
    })
    toast(`Added ${food.name} to meal`)
    navigate('/log/draft')
  }

  return (
    <div className="pt-4 px-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#1a1a2e] leading-tight truncate">{food.name}</h1>
          <p className="text-xs text-[#6b7280]">{food.brand ? `${food.brand} · ` : ''}Customizable portion</p>
        </div>
      </div>

      {/* Portion Controller Card */}
      <Card className="mb-4">
        <SectionLabel>Serving & Quantity</SectionLabel>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center bg-[#f3f4f6] rounded-xl p-1 border border-[#e5e7eb]">
            <button
              onClick={() => handleStep(-10)}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-white rounded-lg transition-colors"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) => {
                setCustomOverrides(null)
                setQty(Math.max(1, Number(e.target.value) || 0))
              }}
              className="w-16 text-center font-black text-base bg-transparent focus:outline-none"
            />
            <button
              onClick={() => handleStep(10)}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-white rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <select
            value={unit}
            onChange={(e) => {
              setCustomOverrides(null)
              setUnit(e.target.value)
            }}
            className="flex-1 rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-[#ff6b6b]"
          >
            {['g', 'ml', 'piece', 'serving', 'bowl', 'cup', 'tbsp', 'tsp'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Multiplier Chips */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {[0.5, 1, 1.5, 2, 3].map((m) => (
            <Chip key={m} onClick={() => handleMultiplier(m)}>
              ×{m}
            </Chip>
          ))}
        </div>

        {/* Hand Portion Quick Guide */}
        <div className="border-t border-[#f3f4f6] pt-3 mt-1">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-2">Visual Hand Estimate</span>
          <div className="flex gap-1.5 flex-wrap">
            {HAND_PORTIONS.map((hp) => (
              <Chip key={hp.label} onClick={() => handleHandPortion(hp.grams)} title={hp.desc}>
                {hp.label} <span className="text-[10px] opacity-70">({hp.grams}g)</span>
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* Macros Preview */}
      <NutritionSummaryCard
        macros={calculatedMacros}
        goals={{ cal: 2000, p: 140, c: 250, fat: 65 }}
        showRemaining={false}
      />

      {/* Manual Override Accordion */}
      <Card className="mt-4 mb-4">
        <SectionLabel>✏️ Direct Macro Overrides (Optional)</SectionLabel>
        <p className="text-xs text-[#6b7280] mb-3">
          Have an item with more protein or custom values? Edit calories and macros directly here:
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input
            label="Calories (kcal)"
            type="number"
            value={calculatedMacros.cal}
            onChange={(e) =>
              setCustomOverrides((prev) => ({
                ...(prev || calculatedMacros),
                cal: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
          <Input
            label="Protein (g)"
            type="number"
            step="0.1"
            value={calculatedMacros.p}
            onChange={(e) =>
              setCustomOverrides((prev) => ({
                ...(prev || calculatedMacros),
                p: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Carbs (g)"
            type="number"
            step="0.1"
            value={calculatedMacros.c}
            onChange={(e) =>
              setCustomOverrides((prev) => ({
                ...(prev || calculatedMacros),
                c: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
          <Input
            label="Fat (g)"
            type="number"
            step="0.1"
            value={calculatedMacros.fat}
            onChange={(e) =>
              setCustomOverrides((prev) => ({
                ...(prev || calculatedMacros),
                fat: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
      </Card>

      {/* Add Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full shadow-lg font-bold text-base py-3.5"
        onClick={handleAdd}
      >
        <Check size={18} /> Add to Meal ({round0(calculatedMacros.cal)} kcal · {round1(calculatedMacros.p)}g P)
      </Button>
    </div>
  )
}
