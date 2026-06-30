import { useState, useCallback, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { useHaptic } from '../../hooks/useHaptic'
import { Button } from '../ui/Button'

interface RepCounterProps {
  onSave: (reps: number) => void
  exerciseName: string
}

const QUICK_ADDS = [5, 10, 25]

export function RepCounter({ onSave, exerciseName }: RepCounterProps) {
  const [count, setCount] = useState(0)
  const controls = useAnimation()
  const rippleControls = useAnimation()
  const haptic = useHaptic()
  const rippleKey = useRef(0)

  const increment = useCallback(() => {
    setCount((c) => c + 1)
    haptic.tick()
    controls.start({
      scale: [1, 1.15, 1],
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
    })
    rippleKey.current++
    rippleControls.set({ scale: 0.8, opacity: 0.5 })
    rippleControls.start({ scale: 2.4, opacity: 0, transition: { duration: 0.6 } })
  }, [controls, rippleControls, haptic])

  const decrement = useCallback(() => {
    setCount((c) => Math.max(0, c - 1))
    haptic.tick()
  }, [haptic])

  const quickAdd = useCallback(
    (n: number) => {
      setCount((c) => c + n)
      haptic.tick()
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
      })
    },
    [controls, haptic],
  )

  const handleSave = useCallback(() => {
    if (count === 0) return
    haptic.success()
    onSave(count)
    setCount(0)
  }, [count, onSave, haptic])

  return (
    <div className="flex flex-col items-center gap-6">
      <h3 className="font-display text-lg font-bold text-navy-900 dark:text-white">
        {exerciseName}
      </h3>

      <div className="relative flex items-center gap-6">
        <button
          onClick={decrement}
          disabled={count === 0}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors disabled:opacity-30"
        >
          <Minus size={20} />
        </button>

        <div className="relative">
          <motion.div
            animate={rippleControls}
            className="absolute inset-0 m-auto w-20 h-20 rounded-full border-2 border-teal-400 pointer-events-none"
            style={{ opacity: 0 }}
          />
          <motion.span
            animate={controls}
            className="block font-mono text-[64px] leading-none font-medium tracking-[-0.03em] text-navy-900 dark:text-white tabular-nums select-none min-w-[120px] text-center"
          >
            {count}
          </motion.span>
        </div>

        <button
          onClick={increment}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex gap-2">
        {QUICK_ADDS.map((n) => (
          <button
            key={n}
            onClick={() => quickAdd(n)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30 dark:hover:text-teal-400 transition-colors"
          >
            +{n}
          </button>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={count === 0}
        fullWidth
        size="lg"
        className="mt-2"
      >
        Bank It
      </Button>
    </div>
  )
}
