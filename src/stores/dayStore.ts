import { create } from 'zustand'
import { todayStr } from '../lib/dateUtils'

interface DayState {
  /** The day the user is viewing on Today — flows into the logger and the FAB badge. */
  selectedDate: string
  setSelectedDate: (date: string) => void
  backToToday: () => void
}

export const useDayStore = create<DayState>((set) => ({
  selectedDate: todayStr(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  backToToday: () => set({ selectedDate: todayStr() }),
}))
