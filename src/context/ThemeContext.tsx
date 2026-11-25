import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Theme, string> = { light: '#0f766e', dark: '#050f14' };

interface ThemeContextValue {
  theme: Theme;
  /** Switches theme. Pass the click position to animate a circular reveal from that point. */
  toggleTheme: (origin?: { x: number; y: number }) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in index.html already set the class before first paint (no flash of the wrong theme).
  const [theme, setThemeState] = useState<Theme>(() => readStored() ?? systemTheme());

  useEffect(() => {
    applyToDocument(theme);
  }, [theme]);

  // Follow the OS setting until the visitor makes an explicit choice.
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (!readStored()) setThemeState(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) - theme still applies for this visit */
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      const commit = () => {
        flushSync(() => setTheme(next));
        applyToDocument(next);
      };

      if (!document.startViewTransition || prefersReducedMotion()) {
        commit();
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? 0;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(commit);
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 550, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
          );
        })
        .catch(() => undefined);
    },
    [theme, setTheme],
  );

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
