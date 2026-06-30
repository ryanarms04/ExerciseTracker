import { BottomSheet } from '../components/ui/BottomSheet'
import { RepCounter } from '../components/counter/RepCounter'
import { db } from '../db/database'
import { todayStr } from '../lib/dateUtils'
import type { Exercise } from '../types'

interface LogSessionSheetProps {
  exercise: Exercise | null
  open: boolean
  onClose: () => void
}

export function LogSessionSheet({ exercise, open, onClose }: LogSessionSheetProps) {
  if (!exercise) return null

  async function handleSave(reps: number) {
    await db.sessions.add({
      exerciseId: exercise!.id!,
      reps,
      date: todayStr(),
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <RepCounter exerciseName={exercise.name} onSave={handleSave} />
    </BottomSheet>
  )
}
