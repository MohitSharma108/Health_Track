import { useRef } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import useDiaryStore from '@/store/diaryStore'
import { cn } from '@/components/ui'

export default function DateNavigator({ className }) {
  const { selectedDate, goToPrevDay, goToNextDay, goToToday, setDate } = useDiaryStore()
  const dateInputRef = useRef(null)

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day')
  const isFuture = dayjs(selectedDate).isAfter(dayjs(), 'day')
  const label = isToday ? 'Today' : dayjs(selectedDate).format('ddd, DD MMM')

  const handleOpenPicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker()
          return
        } catch (_) {}
      }
      dateInputRef.current.focus()
    }
  }

  return (
    <div className={cn('flex items-center justify-between bg-white rounded-2xl border border-[#e5e7eb] p-2 shadow-sm', className)}>
      <button
        type="button"
        onClick={goToPrevDay}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="relative flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleOpenPicker}
          className={cn(
            'flex items-center gap-1.5 font-bold text-sm px-3.5 py-1.5 rounded-full border transition-all cursor-pointer',
            isToday ? 'text-[#ff6b6b] bg-[#fff0f0] border-transparent' : 'text-[#1a1a2e] hover:bg-[#f3f4f6] border-[#e5e7eb]'
          )}
          title="Pick date from calendar"
        >
          <CalendarIcon size={15} className="text-[#ff6b6b]" />
          <span>{label}</span>
          <span className="text-xs font-normal text-gray-500">({selectedDate})</span>
        </button>

        {!isToday && (
          <button
            type="button"
            onClick={goToToday}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            Today
          </button>
        )}

        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          tabIndex={-1}
        />
      </div>

      <button
        type="button"
        onClick={!isFuture ? goToNextDay : undefined}
        className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-colors', isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#f3f4f6] cursor-pointer')}
        disabled={isFuture}
        aria-label="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
