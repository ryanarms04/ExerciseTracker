import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Trash2 } from 'lucide-react'

interface SwipeToDeleteProps {
  children: React.ReactNode
  onDelete: () => void
  label?: string
}

const THRESHOLD = -80
const DELETE_THRESHOLD = -140

export function SwipeToDelete({ children, onDelete, label = 'Remove' }: SwipeToDeleteProps) {
  const x = useMotionValue(0)
  const [confirming, setConfirming] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bgOpacity = useTransform(x, [0, THRESHOLD], [0, 1])
  const iconScale = useTransform(x, [0, THRESHOLD, DELETE_THRESHOLD], [0.5, 1, 1.2])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < DELETE_THRESHOLD) {
      setConfirming(true)
    } else {
      x.set(0)
    }
  }

  function handleConfirm() {
    onDelete()
    setConfirming(false)
  }

  function handleCancel() {
    setConfirming(false)
    x.set(0)
  }

  if (confirming) {
    return (
      <motion.div
        initial={{ height: 'auto' }}
        className="rounded-[var(--radius-card)] overflow-hidden bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800"
      >
        <div className="p-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-navy-800 dark:text-navy-200">
            Remove this exercise?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-coral-500 text-white"
            >
              Remove
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-[var(--radius-card)]">
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-[var(--radius-card)] bg-coral-500"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale }} className="flex items-center gap-2 text-white">
          <Trash2 size={18} />
          <span className="text-sm font-semibold">{label}</span>
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: DELETE_THRESHOLD - 20, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}
