/**
 * useMediaQuery Hook
 * Reactive media query matching with SSR safety
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Check if a media query matches
 * Returns false during SSR (no window)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Only set initial state once
    if (!initialized.current) {
      setMatches(mediaQuery.matches);
      initialized.current = true;
    }

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Legacy API (Safari < 14)
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isWide = useMediaQuery('(min-width: 1280px)');
  const isUltraWide = useMediaQuery('(min-width: 1536px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isUltraWide,
    // Convenience
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrWide: isDesktop || isWide,
  };
}

/**
 * Reduced motion preference
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Dark mode preference (system)
 */
export function useSystemDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * High contrast preference
 */
export function useHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)');
}

/**
 * Hover capability
 */
export function useHoverCapability(): 'hover' | 'none' {
  const hasHover = useMediaQuery('(hover: hover)');
  return hasHover ? 'hover' : 'none';
}

/**
 * Pointer capability
 */
export function usePointerCapability(): 'fine' | 'coarse' {
  const isFine = useMediaQuery('(pointer: fine)');
  return isFine ? 'fine' : 'coarse';
}

/**
 * Print media
 */
export function usePrintMedia(): boolean {
  return useMediaQuery('print');
}

/**
 * Custom hook for container queries (requires parent with container-type)
 */
export function useContainerQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Find the nearest container ancestor
    // This is a simplified version — real implementation needs resize observer
    const container = document.querySelector('[style*="container-type"]');
    if (!container) return;

    // Fallback: use resize observer on container
    const observer = new ResizeObserver((_entries: ResizeObserverEntry[]) => {
      // Check if container matches query
      // This is simplified — actual implementation would parse query
      setMatches(true);
      void _entries;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [query]);

  return matches;
}

/**
 * Hook for multiple media queries at once
 */
export function useMediaQueries(queries: Record<string, string>): Record<string, boolean> {
  const queryEntries = Object.entries(queries);
  
  // Lazy initialization - compute initial matches on client
  const [matches, setMatches] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const initial: Record<string, boolean> = {};
    for (const [key, query] of queryEntries) {
      initial[key] = window.matchMedia(query).matches;
    }
    return initial;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQueries = queryEntries.map(([key, query]) => ({
      key,
      mql: window.matchMedia(query),
    }));
    
    const handlers = mediaQueries.map(({ key, mql }) => {
      const handler = (e: MediaQueryListEvent) => {
        setMatches(prev => ({ ...prev, [key]: e.matches }));
      };
      mql.addEventListener('change', handler);
      return { mql, handler };
    });
    
    return () => {
      for (const { mql, handler } of handlers) {
        mql.removeEventListener('change', handler);
      }
    };
  }, [queryEntries]);
  
  return matches;
}

/**
 * Breakpoint-specific hooks for convenience
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsWide = () => useMediaQuery('(min-width: 1280px)');
export const useIsUltraWide = () => useMediaQuery('(min-width: 1536px)');