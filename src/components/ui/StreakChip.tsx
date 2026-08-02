import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, AnimatePresence } from 'motion/react'
import { Flame } from 'lucide-react'
import { useProgress } from '../../hooks/useProgress'
import { useHaptic } from '../../hooks/useHaptic'
import { ACHIEVEMENT_FAMILIES } from '../../lib/achievements'

const STREAK_TIERS = ACHIEVEMENT_FAMILIES.find((f) => f.key === 'streak')?.tiers ?? []

/**
 * Looping animations are declared once at module scope so a re-render can't
 * hand Motion a fresh target object and restart the loop mid-breath.
 *
 * The glow breathes with two keyframes and `repeatType: 'mirror'`, which plays
 * the tween forwards then backwards — a genuine ping-pong. A three-keyframe
 * `loop` looks the same on paper but seams at the wrap, which reads as a blink.
 */
/**
 * A soft backlight behind the flame — brightest at the centre, falling off to
 * nothing, which is what a blurred disc looked like before.
 *
 * It's a radial gradient rather than an actual `blur()` because animating a
 * blurred element forces the browser to re-rasterize the whole gaussian every
 * frame, which drops frames on a phone and makes the pulse stutter. A gradient
 * is painted once, so the pulse only moves opacity and transform.
 */
// Two falloffs stacked: a small core plus a wide, weak skirt. A single linear
// ramp ends at one radius and the eye reads that as the edge of a circle;
// overlapping two of different widths approximates a gaussian, so the light
// just fades out.
// `closest-side` sizes each circle to half the box width, so the light reaches
// zero exactly at the edge — without it the gradient stretches to the corners
// and the square element itself becomes visible as a soft rectangle.
const BACKLIGHT = [
  'radial-gradient(circle closest-side, currentColor 0%, transparent 58%)',
  'radial-gradient(circle closest-side, currentColor 0%, transparent 100%)',
].join(', ')

// Dim value first so the loop starts by swelling. NEVER pair these with
// `initial={false}`: that tells Motion to skip the animation and jump to the
// final keyframe, which silently turns the whole pulse into a static value.
const GLOW_BREATH = { opacity: [0.16, 0.34], scale: [0.96, 1.08] }
// Embers still glow when the fire is out — a dormant backlight breathes too,
// just faintly. A dead-static glow reads as a broken effect.
const GLOW_DIM = { opacity: [0.05, 0.13], scale: [0.98, 1.05] }
// Mirroring doubles the cycle: 1.6s each way is a ~3.2s breath, close to a
// resting human one and slow enough to read as glowing rather than flashing.
const BREATH_TRANSITION = {
  duration: 1.6,
  repeat: Infinity,
  repeatType: 'mirror',
  ease: 'easeInOut',
} as const

const EMBER_RISE = { y: [0, -26], opacity: [0, 0.9, 0], scale: [1, 0.5] }
const EMBER_TRANSITION = { duration: 1.4, repeat: Infinity, ease: 'easeOut' } as const

// Flickering is meant to be irregular, so it keeps its multi-step loop — it
// starts and ends at rest, so the wrap is already seamless.
const FLAME_FLICKER = { scale: [1, 1.08, 0.97, 1.05, 1], rotate: [0, -3, 2, -2, 0] }
const FLAME_STILL = { scale: 1, rotate: 0 }
const FLICKER_TRANSITION = { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } as const

/**
 * 🔥 n — ember ring while a streak is alive; pulses once when it grows.
 * Tap for the fire: an animated flame, what keeps the streak alive today,
 * and the next rung on the streak ladder.
 */
export function StreakChip() {
  const progress = useProgress()
  const haptic = useHaptic()
  const controls = useAnimation()
  const prev = useRef<number | null>(null)
  const [open, setOpen] = useState(false)

  const current = progress?.stats.currentStreak ?? 0
  const best = progress?.stats.bestStreak ?? 0
  const goalDays = progress?.stats.goalDays ?? 0
  const todayMet = progress?.todayMet ?? false
  const todayGoal = progress?.todayGoal ?? 0
  const todayReps = progress?.stats.todayReps ?? 0
  const lit = current > 0

  useEffect(() => {
    if (!progress) return
    if (prev.current !== null && current > prev.current) {
      controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.45 } })
    }
    prev.current = current
  }, [progress, current, controls])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const nextTier = STREAK_TIERS.find((t) => t.value > current)
  const remaining = Math.max(todayGoal - todayReps, 0)

  // Always name what's actually been counted today — "hit 50 reps" alone left
  // no way to tell whether the app had registered anything at all.
  const statusLine = todayMet
    ? "Today's goal is done — the flame is safe."
    : todayReps > 0
      ? current === 0
        ? `${todayReps} of ${todayGoal} today — ${remaining} more to light the flame.`
        : `${todayReps} of ${todayGoal} today — ${remaining} more or the streak resets.`
      : current === 0
        ? `Hit ${todayGoal} reps today to light the flame.`
        : `Nothing logged today — ${todayGoal} reps keeps the streak alive.`

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
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-ember"
                  style={{
                    backgroundImage: BACKLIGHT,
                    // Resting value lives here, never left to the animation to set
                    // Mid-range of the pulse, so a frozen glow matches its average
                    opacity: lit ? 0.25 : 0.09,
                    willChange: 'opacity, transform',
                  }}
                  animate={lit ? GLOW_BREATH : GLOW_DIM}
                  transition={BREATH_TRANSITION}
                />
                {lit &&
                  [0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute bottom-2 w-1 h-1 rounded-full bg-ember"
                      style={{ left: `${42 + i * 8}%` }}
                      animate={EMBER_RISE}
                      transition={{ ...EMBER_TRANSITION, delay: i * 0.45 }}
                    />
                  ))}
                {/* relative + z-10: the flame always sits above its own glow */}
                <motion.div
                  animate={lit ? FLAME_FLICKER : FLAME_STILL}
                  transition={lit ? FLICKER_TRANSITION : undefined}
                  // Dormant is still fire — a dimmed ember silhouette reads as
                  // "waiting to be lit". A grey outline just reads as broken.
                  className={`relative z-10 ${lit ? 'text-ember' : 'text-ember/35'}`}
                >
                  <Flame
                    size={40}
                    strokeWidth={1.5}
                    fill="currentColor"
                    className={lit ? 'drop-shadow-[0_0_6px_rgb(255_138_92/0.55)]' : ''}
                  />
                </motion.div>
              </div>

              <p className="num-md text-text text-center">
                {current > 0 ? `${current} day${current === 1 ? '' : 's'}` : 'No streak yet'}
              </p>
              <p
                className={`type-caption text-center mt-1 ${
                  todayMet ? 'text-text-faint' : 'text-ember'
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
                <div className="flex items-baseline justify-between">
                  <span className="type-caption text-text-faint">Goals hit</span>
                  <span className="num-sm text-text-mute">
                    {goalDays} day{goalDays === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="type-caption text-text-faint">
                    {nextTier ? `Next · ${nextTier.name}` : 'Milestones'}
                  </span>
                  <span className="num-sm text-text-mute whitespace-nowrap">
                    {nextTier
                      ? `${nextTier.value - current} day${nextTier.value - current === 1 ? '' : 's'} to go`
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
