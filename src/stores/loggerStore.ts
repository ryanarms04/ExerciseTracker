import { create } from 'zustand'

interface LoggerState {
  open: boolean
  /** null = no explicit pick: LoggerHost arms the last-used exercise. */
  exerciseId: number | null
  openLogger: (exerciseId?: number) => void
  closeLogger: () => void
}

/** Single logger entry point shared by the FAB, the ring card and the tiles. */
export const useLoggerStore = create<LoggerState>((set) => ({
  open: false,
  exerciseId: null,
  openLogger: (exerciseId) => set({ open: true, exerciseId: exerciseId ?? null }),
  closeLogger: () => set({ open: false }),
}))
