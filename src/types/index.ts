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

/** A daily goal and the date it took effect. Sorted ascending by `from`. */
export interface GoalPeriod {
  from: string
  goal: number
}

export interface SettingsState {
  userName: string
  dailyGoal: number
  theme: 'light' | 'dark' | 'system'
  hasCompletedOnboarding: boolean
  selectedExerciseIds: number[]
  /** Date (YYYY-MM-DD) the goal-crossed celebration last ran — once per day. */
  lastGoalCelebration: string
  /**
   * Every goal the user has ever set, with its start date. A day is judged
   * against the goal that was active THAT day, so raising your goal never
   * retroactively breaks a streak you legitimately earned.
   */
  goalHistory: GoalPeriod[]
}

/** One rung of a family. `value` is the threshold on the family's measure. */
export interface AchievementTier {
  value: number
  name: string
}

/**
 * Achievements are families of ascending tiers rather than one-off badges, so
 * progression keeps going for years instead of ending at 1,000 reps.
 */
export interface AchievementFamily {
  key: string
  name: string
  /** What the number means, e.g. "reps", "days in a row". */
  unit: string
  icon: string
  tiers: AchievementTier[]
  measure: (stats: AchievementStats) => number
}

export interface AchievementStats {
  totalReps: number
  currentStreak: number
  bestStreak: number
  bestDay: number
  uniqueExercises: number
  /** Days the daily goal was actually met (not necessarily consecutive). */
  goalDays: number
  todayReps: number
  dailyGoal: number
  loggedBefore7am: boolean
  loggedAfter10pm: boolean
}
