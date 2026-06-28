import type { Config } from 'tailwindcss';

/**
 * Phase 1, Task 1.23: Apply NUWS §7.5 design tokens.
 *
 * Tokens are the source of truth (per `EAOS-NUWS-principles.md` §7.5). When
 * `packages/ui/` ships (Task 1.12), this config imports from there. For
 * now, the values are inline so the scaffold compiles.
 *
 * - Colors: neutral chrome, state colors (healthy/warning/critical).
 * - Typography: Inter (UI), JetBrains Mono (code/entity IDs).
 * - Spacing: 4/8/12/16/24/32/48/64/96 scale (no other values).
 * - Dark mode: default, system-controlled via next-themes.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Tremor's colour classes used dynamically — keep them in the build.
    {
      pattern:
        /^(bg|text|border|ring|fill|stroke)-(tremor|brand|emerald|green|lime|amber|yellow|red|rose|blue|sky|cyan|teal|indigo|violet|purple|fuchsia|pink|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Neutral chrome (NUWS §7.5.2 — 10 steps from #0A0A0A to #FAFAFA)
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
        // State colors (NUWS §7.2 — binding for state/health/severity)
        state: {
          healthy: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#3B82F6',
          neutral: '#71717A',
        },
      },
      spacing: {
        // 4/8/12/16/24/32/48/64/96 — no other values (NUWS §7.5.4 / Appendix D)
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
      },
      borderRadius: {
        sm: '4px', // inputs, tags
        DEFAULT: '8px', // buttons, cards
        md: '12px', // panels, modals
        lg: '16px', // workspace shell
        full: '9999px', // pills, avatars
      },
    },
  },
  plugins: [],
};

export default config;
