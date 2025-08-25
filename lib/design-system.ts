/**
 * SafeTrade Design System
 * Unified design tokens and component styling utilities
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
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
  
  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Success Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger Colors
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
} as const;

// Spacing Scale
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '0.75rem', // 12px
  lg: '1rem',    // 16px
  xl: '1.5rem',  // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
  '5xl': '6rem', // 96px
  '6xl': '8rem', // 128px
} as const;

// Typography Scale
export const typography = {
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// Border Radius Scale
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// Shadow Scale
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Enhanced Animation and Micro-interactions
export const animations = {
  // Transition durations and easing
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Base transition classes
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    bounce: 'transition-all duration-200 ease-out',
    spring: 'transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
  },
  
  // Micro-interactions for enhanced UX
  interactions: {
    // Button press effect with slight scale and shadow reduction
    press: 'active:scale-[0.98] active:shadow-sm transition-transform duration-75',
    // Subtle lift for cards and interactive elements
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
    // Enhanced card hover with rotation and shadow
    cardHover: 'hover:-translate-y-2 hover:rotate-[0.5deg] hover:shadow-xl transition-all duration-300',
    // Gentle scale for buttons and links
    scaleHover: 'hover:scale-[1.02] transition-transform duration-200',
    // Glow effect for focused elements
    glow: 'hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-300 transition-all duration-200',
    // Shimmer effect for loading or special elements
    shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700',
  },
  
  // Hover effects with semantic meaning
  hover: {
    lift: 'hover:-translate-y-1 hover:shadow-md',
    liftStrong: 'hover:-translate-y-2 hover:shadow-lg',
    scale: 'hover:scale-105',
    scaleSubtle: 'hover:scale-[1.02]',
    glowPrimary: 'hover:shadow-lg hover:shadow-blue-500/25',
    glowSuccess: 'hover:shadow-lg hover:shadow-emerald-500/25',
    glowDanger: 'hover:shadow-lg hover:shadow-red-500/25',
    brighten: 'hover:brightness-110',
    fadeOpacity: 'hover:opacity-80',
  },
  
  // Loading and state animations
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
    slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
    slideInLeft: 'animate-in slide-in-from-left-4 duration-300',
    slideInRight: 'animate-in slide-in-from-right-4 duration-300',
    fadeIn: 'animate-in fade-in duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
  },
  
  // Focus states for accessibility
  focus: {
    ring: 'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none',
    ringSubtle: 'focus:ring-1 focus:ring-offset-1 focus:ring-blue-400/60 focus:outline-none',
    ringSuccess: 'focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:outline-none',
    ringDanger: 'focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:outline-none',
    ringLarge: 'focus:ring-4 focus:ring-offset-2 focus:ring-blue-500/40 focus:outline-none',
  },
  
  // Modal and overlay animations
  modal: {
    backdrop: 'animate-in fade-in duration-200',
    content: 'animate-in fade-in zoom-in-95 duration-200',
    slideUp: 'animate-in slide-in-from-bottom-8 duration-300 ease-out',
    slideDown: 'animate-in slide-in-from-top-8 duration-300 ease-out',
    slideLeft: 'animate-in slide-in-from-left-8 duration-300 ease-out',
    slideRight: 'animate-in slide-in-from-right-8 duration-300 ease-out',
  },
  
  // Stagger animations for lists and grids
  stagger: {
    container: 'space-y-2',
    item: 'animate-in fade-in slide-in-from-bottom-4',
    delay: {
      100: 'animation-delay-100',
      200: 'animation-delay-200',
      300: 'animation-delay-300',
      400: 'animation-delay-400',
    },
  },
} as const;

// Component Variants
export const componentVariants = {
  card: {
    base: 'bg-white rounded-xl border border-gray-200/60 shadow-sm transition-all duration-200',
    hover: 'hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5',
    interactive: 'cursor-pointer',
    elevated: 'shadow-lg',
  },
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    sizes: {
      xs: 'px-2.5 py-1.5 text-xs rounded-md',
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
    },
  },
  badge: {
    base: 'inline-flex items-center font-medium rounded-full transition-colors',
    sizes: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-sm',
    },
  },
  input: {
    base: 'block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-200',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  },
} as const;

// Utility Classes
export const utils = {
  // Focus ring for interactive elements
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  
  // Smooth transitions
  transition: 'transition-all duration-200 ease-out',
  
  // Text truncation
  truncate: 'truncate',
  
  // Gradient backgrounds
  gradients: {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700',
    success: 'bg-gradient-to-r from-success-600 to-success-700',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600',
  },
} as const;

// Status Colors Mapping
export const statusColors = {
  // Listing Status
  available: colors.success,
  in_talks: colors.warning,
  sold: colors.secondary,
  
  // Meeting Status
  scheduled: colors.primary,
  confirmed: colors.success,
  in_progress: colors.warning,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.secondary,
  
  // Verification Status
  verified: colors.success,
  pending: colors.warning,
  rejected: colors.danger,
} as const;

// Icon Sizes
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
} as const;

// Breakpoints (for responsive design)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index Scale
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

// Export all design tokens
export const designSystem = {
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
} as const;

export default designSystem;