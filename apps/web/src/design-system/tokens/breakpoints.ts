/**
 * Design System Breakpoint Tokens
 * Mobile-first approach — audit from Taylor & Francis, Elsevier, Nature, PLOS
 */

// ============================================
// Breakpoint Values (min-width)
// ============================================
export const breakpoint = {
  // Mobile first
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones / small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
  '3xl': '1920px', // Ultra-wide

  // Semantic aliases
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultraWide: '1536px',
} as const;

// ============================================
// Media Query Strings
// ============================================
export const mediaQuery = {
  // Min-width (mobile-first)
  xs: `@media (min-width: ${breakpoint.xs})`,
  sm: `@media (min-width: ${breakpoint.sm})`,
  md: `@media (min-width: ${breakpoint.md})`,
  lg: `@media (min-width: ${breakpoint.lg})`,
  xl: `@media (min-width: ${breakpoint.xl})`,
  '2xl': `@media (min-width: ${breakpoint['2xl']})`,
  '3xl': `@media (min-width: ${breakpoint['3xl']})`,

  // Max-width (for desktop-first overrides)
  maxXs: `@media (max-width: ${parseInt(breakpoint.sm) - 1}px)`,
  maxSm: `@media (max-width: ${parseInt(breakpoint.md) - 1}px)`,
  maxMd: `@media (max-width: ${parseInt(breakpoint.lg) - 1}px)`,
  maxLg: `@media (max-width: ${parseInt(breakpoint.xl) - 1}px)`,
  maxXl: `@media (max-width: ${parseInt(breakpoint['2xl']) - 1}px)`,

  // Range queries
  mobileOnly: `@media (max-width: ${parseInt(breakpoint.md) - 1}px)`,
  tabletOnly: `@media (min-width: ${breakpoint.md}) and (max-width: ${parseInt(breakpoint.lg) - 1}px)`,
  desktopOnly: `@media (min-width: ${breakpoint.lg})`,

  // Reduced motion
  reduceMotion: `@media (prefers-reduced-motion: reduce)`,
  noReduceMotion: `@media (prefers-reduced-motion: no-preference)`,

  // Dark mode
  darkMode: `@media (prefers-color-scheme: dark)`,
  lightMode: `@media (prefers-color-scheme: light)`,

  // High contrast
  highContrast: `@media (prefers-contrast: more)`,
  forcedColors: `@media (forced-colors: active)`,

  // Hover capability
  hover: `@media (hover: hover)`,
  noHover: `@media (hover: none)`,

  // Pointer capability
  finePointer: `@media (pointer: fine)`,
  coarsePointer: `@media (pointer: coarse)`,

  // Print
  print: `@media print`,
} as const;

// ============================================
// Container Queries (for component-based responsive)
// ============================================
export const containerQuery = {
  // Container breakpoint names (used with @container)
  sm: '320px',
  md: '480px',
  lg: '640px',
  xl: '800px',
  '2xl': '1024px',

  // Media query strings
  smUp: `@container (min-width: 320px)`,
  mdUp: `@container (min-width: 480px)`,
  lgUp: `@container (min-width: 640px)`,
  xlUp: `@container (min-width: 800px)`,
  '2xlUp': `@container (min-width: 1024px)`,
} as const;

// ============================================
// Z-Index Scale
// ============================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================
// Container Max Widths
// ============================================
export const containerMaxWidth = {
  none: 'none',
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
  // Article-specific
  article: '800px',      // Optimal reading width ~65-75 chars
  articleWide: '960px',  // For figures/tables
  editorial: '1200px',   // Editorial workspace
} as const;

// ============================================
// CSS Custom Properties
// ============================================
export const breakpointCSSVars = {
  // Breakpoints
  '--breakpoint-xs': breakpoint.xs,
  '--breakpoint-sm': breakpoint.sm,
  '--breakpoint-md': breakpoint.md,
  '--breakpoint-lg': breakpoint.lg,
  '--breakpoint-xl': breakpoint.xl,
  '--breakpoint-2xl': breakpoint['2xl'],
  '--breakpoint-3xl': breakpoint['3xl'],

  // Container max widths
  '--container-max-width-none': containerMaxWidth.none,
  '--container-max-width-xs': containerMaxWidth.xs,
  '--container-max-width-sm': containerMaxWidth.sm,
  '--container-max-width-md': containerMaxWidth.md,
  '--container-max-width-lg': containerMaxWidth.lg,
  '--container-max-width-xl': containerMaxWidth.xl,
  '--container-max-width-2xl': containerMaxWidth['2xl'],
  '--container-max-width-full': containerMaxWidth.full,
  '--container-max-width-article': containerMaxWidth.article,
  '--container-max-width-article-wide': containerMaxWidth.articleWide,
  '--container-max-width-editorial': containerMaxWidth.editorial,

  // Z-index
  '--z-index-hide': zIndex.hide,
  '--z-index-base': zIndex.base,
  '--z-index-dropdown': zIndex.dropdown,
  '--z-index-sticky': zIndex.sticky,
  '--z-index-fixed': zIndex.fixed,
  '--z-index-modal-backdrop': zIndex.modalBackdrop,
  '--z-index-modal': zIndex.modal,
  '--z-index-popover': zIndex.popover,
  '--z-index-tooltip': zIndex.tooltip,
  '--z-index-toast': zIndex.toast,
  '--z-index-max': zIndex.max,
} as const;

// ============================================
// Type exports
// ============================================
export type BreakpointTokens = typeof breakpoint;
export type BreakpointKey = keyof typeof breakpoint;
export type MediaQueryTokens = typeof mediaQuery;
export type ContainerQueryTokens = typeof containerQuery;
export type ZIndexTokens = typeof zIndex;
export type ContainerMaxWidthTokens = typeof containerMaxWidth;

// ============================================
// Helper functions
// ============================================
export function getBreakpoint(key: BreakpointKey): string {
  return breakpoint[key];
}

export function getMediaQuery(key: keyof typeof mediaQuery): string {
  return mediaQuery[key];
}

export function getContainerQuery(key: keyof typeof containerQuery): string {
  return containerQuery[key];
}