import { DatabaseZap } from 'lucide-react'
import { Button } from './ui/Button'

interface StorageUnavailableProps {
  detail: string
  onRetry: () => void
}

/**
 * Shown when the browser refuses to open IndexedDB. Without this the app
 * rendered a silent, permanently empty shell — no exercises, no onboarding,
 * a dead Log button — which refreshing never fixed. Private windows and
 * in-app browsers (links opened inside Instagram, Messenger, etc.) are the
 * usual culprits, so the copy names them and offers the way out.
 */
export function StorageUnavailable({ detail, onRetry }: StorageUnavailableProps) {
  return (
    <div className="min-h-dvh bg-bg text-text flex items-center justify-center px-5 py-10">
      <div className="max-w-sm w-full p-6 bg-surface border border-hairline rounded-[var(--radius-card)] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-hairline flex items-center justify-center mx-auto text-ember">
          <DatabaseZap size={24} />
        </div>

        <h1 className="type-heading text-text text-center">
          This browser is blocking storage
        </h1>

        <p className="type-body text-text-mute">
          Momentum keeps every workout on your own device, so it needs local
          storage to run. This browser isn&rsquo;t allowing it.
        </p>

        <ul className="space-y-2 type-body text-text-mute">
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">
              1.
            </span>
            <span>
              Opened from a chat app? Tap the <strong className="text-text">⋯</strong> menu and
              choose <strong className="text-text">Open in browser</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">
              2.
            </span>
            <span>
              In a private window? Reopen this page in a normal tab.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">
              3.
            </span>
            <span>
              Otherwise, allow site data for this site in your browser settings.
            </span>
          </li>
        </ul>

        <Button onClick={onRetry} fullWidth>
          Try again
        </Button>

        <p className="font-mono text-[11px] leading-4 text-text-faint break-words text-center">
          {detail}
        </p>
      </div>
    </div>
  )
}
