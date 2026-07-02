import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { db } from '../db/database'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { SwipeToDelete } from '../components/ui/SwipeToDelete'
import { useSnackbar } from '../components/ui/Snackbar'
import { LogRow } from '../components/exercise/LogRow'
import { ConsistencyHeatmap } from '../components/charts/ConsistencyHeatmap'
import { useLoggerStore } from '../stores/loggerStore'
import { useHaptic } from '../hooks/useHaptic'
import { formatDate, todayStr } from '../lib/dateUtils'
import type { Session } from '../types'

const PAGE_SIZE = 20

export function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const openLogger = useLoggerStore((s) => s.openLogger)
  const openEditor = useLoggerStore((s) => s.openEditor)
  const snackbar = useSnackbar()
  const haptic = useHaptic()
  const [limit, setLimit] = useState(PAGE_SIZE)

  const exercise = useLiveQuery(() => db.exercises.get(Number(id)), [id])

  // One query feeds stats, heatmap and history
  const sessions = useLiveQuery(
    async () => {
      const rows = await db.sessions.where('exerciseId').equals(Number(id)).toArray()
      // newest day first; within a day, newest set first
      return rows.sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      )
    },
    [id],
  )

  if (!exercise) return null

  const totalReps = sessions?.reduce((sum, s) => sum + s.reps, 0) ?? 0
  const sessionCount = sessions?.length ?? 0
  const avgPerSession = sessionCount > 0 ? Math.round(totalReps / sessionCount) : 0

  const totalsByDate = new Map<string, number>()
  for (const s of sessions ?? []) {
    totalsByDate.set(s.date, (totalsByDate.get(s.date) ?? 0) + s.reps)
  }
  const bestDay = totalsByDate.size > 0 ? Math.max(...totalsByDate.values()) : 0

  const visible = sessions?.slice(0, limit) ?? []
  const groups: { date: string; total: number; rows: Session[] }[] = []
  for (const s of visible) {
    const last = groups[groups.length - 1]
    if (last && last.date === s.date) {
      last.rows.push(s)
      last.total += s.reps
    } else {
      groups.push({ date: s.date, total: s.reps, rows: [s] })
    }
  }
  const remaining = (sessions?.length ?? 0) - visible.length

  async function deleteSession(session: Session) {
    await db.sessions.delete(session.id!)
    haptic.tick()
    snackbar.show({
      message: `Deleted ${session.reps} ${exercise?.name ?? 'reps'}`,
      actionLabel: 'Undo',
      onAction: () => {
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
    <div className="px-5 safe-top pb-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 min-h-11 pr-2 type-label text-text-mute mb-2"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: exercise.color + '1F', color: exercise.color }}
        >
          <DynamicIcon name={exercise.icon} size={26} />
        </div>
        <div className="min-w-0">
          <h1 className="type-title text-text truncate">{exercise.name}</h1>
          <p className="type-caption text-text-faint capitalize mt-0.5">
            {exercise.category} body
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total', value: totalReps },
          { label: 'Best day', value: bestDay },
          { label: 'Avg / set', value: avgPerSession },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 text-center bg-surface border border-hairline rounded-[var(--radius-tile)]"
          >
            <p className="num-md text-text">{stat.value.toLocaleString()}</p>
            <p className="type-caption text-text-faint mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="p-4 bg-surface border border-hairline rounded-[var(--radius-card)] mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="type-heading text-text">Consistency</h2>
          <span className="type-caption text-text-faint">Last 12 weeks</span>
        </div>
        <ConsistencyHeatmap totalsByDate={totalsByDate} />
      </section>

      <section>
        <h2 className="type-heading text-text mb-2">History</h2>
        {sessions === undefined ? null : sessions.length === 0 ? (
          <div className="p-6 text-center bg-surface border border-hairline rounded-[var(--radius-card)]">
            <p className="type-body text-text-mute">No sets logged yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.date}>
                <div className="flex items-baseline justify-between px-1 mb-1.5">
                  <span className="type-caption uppercase text-text-faint">
                    {group.date === todayStr() ? 'Today' : formatDate(group.date)}
                  </span>
                  <span className="num-sm text-text-mute">{group.total}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {group.rows.map((session) => (
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
                          onDelete={() => deleteSession(session)}
                        >
                          <LogRow
                            session={session}
                            exercise={exercise}
                            onClick={() => openEditor(session)}
                          />
                        </SwipeToDelete>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="w-full min-h-11 rounded-full bg-surface-2 border border-hairline type-label text-text-mute"
              >
                Show more ({remaining} older)
              </button>
            )}
          </div>
        )}
      </section>

      <div className="sticky bottom-28 mt-6 z-20">
        <button
          onClick={() => openLogger(exercise.id)}
          className="w-full min-h-14 rounded-2xl bg-accent text-accent-ink type-heading shadow-[0_4px_16px_rgb(45_212_207/0.25)]"
        >
          Log {exercise.name.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
