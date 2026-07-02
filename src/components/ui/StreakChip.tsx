import { Flame } from 'lucide-react'
import { useStreak } from '../../hooks/useStreak'

/** 🔥 n — ember ring while a streak is alive, muted at zero. */
export function StreakChip() {
  const streak = useStreak()
  const current = streak?.current ?? 0
  const lit = current > 0

  return (
    <div
      aria-label={`${current} day streak`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
        lit ? 'border-ember text-ember' : 'border-hairline text-text-faint'
      }`}
    >
      <Flame size={14} />
      <span className="num-sm">{current}</span>
    </div>
  )
}
