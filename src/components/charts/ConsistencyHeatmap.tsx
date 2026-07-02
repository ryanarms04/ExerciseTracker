import { todayStr, mondayOf, addDaysStr } from '../../lib/dateUtils'

interface ConsistencyHeatmapProps {
  /** Reps per date (YYYY-MM-DD). */
  totalsByDate: Map<string, number>
}

const WEEKS = 12
const CELL = 14
const R = 4.5

/**
 * 7×12 dot matrix of the last 12 weeks, columns = weeks, rows = Mon–Sun.
 * Intensity is relative to the personal average over active days, so a
 * 20-rep day and a 200-rep day both read honestly for their owner.
 */
export function ConsistencyHeatmap({ totalsByDate }: ConsistencyHeatmapProps) {
  const today = todayStr()
  const startMonday = addDaysStr(mondayOf(today), -(WEEKS - 1) * 7)

  const active: number[] = []
  for (const [date, total] of totalsByDate) {
    if (date >= startMonday && date <= today && total > 0) active.push(total)
  }
  const avg = active.length > 0 ? active.reduce((a, b) => a + b, 0) / active.length : 0

  const cells: { x: number; y: number; opacity: number; filled: boolean }[] = []
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDaysStr(startMonday, w * 7 + d)
      if (date > today) continue
      const total = totalsByDate.get(date) ?? 0
      const filled = total > 0
      const opacity = !filled ? 1 : total < avg * 0.75 ? 0.35 : total <= avg * 1.5 ? 0.65 : 1
      cells.push({ x: w * CELL + CELL / 2, y: d * CELL + CELL / 2, opacity, filled })
    }
  }

  return (
    <svg
      viewBox={`0 0 ${WEEKS * CELL} ${7 * CELL}`}
      className="w-full h-auto"
      role="img"
      aria-label="Activity for the last 12 weeks"
    >
      {cells.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={R}
          className={c.filled ? 'fill-accent' : 'fill-ring-track'}
          opacity={c.opacity}
        />
      ))}
    </svg>
  )
}
