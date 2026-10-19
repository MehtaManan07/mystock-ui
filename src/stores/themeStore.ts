import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

/** What the user picked. `system` defers to the OS preference. */
export type ThemeMode = 'light' | 'dark' | 'system';
/** What actually gets painted. `system` is resolved away. */
export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeState {
  mode: ThemeMode;
  /** Cycles light -> dark -> system. */
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const NEXT: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      toggleTheme: () => set((state) => ({ mode: NEXT[state.mode] })),
      setTheme: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: STORAGE_KEYS.THEME_MODE,
      // v0 persisted only 'light' | 'dark'. Those are still valid values, so
      // existing choices carry over untouched; only brand-new users get
      // 'system'.
      version: 1,
    }
  )
);

function subscribeToSystem(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getSystemSnapshot = (): ResolvedTheme =>
  window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';

/**
 * The OS colour preference, kept live. Using `useSyncExternalStore` means a
 * change in macOS/Windows appearance repaints the app immediately rather than
 * waiting for a reload.
 */
export function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeToSystem, getSystemSnapshot, () => 'light');
}

/** The theme to actually render: the user's pick, with `system` resolved. */
export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemeStore((state) => state.mode);
  const system = useSystemTheme();
  return mode === 'system' ? system : mode;
}
