// 3WM SONIK - Design System Tokens

// Core 3WM Brand Colors
export const brand = {
  ink: '#0D0D0D',
  darkAmber: '#1A1208',
  surface: '#181410',
  gold: '#F5A800',
  fire: '#FF3C00',
  mint: '#2AFFA3',
  silver: '#C9C9D4',

  // Agent Colors
  emar: '#2AFFA3',
  ricky: '#F5A800',
  kingpin: '#FF3C00',
  orchestrator: '#F5A800',
};

// Neutral Scale
export const neutral = {
  950: '#0D0D0D',
  900: '#181410',
  850: '#151208',
  800: '#262626',
  700: '#404040',
  500: '#737373',
  400: '#A3A3A3',
  300: '#D4D4D4',
  200: '#E5E5E5',
  100: '#F5F5F5',
  50: '#FAFAFA',
};

// Semantic Colors
export const semantic = {
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
};

// Legacy colors for backward compatibility
export const colors = {
  obsidian: '#0a0b0d',
  obsidianLighter: '#111317',
  graphite: '#16181d',
  graphiteHover: '#1f2229',
  graphiteBorder: '#272b34',

  deepForest: '#0d1a14',
  mutedEmerald: '#10b981',
  emeraldGlow: '#059669',

  warmIvory: '#f5f5f0',
  ivoryMuted: '#d4d4cc',
  textDimmed: '#9ca3af',
  textSubtle: '#6b7280',

  copper: '#b45309',
  copperLight: '#d97706',
  softAmber: '#f59e0b',
  amberGlow: '#fbbf24',

  signalGreen: '#22c55e',
  signalYellow: '#eab308',
  signalRed: '#ef4444',
  signalCyan: '#06b6d4',
  signalPurple: '#a855f7',
};

// Typography Scale
export const typography = {
  // Font Families
  fontDisplay: 'Bebas Neue, sans-serif',
  fontSans: 'DM Sans, sans-serif',
  fontMono: 'IBM Plex Mono, monospace',

  // Font Sizes (rem)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',

  // Brand-specific glows
  glowGold: '0 0 20px rgba(245, 168, 0, 0.3)',
  glowFire: '0 0 20px rgba(255, 60, 0, 0.3)',
  glowMint: '0 0 20px rgba(42, 255, 163, 0.3)',

  // Legacy shadows
  subtle: '0 1px 3px rgba(0, 0, 0, 0.4)',
  panel: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
  glowAmber: '0 0 20px rgba(245, 158, 11, 0.25)',
  glowEmerald: '0 0 20px rgba(16, 185, 129, 0.25)',
  glowCyan: '0 0 20px rgba(6, 182, 212, 0.25)',
  glowPurple: '0 0 20px rgba(168, 85, 247, 0.25)',
};

// Transitions
export const transitions = {
  fast: '150ms ease',
  base: '250ms ease',
  slow: '350ms ease',
  slower: '500ms ease',
};

// Z-Index Scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};
