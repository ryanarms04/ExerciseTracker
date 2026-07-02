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
  /** How sets are counted. Absent = 'reps' (non-indexed, no schema bump). */
  unit?: 'reps' | 'seconds'
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
  /** Date (YYYY-MM-DD) the goal-crossed celebration last ran — once per day. */
  lastGoalCelebration: string
}

export interface AchievementDef {
  key: string
  name: string
  description: string
  icon: string
  rule: (stats: AchievementStats) => boolean
  /** Live progress toward the unlock, for the badge ring + "450/1000" caption. */
  progress: (stats: AchievementStats) => { current: number; target: number }
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
