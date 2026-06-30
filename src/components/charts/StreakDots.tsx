import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { getWeekDates, getDayOfWeekShort, todayStr } from '../../lib/dateUtils'

export function StreakDots() {
  const weekDates = getWeekDates()
  const today = todayStr()

  const activeDates = useLiveQuery(async () => {
    const sessions = await db.sessions
      .where('date')
      .anyOf(weekDates)
      .toArray()
    return new Set(sessions.map((s) => s.date))
  }, [])

  if (!activeDates) return null

  return (
    <div className="flex items-center justify-between px-2">
      {weekDates.map((date) => {
        const isActive = activeDates.has(date)
        const isToday = date === today

        return (
          <div key={date} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-navy-400 dark:text-navy-500">
              {getDayOfWeekShort(date).charAt(0)}
            </span>
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-teal-500 shadow-[var(--shadow-glow-teal)]'
                  : isToday
                    ? 'bg-navy-300 dark:bg-navy-600 ring-2 ring-navy-200 dark:ring-navy-700'
                    : 'bg-navy-200 dark:bg-navy-700'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}
