import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { computeStreak } from '../lib/streak'
import { todayStr } from '../lib/dateUtils'

export function useStreak() {
  return useLiveQuery(async () => {
    const dates = (await db.sessions.orderBy('date').uniqueKeys()) as string[]
    return computeStreak(dates, todayStr())
  }, [])
}
