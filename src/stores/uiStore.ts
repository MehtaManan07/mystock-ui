import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** Desktop sidebar collapsed to an icon rail. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed: boolean) => set({ sidebarCollapsed }),
    }),
    { name: 'mystock_ui' }
  )
);
