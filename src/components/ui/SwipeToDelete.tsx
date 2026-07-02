import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Trash2 } from 'lucide-react'

interface SwipeToDeleteProps {
  children: React.ReactNode
  onDelete: () => void
  label?: string
  /** false = fire onDelete on release (undo-based flows); true = inline confirm. */
  confirm?: boolean
  confirmMessage?: string
}

const THRESHOLD = -80
const DELETE_THRESHOLD = -140

export function SwipeToDelete({
  children,
  onDelete,
  label = 'Remove',
  confirm = true,
  confirmMessage = 'Remove this exercise?',
}: SwipeToDeleteProps) {
  const x = useMotionValue(0)
  const [confirming, setConfirming] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bgOpacity = useTransform(x, [0, THRESHOLD], [0, 1])
  const iconScale = useTransform(x, [0, THRESHOLD, DELETE_THRESHOLD], [0.5, 1, 1.2])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < DELETE_THRESHOLD) {
      if (confirm) {
        setConfirming(true)
      } else {
        onDelete()
        x.set(0)
      }
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
        className="rounded-[var(--radius-card)] overflow-hidden bg-danger/10 border border-danger/40"
      >
        <div className="p-3 flex items-center justify-between gap-3">
          <p className="type-label text-text">{confirmMessage}</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCancel}
              className="min-h-11 px-3.5 rounded-full type-label bg-surface-2 border border-hairline text-text-mute"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="min-h-11 px-3.5 rounded-full type-label bg-danger text-danger-ink"
            >
              {label}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-[var(--radius-card)]">
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-[var(--radius-card)] bg-danger"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale }} className="flex items-center gap-2 text-danger-ink">
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
