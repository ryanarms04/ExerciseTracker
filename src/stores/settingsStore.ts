import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayStr } from '../lib/dateUtils'
import type { GoalPeriod, SettingsState } from '../types'

interface SettingsActions {
  setUserName: (name: string) => void
  setDailyGoal: (goal: number) => void
  setTheme: (theme: SettingsState['theme']) => void
  completeOnboarding: () => void
  setSelectedExerciseIds: (ids: number[]) => void
  setLastGoalCelebration: (date: string) => void
  /** One-time backfill for devices that predate goal history. */
  seedGoalHistory: (from: string) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      userName: '',
      dailyGoal: 50,
      theme: 'system',
      hasCompletedOnboarding: false,
      selectedExerciseIds: [],
      lastGoalCelebration: '',
      goalHistory: [],

      setUserName: (userName) => set({ userName }),

      // Record when each goal took effect so past days keep being judged
      // against the goal that was live at the time.
      setDailyGoal: (dailyGoal) =>
        set((s) => {
          const today = todayStr()
          const history: GoalPeriod[] = [
            ...s.goalHistory.filter((p) => p.from !== today),
            { from: today, goal: dailyGoal },
          ].sort((a, b) => a.from.localeCompare(b.from))
          return { dailyGoal, goalHistory: history }
        }),

      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setSelectedExerciseIds: (selectedExerciseIds) => set({ selectedExerciseIds }),
      setLastGoalCelebration: (lastGoalCelebration) => set({ lastGoalCelebration }),

      seedGoalHistory: (from) =>
        set((s) =>
          s.goalHistory.length > 0 ? s : { goalHistory: [{ from, goal: s.dailyGoal }] },
        ),
    }),
    { name: 'exercise-tracker-settings' },
  ),
)
