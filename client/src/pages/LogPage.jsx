import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFoodSearch } from '@/api/foods'
import { useProfile } from '@/api/profile'
import useDiaryStore from '@/store/diaryStore'
import { round1, round0, MEAL_TYPES, MEAL_ICONS } from '@/lib/macros'
import { Button, Spinner, EmptyState, Card, Chip, Input } from '@/components/ui'
import { Search, Camera, Barcode, Zap, ChevronRight } from 'lucide-react'
import { toast } from '@/components/layout/Toaster'

function FoodResult({ food, onSelect }) {
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors last:border-0"
    >
      <div className="w-10 h-10 rounded-xl bg-[#fff0f0] flex items-center justify-center text-lg flex-shrink-0">
        🍽️
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1a1a2e] truncate">{food.name}</div>
        <div className="text-xs text-[#6b7280]">
          {round0((food.per100?.cal || 0))}kcal · {round1(food.per100?.p || 0)}g protein per 100g
        </div>
      </div>
      <ChevronRight size={16} className="text-[#6b7280] flex-shrink-0" />
    </button>
  )
}

export default function LogPage() {
  const navigate = useNavigate()
  const { setDraft, ensureDraft, selectedDate, draft } = useDiaryStore()
  const [q, setQ] = useState('')
  const [activeMealType, setActiveMealType] = useState(draft?.mealType || 'Lunch')

  const { data: results, isLoading } = useFoodSearch(q)

  const handleSelectFood = (food) => {
    ensureDraft(activeMealType)
    navigate(`/log/food/${food.id}`, { state: { food } })
  }

  return (
    <div className="pt-5 pb-4">
      {/* Header */}
      <div className="px-4 mb-4">
        <h1 className="text-xl font-black text-[#1a1a2e]">Log Food</h1>
        <p className="text-sm text-[#6b7280]">Search, scan, or add a custom item</p>
      </div>

      {/* Meal type selector */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {MEAL_TYPES.map((mt) => (
            <Chip
              key={mt}
              active={activeMealType === mt}
              onClick={() => setActiveMealType(mt)}
              className="flex-shrink-0"
            >
              {MEAL_ICONS[mt]} {mt}
            </Chip>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Barcode, label: 'Scan Barcode', to: '/log/barcode', color: '#4e9af1' },
          { icon: Camera,  label: 'Photo AI',     to: '/log/photo',   color: '#00c9a7' },
          { icon: Zap,     label: 'Quick Cal',    to: '/log/quick',   color: '#f59e0b' },
        ].map(({ icon: Icon, label, to, color }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
              <Icon size={22} style={{ color }} />
            </div>
            <span className="text-xs font-semibold text-[#1a1a2e] text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search 500,000+ foods..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-[#e5e7eb] pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] bg-white"
            autoFocus
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-4 bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        {!q ? (
          <div className="px-4 py-6 text-sm text-[#6b7280] text-center">
            Start typing to search foods, or use quick actions above
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (results || []).length === 0 ? (
          <EmptyState icon="🔍" title="No results" body={`No foods found for "${q}". Try scanning a barcode or adding a custom item.`} />
        ) : (
          (results || []).slice(0, 20).map((food) => (
            <FoodResult key={food.id} food={food} onSelect={handleSelectFood} />
          ))
        )}
      </div>
    </div>
  )
}
