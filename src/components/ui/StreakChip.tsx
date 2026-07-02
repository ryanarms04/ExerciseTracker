import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, AnimatePresence } from 'motion/react'
import { Flame } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useStreak } from '../../hooks/useStreak'
import { useHaptic } from '../../hooks/useHaptic'
import { todayStr } from '../../lib/dateUtils'

// The streak achievements, as countdown targets
const MILESTONES = [
  { target: 3, name: '3-Day Streak' },
  { target: 7, name: 'Weekly Warrior' },
  { target: 30, name: 'Monthly Monster' },
]

/**
 * 🔥 n — ember ring while a streak is alive; pulses once when it grows.
 * Tap for the fire: an animated flame with streak facts and what it takes
 * to keep it alive.
 */
export function StreakChip() {
  const streak = useStreak()
  const haptic = useHaptic()
  const controls = useAnimation()
  const prev = useRef<number | null>(null)
  const [open, setOpen] = useState(false)

  const current = streak?.current ?? 0
  const best = streak?.best ?? 0
  const lit = current > 0

  const todayLogged = useLiveQuery(async () => {
    const first = await db.sessions.where('date').equals(todayStr()).first()
    return !!first
  }, [])

  // One pulse when the first bank of the day extends the streak
  useEffect(() => {
    if (streak === undefined) return
    if (prev.current !== null && streak.current > prev.current) {
      controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.45 } })
    }
    prev.current = streak.current
  }, [streak, controls])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const nextMilestone = MILESTONES.find((m) => m.target > current)

  const statusLine =
    current === 0
      ? 'Bank any set to light the flame.'
      : todayLogged
        ? 'Today is banked — the flame is safe.'
        : 'Log a set today to keep it burning.'

  return (
    <div className="relative">
      <motion.button
        animate={controls}
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          haptic.tick()
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-label={`${current} day streak — details`}
        className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border transition-shadow ${
          lit
            ? 'border-ember text-ember' + (open ? ' shadow-[0_0_16px_rgb(255_138_92/0.45)]' : '')
            : 'border-hairline text-text-faint'
        }`}
      >
        <Flame size={14} />
        <span className="num-sm">{current}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="absolute right-0 top-full mt-2 z-30 w-64 p-5 bg-surface-2 border border-hairline rounded-[var(--radius-card)] shadow-[var(--shadow-card-hover)]"
              role="dialog"
              aria-label="Streak details"
            >
              <div className="relative flex justify-center mb-3" aria-hidden>
                {/* breathing ember glow */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-ember blur-xl"
                  animate={{ opacity: lit ? [0.35, 0.6, 0.35] : 0.12, scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                {/* rising embers */}
                {lit &&
                  [0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute bottom-2 w-1 h-1 rounded-full bg-ember"
                      style={{ left: `${42 + i * 8}%` }}
                      animate={{ y: [0, -26], opacity: [0, 0.9, 0], scale: [1, 0.5] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45 }}
                    />
                  ))}
                {/* the flame itself, flickering */}
                <motion.div
                  animate={
                    lit
                      ? { scale: [1, 1.08, 0.97, 1.05, 1], rotate: [0, -3, 2, -2, 0] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className={lit ? 'text-ember' : 'text-text-faint'}
                >
                  <Flame size={40} fill={lit ? 'currentColor' : 'none'} />
                </motion.div>
              </div>

              <p className="num-md text-text text-center">
                {current > 0 ? `${current} day${current === 1 ? '' : 's'}` : 'No streak yet'}
              </p>
              <p
                className={`type-caption text-center mt-1 ${
                  current > 0 && !todayLogged ? 'text-ember' : 'text-text-faint'
                }`}
              >
                {statusLine}
              </p>

              <div className="border-t border-hairline mt-4 pt-3 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="type-caption text-text-faint">Best streak</span>
                  <span className="num-sm text-text-mute">
                    {best} day{best === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="type-caption text-text-faint">
                    {nextMilestone ? `Next · ${nextMilestone.name}` : 'Milestones'}
                  </span>
                  <span className="num-sm text-text-mute whitespace-nowrap">
                    {nextMilestone
                      ? `${nextMilestone.target - current} day${nextMilestone.target - current === 1 ? '' : 's'} to go`
                      : 'All crushed 🔥'}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
