import { create } from "zustand"
import type { ReactNode } from "react"

interface HeaderStore {
  titleSlot: ReactNode
  setTitleSlot: (slot: ReactNode) => void
}
interface FooterStore {
  footerSlot: ReactNode
  setFooterSlot: (slot: ReactNode) => void
}

const useHeaderStore = create<HeaderStore>((set) => ({
  titleSlot: null,
  setTitleSlot: (slot) => set({ titleSlot: slot }),
}))

const useFooterStore = create<FooterStore>((set) => ({
  footerSlot: null,
  setFooterSlot: (slot) => set({ footerSlot: slot }),
}))

export { useHeaderStore, useFooterStore }
