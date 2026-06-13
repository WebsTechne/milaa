import { create } from "zustand"
import type { ReactNode } from "react"

interface HeaderStore {
  titleSlot: ReactNode
  setTitleSlot: (slot: ReactNode) => void
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  titleSlot: null,
  setTitleSlot: (slot) => set({ titleSlot: slot }),
}))
