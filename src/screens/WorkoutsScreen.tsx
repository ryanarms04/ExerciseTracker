import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { SwipeToDelete } from '../components/ui/SwipeToDelete'
import { LogSessionSheet } from '../modals/LogSessionSheet'
import { AddExerciseModal } from '../modals/AddExerciseModal'
import { todayStr } from '../lib/dateUtils'
import type { Exercise, ExerciseCategory } from '../types'

const FILTERS: { label: string; value: ExerciseCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upper', value: 'upper' },
  { label: 'Core', value: 'core' },
  { label: 'Lower', value: 'lower' },
  { label: 'Custom', value: 'custom' },
]

export function WorkoutsScreen() {
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    const active = all.filter((e) => !e.isArchived)
    if (filter === 'all') return active
    return active.filter((e) => e.category === filter)
  }, [filter])

  const todayReps = useLiveQuery(async () => {
    const today = todayStr()
    const sessions = await db.sessions.where('date').equals(today).toArray()
    const map = new Map<number, number>()
    for (const s of sessions) {
      map.set(s.exerciseId, (map.get(s.exerciseId) || 0) + s.reps)
    }
    return map
  })

  async function archiveExercise(id: number) {
    await db.exercises.update(id, { isArchived: true })
  }

  return (
    <>
      <div className="px-5 pt-14 pb-4">
        <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white">
          Workouts
        </h1>

        <SegmentedControl
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          layout="scroll"
          className="mt-4"
        />
      </div>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {exercises?.map((ex, i) => {
              const reps = todayReps?.get(ex.id!) ?? 0
              const isHero = i % 3 === 0

              return (
                <motion.div
                  key={ex.id}
                  className={isHero ? 'col-span-2' : ''}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.04 }}
                  layout
                >
                  <SwipeToDelete onDelete={() => archiveExercise(ex.id!)}>
                    <Card
                      className={`p-4 cursor-pointer group active:scale-[0.98] transition-transform ${
                        isHero ? 'flex items-center gap-4' : ''
                      }`}
                      onClick={() => setSelectedExercise(ex)}
                    >
                      <div
                        className={`rounded-2xl flex items-center justify-center shrink-0 transition-shadow group-hover:shadow-lg ${
                          isHero ? 'w-14 h-14' : 'w-12 h-12 mx-auto'
                        }`}
                        style={{ backgroundColor: ex.color + '18', color: ex.color }}
                      >
                        <DynamicIcon name={ex.icon} size={isHero ? 24 : 20} />
                      </div>
                      <div className={isHero ? 'flex-1' : 'mt-3 text-center'}>
                        <p className="text-sm font-semibold text-navy-900 dark:text-white truncate">
                          {ex.name}
                        </p>
                        {reps > 0 && (
                          <p className="text-xs text-teal-500 font-medium mt-0.5">
                            {reps} today
                          </p>
                        )}
                        {!isHero && (
                          <Link
                            to={`/exercise/${ex.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block text-xs text-navy-400 hover:text-teal-500 transition-colors mt-1 px-2 py-1"
                          >
                            Details →
                          </Link>
                        )}
                      </div>
                      {isHero && (
                        <Link
                          to={`/exercise/${ex.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-navy-400 hover:text-teal-500 transition-colors px-2 py-2"
                        >
                          Details →
                        </Link>
                      )}
                    </Card>
                  </SwipeToDelete>
                </motion.div>
              )
            })}
          </AnimatePresence>

          <motion.div
            className="col-span-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full p-4 rounded-[var(--radius-card)] border-2 border-dashed border-coral-300 dark:border-coral-800 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span className="font-semibold text-sm">Add Exercise</span>
            </button>
          </motion.div>
        </div>
      </div>

      <LogSessionSheet
        exercise={selectedExercise}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />

      <AddExerciseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  )
}
