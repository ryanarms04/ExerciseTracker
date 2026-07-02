import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Settings, Lock } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { useSettingsStore } from '../stores/settingsStore'
import { useAchievements } from '../hooks/useAchievements'
import { ACHIEVEMENTS } from '../lib/achievements'
import { getWeekDates, getDayOfWeekShort } from '../lib/dateUtils'

export function ProfileScreen() {
  const userName = useSettingsStore((s) => s.userName)
  const dailyGoal = useSettingsStore((s) => s.dailyGoal)
  const { unlocked, stats } = useAchievements()

  const weekData = useLiveQuery(async () => {
    const dates = getWeekDates()
    const sessions = await db.sessions
      .where('date')
      .anyOf(dates)
      .toArray()

    return dates.map((date) => ({
      day: getDayOfWeekShort(date),
      reps: sessions
        .filter((s) => s.date === date)
        .reduce((sum, s) => sum + s.reps, 0),
    }))
  })

  const unlockedKeys = new Set(unlocked.map((a) => a.key))

  const statCards = [
    { label: 'Total Reps', value: stats?.totalReps ?? 0, color: 'text-teal-500' },
    { label: 'Current Streak', value: stats?.currentStreak ?? 0, suffix: 'd', color: 'text-coral-500' },
    { label: 'Best Day', value: stats?.bestDay ?? 0, color: 'text-teal-500' },
    { label: 'Exercises', value: stats?.uniqueExercises ?? 0, color: 'text-coral-500' },
  ]

  return (
    <div className="px-5 safe-top pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-display font-bold text-lg">
            {(userName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900 dark:text-white">
              {userName || 'Athlete'}
            </h1>
            <p className="text-xs text-navy-400 dark:text-navy-500">Member since today</p>
          </div>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-navy-100 dark:bg-navy-800 text-navy-500 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors"
        >
          <Settings size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="p-4">
              <p className="font-mono text-2xl font-medium tracking-tight tabular-nums text-navy-900 dark:text-white">
                {stat.value.toLocaleString()}
                {stat.suffix && (
                  <span className="text-sm text-navy-400 ml-0.5">{stat.suffix}</span>
                )}
              </p>
              <p className="text-xs text-navy-400 dark:text-navy-500 mt-0.5">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide">
          Achievements
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlockedKeys.has(a.key)
            return (
              <div
                key={a.key}
                className={`shrink-0 w-28 p-3 rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20 shadow-sm'
                    : 'bg-navy-100 dark:bg-navy-800 opacity-50'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {isUnlocked ? (
                    <DynamicIcon name={a.icon} size={24} className="text-teal-500" />
                  ) : (
                    <Lock size={18} className="text-navy-400" />
                  )}
                </div>
                <p className="text-xs font-semibold text-navy-900 dark:text-white text-center truncate">
                  {a.name}
                </p>
                <p className="text-[10px] text-navy-400 text-center mt-0.5 line-clamp-2">
                  {a.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <Card className="p-4">
        <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide">
          This Week
        </h2>
        {weekData && (() => {
          // Bars scale to 72px so the tallest bar + its 20px value label fill
          // the 96px area; the goal hairline shares the same px scale.
          const max = Math.max(dailyGoal, ...weekData.map((d) => d.reps), 1)
          return (
            <>
              <div className="relative h-24">
                <div
                  aria-hidden
                  className="absolute inset-x-0 border-t border-dashed border-ring-track"
                  style={{ bottom: (dailyGoal / max) * 72 }}
                />
                <div className="absolute inset-0 flex items-end gap-2">
                  {weekData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                      {d.reps > 0 && <span className="num-sm text-text-mute">{d.reps}</span>}
                      <div
                        className={`w-full max-w-9 rounded-t ${d.reps > 0 ? 'bg-accent' : 'bg-ring-track'}`}
                        style={{ height: d.reps > 0 ? Math.max((d.reps / max) * 72, 4) : 3 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-1.5">
                {weekData.map((d) => (
                  <span key={d.day} className="flex-1 text-center type-caption text-text-faint">
                    {d.day}
                  </span>
                ))}
              </div>
            </>
          )
        })()}
      </Card>
    </div>
  )
}
