import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Download } from 'lucide-react'
import { Sheet } from '../components/ui/Sheet'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { db } from '../db/database'
import { eraseAllData } from '../db/reset'

const CONFIRM_WORD = 'DELETE'

interface ResetDataSheetProps {
  open: boolean
  onClose: () => void
  /** Offered as a way out before anything is destroyed. */
  onExport: () => void
}

/**
 * Deleting everything is irreversible and there is no cloud copy, so it takes
 * three deliberate acts: opening this sheet, typing DELETE, and pressing a
 * button that says exactly what it does.
 */
export function ResetDataSheet({ open, onClose, onExport }: ResetDataSheetProps) {
  const [typed, setTyped] = useState('')
  const [erasing, setErasing] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const wasOpen = useRef(false)

  const counts = useLiveQuery(async () => {
    const [sessions, exercises, achievements] = await Promise.all([
      db.sessions.count(),
      db.exercises.count(),
      db.achievements.count(),
    ])
    return { sessions, exercises, achievements }
  }, [])

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTyped('')
      setFailed(null)
      setErasing(false)
    }
    wasOpen.current = open
  }, [open])

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD

  async function handleErase() {
    if (!confirmed || erasing) return
    setErasing(true)
    setFailed(null)
    try {
      await eraseAllData()
      // Full reload: the app boots as a first run, re-seeds and shows onboarding
      window.location.reload()
    } catch (err) {
      setErasing(false)
      setFailed(err instanceof Error ? `${err.name}: ${err.message}` : 'Unknown error')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Delete all data">
      <div className="max-w-sm mx-auto space-y-5">
        <div className="flex gap-3 p-4 rounded-[var(--radius-card)] bg-danger/10 border border-danger/40">
          <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="type-label text-text">This erases everything on this device.</p>
            <p className="type-caption text-text-mute mt-1.5 leading-5">
              Your workouts live only here — there is no account and no cloud copy, so
              this cannot be undone.
            </p>
          </div>
        </div>

        <div>
          <p className="type-caption uppercase text-text-faint mb-2">About to be deleted</p>
          <ul className="space-y-1.5">
            {[
              { n: counts?.sessions, label: 'logged sets' },
              { n: counts?.exercises, label: 'exercises, including any you made' },
              { n: counts?.achievements, label: 'unlocked levels' },
            ].map((row) => (
              <li key={row.label} className="flex items-baseline gap-2">
                <span className="num-sm text-text">{row.n ?? '—'}</span>
                <span className="type-caption text-text-mute">{row.label}</span>
              </li>
            ))}
            <li className="flex items-baseline gap-2">
              <span className="num-sm text-text">·</span>
              <span className="type-caption text-text-mute">
                your name, daily goal and streak history
              </span>
            </li>
          </ul>
        </div>

        <Button variant="secondary" onClick={onExport} fullWidth>
          <Download size={16} />
          Export a backup first
        </Button>

        <div>
          <Input
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="reset-help"
          />
          <p id="reset-help" className="type-caption text-text-faint mt-1.5">
            This step exists so nobody deletes months of work with a stray tap.
          </p>
        </div>

        {failed && (
          <p className="type-caption text-danger" role="alert">
            Nothing was deleted — {failed}. Try again, or reload the app.
          </p>
        )}

        <button
          onClick={handleErase}
          disabled={!confirmed || erasing}
          className="w-full min-h-14 rounded-2xl bg-danger text-danger-ink type-heading disabled:opacity-40 transition-opacity"
        >
          {erasing ? 'Deleting…' : 'Delete everything and start over'}
        </button>
      </div>
    </Sheet>
  )
}
