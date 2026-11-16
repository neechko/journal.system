/**
 * useTheme Hook
 * Theme management (light/dark/system) with persistence
 * SSR-safe with next-themes pattern
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = true,
  storageKey = 'journal-system-theme',
}: ThemeProviderProps) {
  // Lazy initialization for theme - reads from localStorage on client
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(storageKey) as Theme | null;
      if (stored) return stored;
    }
    return defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Resolve system theme
  const resolveTheme = useCallback((t: Theme): 'light' | 'dark' => {
    if (t === 'system') {
      if (typeof window !== 'undefined' && enableSystem) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return t;
  }, [enableSystem]);

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);

    if (disableTransitionOnChange) {
      root.style.setProperty('transition', 'none');
      requestAnimationFrame(() => {
        root.style.removeProperty('transition');
      });
    }
  }, [disableTransitionOnChange]);

  // Initialize on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMounted(true);
      setResolvedTheme(resolveTheme(theme));
      applyTheme(resolveTheme(theme));
    }
  }, [resolveTheme, applyTheme, theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, enableSystem, applyTheme]);

  // Update theme
  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, newTheme);
    }
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    setThemeValue(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setThemeValue]);

  // During SSR, return default values
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: defaultTheme,
          resolvedTheme: resolveTheme(defaultTheme),
          setTheme: () => {},
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: setThemeValue,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook for components that need theme-aware values
 */
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkValue : lightValue;
}

/**
 * Hook for theme-aware CSS variables
 */
export function useThemeCSSVars() {
  const { resolvedTheme } = useTheme();
  // resolvedTheme is used implicitly via CSS [data-theme] selector
  void resolvedTheme;
  return {
    '--color-background-primary': `var(--color-background-primary)`,
    '--color-text-primary': `var(--color-text-primary)`,
    // All CSS vars automatically switch via [data-theme] selector
  };
}

/**
 * Client-only component wrapper (for components that need theme context)
 */
export function ThemeAware({ children }: { children: (theme: ThemeContextValue) => ReactNode }) {
  const theme = useTheme();
  return <>{children(theme)}</>;
}