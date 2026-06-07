import { create } from 'zustand'

export const useUiStore = create((set, get) => ({
  confirm: null,

  showConfirm: (opts) => set({ confirm: opts }),
  closeConfirm: () => set({ confirm: null }),

  doConfirm: () => {
    const { confirm } = get()
    if (confirm?.onConfirm) confirm.onConfirm()
    set({ confirm: null })
  },
}))

// Helper hook-free function usable anywhere
export function showConfirmGlobal(opts) {
  useUiStore.getState().showConfirm(opts)
}
