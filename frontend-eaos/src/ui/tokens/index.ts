export const colors = {
  canvas: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#0A0A0A',
  },
  state: {
    healthy: '#22C55E',
    warning: '#F59E0B',
    critical: '#EF4444',
    info: '#3B82F6',
    neutral: '#71717A',
  },
} as const;

export const fonts = {
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'sans-serif',
  ],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
} as const;

export const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '6': '24px',
  '8': '32px',
  '12': '48px',
  '16': '64px',
  '24': '96px',
} as const;

export const borderRadius = {
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
} as const;

export const fontSize = {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['13px', { lineHeight: '18px' }],
  base: ['14px', { lineHeight: '20px' }],
  lg: ['16px', { lineHeight: '24px' }],
  xl: ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['32px', { lineHeight: '40px' }],
  '4xl': ['48px', { lineHeight: '56px' }],
} as const;

export const density = {
  compact: {
    rowHeight: '28px',
    padding: '4px',
  },
  default: {
    rowHeight: '36px',
    padding: '8px',
  },
  comfortable: {
    rowHeight: '48px',
    padding: '12px',
  },
} as const;

export const healthStatus = {
  healthy: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
  unknown: '#71717A',
} as const;

export const lifecycleState = {
  active: '#22C55E',
  paused: '#F59E0B',
  suspended: '#F97316',
  archived: '#71717A',
  draft: '#3B82F6',
  pending: '#8B5CF6',
} as const;
