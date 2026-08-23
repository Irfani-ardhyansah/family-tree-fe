import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'family-suite.theme';

type ThemeContextValue = {
  mode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyMode(mode: ColorMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode;
}

function readInitialMode(): ColorMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(readInitialMode);

  const setColorMode = useCallback((next: ColorMode) => {
    setMode(next);
    applyMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setColorMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setColorMode]);

  const value = useMemo(
    () => ({ mode, isDark: mode === 'dark', setColorMode, toggle }),
    [mode, setColorMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
