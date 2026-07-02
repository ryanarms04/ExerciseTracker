import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

interface HoldTimerProps {
  size: number
  count: number
  /** Fires once per held second — parent owns the count (same as dial ticks). */
  onTick: () => void
  color?: string
}

/**
 * Press-and-hold timer for duration exercises. The ring completes one lap per
 * minute (the dial's lap-per-10 grammar, stretched to time). Release pauses;
 * chips still adjust; Bank grammar is unchanged.
 */
export function HoldTimer({ size, count, onTick, color = '#0EA5A2' }: HoldTimerProps) {
  const [holding, setHolding] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  const stop = useCallback(() => {
    setHolding(false)
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current != null) return
    setHolding(true)
    intervalRef.current = window.setInterval(() => onTickRef.current(), 1000)
  }, [])

  useEffect(() => stop, [stop])

  const strokeWidth = 8
  const padding = strokeWidth * 1.8 + 2
  const radius = (size - padding * 2) / 2
  const center = size / 2
  const c = 2 * Math.PI * radius
  const frac = (count % 60) / 60

  return (
    <div
      className="absolute inset-0 touch-none no-select"
      style={{ cursor: 'pointer' }}
      onPointerDown={(e) => {
        e.preventDefault()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // capture is best-effort; the timer must start regardless
        }
        start()
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pointer-events-none">
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
        {/* breathing halo while the timer runs */}
        {holding && (
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
    </div>
  )
}
