import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { Flame, Award, TrendingUp, Calendar, Droplets } from 'lucide-react'
import { useProfile } from '@/api/profile'
import { Card, SectionLabel, Chip } from '@/components/ui'

// Mock 7-day past data for immediate visual satisfaction (will pull from API in prod)
const PAST_7_DAYS = [
  { day: 'Mon', cal: 1850, protein: 125, carbs: 210, fat: 55, goal: 2000 },
  { day: 'Tue', cal: 1920, protein: 138, carbs: 220, fat: 58, goal: 2000 },
  { day: 'Wed', cal: 2050, protein: 145, carbs: 240, fat: 62, goal: 2000 },
  { day: 'Thu', cal: 1780, protein: 130, carbs: 190, fat: 54, goal: 2000 },
  { day: 'Fri', cal: 2100, protein: 142, carbs: 250, fat: 65, goal: 2000 },
  { day: 'Sat', cal: 1950, protein: 135, carbs: 230, fat: 60, goal: 2000 },
  { day: 'Sun', cal: 1880, protein: 132, carbs: 215, fat: 56, goal: 2000 },
]

const WEIGHT_LOGS = [
  { date: '1 Oct', weight: 74.2 },
  { date: '4 Oct', weight: 73.8 },
  { date: '7 Oct', weight: 73.5 },
  { date: '11 Oct', weight: 73.1 },
]

export default function ProgressPage() {
  const { data: profile } = useProfile()
  const [chartView, setChartView] = useState('calories') // 'calories' | 'macros'

  return (
    <div className="pt-4 px-4 pb-16">
      <div className="mb-4">
        <h1 className="text-xl font-black text-[#1a1a2e]">Analytics & Progress</h1>
        <p className="text-xs text-[#6b7280]">Macro adherence, weight trends & consistency</p>
      </div>

      {/* Streak & Consistency Badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-gradient-to-br from-[#fff7ed] to-white border-[#fed7aa] p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="text-orange-500" size={20} />
            <span className="text-xs font-bold text-orange-700 uppercase">Logging Streak</span>
          </div>
          <div className="text-2xl font-black text-[#1a1a2e]">7 Days 🔥</div>
          <p className="text-[11px] text-[#6b7280] mt-0.5">Logged every meal this week</p>
        </Card>

        <Card className="bg-gradient-to-br from-[#eff6ff] to-white border-[#bfdbfe] p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="text-blue-500" size={20} />
            <span className="text-xs font-bold text-blue-700 uppercase">Protein Hit Rate</span>
          </div>
          <div className="text-2xl font-black text-[#1a1a2e]">86% 🎯</div>
          <p className="text-[11px] text-[#6b7280] mt-0.5">6 of 7 days hit goal</p>
        </Card>
      </div>

      {/* 7-Day Chart */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">7-Day Intake Trend</SectionLabel>
          <div className="flex gap-1">
            <Chip
              active={chartView === 'calories'}
              onClick={() => setChartView('calories')}
            >
              Calories
            </Chip>
            <Chip
              active={chartView === 'macros'}
              onClick={() => setChartView('macros')}
            >
              Macros
            </Chip>
          </div>
        </div>

        <div className="h-52 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'calories' ? (
              <BarChart data={PAST_7_DAYS}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[1000, 2500]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="cal" fill="#ff6b6b" radius={[6, 6, 0, 0]} name="Calories" />
              </BarChart>
            ) : (
              <BarChart data={PAST_7_DAYS}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="protein" fill="#4e9af1" stackId="a" name="Protein (g)" />
                <Bar dataKey="carbs" fill="#f59e0b" stackId="a" name="Carbs (g)" />
                <Bar dataKey="fat" fill="#f97316" stackId="a" radius={[6, 6, 0, 0]} name="Fat (g)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weight Progress Chart */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">Weight Trend</SectionLabel>
          <span className="text-xs font-bold text-green-600">-1.1 kg this month</span>
        </div>
        <div className="h-44 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEIGHT_LOGS}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 'bold',
                  border: '1px solid #e5e7eb',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00c9a7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#00c9a7' }}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
