import { useState } from 'react'
import { Plus, MoreVertical, Trash2, Edit, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDeleteMeal } from '@/api/meals'
import { sumMacros, round1, round0, MEAL_ICONS } from '@/lib/macros'
import { cn, Card } from '@/components/ui'
import { toast } from '@/components/layout/Toaster'
import useDiaryStore from '@/store/diaryStore'

function FoodItemRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#f9fafb] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1a1a2e] truncate">{item.name}</div>
        <div className="text-xs text-[#6b7280]">
          {item.qty} {item.unit} · {round0(item.macros?.cal || 0)} kcal
        </div>
      </div>
      <div className="flex gap-2 text-xs font-bold shrink-0">
        <span className="text-blue-600">{round1(item.macros?.p || 0)}P</span>
        <span className="text-yellow-600">{round1(item.macros?.c || 0)}C</span>
        <span className="text-orange-600">{round1(item.macros?.fat || 0)}F</span>
      </div>
    </div>
  )
}

export default function MealSection({ mealType, meals = [], onRefetch }) {
  const navigate = useNavigate()
  const { setDraft, selectedDate } = useDiaryStore()
  const deleteMeal = useDeleteMeal()
  const [openMenu, setOpenMenu] = useState(null)

  const mealsOfType = meals.filter((m) => m.mealType === mealType)
  const totals = sumMacros(
    mealsOfType.flatMap((m) => (m.items || []).map((i) => i.macros))
  )

  const handleDelete = async (id) => {
    try {
      await deleteMeal.mutateAsync(id)
      toast('Meal deleted')
      onRefetch?.()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleEdit = (meal) => {
    setDraft({
      mealType: meal.mealType,
      date: meal.date,
      note: meal.note || '',
      editId: meal.id,
      items: (meal.items || []).map((i) => ({ ...i, id: crypto.randomUUID() })),
    })
    navigate('/log/draft')
  }

  const handleAdd = () => {
    setDraft({ mealType, date: selectedDate, note: '', editId: null, items: [] })
    navigate('/log')
  }

  return (
    <Card className="mb-3">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MEAL_ICONS[mealType]}</span>
          <div>
            <h3 className="font-bold text-sm text-[#1a1a2e]">{mealType}</h3>
            {totals.cal > 0 && (
              <span className="text-xs text-[#ff6b6b] font-semibold">{round0(totals.cal)} kcal</span>
            )}
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-semibold text-[#ff6b6b] px-3 py-1.5 rounded-lg hover:bg-[#fff0f0] transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Meal cards */}
      {mealsOfType.length === 0 ? (
        <button
          onClick={handleAdd}
          className="w-full text-xs text-[#6b7280] border border-dashed border-[#e5e7eb] rounded-xl py-4 text-center hover:bg-[#f9fafb] transition-colors"
        >
          Tap + Add to log {mealType.toLowerCase()}
        </button>
      ) : (
        mealsOfType.map((meal) => (
          <div key={meal.id} className="relative mb-2 last:mb-0">
            <div className="bg-[#f9fafb] rounded-xl border border-[#f0f0f0] px-3">
              {/* Meal items */}
              {(meal.items || []).map((item, i) => (
                <FoodItemRow key={i} item={item} />
              ))}
            </div>

            {/* Meal actions */}
            <div className="flex gap-2 mt-1.5 px-1">
              <button onClick={() => handleEdit(meal)} className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#ff6b6b] transition-colors">
                <Edit size={12} /> Edit
              </button>
              <button onClick={() => handleDelete(meal.id)} className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-red-500 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Macro totals for this meal type */}
      {totals.cal > 0 && (
        <div className="flex gap-3 mt-3 pt-2 border-t border-[#f3f4f6] text-xs text-[#6b7280]">
          <span><span className="font-bold text-blue-600">{round1(totals.p)}g</span> P</span>
          <span><span className="font-bold text-yellow-600">{round1(totals.c)}g</span> C</span>
          <span><span className="font-bold text-orange-600">{round1(totals.fat)}g</span> F</span>
        </div>
      )}
    </Card>
  )
}
