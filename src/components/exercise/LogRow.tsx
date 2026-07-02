import { DynamicIcon } from '../ui/DynamicIcon'
import { toDateStr, formatTime } from '../../lib/dateUtils'
import type { Exercise, Session } from '../../types'

interface LogRowProps {
  session: Session
  exercise?: Exercise
  /** Tap-to-edit: opens the logger with this session loaded. */
  onClick?: () => void
}

/**
 * One logged set. Shows the session's own wall-clock time; entries logged to
 * a different day than they were created get an honest `added later` badge
 * instead of a misleading time.
 */
export function LogRow({ session, exercise, onClick }: LogRowProps) {
  const backdated = toDateStr(new Date(session.createdAt)) !== session.date
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 bg-surface border border-hairline rounded-[var(--radius-card)]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: (exercise?.color ?? '#64748B') + '1F',
          color: exercise?.color ?? '#64748B',
        }}
      >
        <DynamicIcon name={exercise?.icon ?? 'activity'} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="type-label text-text truncate">{exercise?.name ?? 'Exercise'}</p>
        <p className="type-caption text-text-faint mt-0.5">
          {backdated ? (
            <span className="inline-block px-1.5 py-px rounded bg-surface-2 border border-hairline">
              added later
            </span>
          ) : (
            formatTime(session.createdAt)
          )}
        </p>
      </div>
      <span className="num-md text-text">
        +{session.reps}
        {exercise?.unit === 'seconds' && <span className="num-sm text-text-faint">s</span>}
      </span>
    </Tag>
  )
}
