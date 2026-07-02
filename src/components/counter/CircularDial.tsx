import { useRef, useCallback, useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'

interface CircularDialProps {
  size: number
  strokeWidth: number
  count: number
  onIncrement: () => void
  onDecrement: () => void
  color?: string
}

const DEGREES_PER_REP = 36
const REPS_PER_SPIN = 10
const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI / 2
const RAD_PER_REP = (DEGREES_PER_REP * Math.PI) / 180

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

export function CircularDial({
  size,
  strokeWidth,
  count,
  onIncrement,
  onDecrement,
  color = '#0EA5A2',
}: CircularDialProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastAngle = useRef(0)
  const accumulated = useRef(0)
  const [active, setActive] = useState(false)
  const [dragPartial, setDragPartial] = useState(0)

  const dotRadius = strokeWidth * 1.8
  const padding = dotRadius + 2
  const radius = (size - padding * 2) / 2
  const center = size / 2
  const circumference = TWO_PI * radius

  const continuousProgress = count / REPS_PER_SPIN + (active ? dragPartial / REPS_PER_SPIN : 0)

  const springProgress = useSpring(continuousProgress, {
    stiffness: 300,
    damping: 30,
  })

  useEffect(() => {
    springProgress.set(continuousProgress)
  }, [continuousProgress, springProgress])

  const dashOffset = useTransform(springProgress, (v) => {
    if (v <= 0) return circumference
    const frac = v % 1
    if (frac < 0.001) return 0
    return circumference * (1 - frac)
  })

  const thumbCx = useTransform(springProgress, (v) => {
    const frac = ((v % 1) + 1) % 1
    const angle = -HALF_PI + frac * TWO_PI
    return center + radius * Math.cos(angle)
  })
  const thumbCy = useTransform(springProgress, (v) => {
    const frac = ((v % 1) + 1) % 1
    const angle = -HALF_PI + frac * TWO_PI
    return center + radius * Math.sin(angle)
  })

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
      setDragPartial(0)
      setActive(true)
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

      const degreesMoved = (accumulated.current * 180) / Math.PI
      const reps = Math.floor(Math.abs(degreesMoved) / DEGREES_PER_REP)

      if (reps > 0) {
        const isClockwise = degreesMoved > 0
        for (let i = 0; i < reps; i++) {
          if (isClockwise) onIncrement()
          else onDecrement()
        }
        const consumedRad = reps * RAD_PER_REP
        if (degreesMoved > 0) accumulated.current -= consumedRad
        else accumulated.current += consumedRad
      }

      const partialReps = accumulated.current / RAD_PER_REP
      setDragPartial(partialReps)
    },
    [getAngle, onIncrement, onDecrement],
  )

  const handleEnd = useCallback(() => {
    isDragging.current = false
    accumulated.current = 0
    setDragPartial(0)
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
      const ringInner = (radius - strokeWidth * 3) * scale
      const ringOuter = (radius + strokeWidth * 3) * scale
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

  const ticks = Array.from({ length: REPS_PER_SPIN }, (_, i) => {
    const a = (i / REPS_PER_SPIN) * TWO_PI - HALF_PI
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
          className="text-ring-track"
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
            className="text-ring-track"
            strokeLinecap="round"
          />
        ))}

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.7}
        />

        <motion.circle
          style={{ cx: thumbCx, cy: thumbCy }}
          r={active ? dotRadius * 1.3 : dotRadius}
          fill={color}
          filter={`drop-shadow(0 0 ${active ? 8 : 4}px ${color}80)`}
        />
      </svg>

      <div
        ref={overlayRef}
        className="absolute inset-0 m-auto z-0 touch-none"
        style={{ width: size, height: size, cursor: active ? 'grabbing' : 'grab' }}
      />
    </>
  )
}
