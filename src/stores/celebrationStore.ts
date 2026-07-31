import { create } from 'zustand'

interface CelebrationState {
  open: boolean
  streak: number
  total: number
  goal: number
  show: (payload: { streak: number; total: number; goal: number }) => void
  hide: () => void
}

/** Drives the goal-crossed moment: the overlay, and the ring's ember sweep. */
export const useCelebrationStore = create<CelebrationState>((set) => ({
  open: false,
  streak: 0,
  total: 0,
  goal: 0,
  show: (payload) => set({ open: true, ...payload }),
  hide: () => set({ open: false }),
}))
