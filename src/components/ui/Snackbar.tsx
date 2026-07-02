import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { create } from 'zustand'

interface Snack {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface SnackbarStore {
  snack: Snack | null
  show: (snack: Omit<Snack, 'id'>) => void
  dismiss: () => void
}

let nextId = 1

const useSnackbarStore = create<SnackbarStore>((set) => ({
  snack: null,
  // One at a time: a new snack replaces the current one and restarts the timer
  show: (s) => set({ snack: { ...s, id: nextId++ } }),
  dismiss: () => set({ snack: null }),
}))

/** `useSnackbar().show({ message: 'Banked 25', actionLabel: 'Undo', onAction })` */
export function useSnackbar() {
  const show = useSnackbarStore((s) => s.show)
  const dismiss = useSnackbarStore((s) => s.dismiss)
  return { show, dismiss }
}

const AUTO_DISMISS_MS = 5000

/** Mounted once in Layout; floats above the bottom nav. */
export function SnackbarHost() {
  const snack = useSnackbarStore((s) => s.snack)
  const dismiss = useSnackbarStore((s) => s.dismiss)

  useEffect(() => {
    if (!snack) return
    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [snack, dismiss])

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-5 pointer-events-none safe-bottom">
      <AnimatePresence>
        {snack && (
          <motion.div
            key={snack.id}
            role="status"
            className="pointer-events-auto flex items-center gap-1 min-h-12 pl-5 pr-1.5 py-1 rounded-full bg-surface-2 border border-hairline shadow-[var(--shadow-card-hover)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 40 || info.velocity.y > 500) dismiss()
            }}
          >
            <span className="type-label text-text">{snack.message}</span>
            {snack.actionLabel && (
              <button
                onClick={() => {
                  snack.onAction?.()
                  dismiss()
                }}
                className="min-h-11 min-w-11 px-3 rounded-full type-label text-accent hover:bg-surface transition-colors"
              >
                {snack.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
