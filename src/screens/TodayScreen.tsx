import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { db } from '../db/database'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { StreakChip } from '../components/ui/StreakChip'
import { SwipeToDelete } from '../components/ui/SwipeToDelete'
import { useSnackbar } from '../components/ui/Snackbar'
import { WeekStrip } from '../components/navigation/WeekStrip'
import { RingGauge } from '../components/charts/RingGauge'
import { LogRow } from '../components/exercise/LogRow'
import { useSettingsStore } from '../stores/settingsStore'
import { useDayStore } from '../stores/dayStore'
import { useLoggerStore } from '../stores/loggerStore'
import { useHaptic } from '../hooks/useHaptic'
import { getGreeting, todayStr, formatDate } from '../lib/dateUtils'
import type { Exercise, Session } from '../types'

export function TodayScreen() {
  const selectedDate = useDayStore((s) => s.selectedDate)
  const setSelectedDate = useDayStore((s) => s.setSelectedDate)
  const userName = useSettingsStore((s) => s.userName)
  const dailyGoal = useSettingsStore((s) => s.dailyGoal)
  const openLogger = useLoggerStore((s) => s.openLogger)
  const snackbar = useSnackbar()
  const haptic = useHaptic()
  const lastKnownToday = useRef(todayStr())
  const isToday = selectedDate === todayStr()

  // A resumed PWA keeps state across midnight — follow the day forward,
  // but leave a deliberately selected past date alone.
  useEffect(() => {
    function refreshToday() {
      const now = todayStr()
      const prevToday = lastKnownToday.current
      if (now === prevToday) return
      lastKnownToday.current = now
      const { selectedDate: sel, setSelectedDate: set } = useDayStore.getState()
      if (sel === prevToday) set(now)
    }
    document.addEventListener('visibilitychange', refreshToday)
    window.addEventListener('focus', refreshToday)
    return () => {
      document.removeEventListener('visibilitychange', refreshToday)
      window.removeEventListener('focus', refreshToday)
    }
  }, [])

  // The day's log, exercises resolved in one bulkGet (no per-row lookups)
  const dayRows = useLiveQuery(async () => {
    const sessions = await db.sessions
      .where('date')
      .equals(selectedDate)
      .reverse()
      .sortBy('createdAt')
    const ids = [...new Set(sessions.map((s) => s.exerciseId))]
    const found = await db.exercises.bulkGet(ids)
    const byId = new Map(ids.map((id, i) => [id, found[i]]))
    return sessions.map((s) => ({ session: s, exercise: byId.get(s.exerciseId) }))
  }, [selectedDate])

  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return all.filter((e) => !e.isArchived)
  }, [])

  // Latest use per exercise: one descending cursor over the createdAt index
  const lastUsedAt = useLiveQuery(async () => {
    const latest = new Map<number, string>()
    await db.sessions
      .orderBy('createdAt')
      .reverse()
      .each((s) => {
        if (!latest.has(s.exerciseId)) latest.set(s.exerciseId, s.createdAt)
      })
    return latest
  }, [])

  const dayTotal = dayRows?.reduce((sum, r) => sum + r.session.reps, 0) ?? 0
  const goalMet = dayTotal >= dailyGoal

  const repsByExercise = new Map<number, number>()
  for (const { session } of dayRows ?? []) {
    repsByExercise.set(session.exerciseId, (repsByExercise.get(session.exerciseId) ?? 0) + session.reps)
  }

  const tiles = [...(exercises ?? [])]
    .sort((a, b) =>
      (lastUsedAt?.get(b.id!) ?? '').localeCompare(lastUsedAt?.get(a.id!) ?? ''),
    )
    .slice(0, 6)

  async function deleteSession(session: Session, exercise?: Exercise) {
    await db.sessions.delete(session.id!)
    haptic.tick()
    snackbar.show({
      message: `Deleted ${session.reps} ${exercise?.name ?? 'reps'}`,
      actionLabel: 'Undo',
      onAction: () => {
        // Re-add with the original createdAt; a fresh id is fine
        db.sessions.add({
          exerciseId: session.exerciseId,
          reps: session.reps,
          date: session.date,
          notes: session.notes,
          createdAt: session.createdAt,
        })
      },
    })
  }

  return (
    <div className="px-5 safe-top pb-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="type-caption uppercase text-text-faint">{getGreeting()}</p>
          <h1 className="type-title text-text mt-0.5">{userName || 'Athlete'}</h1>
        </div>
        <StreakChip />
      </header>

      <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      <button
        onClick={() => openLogger()}
        aria-label={`Log reps for ${isToday ? 'today' : formatDate(selectedDate)}`}
        className="w-full text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-5 p-4 bg-surface border border-hairline rounded-[var(--radius-card)]">
          <RingGauge key={selectedDate} value={dayTotal} goal={dailyGoal} size={120} />
          <div className="flex-1 min-w-0">
            <p className="type-body text-text-mute inline-flex items-center gap-1.5">
              of {dailyGoal}
              {goalMet && <Check size={16} className="text-ember" aria-label="goal reached" />}
            </p>
            <p className="type-caption text-text-faint mt-1">
              {isToday ? 'Today' : formatDate(selectedDate)} ·{' '}
              {goalMet ? 'Goal crushed' : `${dailyGoal - dayTotal} to go`}
            </p>
          </div>
        </div>
      </button>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="type-heading text-text">Exercises</h2>
          <Link to="/library" className="inline-flex items-center min-h-11 px-2 type-label text-accent">
            All →
          </Link>
        </div>
        {exercises === undefined ? null : (
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((ex) => {
              const reps = repsByExercise.get(ex.id!) ?? 0
              return (
                <button
                  key={ex.id}
                  onClick={() => openLogger(ex.id)}
                  className="flex items-center gap-3 p-3 bg-surface border border-hairline rounded-[var(--radius-tile)] text-left active:scale-[0.97] transition-transform"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: ex.color + '1F', color: ex.color }}
                  >
                    <DynamicIcon name={ex.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block type-label text-text truncate">{ex.name}</span>
                    <span className={`block type-caption mt-0.5 ${reps > 0 ? 'text-accent' : 'text-text-faint'}`}>
                      {reps > 0 ? `${reps} ${isToday ? 'today' : 'logged'}` : '—'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="type-heading text-text mb-2">
          Log · {isToday ? 'Today' : formatDate(selectedDate)}
        </h2>
        {dayRows === undefined ? null : dayRows.length === 0 ? (
          <div className="p-6 text-center bg-surface border border-hairline rounded-[var(--radius-card)]">
            <p className="type-body text-text-mute">
              Nothing logged {isToday ? 'yet today' : 'on this day'}.
            </p>
            <p className="type-caption text-text-faint mt-1">Tap the ● button to add a set.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {dayRows.map(({ session, exercise }) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                >
                  <SwipeToDelete
                    confirm={false}
                    label="Delete"
                    onDelete={() => deleteSession(session, exercise)}
                  >
                    <LogRow session={session} exercise={exercise} />
                  </SwipeToDelete>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}
