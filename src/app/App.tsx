import { useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { Router } from './Router'
import { useTheme } from '../hooks/useTheme'
import { seedDatabase } from '../db/seed'
import { db } from '../db/database'
import { StorageUnavailable } from '../components/StorageUnavailable'
import { useSettingsStore } from '../stores/settingsStore'
import { todayStr } from '../lib/dateUtils'

type Health = 'checking' | 'ok' | 'unavailable'

/** One-shot: retires the pre-overlay celebration mark. */
const CELEBRATION_RESET_KEY = 'exercise-tracker-celebration-reset'

export default function App() {
  useTheme()
  const [health, setHealth] = useState<Health>('checking')
  const [detail, setDetail] = useState('')
  const [attempt, setAttempt] = useState(0)

  // Prove the database opens before rendering the app. If it can't (private
  // window, in-app browser, blocked site data), every query would silently
  // hang and the user would stare at an empty shell forever.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        await db.open()
        if (cancelled) return
        setHealth('ok')
      } catch (err) {
        if (cancelled) return
        const e = err as { name?: string; message?: string }
        setDetail(`${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`)
        setHealth('unavailable')
        return
      }
      // Seeding failing is survivable (existing data still loads) and retries
      // on the next launch, so it never blocks the UI.
      seedDatabase().catch((err) => console.error('Seeding failed:', err))

      // Devices that logged before goal history existed get one period opened
      // at their earliest session, so old days are judged against the goal
      // they're using today rather than against nothing.
      try {
        if (useSettingsStore.getState().goalHistory.length === 0) {
          const first = await db.sessions.orderBy('date').first()
          useSettingsStore.getState().seedGoalHistory(first?.date ?? todayStr())
        }
      } catch (err) {
        console.error('Goal history backfill failed:', err)
      }

      // The old build marked the day celebrated for a moment that was only a
      // ring sweep. Anyone updating mid-day would have the new overlay silently
      // suppressed, so clear that mark once — worst case the moment plays one
      // extra time.
      try {
        if (localStorage.getItem(CELEBRATION_RESET_KEY) !== '1') {
          useSettingsStore.getState().setLastGoalCelebration('')
          localStorage.setItem(CELEBRATION_RESET_KEY, '1')
        }
      } catch {
        /* storage blocked — the moment simply waits for tomorrow */
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setHealth('checking')
    setAttempt((n) => n + 1)
  }, [])

  if (health === 'unavailable') {
    return <StorageUnavailable detail={detail} onRetry={retry} />
  }
  if (health === 'checking') return null

  return (
    <MotionConfig reducedMotion="user">
      <Router />
    </MotionConfig>
  )
}
