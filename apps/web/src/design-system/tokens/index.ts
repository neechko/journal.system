/**
 * Design System Tokens — Main Export
 * All tokens exported from single entry point
 */

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './motion';
export * from './breakpoints';

// Re-export types from each module
export type { ColorTokens, ColorMode, JournalSlug } from './colors';
export type { SpacingTokens, SpacingKey, SpacingComponentKey, SpacingLayoutKey } from './spacing';
export type { FontSizeTokens, FontSizeKey, FontSizeComponentKey, TextStyleKey } from './typography';
export type { DurationTokens, EasingTokens, KeyframesTokens, TransitionTokens } from './motion';
export type { BreakpointTokens, BreakpointKey, MediaQueryTokens, ContainerQueryTokens, ZIndexTokens, ContainerMaxWidthTokens } from './breakpoints';