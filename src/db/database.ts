import Dexie, { type Table } from 'dexie'
import type { Exercise, Session, Achievement } from '../types'

class ExerciseTrackerDB extends Dexie {
  exercises!: Table<Exercise, number>
  sessions!: Table<Session, number>
  achievements!: Table<Achievement, number>

  constructor() {
    super('ExerciseTrackerDB')
    this.version(1).stores({
      exercises: '++id, name, category, isCustom, isArchived',
      sessions: '++id, exerciseId, date, createdAt',
      achievements: '++id, key, unlockedAt',
    })

    // Dedupe before v3 makes `key` unique — building a unique index over
    // existing duplicates would abort the upgrade and brick the DB.
    this.version(2).upgrade(async (tx) => {
      const all = await tx.table('achievements').toArray()
      const seen = new Set<string>()
      const dupeIds: number[] = []
      for (const a of all) {
        if (seen.has(a.key)) dupeIds.push(a.id)
        else seen.add(a.key)
      }
      if (dupeIds.length > 0) {
        await tx.table('achievements').bulkDelete(dupeIds)
      }
    })

    this.version(3).stores({
      achievements: '++id, &key, unlockedAt',
    })
  }
}

export const db = new ExerciseTrackerDB()
