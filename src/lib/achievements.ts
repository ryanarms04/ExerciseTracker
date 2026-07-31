import type { AchievementFamily, AchievementStats, AchievementTier } from '../types'

/**
 * Progression is organised as families of ascending tiers. Someone training
 * daily for two years still has rungs above them (100,000 reps, a 730-day
 * streak), and the You screen stays readable because each family shows one
 * badge — its current level and the climb to the next.
 */
export const ACHIEVEMENT_FAMILIES: AchievementFamily[] = [
  {
    key: 'total',
    name: 'Total reps',
    unit: 'reps',
    icon: 'award',
    measure: (s) => s.totalReps,
    tiers: [
      { value: 1, name: 'First Rep' },
      { value: 100, name: 'Century Club' },
      { value: 500, name: 'Five Hundred' },
      { value: 1_000, name: 'Thousandaire' },
      { value: 2_500, name: 'Iron Will' },
      { value: 5_000, name: 'Five K Club' },
      { value: 10_000, name: 'Ten Thousand Strong' },
      { value: 25_000, name: 'Relentless' },
      { value: 50_000, name: 'Machine' },
      { value: 100_000, name: 'Legend' },
    ],
  },
  {
    key: 'streak',
    name: 'Streak',
    unit: 'days in a row',
    icon: 'flame',
    measure: (s) => s.bestStreak,
    tiers: [
      { value: 3, name: '3-Day Streak' },
      { value: 7, name: 'Weekly Warrior' },
      { value: 14, name: 'Fortnight' },
      { value: 30, name: 'Monthly Monster' },
      { value: 60, name: 'Two Months' },
      { value: 100, name: 'Century Streak' },
      { value: 180, name: 'Half a Year' },
      { value: 365, name: 'Year of Fire' },
      { value: 500, name: 'Five Hundred Days' },
      { value: 730, name: 'Two Years' },
    ],
  },
  {
    key: 'goaldays',
    name: 'Goals hit',
    unit: 'days',
    icon: 'check-circle',
    measure: (s) => s.goalDays,
    tiers: [
      { value: 1, name: 'Goal Crusher' },
      { value: 10, name: 'Ten Days Done' },
      { value: 50, name: 'Fifty Days' },
      { value: 100, name: 'Hundred Days' },
      { value: 250, name: 'Committed' },
      { value: 500, name: 'Five Hundred Days' },
      { value: 1_000, name: 'Thousand Days' },
    ],
  },
  {
    key: 'bestday',
    name: 'Biggest day',
    unit: 'reps in a day',
    icon: 'trophy',
    measure: (s) => s.bestDay,
    tiers: [
      { value: 50, name: 'Big Day' },
      { value: 100, name: 'Century Day' },
      { value: 200, name: 'Double Century' },
      { value: 500, name: 'Monster Day' },
      { value: 1_000, name: 'Thousand in a Day' },
    ],
  },
  {
    key: 'variety',
    name: 'Variety',
    unit: 'exercises',
    icon: 'target',
    measure: (s) => s.uniqueExercises,
    tiers: [
      { value: 3, name: 'Mixing It Up' },
      { value: 5, name: 'Well Rounded' },
      { value: 8, name: 'Explorer' },
      { value: 12, name: 'Completionist' },
    ],
  },
  {
    key: 'early',
    name: 'Early bird',
    unit: '',
    icon: 'sunrise',
    measure: (s) => (s.loggedBefore7am ? 1 : 0),
    tiers: [{ value: 1, name: 'Early Bird' }],
  },
  {
    key: 'night',
    name: 'Night owl',
    unit: '',
    icon: 'moon',
    measure: (s) => (s.loggedAfter10pm ? 1 : 0),
    tiers: [{ value: 1, name: 'Night Owl' }],
  },
]

/** Stable id for one tier, stored in the achievements table. */
export function tierKey(familyKey: string, tier: AchievementTier): string {
  return `${familyKey}:${tier.value}`
}

export interface FamilyProgress {
  /** Tiers cleared so far. */
  level: number
  /** How far into the current rung, 0–1. */
  fraction: number
  current: number
  next: AchievementTier | null
  /** Highest tier cleared. */
  earned: AchievementTier | null
  maxed: boolean
}

export function familyProgress(
  family: AchievementFamily,
  stats: AchievementStats,
): FamilyProgress {
  const current = family.measure(stats)
  const cleared = family.tiers.filter((t) => current >= t.value)
  const level = cleared.length
  const next = family.tiers[level] ?? null
  const earned = cleared[cleared.length - 1] ?? null
  const floor = earned?.value ?? 0
  const fraction = next ? Math.min((current - floor) / (next.value - floor), 1) : 1
  return { level, fraction, current, next, earned, maxed: !next }
}

/** Every tier the stats currently satisfy, as storage keys. */
export function satisfiedTierKeys(stats: AchievementStats): string[] {
  const keys: string[] = []
  for (const family of ACHIEVEMENT_FAMILIES) {
    const value = family.measure(stats)
    for (const tier of family.tiers) {
      if (value >= tier.value) keys.push(tierKey(family.key, tier))
    }
  }
  return keys
}

/** Human name for a stored key, for the unlock toast. */
export function tierName(key: string): string {
  const [familyKey, raw] = key.split(':')
  const family = ACHIEVEMENT_FAMILIES.find((f) => f.key === familyKey)
  return family?.tiers.find((t) => t.value === Number(raw))?.name ?? key
}

export const TOTAL_LEVELS = ACHIEVEMENT_FAMILIES.reduce((n, f) => n + f.tiers.length, 0)

/** Keys written by the pre-tier release, mapped onto their new homes. */
export const LEGACY_KEY_MAP: Record<string, string> = {
  first_rep: 'total:1',
  century: 'total:100',
  thousand: 'total:1000',
  streak_3: 'streak:3',
  streak_7: 'streak:7',
  streak_30: 'streak:30',
  five_exercises: 'variety:5',
  daily_goal: 'goaldays:1',
  early_bird: 'early:1',
  night_owl: 'night:1',
}
