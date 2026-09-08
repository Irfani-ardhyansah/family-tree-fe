import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

export type ColorMode = 'light' | 'dark';

export type ThemeRevealOrigin = {
  x: number;
  y: number;
};

const STORAGE_KEY = 'family-suite.theme';

type ThemeContextValue = {
  mode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode, origin?: ThemeRevealOrigin) => void;
  toggle: (origin?: ThemeRevealOrigin) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
};

function applyMode(mode: ColorMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode;
}

function readInitialMode(): ColorMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function farthestViewportRadius(x: number, y: number) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
}

function startViewTransition(update: () => void): ViewTransitionLike | null {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => ViewTransitionLike;
  };
  if (typeof doc.startViewTransition !== 'function') return null;
  return doc.startViewTransition(update);
}

function persistMode(mode: ColorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(readInitialMode);
  const revealing = useRef(false);

  const apply = useCallback((next: ColorMode) => {
    flushSync(() => {
      setMode(next);
    });
    applyMode(next);
    persistMode(next);
  }, []);

  const setColorMode = useCallback(
    (next: ColorMode, origin?: ThemeRevealOrigin) => {
      if (revealing.current) return;

      if (!origin || prefersReducedMotion()) {
        apply(next);
        return;
      }

      document.documentElement.style.setProperty('--theme-x', `${origin.x}px`);
      document.documentElement.style.setProperty('--theme-y', `${origin.y}px`);
      document.documentElement.style.setProperty(
        '--theme-r',
        `${farthestViewportRadius(origin.x, origin.y)}px`,
      );

      const reveal = startViewTransition(() => apply(next));
      if (!reveal) {
        apply(next);
        return;
      }

      revealing.current = true;
      reveal.finished.finally(() => {
        revealing.current = false;
      });
    },
    [apply],
  );

  const toggle = useCallback(
    (origin?: ThemeRevealOrigin) => {
      setColorMode(mode === 'dark' ? 'light' : 'dark', origin);
    },
    [mode, setColorMode],
  );

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
