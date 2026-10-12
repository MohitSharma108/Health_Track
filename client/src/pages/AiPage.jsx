import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, RefreshCw, Plus, Edit3, MessageSquare, Send, Calendar } from 'lucide-react'
import { useWhatToEat, usePlanDay, useAiAssistant } from '@/api/ai'
import { useProfile } from '@/api/profile'
import { useMealsByDate, useAddMeal } from '@/api/meals'
import useDiaryStore from '@/store/diaryStore'
import { sumMacros, round1, round0, MEAL_ICONS } from '@/lib/macros'
import { Button, Card, Chip, Input, Spinner, SectionLabel } from '@/components/ui'
import { toast } from '@/components/layout/Toaster'
import dayjs from 'dayjs'

export default function AiPage() {
  const navigate = useNavigate()
  const { selectedDate, setDraft, ensureDraft } = useDiaryStore()
  const { data: profile } = useProfile()
  const { data: todayMeals = [] } = useMealsByDate(selectedDate)
  const addMeal = useAddMeal()

  const [activeTab, setActiveTab] = useState('eatNow') // 'eatNow' | 'planDay' | 'chat'

  // AI Mutations
  const whatToEatMutation = useWhatToEat()
  const planDayMutation = usePlanDay()
  const assistantMutation = useAiAssistant()

  // Local states
  const [suggestion, setSuggestion] = useState(null)
  const [dayPlan, setDayPlan] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaste! I am your Nourish AI Nutritionist. Ask me anything about your macros, high-protein Indian alternatives, meal prep, or portion advice.',
    },
  ])
  const [inputChat, setInputChat] = useState('')

  // Calculate current context
  const consumedMacros = sumMacros(todayMeals.flatMap((m) => (m.items || []).map((i) => i.macros)))
  const calGoal = profile?.calorieGoal || 2000
  const proteinGoal = profile?.proteinGoal || 140
  const remainingProtein = Math.max(0, proteinGoal - consumedMacros.p)
  const remainingCalories = Math.max(0, calGoal - consumedMacros.cal)

  const handleFetchEatNow = async () => {
    try {
      const res = await whatToEatMutation.mutateAsync({
        remainingProtein,
        remainingCalories,
        dietPreference: profile?.dietPreference || 'vegetarian',
        allergies: profile?.allergies || [],
        currentTime: dayjs().format('HH:mm'),
      })
      setSuggestion(res.recommendation || res)
      toast('Generated fresh meal recommendation')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleFetchPlanDay = async () => {
    try {
      const res = await planDayMutation.mutateAsync({
        targetCalories: calGoal,
        targetProtein: proteinGoal,
        dietPreference: profile?.dietPreference || 'vegetarian',
        targetDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      })
      setDayPlan(res.plan || res)
      toast('Generated customized 4-meal daily plan')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleCustomizeInDraft = (meal) => {
    const items = (meal.ingredients || []).map((ing) => ({
      id: crypto.randomUUID(),
      name: ing.name,
      qty: parseFloat(ing.qty) || 100,
      unit: ing.qty?.replace(/[0-9.]/g, '').trim() || 'g',
      macros: {
        cal: ing.calories || Math.round((meal.calories || 300) / (meal.ingredients?.length || 1)),
        p: ing.proteinG || round1((meal.proteinG || 25) / (meal.ingredients?.length || 1)),
        c: ing.carbsG || 20,
        fat: ing.fatG || 8,
      },
    }))

    setDraft({
      mealType: meal.mealType || 'Dinner',
      date: selectedDate,
      items: items.length > 0 ? items : [{
        id: crypto.randomUUID(),
        name: meal.title || meal.name,
        qty: 1,
        unit: 'portion',
        macros: {
          cal: meal.calories || 350,
          p: meal.proteinG || 30,
          c: meal.carbsG || 35,
          fat: meal.fatG || 10,
        },
      }],
      note: meal.title || '',
      editId: null,
    })
    navigate('/log/draft')
  }

  const handleSendChat = async (e) => {
    e?.preventDefault()
    if (!inputChat.trim()) return
    const userMsg = inputChat.trim()
    setInputChat('')
    const newHistory = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newHistory)

    try {
      const res = await assistantMutation.mutateAsync({
        message: userMsg,
        history: newHistory,
      })
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.reply || res.message || res.text }])
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="pt-4 px-4 pb-16">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-[#1a1a2e] flex items-center gap-2">
          <Sparkles className="text-[#ff6b6b]" size={22} /> AI Nutrition Coach
        </h1>
        <p className="text-xs text-[#6b7280]">Real-time recommendations, tomorrow's planning & chat</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#e5e7eb] p-1 rounded-2xl mb-4">
        {[
          { id: 'eatNow', label: 'Eat Right Now' },
          { id: 'planDay', label: 'Plan Tomorrow' },
          { id: 'chat', label: 'Ask AI' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a2e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: What Should I Eat Now */}
      {activeTab === 'eatNow' && (
        <div className="flex flex-col gap-4">
          <Card className="bg-gradient-to-br from-[#fff0f0] to-white border-[#ffd8d8]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[#ff6b6b] uppercase tracking-wider">Remaining for Today</span>
              <span className="text-xs font-semibold text-[#6b7280]">{round0(remainingCalories)} kcal left</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-black text-[#1a1a2e]">{round1(remainingProtein)}g</span>
                <span className="text-xs text-[#6b7280] block font-semibold">Protein needed</span>
              </div>
              <Button
                variant="primary"
                size="md"
                className="ml-auto font-bold"
                onClick={handleFetchEatNow}
                loading={whatToEatMutation.isPending}
              >
                <Sparkles size={16} /> Suggest Meal
              </Button>
            </div>
          </Card>

          {suggestion ? (
            <Card>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-base font-black text-[#1a1a2e] leading-snug">{suggestion.title}</h3>
                  <p className="text-xs text-[#6b7280] mt-0.5">{suggestion.prepTime || '15 mins'} · {suggestion.mealType || 'Meal'}</p>
                </div>
                <span className="bg-[#fff0f0] text-[#ff6b6b] text-xs font-extrabold px-2.5 py-1 rounded-full">
                  {suggestion.calories} kcal · {suggestion.proteinG}g P
                </span>
              </div>

              {/* Exact ingredient quantities box */}
              {suggestion.portionBreakdown && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-3 my-3">
                  <span className="text-[11px] font-black text-[#1a1a2e] uppercase tracking-wider block mb-1">
                    ⚖️ Exactly How Much To Take:
                  </span>
                  <p className="text-xs font-medium text-[#4b5563] whitespace-pre-line leading-relaxed">
                    {suggestion.portionBreakdown}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 font-bold"
                  onClick={() => handleCustomizeInDraft(suggestion)}
                >
                  <Edit3 size={15} /> Customize in Draft
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleFetchEatNow}
                  loading={whatToEatMutation.isPending}
                  title="Generate another suggestion"
                >
                  <RefreshCw size={15} />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-10 text-[#6b7280]">
              <Sparkles size={36} className="mx-auto mb-2 text-[#ff6b6b] opacity-60" />
              <p className="text-sm font-bold text-[#1a1a2e]">Need dinner or snack ideas?</p>
              <p className="text-xs text-[#6b7280] mt-1 max-w-xs mx-auto">
                Tap "Suggest Meal" to get high-protein Indian options calculated specifically for your remaining {round1(remainingProtein)}g protein.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Plan Tomorrow */}
      {activeTab === 'planDay' && (
        <div className="flex flex-col gap-4">
          <Card className="bg-[#f9fafb]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#1a1a2e]">Tomorrow's Target Schedule</h3>
                <p className="text-xs text-[#6b7280]">Target: {calGoal} kcal · {proteinGoal}g protein</p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="font-bold"
                onClick={handleFetchPlanDay}
                loading={planDayMutation.isPending}
              >
                <Calendar size={15} /> Generate Plan
              </Button>
            </div>
          </Card>

          {dayPlan?.meals ? (
            <div className="flex flex-col gap-3">
              {dayPlan.meals.map((m, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase text-[#6b7280]">
                      {MEAL_ICONS[m.mealType] || '🍽️'} {m.mealType}
                    </span>
                    <span className="text-xs font-bold text-[#ff6b6b]">
                      {m.calories} kcal · {m.proteinG}g P
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#1a1a2e]">{m.title}</h4>
                  {m.portionBreakdown && (
                    <p className="text-xs text-[#6b7280] mt-1 bg-[#f9fafb] p-2 rounded-lg">
                      {m.portionBreakdown}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold"
                      onClick={() => handleCustomizeInDraft(m)}
                    >
                      <Edit3 size={12} /> Customize in Draft
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10 text-[#6b7280]">
              <Calendar size={36} className="mx-auto mb-2 text-[#4e9af1] opacity-60" />
              <p className="text-sm font-bold text-[#1a1a2e]">Plan Ahead for Tomorrow</p>
              <p className="text-xs text-[#6b7280] mt-1 max-w-xs mx-auto">
                Generate a complete 4-meal daily menu tailored to hit your {proteinGoal}g protein target effortlessly.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: AI Chat */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[520px]">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#ff6b6b] text-white font-medium'
                      : 'bg-white border border-[#e5e7eb] text-[#1a1a2e] shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {assistantMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 text-xs text-[#6b7280] flex items-center gap-2">
                  <Spinner size={14} /> AI is analyzing and thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <Input
              placeholder="Ask about high-protein options, recipes, diet tips..."
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={!inputChat.trim() || assistantMutation.isPending}
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
