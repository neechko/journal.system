/**
 * Design System Hooks — Main Export
 */

export { useMediaQuery, useBreakpoint, useReducedMotion as useMediaQueryReducedMotion, useSystemDarkMode, useHighContrast, useHoverCapability, usePointerCapability, usePrintMedia, useContainerQuery, useMediaQueries, useIsMobile, useIsTablet, useIsDesktop, useIsWide, useIsUltraWide } from './useMediaQuery';
export { useReducedMotion, useTransitionDuration, useEasing, useTransition, useMotionVariants, useMotionStyle, useAnimationConfig, useMotionAware } from './useReducedMotion';
export { useTheme, useThemeValue, useThemeCSSVars, ThemeAware, ThemeProvider } from './useTheme';
export type { Theme, ThemeContextValue } from './useTheme';