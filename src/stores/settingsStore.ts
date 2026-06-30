import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SettingsState } from '../types'

interface SettingsActions {
  setUserName: (name: string) => void
  setDailyGoal: (goal: number) => void
  setTheme: (theme: SettingsState['theme']) => void
  completeOnboarding: () => void
  setSelectedExerciseIds: (ids: number[]) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      userName: '',
      dailyGoal: 50,
      theme: 'system',
      hasCompletedOnboarding: false,
      selectedExerciseIds: [],

      setUserName: (userName) => set({ userName }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setSelectedExerciseIds: (selectedExerciseIds) => set({ selectedExerciseIds }),
    }),
    { name: 'exercise-tracker-settings' },
  ),
)
