import { create } from 'zustand'
import type { Session } from '../types'

interface LoggerState {
  open: boolean
  /** null = no explicit pick: LoggerHost arms the last-used exercise. */
  exerciseId: number | null
  /** Set = the logger edits this session instead of creating one. */
  editSession: Session | null
  openLogger: (exerciseId?: number) => void
  openEditor: (session: Session) => void
  closeLogger: () => void
}

/** Single logger entry point shared by the FAB, ring card, tiles, library and detail. */
export const useLoggerStore = create<LoggerState>((set) => ({
  open: false,
  exerciseId: null,
  editSession: null,
  openLogger: (exerciseId) => set({ open: true, exerciseId: exerciseId ?? null, editSession: null }),
  openEditor: (session) => set({ open: true, exerciseId: session.exerciseId, editSession: session }),
  // editSession survives the close so the exit animation doesn't flicker;
  // the next open overwrites it.
  closeLogger: () => set({ open: false }),
}))
