import { CalendarDays, ChevronDown } from 'lucide-react'
import { todayStr, formatDate } from '../../lib/dateUtils'

interface DateChipProps {
  date: string
  /** Omit to lock the chip (edit mode). */
  onTap?: () => void
  expanded?: boolean
}

/** The logger's date. Backdated state tints ember; tap drops the inline WeekStrip. */
export function DateChip({ date, onTap, expanded = false }: DateChipProps) {
  const isToday = date === todayStr()

  return (
    <button
      onClick={onTap}
      disabled={!onTap}
      aria-expanded={onTap ? expanded : undefined}
      aria-label={`Logging date: ${isToday ? 'today' : formatDate(date)}`}
      className={`inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full type-label border transition-colors disabled:opacity-60 ${
        isToday
          ? 'bg-surface-2 border-hairline text-text'
          : 'bg-ember/10 border-ember text-ember'
      }`}
    >
      <CalendarDays size={14} />
      {isToday ? 'Today' : formatDate(date)}
      {onTap && (
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  )
}
