import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../stores/settingsStore'
import { ACHIEVEMENTS } from '../lib/achievements'
import { todayStr } from '../lib/dateUtils'
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

    const dates = [...new Set(allSessions.map((s) => s.date))].sort().reverse()
    let currentStreak = 0
    const cursor = new Date()
    const todayCheck = cursor.toISOString().split('T')[0]
    const yesterdayDate = new Date(cursor)
    yesterdayDate.setDate(cursor.getDate() - 1)
    const yesterdayCheck = yesterdayDate.toISOString().split('T')[0]

    if (dates[0] === todayCheck || dates[0] === yesterdayCheck) {
      const start = dates[0] === todayCheck ? new Date() : yesterdayDate
      for (const d of dates) {
        if (d === start.toISOString().split('T')[0]) {
          currentStreak++
          start.setDate(start.getDate() - 1)
        } else break
      }
    }

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

  useEffect(() => {
    if (!stats || !unlocked) return

    const unlockedKeys = new Set(unlocked.map((a) => a.key))

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedKeys.has(achievement.key) && achievement.rule(stats)) {
        db.achievements.add({
          key: achievement.key,
          unlockedAt: new Date().toISOString(),
        })
      }
    }
  }, [stats, unlocked])

  return { unlocked: unlocked ?? [], stats }
}
