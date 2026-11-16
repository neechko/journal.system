/**
 * ThemeProvider Component
 * Client-side wrapper for theme management
 * Uses next-themes pattern for Next.js App Router
 */

'use client';

import { ThemeProvider, ThemeProviderProps } from '../hooks/useTheme';

export { ThemeProvider };
export type { ThemeProviderProps };

// Re-export hooks
export { useTheme, useThemeValue, useThemeCSSVars, ThemeAware } from '../hooks/useTheme';