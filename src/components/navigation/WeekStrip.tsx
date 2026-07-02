import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { db } from '../../db/database'
import { todayStr, mondayOf, addDaysStr, getWeekDates, getDayOfWeekShort } from '../../lib/dateUtils'

interface WeekStripProps {
  selectedDate: string
  onSelect: (date: string) => void
}

/**
 * One week (Mon–Sun), swipe or chevron to page into the past, activity dots,
 * today outlined, selected day as an accent pill. Doubles as the app's date
 * selector — it replaces the 14-day strip and the streak-dots card, and gets
 * reused by the logger's date picker in Phase 3.
 */
export function WeekStrip({ selectedDate, onSelect }: WeekStripProps) {
  const today = todayStr()
  const currentMonday = mondayOf(today)
  const [weekAnchor, setWeekAnchor] = useState(() => mondayOf(selectedDate))
  const [pageDir, setPageDir] = useState(0)

  // Follow external selection changes (tap, back-to-today, midnight rollover);
  // paging alone doesn't move the selection, so this never fights the pager.
  useEffect(() => {
    setWeekAnchor(mondayOf(selectedDate))
  }, [selectedDate])

  const days = getWeekDates(weekAnchor)
  const atCurrentWeek = weekAnchor === currentMonday

  const activeDates = useLiveQuery(async () => {
    const range = db.sessions.where('date').between(days[0], days[6], true, true)
    try {
      const dates = await range.uniqueKeys()
      return new Set(dates as string[])
    } catch (err) {
      // Some WebKit builds are flaky with unique-key cursors; a rejected
      // query would otherwise throw all the way to the error boundary.
      console.error('uniqueKeys failed, falling back to full scan', err)
      const rows = await range.toArray()
      return new Set(rows.map((s) => s.date))
    }
  }, [weekAnchor])

  function page(delta: 1 | -1) {
    if (delta === 1 && atCurrentWeek) return
    setPageDir(delta)
    setWeekAnchor(addDaysStr(weekAnchor, delta * 7))
  }

  function backToToday() {
    setWeekAnchor(currentMonday)
    onSelect(today)
  }

  const offToday = selectedDate !== today || !atCurrentWeek

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => page(-1)}
          aria-label="Previous week"
          className="w-11 h-11 flex items-center justify-center rounded-full text-text-faint hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="type-caption uppercase text-text-faint">
          {atCurrentWeek ? 'This week' : rangeLabel(days)}
        </span>
        <button
          onClick={() => page(1)}
          disabled={atCurrentWeek}
          aria-label="Next week"
          className="w-11 h-11 flex items-center justify-center rounded-full text-text-faint hover:bg-surface-2 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <motion.div
        key={weekAnchor}
        initial={{ x: pageDir * 32, opacity: pageDir === 0 ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onPanEnd={(_, info) => {
          if (info.offset.x < -48) page(1)
          else if (info.offset.x > 48) page(-1)
        }}
        className="flex gap-1.5 touch-pan-y no-select"
      >
        {days.map((date) => {
          const isSelected = date === selectedDate
          const isToday = date === today
          const isFuture = date > today
          const isActive = activeDates?.has(date) ?? false

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              disabled={isFuture}
              aria-label={date}
              aria-pressed={isSelected}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 min-h-14 rounded-2xl transition-colors ${
                isSelected
                  ? 'bg-accent'
                  : isFuture
                    ? 'opacity-35'
                    : 'hover:bg-surface-2'
              } ${isToday && !isSelected ? 'border border-accent' : ''}`}
            >
              <span className={`type-caption ${isSelected ? 'text-accent-ink' : 'text-text-faint'}`}>
                {getDayOfWeekShort(date).charAt(0)}
              </span>
              <span
                className={`num-sm ${
                  isSelected ? 'text-accent-ink' : isToday ? 'text-accent' : 'text-text'
                }`}
              >
                {Number(date.slice(8))}
              </span>
              <span
                className={`w-1 h-1 rounded-full ${
                  isActive ? (isSelected ? 'bg-accent-ink' : 'bg-accent') : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {offToday && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center overflow-hidden"
          >
            <button
              onClick={backToToday}
              className="mt-2 min-h-11 inline-flex items-center gap-1.5 px-4 rounded-full bg-accent/10 text-accent type-label"
            >
              <ArrowLeft size={14} />
              Back to today
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function rangeLabel(days: string[]): string {
  const a = new Date(days[0] + 'T00:00:00')
  const b = new Date(days[6] + 'T00:00:00')
  const bMonth = b.toLocaleDateString('en-US', { month: 'short' })
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${bMonth}`
  }
  const aMonth = a.toLocaleDateString('en-US', { month: 'short' })
  return `${a.getDate()} ${aMonth} – ${b.getDate()} ${bMonth}`
}
