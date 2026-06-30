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
  }
}

export const db = new ExerciseTrackerDB()
