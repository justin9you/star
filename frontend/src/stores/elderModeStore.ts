import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ElderModeState {
  isElderMode: boolean
  toggleElderMode: () => void
  setElderMode: (value: boolean) => void
}

export const useElderModeStore = create<ElderModeState>()(
  persist(
    (set) => ({
      isElderMode: false,
      toggleElderMode: () => set((state) => ({ isElderMode: !state.isElderMode })),
      setElderMode: (value) => set({ isElderMode: value }),
    }),
    {
      name: 'elder-mode-storage',
    }
  )
)