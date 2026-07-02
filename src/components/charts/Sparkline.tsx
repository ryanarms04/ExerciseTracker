interface SparklineProps {
  /** Daily totals, oldest first. */
  points: number[]
  width?: number
  height?: number
}

/** Hand-rolled 7-point trend line for library tiles. */
export function Sparkline({ points, width = 72, height = 20 }: SparklineProps) {
  const max = Math.max(...points, 1)
  const active = points.some((v) => v > 0)
  const step = width / (points.length - 1)
  const path = points
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 4)).toFixed(1)}`)
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={active ? 'text-accent' : 'text-ring-track'}
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
