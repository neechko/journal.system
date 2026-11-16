/**
 * Design System Typography Tokens
 * Modular scale (1.25 ratio) — audit from Taylor & Francis, Nature, PLOS
 * System font stack with Inter fallback for consistency
 */

// ============================================
// Font Families
// ============================================
export const fontFamily = {
  // System UI font stack (performant, native feel)
  sans: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),

  // Inter as custom font (loaded via next/font)
  inter: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ].join(', '),

  // Monospace for code, DOIs, metadata
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),

  // Serif for article body text (optional, journal-specific)
  serif: [
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif',
  ].join(', '),
} as const;

// ============================================
// Font Weights
// ============================================
export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

// ============================================
// Line Heights
// ============================================
export const lineHeight = {
  none: 1,
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ============================================
// Font Sizes — Modular Scale (1.25 ratio)
// Base: 16px (1rem)
// ============================================
const BASE_SIZE = 16; // px
const RATIO = 1.25;   // Major third

function modularScale(steps: number): string {
  const size = BASE_SIZE * Math.pow(RATIO, steps);
  return `${(size / 16).toFixed(4)}rem`; // Convert to rem
}

export const fontSize = {
  // Modular scale
  '-2': modularScale(-2),  // 0.64rem ≈ 10.24px
  '-1': modularScale(-1),  // 0.8rem ≈ 12.8px
  '0': modularScale(0),    // 1rem = 16px
  '1': modularScale(1),    // 1.25rem = 20px
  '2': modularScale(2),    // 1.5625rem = 25px
  '3': modularScale(3),    // 1.953125rem = 31.25px
  '4': modularScale(4),    // 2.44140625rem = 39.06px
  '5': modularScale(5),    // 3.0517578125rem = 48.83px
  '6': modularScale(6),    // 3.814697265625rem = 61.04px

  // Semantic aliases
  xs: modularScale(-1),      // 12.8px — captions, footnotes
  sm: modularScale(-0.5),    // ~14.3px — small text
  base: modularScale(0),     // 16px — body text
  lg: modularScale(0.5),     // ~17.9px — large body
  xl: modularScale(1),       // 20px — subheadings
  '2xl': modularScale(2),    // 25px — headings
  '3xl': modularScale(3),    // 31px — major headings
  '4xl': modularScale(4),    // 39px — page titles
  '5xl': modularScale(5),    // 49px — hero titles
  '6xl': modularScale(6),    // 61px — display

  // Component-specific
  component: {
    button: modularScale(0),       // 16px
    buttonSm: modularScale(-0.5),  // ~14.3px
    buttonLg: modularScale(0.5),   // ~17.9px
    input: modularScale(0),        // 16px
    inputSm: modularScale(-0.5),   // ~14.3px
    label: modularScale(-0.5),     // ~14.3px
    caption: modularScale(-1),     // 12.8px
    overline: modularScale(-1.5),  // ~11.3px
    tableHeader: modularScale(-0.5), // ~14.3px
    tableCell: modularScale(0),    // 16px
    tableCellSm: modularScale(-0.5), // ~14.3px
    dropdownItem: modularScale(0), // 16px
    tooltip: modularScale(-0.5),   // ~14.3px
    toast: modularScale(0),        // 16px
    modalTitle: modularScale(2),   // 25px
    pageTitle: modularScale(4),    // 39px
    sectionTitle: modularScale(2), // 25px
    articleTitle: modularScale(3), // 31px
    articleMeta: modularScale(-0.5), // ~14.3px
    figureCaption: modularScale(-1), // 12.8px
    reference: modularScale(-0.5), // ~14.3px
    citation: modularScale(-0.5),  // ~14.3px
  },
} as const;

export type FontSizeTokens = typeof fontSize;
export type FontSizeKey = keyof typeof fontSize;
export type FontSizeComponentKey = keyof typeof fontSize.component;

// ============================================
// Letter Spacing
// ============================================
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',

  component: {
    heading: '-0.025em',
    button: '0.025em',
    caption: '0.05em',
    overline: '0.1em',
  },
} as const;

// ============================================
// Text Styles (Composable presets)
// ============================================
export const textStyle = {
  // Display
  displayLarge: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headlines
  headlineLarge: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  headlineMedium: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  headlineSmall: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Titles
  titleLarge: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  titleMedium: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  titleSmall: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels
  labelLarge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },

  // Article-specific
  articleBody: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.serif,
  },
  articleTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  articleAbstract: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
    fontStyle: 'italic',
  },
  articleAuthors: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  articleAffiliation: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  figureCaption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontStyle: 'italic',
  },
  reference: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    textIndent: '-1.5em',
    paddingLeft: '1.5em',
  },
} as const;

export type TextStyleKey = keyof typeof textStyle;

// ============================================
// CSS Custom Properties
// ============================================
export const typographyCSSVars = {
  // Font families
  '--font-family-sans': fontFamily.sans,
  '--font-family-inter': fontFamily.inter,
  '--font-family-mono': fontFamily.mono,
  '--font-family-serif': fontFamily.serif,

  // Font weights
  '--font-weight-light': fontWeight.light,
  '--font-weight-normal': fontWeight.normal,
  '--font-weight-medium': fontWeight.medium,
  '--font-weight-semibold': fontWeight.semibold,
  '--font-weight-bold': fontWeight.bold,
  '--font-weight-extrabold': fontWeight.extrabold,

  // Line heights
  '--line-height-none': lineHeight.none,
  '--line-height-tight': lineHeight.tight,
  '--line-height-snug': lineHeight.snug,
  '--line-height-normal': lineHeight.normal,
  '--line-height-relaxed': lineHeight.relaxed,
  '--line-height-loose': lineHeight.loose,

  // Letter spacing
  '--letter-spacing-tighter': letterSpacing.tighter,
  '--letter-spacing-tight': letterSpacing.tight,
  '--letter-spacing-normal': letterSpacing.normal,
  '--letter-spacing-wide': letterSpacing.wide,
  '--letter-spacing-wider': letterSpacing.wider,
  '--letter-spacing-widest': letterSpacing.widest,
} as const;