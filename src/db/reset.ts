import { db } from './database'

/**
 * Only this app's keys. github.io serves every project from one origin, so a
 * blanket localStorage.clear() would wipe unrelated sites' data.
 */
const APP_STORAGE_KEYS = [
  'exercise-tracker-settings',
  'exercise-tracker-seed-version',
  'exercise-tracker-celebration-reset',
]

/**
 * Wipes everything this device holds: workouts, exercises, achievements and
 * settings. Tables are emptied rather than the database dropped — dropping it
 * closes it underneath the live queries still on screen, and an error flash on
 * the way out of a destructive action is the last thing anyone needs.
 */
export async function eraseAllData(): Promise<void> {
  await db.transaction('rw', db.exercises, db.sessions, db.achievements, async () => {
    await Promise.all([db.exercises.clear(), db.sessions.clear(), db.achievements.clear()])
  })

  for (const key of APP_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage blocked — the data itself is already gone */
    }
  }
}
