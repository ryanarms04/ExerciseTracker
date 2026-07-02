import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { CalendarDays } from 'lucide-react'
import { Sheet } from '../components/ui/Sheet'
import { RepCounter } from '../components/counter/RepCounter'
import { db } from '../db/database'
import { todayStr, formatDate } from '../lib/dateUtils'
import type { Exercise } from '../types'

interface LogSessionSheetProps {
  exercise: Exercise | null
  open: boolean
  onClose: () => void
  /** Date the user was viewing when they opened the logger. Defaults to today. */
  initialDate?: string
}

export function LogSessionSheet({ exercise, open, onClose, initialDate }: LogSessionSheetProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayStr())

  // Re-derive on every open: the sheet stays mounted between uses, so a date
  // from a previous open (or from before midnight) must not leak in.
  useEffect(() => {
    if (open) setSelectedDate(initialDate ?? todayStr())
  }, [open, initialDate])

  if (!exercise) return null

  const isToday = selectedDate === todayStr()

  async function handleSave(reps: number) {
    if (!exercise?.id) return
    await db.sessions.add({
      exerciseId: exercise.id,
      reps,
      date: selectedDate,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log Session">
      <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 w-full">
          <CalendarDays size={16} className="text-text-faint shrink-0" />
          <label className="relative flex-1">
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm font-semibold min-h-11 py-2 px-3 rounded-xl bg-surface-2 text-text border border-hairline cursor-pointer appearance-none"
            />
          </label>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="type-label text-accent whitespace-nowrap min-h-11 px-3"
            >
              Today
            </button>
          )}
        </div>

        {!isToday && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="type-label text-ember -mt-3"
          >
            Logging for {formatDate(selectedDate)}
          </motion.p>
        )}

        <RepCounter
          exerciseName={exercise.name}
          onSave={handleSave}
          color={exercise.color}
        />
      </div>
    </Sheet>
  )
}
