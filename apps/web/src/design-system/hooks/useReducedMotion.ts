/**
 * useReducedMotion Hook
 * Reacts to prefers-reduced-motion media query
 * Provides both boolean and transition overrides
 */

import { useMediaQuery } from './useMediaQuery';

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Get transition duration based on reduced motion preference
 */
export function useTransitionDuration(
  normalDuration: string,
  reducedDuration: string = '0ms'
): string {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedDuration : normalDuration;
}

/**
 * Get easing based on reduced motion preference
 */
export function useEasing(
  normalEasing: string,
  reducedEasing: string = 'linear'
): string {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedEasing : normalEasing;
}

/**
 * Get complete transition string based on reduced motion preference
 */
export function useTransition(
  normalTransition: string,
  reducedTransition: string = 'none'
): string {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedTransition : normalTransition;
}

/**
 * Motion variants for Framer Motion / similar libraries
 */
export function useMotionVariants<T extends Record<string, unknown>>(
  normalVariants: T,
  reducedVariants: T
): T {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedVariants : normalVariants;
}

/**
 * CSS-in-JS style object with motion-aware transitions
 */
export function useMotionStyle<T extends React.CSSProperties>(
  normalStyle: T,
  reducedStyle: T
): T {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedStyle : normalStyle;
}

/**
 * Hook for animation components (returns safe defaults)
 */
export function useAnimationConfig() {
  const prefersReduced = useReducedMotion();

  return {
    prefersReduced,
    // Safe defaults
    duration: prefersReduced ? 0 : 200,
    easing: prefersReduced ? 'linear' : 'cubic-bezier(0.4, 0, 0.2, 1)',
    // For Framer Motion
    transition: prefersReduced
      ? { duration: 0 }
      : { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    // For CSS transitions
    cssTransition: prefersReduced
      ? 'none'
      : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };
}

/**
 * Higher-order hook for components that need motion config
 */
export function useMotionAware<T extends HTMLElement = HTMLElement>(
  normalProps: React.HTMLAttributes<T>,
  reducedProps: React.HTMLAttributes<T>
): React.HTMLAttributes<T> {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedProps : normalProps;
}