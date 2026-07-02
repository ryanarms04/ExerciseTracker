import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

interface SecondsTimerProps {
  size: number
  count: number
  /** Parent owns the running state so bank/switch/reset can stop the clock. */
  running: boolean
  onToggle: () => void
  /** Fires once per running second — parent owns the count (same as dial ticks). */
  onTick: () => void
  color?: string
}

/**
 * Tap-to-start / tap-to-stop timer for duration exercises — you're mid-plank,
 * not holding a phone. The ring completes one lap per minute; chips and Bank
 * grammar are unchanged.
 */
export function SecondsTimer({ size, count, running, onToggle, onTick, color = '#0EA5A2' }: SecondsTimerProps) {
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => onTickRef.current(), 1000)
    return () => clearInterval(id)
  }, [running])

  const strokeWidth = 8
  const padding = strokeWidth * 1.8 + 2
  const radius = (size - padding * 2) / 2
  const center = size / 2
  const c = 2 * Math.PI * radius
  const frac = (count % 60) / 60

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={running}
      aria-label={running ? 'Stop timer' : 'Start timer'}
      className="absolute inset-0 rounded-full touch-none no-select"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-ring-track"
          stroke="currentColor"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: frac === 0 && count > 0 ? 0 : c * (1 - frac) }}
          transition={{ duration: 0.35, ease: 'linear' }}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.7}
        />
        {/* breathing halo while the clock runs */}
        {running && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={2}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: 'center' }}
          />
        )}
      </svg>
    </button>
  )
}
