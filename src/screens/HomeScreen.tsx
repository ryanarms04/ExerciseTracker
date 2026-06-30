import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { StreakDots } from '../components/charts/StreakDots'
import { LogSessionSheet } from '../modals/LogSessionSheet'
import { useSettingsStore } from '../stores/settingsStore'
import { getGreeting, todayStr, relativeTime } from '../lib/dateUtils'
import type { Exercise } from '../types'

export function HomeScreen() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const userName = useSettingsStore((s) => s.userName)
  const dailyGoal = useSettingsStore((s) => s.dailyGoal)

  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return all.filter((e) => !e.isArchived)
  })

  const todaySessions = useLiveQuery(async () => {
    const today = todayStr()
    return db.sessions.where('date').equals(today).toArray()
  })

  const recentSessions = useLiveQuery(async () => {
    const sessions = await db.sessions.orderBy('createdAt').reverse().limit(10).toArray()
    const exerciseMap = new Map<number, Exercise>()
    for (const s of sessions) {
      if (!exerciseMap.has(s.exerciseId)) {
        const ex = await db.exercises.get(s.exerciseId)
        if (ex) exerciseMap.set(s.exerciseId, ex)
      }
    }
    return sessions.map((s) => ({
      ...s,
      exercise: exerciseMap.get(s.exerciseId),
    }))
  })

  const todayTotal = todaySessions?.reduce((sum, s) => sum + s.reps, 0) ?? 0
  const goalProgress = Math.min((todayTotal / dailyGoal) * 100, 100)

  return (
    <>
      <div className="relative noise-overlay diagonal-clip bg-gradient-to-br from-navy-900 via-navy-900 to-teal-900 px-5 pt-14 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-navy-400 text-sm font-medium">{getGreeting()}</p>
            <h1 className="font-display text-2xl font-bold text-white mt-0.5">
              {userName || 'Athlete'}
            </h1>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            <Settings size={18} />
          </Link>
        </div>

        <div className="text-center">
          <motion.p
            key={todayTotal}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-[64px] leading-none font-medium tracking-[-0.03em] text-white"
          >
            {todayTotal}
          </motion.p>
          <p className="text-navy-400 text-sm mt-1">reps today</p>
          <div className="mt-3 mx-auto w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-navy-500 text-xs mt-1.5">
            {todayTotal} / {dailyGoal} daily goal
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-5">
        <Card className="p-4">
          <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide">
            Quick Log
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
            {exercises?.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className="flex flex-col items-center gap-1.5 snap-start shrink-0"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: ex.color + '18', color: ex.color }}
                >
                  <DynamicIcon name={ex.icon} size={22} />
                </div>
                <span className="text-[10px] font-medium text-navy-500 dark:text-navy-400 w-14 text-center truncate">
                  {ex.name}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide">
            This Week
          </h2>
          <StreakDots />
        </Card>

        <div>
          <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide px-1">
            Recent Activity
          </h2>
          {(!recentSessions || recentSessions.length === 0) ? (
            <Card className="p-6 text-center">
              <p className="text-navy-400 dark:text-navy-500 text-sm">
                No workouts yet. Tap an exercise above to start!
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-3.5 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: (session.exercise?.color ?? '#64748B') + '18',
                        color: session.exercise?.color ?? '#64748B',
                      }}
                    >
                      <DynamicIcon name={session.exercise?.icon ?? 'activity'} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white truncate">
                        {session.exercise?.name ?? 'Exercise'}
                      </p>
                      <p className="text-xs text-navy-400 dark:text-navy-500">
                        {relativeTime(session.createdAt)}
                      </p>
                    </div>
                    <span className="font-mono text-lg font-medium text-navy-900 dark:text-white tabular-nums">
                      {session.reps}
                    </span>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogSessionSheet
        exercise={selectedExercise}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </>
  )
}
