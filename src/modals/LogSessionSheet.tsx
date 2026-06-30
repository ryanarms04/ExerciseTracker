import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { RepCounter } from '../components/counter/RepCounter'
import { db } from '../db/database'
import { todayStr, formatDate } from '../lib/dateUtils'
import type { Exercise } from '../types'

interface LogSessionSheetProps {
  exercise: Exercise | null
  open: boolean
  onClose: () => void
}

export function LogSessionSheet({ exercise, open, onClose }: LogSessionSheetProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr())

  if (!exercise) return null

  const isToday = selectedDate === todayStr()

  async function handleSave(reps: number) {
    await db.sessions.add({
      exerciseId: exercise!.id!,
      reps,
      date: selectedDate,
      createdAt: new Date().toISOString(),
    })
    setSelectedDate(todayStr())
    onClose()
  }

  function handleClose() {
    setSelectedDate(todayStr())
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-white dark:bg-navy-950 flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="flex items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-navy-100 dark:border-navy-800">
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors -ml-1"
            >
              <ArrowLeft size={20} className="text-navy-700 dark:text-navy-300" />
            </button>
            <h2 className="font-display text-lg font-bold text-navy-900 dark:text-white">
              Log Session
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 w-full">
                <CalendarDays size={16} className="text-navy-400 dark:text-navy-500 shrink-0" />
                <label className="relative flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-sm font-semibold py-2 px-3 rounded-xl bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-white border border-navy-200 dark:border-navy-700 cursor-pointer appearance-none"
                  />
                </label>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(todayStr())}
                    className="text-xs font-semibold text-teal-500 hover:text-teal-600 whitespace-nowrap px-2 py-1"
                  >
                    Today
                  </button>
                )}
              </div>

              {!isToday && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-coral-500 font-medium -mt-3"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
