// lib/colors.ts - Centralized Color Palette for SafeTrade MVP

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb', // Hover states
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },

  // Success Colors (for verification, completed states)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a', // Main success green
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Warning Colors (for caution, pending states)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706', // Main warning yellow
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // Error/Danger Colors
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626', // Main error red
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Neutral/Gray Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563', // Main text color
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // Background Colors
  background: {
    white: '#ffffff',
    light: '#f9fafb', // Light gray background
    muted: '#f3f4f6'  // Muted background
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    default: '#d1d5db',
    focus: '#3b82f6' // Focus ring color
  }
};

// Semantic Color Mappings for specific use cases
export const semantic = {
  // Status colors
  verified: colors.success[600],
  unverified: colors.warning[600],
  error: colors.danger[600],
  
  // UI element colors
  button: {
    primary: colors.primary[600],
    primaryHover: colors.primary[700],
    secondary: colors.gray[100],
    secondaryHover: colors.gray[200],
    danger: colors.danger[600],
    dangerHover: colors.danger[700]
  },

  // Text colors
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    muted: colors.gray[500],
    light: colors.gray[400]
  },

  // Form colors
  form: {
    border: colors.border.light,
    borderFocus: colors.border.focus,
    borderError: colors.danger[300],
    background: colors.background.white,
    placeholder: colors.gray[400]
  }
};

// Utility functions for generating Tailwind class names
export const tw = {
  // Background utilities
  bg: {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-100 hover:bg-gray-200',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    light: 'bg-gray-50',
    white: 'bg-white'
  },

  // Text utilities
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600', 
    muted: 'text-gray-500',
    light: 'text-gray-400',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  },

  // Border utilities
  border: {
    default: 'border-gray-300',
    light: 'border-gray-200',
    focus: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
  }
};

export default colors;