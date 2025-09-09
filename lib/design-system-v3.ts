/**
 * SafeTrade Design System v3.0 - Compact & Animated Edition
 * Ultra-compact sizing with enhanced animations for modern UX
 * TypeScript design tokens matching CSS variables
 */

// Sophisticated Color Palette - Grok/Vercel Inspired
export const colors = {
  // Primary Brand Colors - Mocha Mousse (Pantone 2025)
  primary: {
    50: '#fdfcfb',
    100: '#faf7f4',
    200: '#f4ede7',
    300: '#ebe0d6',
    400: '#d4c4b4',
    500: '#a47864',  // Main Mocha Mousse
    600: '#8b6a56',
    700: '#6b5242',
    800: '#4a3a2e',
    900: '#2d221a',
    950: '#1a1411',
  },
  
  // Sophisticated Neutral Scale - Vercel Inspired
  neutral: {
    0: '#ffffff',      // Pure white
    50: '#fefefe',     // Ultra-clean background
    100: '#fcfcfc',    // Elevated surfaces
    200: '#f8f8f8',    // Hover states
    300: '#f4f4f4',    // Pressed states
    400: '#e5e5e5',    // Borders
    500: '#a3a3a3',    // Light gray text
    600: '#737373',    // Medium gray
    700: '#525252',    // Secondary text
    800: '#262626',    // Dark gray
    900: '#171717',    // Near black
    950: '#000000',    // Pure black
  },
  
  // Digital Lavender - 2025 Trend Color
  lavender: {
    50: '#faf8ff',
    100: '#f3f0ff',
    200: '#e9e5ff',
    300: '#d6cfff',
    400: '#beb0ff',
    500: '#a78bfa',    // Main Digital Lavender
    600: '#9671f7',
    700: '#8457eb',
    800: '#6b46c1',
    900: '#553c9a',
  },
  
  // Success Colors - Orange accent system
  success: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#ff8c00',    // Main orange
    600: '#e67e22',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Warning Colors
  warning: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#ea580c',    // Main warning
    600: '#dc2626',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#dc2626',    // Main error
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#7f1d1d',
  },
} as const;

// Compact Spacing Scale (20% smaller)
export const spacing = {
  0: '0',
  1: '0.2rem',    // 3.2px (was 4px)
  2: '0.4rem',    // 6.4px (was 8px)
  3: '0.6rem',    // 9.6px (was 12px)
  4: '0.8rem',    // 12.8px (was 16px)
  5: '1rem',      // 16px (was 20px)
  6: '1.2rem',    // 19.2px (was 24px)
  8: '1.6rem',    // 25.6px (was 32px)
  10: '2rem',     // 32px (was 40px)
  12: '2.4rem',   // 38.4px (was 48px)
  16: '3.2rem',   // 51.2px (was 64px)
  20: '4rem',     // 64px (was 80px)
  24: '4.8rem',   // 76.8px (was 96px)
  32: '6.4rem',   // 102.4px (was 128px)
} as const;

// Compact Typography Scale (15% smaller)
export const typography = {
  fontSize: {
    xs: '0.65rem',      // 10.4px (was 12px)
    sm: '0.75rem',      // 12px (was 14px)
    base: '0.85rem',    // 13.6px (was 16px)
    lg: '0.95rem',      // 15.2px (was 18px)
    xl: '1.05rem',      // 16.8px (was 20px)
    '2xl': '1.25rem',   // 20px (was 24px)
    '3xl': '1.5rem',    // 24px (was 30px)
    '4xl': '1.8rem',    // 28.8px (was 36px)
    '5xl': '2.4rem',    // 38.4px (was 48px)
    '6xl': '3rem',      // 48px (was 60px)
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.2',
    snug: '1.3',
    normal: '1.4',
    relaxed: '1.5',
    loose: '1.6',
  },
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.015em',
    normal: '0',
    wide: '0.015em',
    wider: '0.02em',
  },
} as const;

// Compact Border Radius Scale
export const borderRadius = {
  none: '0',
  xs: '0.2rem',      // 3.2px
  sm: '0.3rem',      // 4.8px
  md: '0.4rem',      // 6.4px
  lg: '0.6rem',      // 9.6px
  xl: '0.8rem',      // 12.8px
  '2xl': '1.2rem',   // 19.2px
  '3xl': '1.6rem',   // 25.6px
  full: '9999px',
} as const;

