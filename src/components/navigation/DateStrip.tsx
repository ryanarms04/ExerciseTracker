import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { todayStr, toDateStr } from '../../lib/dateUtils'

interface DateStripProps {
  selectedDate: string
  onSelect: (date: string) => void
}

function getDates(count: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(toDateStr(d))
  }
  return dates
}

function formatDay(dateStr: string): { weekday: string; day: number; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}

export function DateStrip({ selectedDate, onSelect }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = todayStr()
  const dates = getDates(14)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const selected = el.querySelector('[data-selected="true"]') as HTMLElement
    if (selected) {
      selected.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' })
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-5 py-2 no-select"
    >
      {dates.map((date) => {
        const { weekday, day } = formatDay(date)
        const isSelected = date === selectedDate
        const isToday = date === today

        return (
          <button
            key={date}
            data-selected={isSelected}
            onClick={() => onSelect(date)}
            className={`relative flex flex-col items-center gap-0.5 snap-start shrink-0 w-12 py-2 rounded-2xl transition-colors ${
              isSelected
                ? 'bg-teal-500 text-white'
                : 'text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800'
            }`}
          >
            <span className={`text-[10px] font-medium ${isSelected ? 'text-teal-100' : ''}`}>
              {weekday}
            </span>
            <span className={`text-base font-bold leading-tight ${isSelected ? 'text-white' : 'text-navy-900 dark:text-white'}`}>
              {day}
            </span>
            {isToday && !isSelected && (
              <motion.div
                layoutId="today-dot"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-teal-500"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
