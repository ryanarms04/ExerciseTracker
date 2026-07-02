import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Flame, ChevronRight, Download, Upload, Minus, Plus } from 'lucide-react'
import { db } from '../db/database'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { useSettingsStore } from '../stores/settingsStore'
import { useAchievements } from '../hooks/useAchievements'
import { ACHIEVEMENTS } from '../lib/achievements'
import { todayStr } from '../lib/dateUtils'
import type { AchievementDef, AchievementStats, SettingsState } from '../types'
import { Sun, Moon, Monitor } from 'lucide-react'

const THEME_OPTIONS: { label: string; value: SettingsState['theme']; icon: typeof Sun }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]

export function YouScreen() {
  const { userName, dailyGoal, theme, setUserName, setDailyGoal, setTheme } = useSettingsStore()
  const { unlocked, stats } = useAchievements()

  // Real tenure: the first thing ever recorded on this device
  const memberSince = useLiveQuery(async () => {
    const firstSession = await db.sessions.orderBy('createdAt').first()
    if (firstSession) return firstSession.createdAt
    const exercises = await db.exercises.toArray()
    if (exercises.length === 0) return null
    return exercises.reduce((min, e) => (e.createdAt < min ? e.createdAt : min), exercises[0].createdAt)
  }, [])

  const firstSessionDate = useLiveQuery(async () => {
    const first = await db.sessions.orderBy('date').first()
    return first?.date ?? null
  }, [])

  const weeklyAvg = (() => {
    if (!stats || stats.totalReps === 0 || !firstSessionDate) return 0
    const days =
      Math.round(
        (new Date(todayStr() + 'T00:00:00').getTime() -
          new Date(firstSessionDate + 'T00:00:00').getTime()) /
          86_400_000,
      ) + 1
    return Math.round(stats.totalReps / Math.max(days / 7, 1))
  })()

  const unlockedKeys = new Set(unlocked.map((a) => a.key))

  const bento = [
    { label: 'Total reps', value: stats?.totalReps ?? 0 },
    { label: 'Day streak', value: stats?.currentStreak ?? 0, ember: true },
    { label: 'Best day', value: stats?.bestDay ?? 0 },
    { label: 'Reps / week', value: weeklyAvg },
  ]

  async function handleExport() {
    const exercises = await db.exercises.toArray()
    const sessions = await db.sessions.toArray()
    const achievements = await db.achievements.toArray()
    const data = JSON.stringify(
      { exercises, sessions, achievements, settings: { userName, dailyGoal, theme } },
      null,
      2,
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exercisetracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const data = JSON.parse(await file.text())

        if (!Array.isArray(data?.exercises) || !Array.isArray(data?.sessions)) {
          throw new Error('not a valid ExerciseTracker backup')
        }
        const exercisesValid = data.exercises.every(
          (x: unknown) => typeof (x as { name?: unknown })?.name === 'string',
        )
        const sessionsValid = data.sessions.every(
          (x: unknown) =>
            typeof (x as { reps?: unknown })?.reps === 'number' &&
            typeof (x as { date?: unknown })?.date === 'string',
        )
        if (!exercisesValid || !sessionsValid) {
          throw new Error('backup contains invalid records')
        }

        const ok = window.confirm(
          `Replace ALL current data with this backup (${data.sessions.length} sessions, ${data.exercises.length} exercises)? This cannot be undone.`,
        )
        if (!ok) return

        await db.transaction('rw', db.exercises, db.sessions, db.achievements, async () => {
          await Promise.all([db.exercises.clear(), db.sessions.clear(), db.achievements.clear()])
          await db.exercises.bulkAdd(data.exercises)
          await db.sessions.bulkAdd(data.sessions)
          if (Array.isArray(data.achievements)) {
            // Dedupe by key: backups from before the unique index may carry doubles
            const unique = [
              ...new Map(data.achievements.map((a: { key: string }) => [a.key, a])).values(),
            ]
            await db.achievements.bulkAdd(unique as typeof data.achievements)
          }
        })

        if (data.settings) {
          if (data.settings.userName) setUserName(data.settings.userName)
          if (data.settings.dailyGoal) setDailyGoal(data.settings.dailyGoal)
          if (data.settings.theme) setTheme(data.settings.theme)
        }
        window.alert('Import complete.')
      } catch (err) {
        window.alert(
          `Import failed: ${err instanceof Error ? err.message : 'unknown error'}. No data was changed.`,
        )
      }
    }
    input.click()
  }

  return (
    <div className="px-5 safe-top pb-4 space-y-6">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-accent flex items-center justify-center shrink-0">
          <span className="type-title text-accent">
            {(userName || 'A').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="type-title text-text truncate">{userName || 'Athlete'}</h1>
          <p className="type-caption text-text-faint mt-0.5">
            {memberSince
              ? `Member since ${new Date(memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : 'Just getting started'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {bento.map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-surface border border-hairline rounded-[var(--radius-tile)]"
          >
            <p className={`num-md inline-flex items-center gap-1.5 ${stat.ember && stat.value > 0 ? 'text-ember' : 'text-text'}`}>
              {stat.ember && stat.value > 0 && <Flame size={18} />}
              {stat.value.toLocaleString()}
            </p>
            <p className="type-caption text-text-faint mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="type-heading text-text mb-2">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge
              key={a.key}
              def={a}
              isUnlocked={unlockedKeys.has(a.key)}
              stats={stats}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-heading text-text mb-2">Settings</h2>
        <div className="bg-surface border border-hairline rounded-[var(--radius-card)] divide-y divide-hairline">
          <Link
            to="/library"
            className="flex items-center justify-between p-4 min-h-14 type-label text-text"
          >
            Manage exercises
            <ChevronRight size={18} className="text-text-faint" />
          </Link>

          <div className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="type-label text-text">Daily goal</p>
              <p className="type-caption text-text-faint mt-0.5">
                Drives the ring &amp; Goal Crusher
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setDailyGoal(Math.max(5, dailyGoal - 5))}
                disabled={dailyGoal <= 5}
                aria-label="Decrease daily goal"
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 border border-hairline text-text-mute disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="num-md text-text w-12 text-center">{dailyGoal}</span>
              <button
                onClick={() => setDailyGoal(dailyGoal + 5)}
                aria-label="Increase daily goal"
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 border border-hairline text-text-mute"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <Input
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="p-4">
            <SectionLabel>Theme</SectionLabel>
            <SegmentedControl
              options={THEME_OPTIONS}
              value={theme}
              onChange={setTheme}
              className="mt-2"
            />
          </div>

          <div className="p-4">
            <SectionLabel>Data</SectionLabel>
            <div className="flex gap-3 mt-2">
              <Button variant="secondary" onClick={handleExport} className="flex-1">
                <Download size={16} />
                Export
              </Button>
              <Button variant="secondary" onClick={handleImport} className="flex-1">
                <Upload size={16} />
                Import
              </Button>
            </div>
          </div>

          <p className="p-4 type-caption text-text-faint text-center">
            Momentum · v{__APP_VERSION__}
          </p>
        </div>
      </section>
    </div>
  )
}

/** Ring badge: unlocked = closed bright ring; locked = live progress arc + n/m caption. */
function AchievementBadge({
  def,
  isUnlocked,
  stats,
}: {
  def: AchievementDef
  isUnlocked: boolean
  stats?: AchievementStats
}) {
  const prog = stats ? def.progress(stats) : { current: 0, target: 1 }
  const frac = isUnlocked ? 1 : prog.target > 0 ? prog.current / prog.target : 0
  const size = 56
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center text-center gap-1 p-3 bg-surface border border-hairline rounded-[var(--radius-tile)]">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-ring-track"
          />
          {frac > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - Math.min(frac, 1))}
              className={isUnlocked ? 'stroke-accent-bright' : 'stroke-accent'}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <DynamicIcon
            name={def.icon}
            size={20}
            className={isUnlocked ? 'text-accent' : 'text-text-faint'}
          />
        </div>
      </div>
      <p className="type-label text-text">{def.name}</p>
      <p className="type-caption text-text-faint">
        {!isUnlocked && prog.target > 1
          ? `${prog.current.toLocaleString()}/${prog.target.toLocaleString()}`
          : def.description}
      </p>
    </div>
  )
}
