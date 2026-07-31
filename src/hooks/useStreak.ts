import { useProgress } from './useProgress'

/** Current and best run of days that actually hit their goal. */
export function useStreak() {
  const progress = useProgress()
  if (!progress) return undefined
  return { current: progress.stats.currentStreak, best: progress.stats.bestStreak }
}