// Refined Shadow Scale (smaller, softer)
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  md: '0 3px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  lg: '0 6px 12px -2px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  xl: '0 12px 20px -4px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 20px 32px -8px rgb(0 0 0 / 0.15)',
  hover: '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
} as const;

// Enhanced Animation System
export const animations = {
  // Ultra-fast durations for micro-interactions
  duration: {
    instant: '0ms',
    fastest: '50ms',
    fast: '100ms',
    normal: '150ms',
    medium: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Modern easing curves
  easing: {
    linear: 'linear',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Enhanced micro-interactions
  interactions: {
    // Button press with faster response
    press: 'active:scale-[0.98] transition-transform duration-[50ms]',
    // Subtle lift for compact elements
    lift: 'hover:-translate-y-0.5 hover:shadow-sm transition-all duration-100',
    // Enhanced card hover with smaller movement
    cardHover: 'hover:-translate-y-1 hover:scale-[1.005] hover:shadow-md transition-all duration-150',
    // Gentle scale for compact buttons
    scaleHover: 'hover:scale-[1.02] transition-transform duration-100',
    // Compact glow effect
    glow: 'hover:shadow-sm hover:shadow-black/10 hover:border-black/20 transition-all duration-100',
    // Faster shimmer effect
    shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500',
  },
  
  // Compact hover effects
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-sm',
    liftStrong: 'hover:-translate-y-1 hover:shadow-md',
    scale: 'hover:scale-105',
    scaleSubtle: 'hover:scale-[1.01]',
    glowPrimary: 'hover:shadow-sm hover:shadow-black/10',
    glowSuccess: 'hover:shadow-sm hover:shadow-emerald-500/20',
    glowDanger: 'hover:shadow-sm hover:shadow-red-500/20',
    brighten: 'hover:brightness-105',
    fadeOpacity: 'hover:opacity-90',
  },
  
  // Fast loading animations
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse-soft',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
    slideIn: 'animate-slide-in-up',
    slideInLeft: 'animate-slide-in-left',
    slideInRight: 'animate-slide-in-right',
    fadeIn: 'animate-fade-in',
    scaleIn: 'animate-scale-in',
  },
  
  // Compact focus states
  focus: {
    ring: 'focus:ring-1 focus:ring-offset-1 focus:ring-black/20 focus:outline-none',
    ringSubtle: 'focus:ring-1 focus:ring-black/10 focus:outline-none',
    ringSuccess: 'focus:ring-1 focus:ring-offset-1 focus:ring-emerald-500/30 focus:outline-none',
    ringDanger: 'focus:ring-1 focus:ring-offset-1 focus:ring-red-500/30 focus:outline-none',
    ringLarge: 'focus:ring-2 focus:ring-offset-1 focus:ring-black/15 focus:outline-none',
  },
  
  // Faster modal animations
  modal: {
    backdrop: 'animate-fade-in',
    content: 'animate-scale-in',
    slideUp: 'animate-slide-in-up',
    slideDown: 'animate-in slide-in-from-top-4 duration-200',
    slideLeft: 'animate-in slide-in-from-left-4 duration-200',
    slideRight: 'animate-in slide-in-from-right-4 duration-200',
  },
  
  // Stagger animations for compact lists
  stagger: {
    container: 'space-y-1',  // Tighter spacing
    item: 'animate-slide-in-up',
    delay: {
      50: 'animation-delay-[50ms]',
      100: 'animation-delay-[100ms]',
      150: 'animation-delay-[150ms]',
      200: 'animation-delay-[200ms]',
      250: 'animation-delay-[250ms]',
    },
  },
} as const;

