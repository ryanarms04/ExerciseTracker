import { useEffect } from 'react'
import { db } from '../db/database'
import { useAchievements } from '../hooks/useAchievements'
import { useSnackbar } from './ui/Snackbar'
import { useHaptic } from '../hooks/useHaptic'
import { ACHIEVEMENTS } from '../lib/achievements'

/**
 * Always-mounted unlock detector (unlocks used to fire only while the old
 * Profile screen was open). New unlocks get a haptic + "Unlocked: …" snackbar
 * — no more silent achievements.
 */
export function AchievementWatcher() {
  const { unlocked, stats } = useAchievements()
  const snackbar = useSnackbar()
  const haptic = useHaptic()

  useEffect(() => {
    if (!stats || !unlocked) return
    const unlockedKeys = new Set(unlocked.map((a) => a.key))

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedKeys.has(achievement.key) && achievement.rule(stats)) {
        db.achievements
          .add({ key: achievement.key, unlockedAt: new Date().toISOString() })
          .then(() => {
            haptic.success()
            snackbar.show({ message: `Unlocked: ${achievement.name}` })
          })
          .catch((err) => {
            // &key unique index rejects concurrent double-unlocks (StrictMode,
            // multiple tabs) — that rejection is the desired outcome.
            if (err?.name !== 'ConstraintError') console.error(err)
          })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, unlocked])

  return null
}
