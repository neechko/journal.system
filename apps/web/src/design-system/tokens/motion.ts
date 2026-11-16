/**
 * Design System Motion Tokens
 * Meaningful, accessible animations — respect prefers-reduced-motion
 * Audit from Nature, PLOS, Taylor & Francis
 */

// ============================================
// Duration
// ============================================
export const duration = {
  instant: '0ms',
  fastest: '50ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',

  // Component-specific
  component: {
    buttonPress: '50ms',
    buttonRelease: '100ms',
    inputFocus: '100ms',
    dropdownOpen: '150ms',
    dropdownClose: '100ms',
    modalOpen: '200ms',
    modalClose: '150ms',
    toastEnter: '200ms',
    toastExit: '200ms',
    tooltipShow: '150ms',
    tooltipHide: '100ms',
    tabSwitch: '150ms',
    accordionToggle: '200ms',
    tableSort: '150ms',
    cardHover: '200ms',
    linkHover: '100ms',
    figureLightboxOpen: '250ms',
    figureLightboxClose: '200ms',
    searchAutocomplete: '100ms',
    pageTransition: '300ms',
  },
} as const;

// ============================================
// Easing
// ============================================
export const easing = {
  // Standard
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Expressive (for meaningful transitions)
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',

  // Spring-like (for playful but professional)
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  springGentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // Component-specific
  component: {
    button: 'cubic-bezier(0, 0, 0.2, 1)',
    input: 'cubic-bezier(0, 0, 0.2, 1)',
    dropdown: 'cubic-bezier(0.4, 0, 0.2, 1)',
    modal: 'cubic-bezier(0.4, 0, 0.2, 1)',
    toast: 'cubic-bezier(0.4, 0, 0.2, 1)',
    tooltip: 'cubic-bezier(0.4, 0, 0.2, 1)',
    tab: 'cubic-bezier(0.4, 0, 0.2, 1)',
    accordion: 'cubic-bezier(0.4, 0, 0.2, 1)',
    card: 'cubic-bezier(0, 0, 0.2, 1)',
    link: 'cubic-bezier(0, 0, 0.2, 1)',
    figureLightbox: 'cubic-bezier(0.4, 0, 0.2, 1)',
    search: 'cubic-bezier(0.4, 0, 0.2, 1)',
    page: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================
// Reduced Motion
// ============================================
export const reducedMotion = {
  // When prefers-reduced-motion: reduce
  // Replace animations with instant or very fast transitions
  duration: {
    instant: '0ms',
    fastest: '1ms',
    fast: '1ms',
    normal: '1ms',
    slow: '1ms',
    slower: '1ms',
    slowest: '1ms',
  },
  easing: {
    linear: 'linear',
    // All others become linear
  },
} as const;

// ============================================
// Keyframes (Reusable animations)
// ============================================
export const keyframes = {
  // Fade
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Slide
  slideInFromTop: {
    from: { opacity: 0, transform: 'translateY(-10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideInFromBottom: {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideInFromLeft: {
    from: { opacity: 0, transform: 'translateX(-10px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  slideInFromRight: {
    from: { opacity: 0, transform: 'translateX(10px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },

  // Scale
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
  },

  // Spin (for loading)
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Pulse (for skeleton loading)
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Shimmer (for skeleton loading)
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
} as const;

// ============================================
// Transition Presets
// ============================================
export const transition = {
  // All properties
  all: {
    fast: `all ${duration.fast} ${easing.easeOut}`,
    normal: `all ${duration.normal} ${easing.easeOut}`,
    slow: `all ${duration.slow} ${easing.easeOut}`,
  },

  // Specific properties
  opacity: {
    fast: `opacity ${duration.fast} ${easing.easeOut}`,
    normal: `opacity ${duration.normal} ${easing.easeOut}`,
  },
  transform: {
    fast: `transform ${duration.fast} ${easing.easeOut}`,
    normal: `transform ${duration.normal} ${easing.easeOut}`,
  },
  color: {
    fast: `color ${duration.fast} ${easing.easeOut}, background-color ${duration.fast} ${easing.easeOut}, border-color ${duration.fast} ${easing.easeOut}`,
    normal: `color ${duration.normal} ${easing.easeOut}, background-color ${duration.normal} ${easing.easeOut}, border-color ${duration.normal} ${easing.easeOut}`,
  },
  boxShadow: {
    fast: `box-shadow ${duration.fast} ${easing.easeOut}`,
    normal: `box-shadow ${duration.normal} ${easing.easeOut}`,
  },

  // Component presets
  component: {
    button: `background-color ${duration.component.buttonPress} ${easing.component.button}, color ${duration.component.buttonPress} ${easing.component.button}, box-shadow ${duration.component.buttonPress} ${easing.component.button}`,
    input: `border-color ${duration.component.inputFocus} ${easing.component.input}, box-shadow ${duration.component.inputFocus} ${easing.component.input}, background-color ${duration.component.inputFocus} ${easing.component.input}`,
    dropdown: `opacity ${duration.component.dropdownOpen} ${easing.component.dropdown}, transform ${duration.component.dropdownOpen} ${easing.component.dropdown}`,
    modal: `opacity ${duration.component.modalOpen} ${easing.component.modal}, transform ${duration.component.modalOpen} ${easing.component.modal}`,
    toast: `opacity ${duration.component.toastEnter} ${easing.component.toast}, transform ${duration.component.toastEnter} ${easing.component.toast}`,
    tooltip: `opacity ${duration.component.tooltipShow} ${easing.component.tooltip}, transform ${duration.component.tooltipShow} ${easing.component.tooltip}`,
    tab: `opacity ${duration.component.tabSwitch} ${easing.component.tab}, transform ${duration.component.tabSwitch} ${easing.component.tab}`,
    accordion: `height ${duration.component.accordionToggle} ${easing.component.accordion}, opacity ${duration.component.accordionToggle} ${easing.component.accordion}`,
    card: `box-shadow ${duration.component.cardHover} ${easing.component.card}, transform ${duration.component.cardHover} ${easing.component.card}`,
    link: `color ${duration.component.linkHover} ${easing.component.link}`,
    figureLightbox: `opacity ${duration.component.figureLightboxOpen} ${easing.component.figureLightbox}, transform ${duration.component.figureLightboxOpen} ${easing.component.figureLightbox}`,
    search: `opacity ${duration.component.searchAutocomplete} ${easing.component.search}, transform ${duration.component.searchAutocomplete} ${easing.component.search}`,
    page: `opacity ${duration.component.pageTransition} ${easing.component.page}, transform ${duration.component.pageTransition} ${easing.component.page}`,
  },
} as const;

// ============================================
// CSS Custom Properties
// ============================================
export const motionCSSVars = {
  // Durations
  '--duration-instant': duration.instant,
  '--duration-fastest': duration.fastest,
  '--duration-fast': duration.fast,
  '--duration-normal': duration.normal,
  '--duration-slow': duration.slow,
  '--duration-slower': duration.slower,
  '--duration-slowest': duration.slowest,

  // Easings
  '--easing-linear': easing.linear,
  '--easing-ease-in': easing.easeIn,
  '--easing-ease-out': easing.easeOut,
  '--easing-ease-in-out': easing.easeInOut,
  '--easing-spring': easing.spring,
  '--easing-spring-gentle': easing.springGentle,

  // Transitions
  '--transition-fast': transition.all.fast,
  '--transition-normal': transition.all.normal,
  '--transition-slow': transition.all.slow,
} as const;

// ============================================
// Type exports
// ============================================
export type DurationTokens = typeof duration;
export type EasingTokens = typeof easing;
export type KeyframesTokens = typeof keyframes;
export type TransitionTokens = typeof transition;