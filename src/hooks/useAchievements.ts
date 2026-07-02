import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../stores/settingsStore'
import { todayStr } from '../lib/dateUtils'
import { computeStreak } from '../lib/streak'
import type { AchievementStats } from '../types'

export function useAchievements() {
  const dailyGoal = useSettingsStore((s) => s.dailyGoal)

  const unlocked = useLiveQuery(() => db.achievements.toArray(), [])

  const stats = useLiveQuery(async (): Promise<AchievementStats | undefined> => {
    const allSessions = await db.sessions.toArray()
    if (allSessions.length === 0) {
      return {
        totalReps: 0,
        currentStreak: 0,
        bestDay: 0,
        uniqueExercises: 0,
        todayReps: 0,
        dailyGoal,
        loggedBefore7am: false,
        loggedAfter10pm: false,
      }
    }

    const totalReps = allSessions.reduce((sum, s) => sum + s.reps, 0)
    const today = todayStr()
    const todayReps = allSessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.reps, 0)

    const uniqueExercises = new Set(allSessions.map((s) => s.exerciseId)).size

    const repsByDate = new Map<string, number>()
    for (const s of allSessions) {
      repsByDate.set(s.date, (repsByDate.get(s.date) || 0) + s.reps)
    }
    const bestDay = Math.max(...repsByDate.values())

    const currentStreak = computeStreak(
      allSessions.map((s) => s.date),
      today,
    ).current

    const loggedBefore7am = allSessions.some((s) => {
      const h = new Date(s.createdAt).getHours()
      return h < 7
    })
    const loggedAfter10pm = allSessions.some((s) => {
      const h = new Date(s.createdAt).getHours()
      return h >= 22
    })

    return {
      totalReps,
      currentStreak,
      bestDay,
      uniqueExercises,
      todayReps,
      dailyGoal,
      loggedBefore7am,
      loggedAfter10pm,
    }
  }, [dailyGoal])

  // Pure data hook — unlock detection lives in AchievementWatcher (Layout),
  // so it runs no matter which screen is open.
  return { unlocked: unlocked ?? [], stats }
}
