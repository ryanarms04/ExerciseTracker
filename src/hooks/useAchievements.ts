import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useProgress } from './useProgress'

export function useAchievements() {
  const unlocked = useLiveQuery(() => db.achievements.toArray(), [])
  const progress = useProgress()

  // Pure data — unlock detection lives in AchievementWatcher (Layout), so it
  // runs no matter which screen is open.
  return { unlocked: unlocked ?? [], stats: progress?.stats }
}
