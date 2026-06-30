import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { LogSessionSheet } from '../modals/LogSessionSheet'
import { Button } from '../components/ui/Button'
import { formatDate } from '../lib/dateUtils'

export function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showLog, setShowLog] = useState(false)

  const exercise = useLiveQuery(
    () => db.exercises.get(Number(id)),
    [id],
  )

  const sessions = useLiveQuery(
    () =>
      db.sessions
        .where('exerciseId')
        .equals(Number(id))
        .reverse()
        .sortBy('createdAt'),
    [id],
  )

  const totalReps = sessions?.reduce((sum, s) => sum + s.reps, 0) ?? 0
  const sessionCount = sessions?.length ?? 0
  const avgPerSession = sessionCount > 0 ? Math.round(totalReps / sessionCount) : 0

  const repsByDate = new Map<string, number>()
  sessions?.forEach((s) => {
    repsByDate.set(s.date, (repsByDate.get(s.date) || 0) + s.reps)
  })
  const bestDay = repsByDate.size > 0 ? Math.max(...repsByDate.values()) : 0

  if (!exercise) return null

  return (
    <>
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: exercise.color + '18', color: exercise.color }}
          >
            <DynamicIcon name={exercise.icon} size={28} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white">
              {exercise.name}
            </h1>
            <p className="text-sm text-navy-400 capitalize">{exercise.category} body</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total', value: totalReps },
            { label: 'Best Day', value: bestDay },
            { label: 'Avg/Session', value: avgPerSession },
          ].map((stat) => (
            <Card key={stat.label} className="p-3 text-center">
              <p className="font-mono text-xl font-medium tabular-nums text-navy-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-[10px] text-navy-400 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Button onClick={() => setShowLog(true)} fullWidth>
          Log Reps
        </Button>

        <div className="mt-6">
          <h2 className="font-display text-sm font-bold text-navy-900 dark:text-white mb-3 uppercase tracking-wide">
            History
          </h2>
          {sessions?.length === 0 ? (
            <p className="text-sm text-navy-400 text-center py-6">No sessions yet</p>
          ) : (
            <div className="space-y-2">
              {sessions?.slice(0, 20).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-navy-900 dark:text-white">
                        {s.reps} reps
                      </p>
                      <p className="text-xs text-navy-400">{formatDate(s.date)}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await db.sessions.delete(s.id!)
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-navy-300 hover:text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogSessionSheet
        exercise={exercise}
        open={showLog}
        onClose={() => setShowLog(false)}
      />
    </>
  )
}
