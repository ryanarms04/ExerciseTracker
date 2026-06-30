import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useStreak() {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.orderBy('date').uniqueKeys()
    const dates = (sessions as string[]).sort().reverse()

    if (dates.length === 0) return { current: 0, best: 0 }

    let current = 0
    const today = new Date()
    const check = new Date(today)
    check.setHours(0, 0, 0, 0)

    const todayStr = check.toISOString().split('T')[0]
    const yesterdayDate = new Date(check)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return { current: 0, best: calcBest(dates) }
    }

    let cursor = dates[0] === todayStr ? today : yesterdayDate
    for (const dateStr of dates) {
      const expected = cursor.toISOString().split('T')[0]
      if (dateStr === expected) {
        current++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    return { current, best: Math.max(current, calcBest(dates)) }
  }, [])
}

function calcBest(sortedDatesDesc: string[]): number {
  let best = 1
  let run = 1
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const prev = new Date(sortedDatesDesc[i - 1] + 'T00:00:00')
    const curr = new Date(sortedDatesDesc[i] + 'T00:00:00')
    const diff = (prev.getTime() - curr.getTime()) / 86_400_000
    if (diff === 1) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}
