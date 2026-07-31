import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCelebrationStore } from '../stores/celebrationStore'

const VISIBLE_MS = 5200

// Fire is an illustration, not chrome: it keeps literal flame colours in both
// themes, always sitting on the overlay's dark scrim.
const FLAME_OUTER = '#FF6B2C'
const FLAME_MID = '#FFA23A'
const FLAME_CORE = '#FFE08A'

const EMBERS = [
  { x: -34, delay: 0, size: 5, drift: -12 },
  { x: 26, delay: 0.35, size: 4, drift: 10 },
  { x: -14, delay: 0.7, size: 6, drift: 6 },
  { x: 38, delay: 1.05, size: 3, drift: -8 },
  { x: 4, delay: 1.4, size: 5, drift: 14 },
  { x: -28, delay: 1.75, size: 4, drift: 4 },
]

/**
 * The moment the daily goal is crossed: a full-screen flame that burns for a
 * few seconds, names the streak, and gets out of the way. Tap to dismiss early.
 */
export function StreakCelebration() {
  const { open, streak, total, goal } = useCelebrationStore()
  const hide = useCelebrationStore((s) => s.hide)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(hide, VISIBLE_MS)
    return () => clearTimeout(t)
  }, [open, hide])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="streak-celebration"
          role="dialog"
          aria-label="Daily streak complete"
          onClick={hide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-8 bg-[#07060B]/95 backdrop-blur-sm"
        >
          {/* heat haze behind everything */}
          <motion.div
            aria-hidden
            className="absolute w-72 h-72 rounded-full blur-3xl"
            style={{ backgroundColor: FLAME_OUTER, opacity: 0.28 }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.22, 0.36, 0.22] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ scale: 0.6, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative flex flex-col items-center"
          >
            <div className="relative" aria-hidden>
              {EMBERS.map((e, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `calc(50% + ${e.x}px)`,
                    bottom: 18,
                    width: e.size,
                    height: e.size,
                    backgroundColor: i % 2 ? FLAME_MID : FLAME_CORE,
                  }}
                  animate={{
                    y: [0, -120],
                    x: [0, e.drift],
                    opacity: [0, 0.95, 0],
                    scale: [1, 0.4],
                  }}
                  transition={{
                    duration: 2.1,
                    repeat: Infinity,
                    delay: e.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}

              <svg width={132} height={172} viewBox="0 0 100 140" className="relative">
                {/* outer body — slow, wide sway */}
                <motion.path
                  d="M50 4 C 62 34, 86 46, 86 82 C 86 112, 68 134, 50 134 C 32 134, 14 112, 14 82 C 14 46, 38 34, 50 4 Z"
                  fill={FLAME_OUTER}
                  style={{ originX: '50%', originY: '100%' }}
                  animate={{ scaleY: [1, 1.07, 0.96, 1.04, 1], scaleX: [1, 0.96, 1.04, 0.98, 1] }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* mid tongue — quicker, offset phase */}
                <motion.path
                  d="M50 36 C 58 56, 72 64, 72 88 C 72 110, 62 126, 50 126 C 38 126, 28 110, 28 88 C 28 64, 42 56, 50 36 Z"
                  fill={FLAME_MID}
                  style={{ originX: '50%', originY: '100%' }}
                  animate={{ scaleY: [1, 0.94, 1.08, 0.97, 1], x: [0, 2, -2, 1, 0] }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* core — fastest flicker */}
                <motion.path
                  d="M50 68 C 55 80, 62 84, 62 98 C 62 112, 57 122, 50 122 C 43 122, 38 112, 38 98 C 38 84, 45 80, 50 68 Z"
                  fill={FLAME_CORE}
                  style={{ originX: '50%', originY: '100%' }}
                  animate={{ scaleY: [1, 1.12, 0.92, 1.06, 1], opacity: [0.9, 1, 0.85, 1, 0.9] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>

              {/* the number rides inside the flame */}
              <div className="absolute inset-0 flex items-end justify-center pb-6">
                <motion.span
                  className="num-hero text-[#3B1400]"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.15 }}
                >
                  {streak}
                </motion.span>
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="type-title text-white text-center mt-6"
            >
              Daily streak complete!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="type-body text-white/70 text-center mt-2"
            >
              {streak === 1
                ? 'Day one on the board. Come back tomorrow to build it.'
                : `${streak} days in a row. Come back tomorrow to keep it alive.`}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="type-caption text-white/45 mt-4"
            >
              {total} of {goal} reps today
            </motion.p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-12 type-caption text-white/35"
          >
            Tap to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