// Compact Component Variants
export const componentVariants = {
  card: {
    base: 'bg-white rounded-md border border-neutral-100 shadow-xs transition-all duration-100',
    hover: 'hover:shadow-sm hover:border-neutral-200 hover:-translate-y-0.5',
    interactive: 'cursor-pointer',
    elevated: 'shadow-md',
    compact: 'p-3', // Smaller padding
  },
  
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-100 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
    sizes: {
      xs: 'h-6 px-2 text-xs rounded-xs',      // Compact sizes
      sm: 'h-7 px-3 text-sm rounded-sm',
      md: 'h-8 px-4 text-sm rounded-md',
      lg: 'h-10 px-5 text-base rounded-md',
      xl: 'h-11 px-6 text-lg rounded-lg',
    },
  },
  
  badge: {
    base: 'inline-flex items-center font-medium rounded-full transition-colors duration-100',
    sizes: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',     // Smaller text
      lg: 'px-3 py-1 text-sm',
    },
  },
  
  input: {
    base: 'block w-full rounded-sm border border-neutral-200 px-3 py-1.5 text-neutral-950 placeholder-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950/20 transition-all duration-100',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
    success: 'border-orange-300 focus:border-orange-500 focus:ring-orange-500/20',
    compact: 'h-8 px-2 py-1 text-sm',  // Compact input variant
  },
} as const;

// Compact Utility Classes
export const utils = {
  // Faster focus ring
  focusRing: 'focus:outline-none focus:ring-1 focus:ring-black/20 focus:ring-offset-1',
  
  // Fast transitions
  transition: 'transition-all duration-100 ease-out',
  transitionFast: 'transition-all duration-50 ease-out',
  
  // Text utilities
  truncate: 'truncate',
  
  // Sophisticated gradients - Grok/Vercel inspired
  gradients: {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700',     // Mocha Mousse
    secondary: 'bg-gradient-to-r from-neutral-600 to-neutral-700',   // Sophisticated gray
    lavender: 'bg-gradient-to-r from-lavender-500 to-lavender-600',  // Digital Lavender
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    error: 'bg-gradient-to-r from-error-500 to-error-600',
    subtle: 'bg-gradient-to-r from-neutral-50 to-neutral-100',
    warm: 'bg-gradient-to-r from-primary-100 to-primary-200',        // Warm Mocha tones
  },
} as const;

// Sophisticated Status Colors Mapping
export const statusColors = {
  // Listing Status
  available: colors.success,
  in_talks: colors.primary,     // Use Mocha Mousse for in-talks
  sold: colors.neutral,
  
  // Meeting Status
  scheduled: colors.lavender,   // Use Digital Lavender for scheduled
  confirmed: colors.success,
  in_progress: colors.primary,  // Mocha Mousse for in-progress
  completed: colors.success,
  cancelled: colors.error,
  no_show: colors.neutral,
  
  // Verification Status
  verified: colors.success,
  pending: colors.primary,      // Mocha Mousse for pending
  rejected: colors.error,
} as const;

// Compact Icon Sizes
export const iconSizes = {
  xs: 'w-3 h-3',      // 12px (was 16px)
  sm: 'w-3.5 h-3.5',  // 14px (was 16px)
  md: 'w-4 h-4',      // 16px (was 20px)
  lg: 'w-5 h-5',      // 20px (was 24px)
  xl: 'w-6 h-6',      // 24px (was 32px)
  '2xl': 'w-8 h-8',   // 32px (was 40px)
} as const;

// Compact Breakpoints
export const breakpoints = {
  xs: '480px',     // New extra small breakpoint
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1200px',    // Smaller max width for compact design
  '2xl': '1400px',
} as const;

// Z-index Scale (unchanged)
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
} as const;

// Enhanced Layout Patterns for Compact Design
export const layouts = {
  containers: {
    xs: 'max-w-sm mx-auto px-3',     // 384px
    sm: 'max-w-md mx-auto px-4',     // 512px  
    md: 'max-w-2xl mx-auto px-4',    // 672px
    lg: 'max-w-4xl mx-auto px-4',    // 896px
    xl: 'max-w-6xl mx-auto px-6',    // 1152px
  },
  
  stacks: {
    xs: 'space-y-1',   // 3.2px
    sm: 'space-y-2',   // 6.4px
    md: 'space-y-3',   // 9.6px
    lg: 'space-y-4',   // 12.8px
    xl: 'space-y-6',   // 19.2px
  },
  
  grids: {
    compact: 'grid gap-3',
    comfortable: 'grid gap-4',
    spacious: 'grid gap-6',
  },
} as const;

// Export all compact design tokens
export const designSystemV3 = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  componentVariants,
  utils,
  statusColors,
  iconSizes,
  breakpoints,
  zIndex,
  layouts,
} as const;

export default designSystemV3;