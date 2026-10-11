import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Trash2, Check, Sparkles, UtensilsCrossed } from 'lucide-react'
import useDiaryStore from '@/store/diaryStore'
import { useAddMeal, useUpdateMeal } from '@/api/meals'
import { sumMacros, round1, round0, MEAL_TYPES, MEAL_ICONS } from '@/lib/macros'
import { Button, Card, Chip, Input, SectionLabel } from '@/components/ui'
import { NutritionSummaryCard } from '@/components/ui/MacroRing'
import { toast } from '@/components/layout/Toaster'
import Sheet from '@/components/ui/Sheet'

export default function DraftReviewPage() {
  const navigate = useNavigate()
  const { draft, updateDraft, removeDraftItem, updateDraftItem, addDraftItem, clearDraft } = useDiaryStore()
  const addMeal = useAddMeal()
  const updateMeal = useUpdateMeal()

  const [customSheetOpen, setCustomSheetOpen] = useState(false)
  const [customItem, setCustomItem] = useState({
    name: '',
    qty: 100,
    unit: 'g',
    cal: 100,
    p: 5,
    c: 15,
    fat: 2,
    fib: 1,
  })

  const items = draft?.items || []
  const totals = sumMacros(items.map((i) => i.macros))

  const handleStepQty = (item, delta) => {
    const oldQty = Number(item.qty) || 1
    const newQty = Math.max(1, oldQty + delta)
    const ratio = newQty / oldQty
    const newMacros = {
      cal: Math.round((item.macros?.cal || 0) * ratio),
      p: round1((item.macros?.p || 0) * ratio),
      c: round1((item.macros?.c || 0) * ratio),
      fat: round1((item.macros?.fat || 0) * ratio),
      fib: round1((item.macros?.fib || 0) * ratio),
    }
    updateDraftItem(item.id, { qty: newQty, macros: newMacros })
  }

  const handleAddCustom = () => {
    if (!customItem.name.trim()) {
      toast('Please enter a name for the ingredient', 'warning')
      return
    }
    addDraftItem({
      name: customItem.name.trim(),
      qty: Number(customItem.qty) || 100,
      unit: customItem.unit || 'g',
      macros: {
        cal: Math.round(Number(customItem.cal) || 0),
        p: round1(Number(customItem.p) || 0),
        c: round1(Number(customItem.c) || 0),
        fat: round1(Number(customItem.fat) || 0),
        fib: round1(Number(customItem.fib) || 0),
      },
      source: 'manual',
    })
    setCustomSheetOpen(false)
    setCustomItem({ name: '', qty: 100, unit: 'g', cal: 100, p: 5, c: 15, fat: 2, fib: 1 })
    toast('Ingredient added to meal')
  }

  const handleSaveMeal = async () => {
    if (items.length === 0) {
      toast('Add at least one item to save meal', 'warning')
      return
    }
    try {
      const payload = {
        mealType: draft.mealType || 'Lunch',
        date: draft.date,
        items: items.map((i) => ({
          foodId: i.foodId || null,
          name: i.name,
          qty: i.qty,
          unit: i.unit,
          macros: i.macros,
          source: i.source || 'manual',
        })),
        note: draft.note || '',
      }

      if (draft.editId) {
        await updateMeal.mutateAsync({ id: draft.editId, ...payload })
        toast('Meal updated successfully')
      } else {
        await addMeal.mutateAsync(payload)
        toast('Meal logged successfully')
      }
      clearDraft()
      navigate('/diary')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="pt-4 px-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/diary')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-[#1a1a2e]">
          {draft?.editId ? '✏️ Edit Meal' : 'Review Meal'}
        </h1>
        <div className="w-9" />
      </div>

      {/* Meal Type Chip Row */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {MEAL_TYPES.map((mt) => (
          <Chip
            key={mt}
            active={draft?.mealType === mt}
            onClick={() => updateDraft((d) => ({ ...d, mealType: mt }))}
          >
            {MEAL_ICON_MAP[mt] || '🍽️'} {mt}
          </Chip>
        ))}
      </div>

      {/* Items List */}
      <SectionLabel>Foods in this meal ({items.length})</SectionLabel>
      <div className="flex flex-col gap-2.5 mb-4">
        {items.length === 0 ? (
          <Card className="text-center py-8 text-[#6b7280]">
            <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No items added yet</p>
            <p className="text-xs mt-1">Tap below to add ingredients or search foods</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#1a1a2e] truncate">{item.name}</div>
                  <div className="text-xs text-[#ff6b6b] font-semibold">
                    {item.qty} {item.unit} · {round0(item.macros?.cal || 0)} kcal
                  </div>
                </div>

                {/* Inline Stepper */}
                <div className="flex items-center bg-[#f3f4f6] rounded-xl p-0.5 border border-[#e5e7eb]">
                  <button
                    onClick={() => handleStepQty(item, -10)}
                    className="w-7 h-7 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-xs">{item.qty}</span>
                  <button
                    onClick={() => handleStepQty(item, 10)}
                    className="w-7 h-7 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeDraftItem(item.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Item Macros Row */}
              <div className="flex gap-3 text-xs mt-2 pt-2 border-t border-[#f9fafb] text-[#6b7280]">
                <span><b className="text-blue-600">{round1(item.macros?.p || 0)}g</b> P</span>
                <span><b className="text-yellow-600">{round1(item.macros?.c || 0)}g</b> C</span>
                <span><b className="text-orange-600">{round1(item.macros?.fat || 0)}g</b> F</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="font-bold py-2.5"
          onClick={() => setCustomSheetOpen(true)}
        >
          <Plus size={14} /> Add Ingredient
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="font-bold py-2.5"
          onClick={() => navigate('/log')}
        >
          🔍 Search Food
        </Button>
      </div>

      {/* Estimated Total Nutrition */}
      <NutritionSummaryCard
        macros={totals}
        goals={{ cal: 2000, p: 140, c: 250, fat: 65 }}
        showRemaining={false}
      />

      {/* Note Input */}
      <div className="mt-4 mb-4">
        <Input
          label="Note (optional)"
          placeholder="e.g. Lunch with team, post-workout meal"
          value={draft?.note || ''}
          onChange={(e) => updateDraft((d) => ({ ...d, note: e.target.value }))}
        />
      </div>

      {/* Save Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full shadow-lg font-bold text-base py-3.5"
        disabled={items.length === 0}
        onClick={handleSaveMeal}
      >
        <Check size={18} /> {draft?.editId ? 'Save Changes' : 'Save Meal'} ({round0(totals.cal)} kcal · {round1(totals.p)}g P)
      </Button>

      {/* Add Custom Ingredient Bottom Sheet */}
      <Sheet
        open={customSheetOpen}
        onClose={() => setCustomSheetOpen(false)}
        title="➕ Add Custom Ingredient"
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Ingredient / Food Name *"
            placeholder="e.g. 40g Basmati Rice, 20g Paneer"
            value={customItem.name}
            onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Quantity"
              type="number"
              value={customItem.qty}
              onChange={(e) => setCustomItem({ ...customItem, qty: Number(e.target.value) || 0 })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#6b7280]">Unit</label>
              <select
                value={customItem.unit}
                onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })}
                className="w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#ff6b6b]"
              >
                {['g', 'ml', 'piece', 'tbsp', 'tsp', 'cup', 'bowl', 'serving'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Calories (kcal)"
              type="number"
              value={customItem.cal}
              onChange={(e) => setCustomItem({ ...customItem, cal: Number(e.target.value) || 0 })}
            />
            <Input
              label="Protein (g)"
              type="number"
              step="0.1"
              value={customItem.p}
              onChange={(e) => setCustomItem({ ...customItem, p: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Carbs (g)"
              type="number"
              step="0.1"
              value={customItem.c}
              onChange={(e) => setCustomItem({ ...customItem, c: Number(e.target.value) || 0 })}
            />
            <Input
              label="Fat (g)"
              type="number"
              step="0.1"
              value={customItem.fat}
              onChange={(e) => setCustomItem({ ...customItem, fat: Number(e.target.value) || 0 })}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full mt-2 font-bold py-3"
            onClick={handleAddCustom}
          >
            Add to Meal ({round0(customItem.cal)} kcal)
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

const MEAL_ICON_MAP = {
  Breakfast: '🌅',
  Lunch: '🍱',
  Dinner: '🌙',
  Snacks: '🍎',
}
