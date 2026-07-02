import { useState, useCallback, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useHaptic } from '../../hooks/useHaptic'
import { Button } from '../ui/Button'
import { CircularDial } from './CircularDial'

interface RepCounterProps {
  onSave: (reps: number) => void
  exerciseName: string
  color?: string
}

export function RepCounter({ onSave, exerciseName, color = '#0EA5A2' }: RepCounterProps) {
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

  const adjustCount = useCallback(
    (n: number) => {
      setCount((c) => Math.max(0, c + n))
      haptic.tick()
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
      })
    },
    [controls, haptic],
  )

  const resetCount = useCallback(() => {
    setCount(0)
    haptic.tick()
  }, [haptic])

  const handleSave = useCallback(() => {
    if (count === 0) return
    haptic.success()
    onSave(count)
    setCount(0)
  }, [count, onSave, haptic])

  const dialSize = 220
  const chipBase = 'min-h-11 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors'
  const addChip = `${chipBase} bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30 dark:hover:text-teal-400`
  const subChip = `${chipBase} bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-coral-50 hover:text-coral-500 dark:hover:bg-coral-900/20 dark:hover:text-coral-400`

  return (
    <div className="flex flex-col items-center gap-6 no-select">
      <h3 className="font-display text-lg font-bold text-navy-900 dark:text-white">
        {exerciseName}
      </h3>

      <div className="relative flex items-center justify-center" style={{ width: dialSize, height: dialSize }}>
        <CircularDial
          size={dialSize}
          strokeWidth={6}
          count={count}
          onIncrement={increment}
          onDecrement={decrement}
          color={color}
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={rippleControls}
            className="absolute w-20 h-20 rounded-full border-2 border-teal-400 pointer-events-none"
            style={{ opacity: 0 }}
          />
          <motion.span
            animate={controls}
            className="block font-mono text-[64px] leading-none font-medium tracking-[-0.03em] text-navy-900 dark:text-white tabular-nums select-none"
          >
            {count}
          </motion.span>
        </div>

        <button
          onClick={decrement}
          disabled={count === 0}
          aria-label="Subtract one rep"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-11 h-11 flex items-center justify-center rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors disabled:opacity-30 shadow-sm z-10"
        >
          <Minus size={18} />
        </button>

        <button
          onClick={increment}
          aria-label="Add one rep"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-11 h-11 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 transition-colors shadow-sm z-10"
        >
          <Plus size={18} />
        </button>
      </div>

      <p className="text-xs text-navy-400 dark:text-navy-500 -mt-2">
        Drag the ring to count
      </p>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <button onClick={() => adjustCount(-10)} disabled={count === 0} className={`${subChip} disabled:opacity-30`}>
            −10
          </button>
          <button onClick={() => adjustCount(-5)} disabled={count === 0} className={`${subChip} disabled:opacity-30`}>
            −5
          </button>
          <button onClick={resetCount} disabled={count === 0} className={`${subChip} disabled:opacity-30 flex items-center gap-1`}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => adjustCount(5)} className={addChip}>+5</button>
          <button onClick={() => adjustCount(10)} className={addChip}>+10</button>
          <button onClick={() => adjustCount(25)} className={addChip}>+25</button>
        </div>
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
