import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useDiaryStore from '@/store/diaryStore'
import { cn } from '@/components/ui'

export default function DateNavigator({ className }) {
  const { selectedDate, goToPrevDay, goToNextDay, goToToday } = useDiaryStore()

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day')
  const isFuture = dayjs(selectedDate).isAfter(dayjs(), 'day')
  const label = isToday ? 'Today' : dayjs(selectedDate).format('ddd, DD MMM')

  return (
    <div className={cn('flex items-center justify-between bg-white rounded-2xl border border-[#e5e7eb] p-2 shadow-sm', className)}>
      <button
        onClick={goToPrevDay}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={isToday ? undefined : goToToday}
        className={cn('font-bold text-sm px-4 py-1.5 rounded-lg transition-colors', isToday ? 'text-[#ff6b6b]' : 'text-[#1a1a2e] hover:bg-[#f3f4f6]')}
      >
        {label}
      </button>
      <button
        onClick={!isFuture ? goToNextDay : undefined}
        className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-colors', isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#f3f4f6]')}
        disabled={isFuture}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
