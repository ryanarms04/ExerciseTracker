import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, MoreHorizontal, Plus, Pencil, Archive, Dumbbell } from 'lucide-react'
import { db } from '../db/database'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { SwipeToDelete } from '../components/ui/SwipeToDelete'
import { Sparkline } from '../components/charts/Sparkline'
import { ExerciseFormSheet } from '../modals/ExerciseFormSheet'
import { useLoggerStore } from '../stores/loggerStore'
import { todayStr, addDaysStr } from '../lib/dateUtils'
import type { Exercise, ExerciseCategory } from '../types'

const FILTERS: { label: string; value: ExerciseCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upper', value: 'upper' },
  { label: 'Core', value: 'core' },
  { label: 'Lower', value: 'lower' },
  { label: 'Custom', value: 'custom' },
]

export function LibraryScreen() {
  const navigate = useNavigate()
  const openLogger = useLoggerStore((s) => s.openLogger)
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [menuFor, setMenuFor] = useState<number | null>(null)

  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    const active = all.filter((e) => !e.isArchived)
    return filter === 'all' ? active : active.filter((e) => e.category === filter)
  }, [filter])

  // One query feeds every tile: 7-day sparkline points AND today's count
  const today = todayStr()
  const week = useLiveQuery(async () => {
    const days = Array.from({ length: 7 }, (_, i) => addDaysStr(today, i - 6))
    const rows = await db.sessions.where('date').between(days[0], days[6], true, true).toArray()
    const byExercise = new Map<number, number[]>()
    const dayIndex = new Map(days.map((d, i) => [d, i]))
    for (const s of rows) {
      const idx = dayIndex.get(s.date)
      if (idx === undefined) continue
      const points = byExercise.get(s.exerciseId) ?? new Array(7).fill(0)
      points[idx] += s.reps
      byExercise.set(s.exerciseId, points)
    }
    return byExercise
  }, [today])

  async function archiveExercise(ex: Exercise) {
    await db.exercises.update(ex.id!, { isArchived: true })
    setMenuFor(null)
  }

  return (
    <>
      <div className="px-5 safe-top pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 min-h-11 pr-2 type-label text-text-mute mb-2"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="type-title text-text">Library</h1>

        <SegmentedControl
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          layout="scroll"
          className="mt-4"
        />
      </div>

      {/* click-away for the overflow menus */}
      {menuFor != null && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
      )}

      <div className="px-5">
        {exercises === undefined ? null : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {exercises.map((ex) => {
                const points = week?.get(ex.id!) ?? new Array(7).fill(0)
                const todayReps = points[6]
                return (
                  <motion.div
                    key={ex.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    className="relative"
                  >
                    <SwipeToDelete
                      label="Archive"
                      confirmMessage={`Archive ${ex.name}?`}
                      onDelete={() => archiveExercise(ex)}
                    >
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() => navigate(`/exercise/${ex.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/exercise/${ex.id}`)}
                        className="p-3 bg-surface border border-hairline rounded-[var(--radius-tile)] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: ex.color + '1F', color: ex.color }}
                          >
                            <DynamicIcon name={ex.icon} size={18} />
                          </span>
                          <span className="type-label text-text truncate flex-1 pr-8">{ex.name}</span>
                        </div>
                        <div className="flex items-end justify-between mt-2.5 min-h-5">
                          <Sparkline points={points} />
                          <span className={`type-caption ${todayReps > 0 ? 'text-accent' : 'text-text-faint'}`}>
                            {todayReps > 0 ? `${todayReps} today` : ''}
                          </span>
                        </div>
                      </div>
                    </SwipeToDelete>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuFor(menuFor === ex.id ? null : ex.id!)
                      }}
                      aria-label={`Options for ${ex.name}`}
                      aria-expanded={menuFor === ex.id}
                      className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center rounded-full text-text-faint z-10"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    <AnimatePresence>
                      {menuFor === ex.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                          className="absolute right-1 top-11 z-20 w-40 py-1 bg-surface-2 border border-hairline rounded-2xl shadow-[var(--shadow-card-hover)]"
                        >
                          <MenuItem
                            icon={Dumbbell}
                            label={`Log ${ex.name.toLowerCase()}`}
                            onClick={() => {
                              setMenuFor(null)
                              openLogger(ex.id)
                            }}
                          />
                          <MenuItem
                            icon={Pencil}
                            label="Edit"
                            onClick={() => {
                              setMenuFor(null)
                              setEditing(ex)
                              setFormOpen(true)
                            }}
                          />
                          <MenuItem
                            icon={Archive}
                            label="Archive"
                            danger
                            onClick={() => {
                              if (window.confirm(`Archive ${ex.name}?`)) archiveExercise(ex)
                              else setMenuFor(null)
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              className="col-span-2 min-h-14 p-4 rounded-[var(--radius-tile)] border-2 border-dashed border-hairline text-accent flex items-center justify-center gap-2 type-label"
            >
              <Plus size={18} />
              New exercise
            </button>
          </div>
        )}
      </div>

      <ExerciseFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        exercise={editing}
      />
    </>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`w-full min-h-11 px-3.5 flex items-center gap-2.5 type-label text-left ${
        danger ? 'text-danger' : 'text-text'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
