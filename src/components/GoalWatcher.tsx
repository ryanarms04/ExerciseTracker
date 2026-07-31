import { useEffect } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useSettingsStore } from '../stores/settingsStore'
import { useCelebrationStore } from '../stores/celebrationStore'
import { useHaptic } from '../hooks/useHaptic'
import { todayStr } from '../lib/dateUtils'

/**
 * Fires the daily-goal celebration once per day, from wherever the set was
 * banked — the logger lives in the shell, so the moment can't depend on the
 * Today screen being mounted.
 */
export function GoalWatcher() {
  const progress = useProgress()
  const haptic = useHaptic()
  const show = useCelebrationStore((s) => s.show)

  useEffect(() => {
    if (!progress?.todayMet) return
    const today = todayStr()
    const { lastGoalCelebration, setLastGoalCelebration } = useSettingsStore.getState()
    if (lastGoalCelebration === today) return

    setLastGoalCelebration(today)
    haptic.success()
    show({
      streak: progress.stats.currentStreak,
      total: progress.stats.todayReps,
      goal: progress.todayGoal,
    })
  }, [progress, haptic, show])

  return null
}
