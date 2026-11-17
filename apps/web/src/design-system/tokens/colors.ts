/**
 * Design System Color Tokens
 * Provisional platform palette. Journal colors require owner configuration.
 * Semantic naming keeps components independent of palette choices.
 */

const primitive = {
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // This action color is provisional until the platform identity is approved.
  action: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
} as const;

export const lightColors = {
  // Background
  background: {
    primary: primitive.neutral[0],
    secondary: primitive.neutral[50],
    tertiary: primitive.neutral[100],
    inverse: primitive.neutral[900],
  },

  // Surface (cards, modals, dropdowns)
  surface: {
    primary: primitive.neutral[0],
    secondary: primitive.neutral[50],
    tertiary: primitive.neutral[100],
    inverse: primitive.neutral[800],
  },

  // Border
  border: {
    primary: primitive.neutral[200],
    secondary: primitive.neutral[300],
    focus: primitive.action[500],
    error: primitive.error[500],
    success: primitive.success[500],
  },

  // Text
  text: {
    primary: primitive.neutral[900],
    secondary: primitive.neutral[600],
    tertiary: primitive.neutral[400],
    inverse: primitive.neutral[0],
    link: primitive.action[600],
    linkHover: primitive.action[700],
  },

  // Brand (journal-specific, overridden per journal)
  brand: {
    primary: primitive.action[600],
    primaryHover: primitive.action[700],
    primaryLight: primitive.action[50],
    secondary: primitive.neutral[600],
    secondaryHover: primitive.neutral[700],
  },

  // Status
  status: {
    success: primitive.success[600],
    successLight: primitive.success[50],
    warning: primitive.warning[600],
    warningLight: primitive.warning[50],
    error: primitive.error[600],
    errorLight: primitive.error[50],
    info: primitive.info[600],
    infoLight: primitive.info[50],
  },

  // Interactive
  interactive: {
    hover: primitive.neutral[100],
    active: primitive.neutral[200],
    disabled: primitive.neutral[300],
    disabledText: primitive.neutral[400],
  },

  // Overlay
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    modal: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export const darkColors = {
  background: {
    primary: primitive.neutral[950],
    secondary: primitive.neutral[900],
    tertiary: primitive.neutral[800],
    inverse: primitive.neutral[0],
  },

  surface: {
    primary: primitive.neutral[900],
    secondary: primitive.neutral[800],
    tertiary: primitive.neutral[700],
    inverse: primitive.neutral[100],
  },

  border: {
    primary: primitive.neutral[700],
    secondary: primitive.neutral[600],
    focus: primitive.action[400],
    error: primitive.error[500],
    success: primitive.success[500],
  },

  text: {
    primary: primitive.neutral[50],
    secondary: primitive.neutral[300],
    tertiary: primitive.neutral[500],
    inverse: primitive.neutral[900],
    link: primitive.action[400],
    linkHover: primitive.action[300],
  },

  brand: {
    primary: primitive.action[500],
    primaryHover: primitive.action[400],
    primaryLight: primitive.action[900],
    secondary: primitive.neutral[300],
    secondaryHover: primitive.neutral[200],
  },

  status: {
    success: primitive.success[500],
    successLight: primitive.success[100],
    warning: primitive.warning[500],
    warningLight: primitive.warning[100],
    error: primitive.error[500],
    errorLight: primitive.error[100],
    info: primitive.info[500],
    infoLight: primitive.info[100],
  },

  interactive: {
    hover: primitive.neutral[800],
    active: primitive.neutral[700],
    disabled: primitive.neutral[700],
    disabledText: primitive.neutral[500],
  },

  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.7)',
    modal: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

export type ColorTokens = typeof lightColors;
export type ColorMode = 'light' | 'dark';
