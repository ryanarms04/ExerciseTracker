import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Settings, Lock } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { useSettingsStore } from '../stores/settingsStore'
import { useAchievements } from '../hooks/useAchievements'
import { ACHIEVEMENTS } from '../lib/achievements'
import { getWeekDates, getDayOfWeekShort } from '../lib/dateUtils'

export function ProfileScreen() {
  const userName = useSettingsStore((s) => s.userName)
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
    <div className="px-5 pt-14 pb-4 space-y-5">
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-navy-100 dark:bg-navy-800 text-navy-500 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors"
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
        {weekData && (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(14, 165, 162, 0.08)' }}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="reps"
                fill="#0EA5A2"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
