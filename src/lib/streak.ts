import { toDateStr } from './dateUtils'

export interface StreakResult {
  current: number
  best: number
}

/**
 * All dates are local-time YYYY-MM-DD strings; never derive them via
 * toISOString(), which shifts to UTC and breaks between midnight and
 * ~10am AEST.
 */
export function computeStreak(activeDates: string[], today: string): StreakResult {
  const dates = [...new Set(activeDates)].sort().reverse()
  if (dates.length === 0) return { current: 0, best: 0 }

  const best = calcBest(dates)
  const yesterday = addDays(today, -1)

  if (dates[0] !== today && dates[0] !== yesterday) {
    return { current: 0, best }
  }

  let current = 0
  let cursor = dates[0]
  for (const d of dates) {
    if (d === cursor) {
      current++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }

  return { current, best: Math.max(current, best) }
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return toDateStr(d)
}

function calcBest(sortedDatesDesc: string[]): number {
  let best = 1
  let run = 1
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const prev = new Date(sortedDatesDesc[i - 1] + 'T00:00:00')
    const curr = new Date(sortedDatesDesc[i] + 'T00:00:00')
    // Round because DST transitions make a calendar day 23 or 25 hours
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000)
    if (diff === 1) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}
