/**
 * Design System Spacing Tokens
 * 4px base unit — consistent rhythm across all components
 * Based on audit of Taylor & Francis, Elsevier, Nature, PLOS
 */

// ============================================
// Base Unit
// ============================================
const BASE_UNIT = 4; // 4px

// ============================================
// Spacing Scale
// ============================================
export const spacing = {
  // Base units
  0: '0',
  1: `${BASE_UNIT}px`,      // 4px
  2: `${BASE_UNIT * 2}px`,  // 8px
  3: `${BASE_UNIT * 3}px`,  // 12px
  4: `${BASE_UNIT * 4}px`,  // 16px
  5: `${BASE_UNIT * 5}px`,  // 20px
  6: `${BASE_UNIT * 6}px`,  // 24px
  8: `${BASE_UNIT * 8}px`,  // 32px
  10: `${BASE_UNIT * 10}px`, // 40px
  12: `${BASE_UNIT * 12}px`, // 48px
  16: `${BASE_UNIT * 16}px`, // 64px
  20: `${BASE_UNIT * 20}px`, // 80px
  24: `${BASE_UNIT * 24}px`, // 96px
  32: `${BASE_UNIT * 32}px`, // 128px

  // Semantic aliases
  none: '0',
  xs: `${BASE_UNIT}px`,           // 4px
  sm: `${BASE_UNIT * 2}px`,       // 8px
  md: `${BASE_UNIT * 4}px`,       // 16px
  lg: `${BASE_UNIT * 6}px`,       // 24px
  xl: `${BASE_UNIT * 8}px`,       // 32px
  '2xl': `${BASE_UNIT * 12}px`,   // 48px
  '3xl': `${BASE_UNIT * 16}px`,   // 64px
  '4xl': `${BASE_UNIT * 24}px`,   // 96px

  // Component-specific
  component: {
    // Button
    buttonPaddingX: `${BASE_UNIT * 4}px`,  // 16px
    buttonPaddingY: `${BASE_UNIT * 2}px`,  // 8px
    buttonPaddingXSm: `${BASE_UNIT * 3}px`, // 12px
    buttonPaddingYSm: `${BASE_UNIT * 1.5}px`, // 6px
    buttonPaddingXLg: `${BASE_UNIT * 6}px`, // 24px
    buttonPaddingYLg: `${BASE_UNIT * 3}px`, // 12px

    // Input
    inputPaddingX: `${BASE_UNIT * 3}px`,   // 12px
    inputPaddingY: `${BASE_UNIT * 2}px`,   // 8px

    // Card
    cardPadding: `${BASE_UNIT * 6}px`,     // 24px
    cardPaddingSm: `${BASE_UNIT * 4}px`,   // 16px

    // Modal
    modalPadding: `${BASE_UNIT * 8}px`,    // 32px

    // Table
    tableCellPaddingX: `${BASE_UNIT * 3}px`, // 12px
    tableCellPaddingY: `${BASE_UNIT * 2}px`, // 8px
    tableCellPaddingXSm: `${BASE_UNIT * 2}px`, // 8px
    tableCellPaddingYSm: `${BASE_UNIT * 1.5}px`, // 6px

    // Dropdown/Select
    dropdownItemPaddingX: `${BASE_UNIT * 3}px`, // 12px
    dropdownItemPaddingY: `${BASE_UNIT * 2}px`, // 8px

    // Tooltip
    tooltipPaddingX: `${BASE_UNIT * 2}px`, // 8px
    tooltipPaddingY: `${BASE_UNIT * 1.5}px`, // 6px

    // Toast
    toastPadding: `${BASE_UNIT * 4}px`, // 16px
    toastGap: `${BASE_UNIT * 3}px`, // 12px
  },

  // Layout
  layout: {
    containerMaxWidth: '1200px',
    containerPaddingX: `${BASE_UNIT * 6}px`, // 24px
    sectionGap: `${BASE_UNIT * 16}px`,     // 64px
    sectionGapSm: `${BASE_UNIT * 12}px`,   // 48px
    componentGap: `${BASE_UNIT * 6}px`,    // 24px
    componentGapSm: `${BASE_UNIT * 4}px`,  // 16px
  },
} as const;

export type SpacingTokens = typeof spacing;
export type SpacingKey = keyof typeof spacing;
export type SpacingComponentKey = keyof typeof spacing.component;
export type SpacingLayoutKey = keyof typeof spacing.layout;

// ============================================
// Helper functions
// ============================================
export function getSpacing(key: Exclude<SpacingKey, 'component' | 'layout'>): string {
  const value = spacing[key];
  return typeof value === 'string' ? value : '';
}

export function getComponentSpacing(key: SpacingComponentKey): string {
  return spacing.component[key];
}

export function getLayoutSpacing(key: SpacingLayoutKey): string {
  return spacing.layout[key];
}

// ============================================
// CSS Custom Properties (for globals.css)
// ============================================
const spacingEntries = Object.entries(spacing) as [string, string | Record<string, string>][];
const filteredEntries = spacingEntries
  .filter(([key, value]) => !['component', 'layout'].includes(key) && typeof value === 'string') as [string, string][];
export const spacingCSSVars = filteredEntries
  .reduce((acc, [key, value]) => {
    acc[`--spacing-${key}`] = value;
    return acc;
  }, {} as Record<string, string>);

// Component CSS vars
Object.entries(spacing.component).forEach(([key, value]) => {
  spacingCSSVars[`--spacing-component-${key}`] = value;
});

// Layout CSS vars
Object.entries(spacing.layout).forEach(([key, value]) => {
  spacingCSSVars[`--spacing-layout-${key}`] = value;
});