export type ExerciseCategory = 'upper' | 'core' | 'lower' | 'custom'

export interface Exercise {
  id?: number
  name: string
  category: ExerciseCategory
  icon: string
  color: string
  isCustom: boolean
  isArchived: boolean
  createdAt: string
}

export interface Session {
  id?: number
  exerciseId: number
  reps: number
  date: string
  notes?: string
  createdAt: string
}

export interface Achievement {
  id?: number
  key: string
  unlockedAt: string
}

export interface SettingsState {
  userName: string
  dailyGoal: number
  theme: 'light' | 'dark' | 'system'
  hasCompletedOnboarding: boolean
  selectedExerciseIds: number[]
}

export interface AchievementDef {
  key: string
  name: string
  description: string
  icon: string
  rule: (stats: AchievementStats) => boolean
}

export interface AchievementStats {
  totalReps: number
  currentStreak: number
  bestDay: number
  uniqueExercises: number
  todayReps: number
  dailyGoal: number
  loggedBefore7am: boolean
  loggedAfter10pm: boolean
}
