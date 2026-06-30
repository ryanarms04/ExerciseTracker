import type { AchievementDef } from '../types'

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_rep',
    name: 'First Rep',
    description: 'Log your very first rep',
    icon: 'zap',
    rule: (s) => s.totalReps >= 1,
  },
  {
    key: 'century',
    name: 'Century Club',
    description: 'Reach 100 total reps',
    icon: 'award',
    rule: (s) => s.totalReps >= 100,
  },
  {
    key: 'thousand',
    name: 'Thousandaire',
    description: 'Reach 1,000 total reps',
    icon: 'crown',
    rule: (s) => s.totalReps >= 1000,
  },
  {
    key: 'streak_3',
    name: '3-Day Streak',
    description: 'Work out 3 days in a row',
    icon: 'flame',
    rule: (s) => s.currentStreak >= 3,
  },
  {
    key: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Work out 7 days in a row',
    icon: 'shield',
    rule: (s) => s.currentStreak >= 7,
  },
  {
    key: 'streak_30',
    name: 'Monthly Monster',
    description: 'Work out 30 days in a row',
    icon: 'trophy',
    rule: (s) => s.currentStreak >= 30,
  },
  {
    key: 'five_exercises',
    name: 'Well Rounded',
    description: 'Use 5 different exercises',
    icon: 'target',
    rule: (s) => s.uniqueExercises >= 5,
  },
  {
    key: 'daily_goal',
    name: 'Goal Crusher',
    description: 'Hit your daily rep goal',
    icon: 'check-circle',
    rule: (s) => s.todayReps >= s.dailyGoal,
  },
  {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Log reps before 7am',
    icon: 'sunrise',
    rule: (s) => s.loggedBefore7am,
  },
  {
    key: 'night_owl',
    name: 'Night Owl',
    description: 'Log reps after 10pm',
    icon: 'moon',
    rule: (s) => s.loggedAfter10pm,
  },
]
