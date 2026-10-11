import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Check } from 'lucide-react'
import { useAddMeal } from '@/api/meals'
import useDiaryStore from '@/store/diaryStore'
import { round1, round0, MEAL_TYPES, MEAL_ICONS } from '@/lib/macros'
import { Button, Card, Chip, Input, SectionLabel } from '@/components/ui'
import { NutritionSummaryCard } from '@/components/ui/MacroRing'
import { toast } from '@/components/layout/Toaster'

export default function QuickAddPage() {
  const navigate = useNavigate()
  const { selectedDate, draft } = useDiaryStore()
  const addMeal = useAddMeal()

  const [mealType, setMealType] = useState(draft?.mealType || 'Snacks')
  const [name, setName] = useState('')
  const [cal, setCal] = useState(250)
  const [p, setP] = useState(15)
  const [c, setC] = useState(25)
  const [fat, setFat] = useState(8)
  const [fib, setFib] = useState(2)

  const macros = {
    cal: Number(cal) || 0,
    p: round1(Number(p) || 0),
    c: round1(Number(c) || 0),
    fat: round1(Number(fat) || 0),
    fib: round1(Number(fib) || 0),
  }

  const handleSave = async () => {
    if (!macros.cal) {
      toast('Please enter calories', 'warning')
      return
    }
    try {
      await addMeal.mutateAsync({
        mealType,
        date: selectedDate,
        items: [
          {
            name: name.trim() || `Quick ${mealType}`,
            qty: 1,
            unit: 'serving',
            macros,
            source: 'quick_add',
          },
        ],
        note: name.trim() ? `Quick entry: ${name.trim()}` : '',
      })
      toast(`Logged ${macros.cal} kcal to ${mealType}`)
      navigate('/diary')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="pt-4 px-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#1a1a2e]">⚡ Quick Calories & Macros</h1>
          <p className="text-xs text-[#6b7280]">Directly log numbers without searching ingredients</p>
        </div>
      </div>

      {/* Meal Type Selection */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {MEAL_TYPES.map((mt) => (
          <Chip key={mt} active={mealType === mt} onClick={() => setMealType(mt)}>
            {MEAL_ICONS[mt]} {mt}
          </Chip>
        ))}
      </div>

      <Card className="mb-4">
        <Input
          label="Meal / Snack Description (Optional)"
          placeholder="e.g. Protein shake, bakery croissant, paneer wrap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3"
          autoFocus
        />

        <div className="mb-3">
          <label className="text-xs font-semibold text-[#6b7280] block mb-1">Calories (kcal) *</label>
          <input
            type="number"
            value={cal}
            onChange={(e) => setCal(e.target.value)}
            className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-2xl font-black text-[#ff6b6b] focus:outline-none focus:border-[#ff6b6b] bg-white"
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <Input
            label="Protein (g)"
            type="number"
            step="0.1"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
          <Input
            label="Carbs (g)"
            type="number"
            step="0.1"
            value={c}
            onChange={(e) => setC(e.target.value)}
          />
          <Input
            label="Fat (g)"
            type="number"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
          />
        </div>

        <Input
          label="Fiber (g) - Optional"
          type="number"
          step="0.1"
          value={fib}
          onChange={(e) => setFib(e.target.value)}
        />
      </Card>

      {/* Live Preview */}
      <NutritionSummaryCard
        macros={macros}
        goals={{ cal: 2000, p: 140, c: 250, fat: 65 }}
        showRemaining={false}
      />

      <Button
        variant="primary"
        size="lg"
        className="w-full shadow-lg font-bold text-base py-3.5 mt-4"
        onClick={handleSave}
      >
        <Check size={18} /> Log Quick {mealType} ({round0(macros.cal)} kcal)
      </Button>
    </div>
  )
}
