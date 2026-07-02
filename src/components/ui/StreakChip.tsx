import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'
import { Flame } from 'lucide-react'
import { useStreak } from '../../hooks/useStreak'

/** 🔥 n — ember ring while a streak is alive; pulses once when it grows
    (the first bank of the day extends it). */
export function StreakChip() {
  const streak = useStreak()
  const controls = useAnimation()
  const prev = useRef<number | null>(null)
  const current = streak?.current ?? 0
  const lit = current > 0

  useEffect(() => {
    if (streak === undefined) return
    if (prev.current !== null && streak.current > prev.current) {
      controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.45 } })
    }
    prev.current = streak.current
  }, [streak, controls])

  return (
    <motion.div
      animate={controls}
      aria-label={`${current} day streak`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
        lit ? 'border-ember text-ember' : 'border-hairline text-text-faint'
      }`}
    >
      <Flame size={14} />
      <span className="num-sm">{current}</span>
    </motion.div>
  )
}
