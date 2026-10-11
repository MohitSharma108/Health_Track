import { useMealsByDate } from '@/api/meals'
import { useProfile } from '@/api/profile'
import useDiaryStore from '@/store/diaryStore'
import { sumMacros, round0, MEAL_TYPES, calcTDEE, macroGoalsFromCalories } from '@/lib/macros'
import { NutritionSummaryCard } from '@/components/ui/MacroRing'
import DateNavigator from '@/components/diary/DateNavigator'
import MealSection from '@/components/diary/MealSection'
import { Spinner, EmptyState } from '@/components/ui'
import { Droplets } from 'lucide-react'

export default function DiaryPage() {
  const { selectedDate } = useDiaryStore()
  const { data: profile } = useProfile()
  const { data: meals = [], isLoading, refetch } = useMealsByDate(selectedDate)

  // Calculate goals from profile
  const tdee = calcTDEE(profile)
  const calGoal = profile?.calorieGoal || tdee
  const macroGoals = macroGoalsFromCalories(calGoal, profile?.goal || 'maintain')
  const goals = { cal: calGoal, ...macroGoals, fib: 25 }

  // Sum today's macros
  const allItems = meals.flatMap((m) => m.items || [])
  const totals = sumMacros(allItems.map((i) => i.macros))

  const waterGoal = profile?.waterGoal || 2500
  const waterToday = 0 // TODO: wire up water API

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Date navigator */}
      <DateNavigator className="mb-4" />

      {/* Calorie & macro summary */}
      <NutritionSummaryCard macros={totals} goals={goals} showRemaining={true} />

      {/* Water widget */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mt-3 mb-4">
        <Droplets size={18} className="text-blue-500" />
        <span className="text-sm font-semibold text-blue-700">Water: {waterToday} / {waterGoal} ml</span>
        <button className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800">+ Log</button>
      </div>

      {/* Meal sections */}
      <div className="mt-1">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : (
          <>
            {MEAL_TYPES.map((mt) => (
              <MealSection
                key={mt}
                mealType={mt}
                meals={meals}
                onRefetch={refetch}
              />
            ))}

            {/* Daily totals footer */}
            {allItems.length > 0 && (
              <div className="bg-[#1a1a2e] text-white rounded-2xl p-4 mt-2">
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Daily Total</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold">{round0(totals.cal)} <span className="opacity-60 font-normal">kcal</span></span>
                  <span className="text-sm font-bold text-blue-400">{round0(totals.p)}g <span className="opacity-60 font-normal">P</span></span>
                  <span className="text-sm font-bold text-yellow-400">{round0(totals.c)}g <span className="opacity-60 font-normal">C</span></span>
                  <span className="text-sm font-bold text-orange-400">{round0(totals.fat)}g <span className="opacity-60 font-normal">F</span></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
