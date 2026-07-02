import { useLiveQuery } from 'dexie-react-hooks'
import { LogSessionSheet } from './LogSessionSheet'
import { db } from '../db/database'
import { useLoggerStore } from '../stores/loggerStore'
import { useDayStore } from '../stores/dayStore'

/**
 * Renders the one logger opened via useLoggerStore (FAB, ring card, tiles).
 * No explicit exercise → arms the last-used one; the viewed day flows in as
 * the logging date. (Phase 3 replaces the armed pick with an in-logger carousel.)
 */
export function LoggerHost() {
  const { open, exerciseId, closeLogger } = useLoggerStore()
  const selectedDate = useDayStore((s) => s.selectedDate)

  const exercise = useLiveQuery(async () => {
    if (exerciseId != null) {
      return db.exercises.get(exerciseId)
    }
    const lastSession = await db.sessions.orderBy('createdAt').last()
    if (lastSession) {
      const lastUsed = await db.exercises.get(lastSession.exerciseId)
      if (lastUsed && !lastUsed.isArchived) return lastUsed
    }
    const all = await db.exercises.toArray()
    return all.find((e) => !e.isArchived)
  }, [exerciseId])

  return (
    <LogSessionSheet
      exercise={exercise ?? null}
      open={open && !!exercise}
      onClose={closeLogger}
      initialDate={selectedDate}
    />
  )
}
