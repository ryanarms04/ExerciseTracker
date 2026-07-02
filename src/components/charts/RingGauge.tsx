import { motion } from 'motion/react'

interface RingGaugeProps {
  value: number
  goal: number
  size?: number
  strokeWidth?: number
}

// ease-out-quart — fast start, gentle landing (REDESIGN §7 mount fill)
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

/**
 * The goal ring. Fills over 800ms; past 100% a second ember arc sweeps on
 * top of the closed accent ring. The number lives in the center.
 */
export function RingGauge({ value, goal, size = 128, strokeWidth = 10 }: RingGaugeProps) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const progress = goal > 0 ? value / goal : 0
  const base = Math.min(progress, 1)
  const over = Math.min(Math.max(progress - 1, 0), 1)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ring-track"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-accent-bright"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - base) }}
          transition={{ duration: 0.8, ease: EASE_OUT_QUART }}
        />
        {over > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-ember"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - over) }}
            transition={{ duration: 0.8, ease: EASE_OUT_QUART }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="num-xl text-text">{value}</span>
      </div>
    </div>
  )
}
