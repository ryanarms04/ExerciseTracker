import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Right-aligned header slot (date chip, actions). */
  headerRight?: ReactNode
  children: ReactNode
}

/**
 * Full-screen modal sheet — the app's single modal shell. Slides up, safe-area
 * aware header with a close target, Escape to dismiss. Replaces the drag-down
 * BottomSheet once its last consumer migrates (task 4.1).
 */
export function Sheet({ open, onClose, title, headerRight, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-bg flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="flex items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-hairline">
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-11 h-11 flex items-center justify-center rounded-full text-text-mute hover:bg-surface-2 transition-colors -ml-2"
            >
              <X size={20} />
            </button>
            {title && <h2 className="type-heading text-text">{title}</h2>}
            {headerRight && <div className="ml-auto">{headerRight}</div>}
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
