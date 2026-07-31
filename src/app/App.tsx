import { useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { Router } from './Router'
import { useTheme } from '../hooks/useTheme'
import { seedDatabase } from '../db/seed'
import { db } from '../db/database'
import { StorageUnavailable } from '../components/StorageUnavailable'

type Health = 'checking' | 'ok' | 'unavailable'

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
