import { describe, it, expect } from 'vitest'
import { dayTotals, goalForDate, goalMetDates } from './progress'
import { computeStreak } from './streak'
import { ACHIEVEMENT_FAMILIES, familyProgress, satisfiedTierKeys, tierName } from './achievements'
import type { AchievementStats, GoalPeriod } from '../types'

const history: GoalPeriod[] = [
  { from: '2026-01-01', goal: 20 },
  { from: '2026-03-01', goal: 50 },
  { from: '2026-06-01', goal: 100 },
]

describe('goalForDate', () => {
  it('uses the goal in effect on that day', () => {
    expect(goalForDate(history, '2026-01-15', 999)).toBe(20)
    expect(goalForDate(history, '2026-04-10', 999)).toBe(50)
    expect(goalForDate(history, '2026-07-04', 999)).toBe(100)
  })

  it('applies a period from its very first day', () => {
    expect(goalForDate(history, '2026-03-01', 999)).toBe(50)
  })

  it('falls back to the earliest known goal for days before tracking began', () => {
    expect(goalForDate(history, '2025-12-25', 999)).toBe(20)
  })

  it('uses the passed fallback when there is no history at all', () => {
    expect(goalForDate([], '2026-05-05', 42)).toBe(42)
  })
})

describe('goalMetDates', () => {
  it('judges each day against its own era, so raising the goal never rewrites history', () => {
    const totals = new Map([
      ['2026-01-10', 25], // goal 20 → met
      ['2026-04-10', 25], // goal 50 → missed
      ['2026-06-10', 25], // goal 100 → missed
      ['2026-06-11', 120], // goal 100 → met
    ])
    expect(goalMetDates(totals, history, 50)).toEqual(['2026-01-10', '2026-06-11'])
  })

  it('counts a day that exactly meets the goal', () => {
    expect(goalMetDates(new Map([['2026-04-01', 50]]), history, 50)).toEqual(['2026-04-01'])
  })

  it('returns days sorted ascending', () => {
    const totals = new Map([
      ['2026-04-03', 60],
      ['2026-04-01', 60],
      ['2026-04-02', 60],
    ])
    expect(goalMetDates(totals, history, 50)).toEqual(['2026-04-01', '2026-04-02', '2026-04-03'])
  })
})

describe('dayTotals', () => {
  it('sums every session logged on the same day', () => {
    const totals = dayTotals([
      { date: '2026-07-01', reps: 20 },
      { date: '2026-07-01', reps: 30 },
      { date: '2026-07-02', reps: 5 },
    ])
    expect(totals.get('2026-07-01')).toBe(50)
    expect(totals.get('2026-07-02')).toBe(5)
  })
})

describe('streak now means goal-met days', () => {
  it('breaks when a day falls short of its goal', () => {
    const totals = new Map([
      ['2026-04-01', 60],
      ['2026-04-02', 10], // short of 50 — breaks the run
      ['2026-04-03', 60],
      ['2026-04-04', 60],
    ])
    const met = goalMetDates(totals, history, 50)
    expect(computeStreak(met, '2026-04-04')).toEqual({ current: 2, best: 2 })
  })

  it('survives a day that only just clears the goal', () => {
    const totals = new Map([
      ['2026-04-01', 50],
      ['2026-04-02', 50],
      ['2026-04-03', 50],
    ])
    const met = goalMetDates(totals, history, 50)
    expect(computeStreak(met, '2026-04-03').current).toBe(3)
  })
})

const baseStats: AchievementStats = {
  totalReps: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestDay: 0,
  uniqueExercises: 0,
  goalDays: 0,
  todayReps: 0,
  dailyGoal: 50,
  loggedBefore7am: false,
  loggedAfter10pm: false,
}

describe('achievement tiers', () => {
  const totals = ACHIEVEMENT_FAMILIES.find((f) => f.key === 'total')!

  it('reports the level and the climb to the next rung', () => {
    const p = familyProgress(totals, { ...baseStats, totalReps: 700 })
    expect(p.level).toBe(3) // 1, 100, 500 cleared
    expect(p.earned?.value).toBe(500)
    expect(p.next?.value).toBe(1000)
    expect(p.fraction).toBeCloseTo(200 / 500)
    expect(p.maxed).toBe(false)
  })

  it('maxes out at the top tier', () => {
    const p = familyProgress(totals, { ...baseStats, totalReps: 250_000 })
    expect(p.level).toBe(totals.tiers.length)
    expect(p.next).toBeNull()
    expect(p.maxed).toBe(true)
    expect(p.fraction).toBe(1)
  })

  it('keeps climbing well past a year of training', () => {
    // 50 reps/day for two years, never missing
    const twoYears: AchievementStats = {
      ...baseStats,
      totalReps: 36_500,
      bestStreak: 730,
      goalDays: 730,
    }
    const level = ACHIEVEMENT_FAMILIES.reduce((n, f) => n + familyProgress(f, twoYears).level, 0)
    expect(level).toBeGreaterThan(20)
    // and there is still somewhere to go
    expect(familyProgress(totals, twoYears).next?.value).toBe(50_000)
  })

  it('derives storage keys for everything satisfied', () => {
    const keys = satisfiedTierKeys({ ...baseStats, totalReps: 150, uniqueExercises: 3 })
    expect(keys).toContain('total:1')
    expect(keys).toContain('total:100')
    expect(keys).toContain('variety:3')
    expect(keys).not.toContain('total:500')
  })

  it('names a stored key for the unlock toast', () => {
    expect(tierName('streak:365')).toBe('Year of Fire')
    expect(tierName('total:100000')).toBe('Legend')
  })
})
