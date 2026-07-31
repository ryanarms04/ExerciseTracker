import type { GoalPeriod, Session } from '../types'

/**
 * The goal that was in effect on a given day. Days before the first recorded
 * period fall back to the earliest known goal — the fairest guess for history
 * logged before goal tracking existed.
 */
export function goalForDate(history: GoalPeriod[], date: string, fallback: number): number {
  if (history.length === 0) return fallback
  let goal = history[0].goal
  for (const period of history) {
    if (period.from > date) break
    goal = period.goal
  }
  return goal
}

/** Reps per calendar day. */
export function dayTotals(sessions: Pick<Session, 'date' | 'reps'>[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    totals.set(s.date, (totals.get(s.date) ?? 0) + s.reps)
  }
  return totals
}

/**
 * The days that actually hit their goal — the only days that count toward a
 * streak. Sorted ascending.
 */
export function goalMetDates(
  totals: Map<string, number>,
  history: GoalPeriod[],
  fallback: number,
): string[] {
  const met: string[] = []
  for (const [date, total] of totals) {
    if (total >= goalForDate(history, date, fallback)) met.push(date)
  }
  return met.sort()
}
