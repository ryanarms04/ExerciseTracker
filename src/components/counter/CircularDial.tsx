import { useRef, useCallback, useState, useEffect } from 'react'
import { motion } from 'motion/react'

interface CircularDialProps {
  size: number
  strokeWidth: number
  onIncrement: () => void
  onDecrement: () => void
  color?: string
}

const DEGREES_PER_REP = 30
const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI / 2

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  let sweep = endAngle - startAngle
  if (sweep < 0) sweep += TWO_PI
  if (sweep > TWO_PI) sweep = TWO_PI - 0.001

  const largeArc = sweep > Math.PI ? 1 : 0
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function CircularDial({
  size,
  strokeWidth,
  onIncrement,
  onDecrement,
  color = '#0EA5A2',
}: CircularDialProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastAngle = useRef(0)
  const accumulated = useRef(0)
  const [arcProgress, setArcProgress] = useState(0)
  const [active, setActive] = useState(false)
  const [thumbAngle, setThumbAngle] = useState(-HALF_PI)

  const radius = (size - strokeWidth) / 2
  const center = size / 2

  const getAngle = useCallback(
    (clientX: number, clientY: number) => {
      const el = overlayRef.current
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      return Math.atan2(clientY - cy, clientX - cx)
    },
    [],
  )

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      isDragging.current = true
      lastAngle.current = getAngle(clientX, clientY)
      accumulated.current = 0
      setActive(true)
      setThumbAngle(lastAngle.current)
    },
    [getAngle],
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current) return

      const angle = getAngle(clientX, clientY)
      let delta = angle - lastAngle.current

      if (delta > Math.PI) delta -= TWO_PI
      if (delta < -Math.PI) delta += TWO_PI

      accumulated.current += delta
      lastAngle.current = angle
      setThumbAngle(angle)

      const degreesMoved = (accumulated.current * 180) / Math.PI
      const reps = Math.floor(Math.abs(degreesMoved) / DEGREES_PER_REP)

      if (reps > 0) {
        const isClockwise = degreesMoved > 0
        for (let i = 0; i < reps; i++) {
          if (isClockwise) onIncrement()
          else onDecrement()
        }
        const consumedRad = reps * ((DEGREES_PER_REP * Math.PI) / 180)
        if (degreesMoved > 0) accumulated.current -= consumedRad
        else accumulated.current += consumedRad
      }

      const progressDeg = (accumulated.current * 180) / Math.PI
      setArcProgress(progressDeg / DEGREES_PER_REP)
    },
    [getAngle, onIncrement, onDecrement],
  )

  const handleEnd = useCallback(() => {
    isDragging.current = false
    accumulated.current = 0
    setArcProgress(0)
    setActive(false)
  }, [])

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    function isOnRing(clientX: number, clientY: number) {
      const rect = el!.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.hypot(clientX - cx, clientY - cy)
      const scale = rect.width / size
      const ringInner = (radius - strokeWidth * 2.5) * scale
      const ringOuter = (radius + strokeWidth * 2.5) * scale
      return dist >= ringInner && dist <= ringOuter
    }

    function onPointerDown(e: PointerEvent) {
      if (!isOnRing(e.clientX, e.clientY)) return
      e.preventDefault()
      e.stopPropagation()
      el!.setPointerCapture(e.pointerId)
      handleStart(e.clientX, e.clientY)
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }

    function onPointerUp() {
      handleEnd()
    }

    el.addEventListener('pointerdown', onPointerDown, { passive: false })
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [radius, strokeWidth, size, handleStart, handleMove, handleEnd])

  const startAngle = -HALF_PI
  const progressAngle = arcProgress * ((DEGREES_PER_REP * Math.PI) / 180)
  const showArc = active && Math.abs(arcProgress) > 0.05

  const thumb = polarToCartesian(center, center, radius, thumbAngle)

  const tickCount = 12
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const a = (i / tickCount) * TWO_PI - HALF_PI
    const inner = polarToCartesian(center, center, radius - strokeWidth * 0.8, a)
    const outer = polarToCartesian(center, center, radius + strokeWidth * 0.8, a)
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y }
  })

  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 m-auto pointer-events-none"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-navy-200 dark:text-navy-700"
          opacity={0.5}
        />

        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-navy-300 dark:text-navy-600"
            strokeLinecap="round"
          />
        ))}

        {showArc && (
          <path
            d={describeArc(
              center,
              center,
              radius,
              progressAngle > 0 ? startAngle : startAngle + progressAngle,
              progressAngle > 0 ? startAngle + progressAngle : startAngle,
            )}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}

        {active && (
          <motion.circle
            cx={thumb.x}
            cy={thumb.y}
            r={strokeWidth * 1.8}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="drop-shadow-lg"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        )}
      </svg>

      {/* Transparent overlay for touch/pointer events — sits below buttons via z-index */}
      <div
        ref={overlayRef}
        className="absolute inset-0 m-auto z-0 touch-none"
        style={{ width: size, height: size, cursor: active ? 'grabbing' : 'grab' }}
      />
    </>
  )
}
