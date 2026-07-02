import { useLiveQuery } from 'dexie-react-hooks'
import { LogSessionSheet } from './LogSessionSheet'
import { db } from '../db/database'
import { useLoggerStore } from '../stores/loggerStore'
import { useDayStore } from '../stores/dayStore'

/**
 * Renders the one logger opened via useLoggerStore (FAB, ring card, tiles,
 * library, detail, row edits). No explicit exercise → arms the last-used one;
 * the viewed day flows in as the logging date.
 */
export function LoggerHost() {
  const { open, exerciseId, editSession, closeLogger } = useLoggerStore()
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

  // useLiveQuery keeps returning the PREVIOUS pick for a render while the new
  // lookup is in flight — opening then would arm the sheet one exercise behind.
  // Hold the sheet closed until the result matches the request.
  const armed = exercise && (exerciseId == null || exercise.id === exerciseId) ? exercise : null

  return (
    <LogSessionSheet
      open={open && !!armed}
      onClose={closeLogger}
      initialExercise={armed}
      initialDate={selectedDate}
      editSession={editSession}
    />
  )
}
