// Professional color scheme
export const colors = {
  // Primary - Blue
  primary: '#2563eb',      // blue-600
  primaryLight: '#3b82f6', // blue-500
  primaryDark: '#1d4ed8',  // blue-700
  
  // Secondary - Teal
  secondary: '#0d9488',      // teal-600
  secondaryLight: '#14b8a6', // teal-500
  secondaryDark: '#0f766e',  // teal-700
  
  // Accent - Amber
  accent: '#f59e0b',      // amber-500
  accentLight: '#fbbf24', // amber-400
  
  // Gradients
  primaryGradient: 'from-blue-500 to-blue-600',
  heroGradient: 'from-blue-50 via-white to-teal-50',
  buttonGradient: 'from-blue-500 to-teal-500',
  
  // Status colors (keep these functional)
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444',  // red-500
};

// Tailwind classes for common patterns
export const gradients = {
  logo: 'bg-gradient-to-br from-blue-500 to-blue-600',
  button: 'bg-gradient-to-r from-blue-500 to-teal-500',
  buttonHover: 'hover:from-blue-600 hover:to-teal-600',
  hero: 'bg-gradient-to-br from-blue-50 via-white to-teal-50',
  card: 'bg-gradient-to-br from-blue-500/10 to-teal-500/5',
};

export const rings = {
  primary: 'focus:ring-blue-500/20',
  input: 'focus:ring-blue-500 focus:border-blue-500',
};
