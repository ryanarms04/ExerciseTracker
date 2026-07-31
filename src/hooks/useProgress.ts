import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../stores/settingsStore'
import { computeStreak } from '../lib/streak'
import { dayTotals, goalForDate, goalMetDates } from '../lib/progress'
import { todayStr } from '../lib/dateUtils'
import type { AchievementStats } from '../types'

export interface ProgressSnapshot {
  stats: AchievementStats
  /** Days that met their goal — what the streak and the week dots are built from. */
  goalMet: Set<string>
  todayGoal: number
  todayMet: boolean
}

/**
 * One query behind every progression number in the app, so the streak shown on
 * Today, the achievement tiers on You and the celebration overlay can never
 * disagree with each other.
 */
export function useProgress(): ProgressSnapshot | undefined {
  const dailyGoal = useSettingsStore((s) => s.dailyGoal)
  const goalHistory = useSettingsStore((s) => s.goalHistory)

  return useLiveQuery(async (): Promise<ProgressSnapshot> => {
    const sessions = await db.sessions.toArray()
    const today = todayStr()
    const totals = dayTotals(sessions)
    const met = goalMetDates(totals, goalHistory, dailyGoal)
    const streak = computeStreak(met, today)
    const todayGoal = goalForDate(goalHistory, today, dailyGoal)
    const todayReps = totals.get(today) ?? 0

    const stats: AchievementStats = {
      totalReps: sessions.reduce((sum, s) => sum + s.reps, 0),
      currentStreak: streak.current,
      bestStreak: streak.best,
      bestDay: totals.size > 0 ? Math.max(...totals.values()) : 0,
      uniqueExercises: new Set(sessions.map((s) => s.exerciseId)).size,
      goalDays: met.length,
      todayReps,
      dailyGoal: todayGoal,
      loggedBefore7am: sessions.some((s) => new Date(s.createdAt).getHours() < 7),
      loggedAfter10pm: sessions.some((s) => new Date(s.createdAt).getHours() >= 22),
    }

    return {
      stats,
      goalMet: new Set(met),
      todayGoal,
      todayMet: todayReps >= todayGoal,
    }
  }, [dailyGoal, goalHistory])
}
