import { useEffect, useRef } from 'react'
import { db } from '../db/database'
import { useAchievements } from '../hooks/useAchievements'
import { useSnackbar } from './ui/Snackbar'
import { useHaptic } from '../hooks/useHaptic'
import { satisfiedTierKeys, tierName } from '../lib/achievements'

/**
 * Always-mounted unlock detector. The first pass after launch records anything
 * already earned *silently* — that keeps a returning user (or someone whose
 * legacy badges just migrated to tiers) from being buried in toasts — and
 * every unlock after that gets its moment.
 */
export function AchievementWatcher() {
  const { unlocked, stats } = useAchievements()
  const snackbar = useSnackbar()
  const haptic = useHaptic()
  const backfilled = useRef(false)
  // Keys mid-write. Each insert updates `unlocked`, which re-runs this effect
  // before the rest of the batch lands — without this guard those keys get
  // re-issued, and the pile-up of colliding writes crashes Dexie's optimistic
  // update layer (it reduces over a null op).
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (!stats || !unlocked) return

    const have = new Set(unlocked.map((a) => a.key))
    const missing = satisfiedTierKeys(stats).filter(
      (k) => !have.has(k) && !inFlight.current.has(k),
    )
    if (missing.length === 0) {
      backfilled.current = true
      return
    }

    const silent = !backfilled.current
    backfilled.current = true
    missing.forEach((k) => inFlight.current.add(k))

    const now = new Date().toISOString()
    // One write for the whole batch — a returning user can satisfy a dozen
    // tiers at once (and every duplicate is harmless: the &key index rejects it).
    db.achievements
      .bulkAdd(missing.map((key) => ({ key, unlockedAt: now })))
      .then(() => {
        if (silent) return
        haptic.success()
        const [first] = missing
        snackbar.show({
          message:
            missing.length === 1
              ? `Unlocked: ${tierName(first)}`
              : `Unlocked: ${tierName(first)} +${missing.length - 1} more`,
        })
      })
      .catch((err) => {
        // BulkError/ConstraintError just means another tab or pass won the race.
        if (err?.name !== 'BulkError' && err?.name !== 'ConstraintError') {
          console.error(err)
        }
      })
      .finally(() => missing.forEach((k) => inFlight.current.delete(k)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, unlocked])

  return null
}
