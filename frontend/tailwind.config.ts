import type { Config } from 'tailwindcss'

/**
 * Tailwind v4 config — SLIM.
 *
 * Plan 33-06 moved colors to `@theme` in `frontend/src/index.css` (single source
 * of truth). Per RESEARCH Gotcha #2, duplicating color definitions here would
 * conflict with @theme — so this file no longer defines `extend.colors` or
 * `borderRadius` (the latter is derived from --radius via calc() and exposed
 * via @theme's --radius-*).
 *
 * What remains here:
 *   - content globs (v4 still scans JS/TSX)
 *   - darkMode strategy ('class')
 *   - breakpoints
 *   - container alignment
 *   - fontFamily + typography scale (density tokens)
 *   - keyframes + animation
 *   - RTL logical-property utilities
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        '3xs': 'var(--text-3xs)',
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        metric: 'var(--text-metric)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
      letterSpacing: {
        tighter: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
      },
    },
  },
  plugins: [
    // RTL direction helpers
    ({ addUtilities }: any) => {
      addUtilities({
        '.rtl': { direction: 'rtl' },
        '.ltr': { direction: 'ltr' },
      })
    },
    // Logical-property utilities for bilingual layout
    ({ addUtilities }: any) => {
      addUtilities({
        '.ms-auto': { 'margin-inline-start': 'auto' },
        '.me-auto': { 'margin-inline-end': 'auto' },
        '.ps-0': { 'padding-inline-start': '0' },
        '.pe-0': { 'padding-inline-end': '0' },
        '.ps-1': { 'padding-inline-start': '0.25rem' },
        '.pe-1': { 'padding-inline-end': '0.25rem' },
        '.ps-2': { 'padding-inline-start': '0.5rem' },
        '.pe-2': { 'padding-inline-end': '0.5rem' },
        '.ps-3': { 'padding-inline-start': '0.75rem' },
        '.pe-3': { 'padding-inline-end': '0.75rem' },
        '.ps-4': { 'padding-inline-start': '1rem' },
        '.pe-4': { 'padding-inline-end': '1rem' },
        '.ps-5': { 'padding-inline-start': '1.25rem' },
        '.pe-5': { 'padding-inline-end': '1.25rem' },
        '.ps-6': { 'padding-inline-start': '1.5rem' },
        '.pe-6': { 'padding-inline-end': '1.5rem' },
        '.ps-8': { 'padding-inline-start': '2rem' },
        '.pe-8': { 'padding-inline-end': '2rem' },
        '.ms-1': { 'margin-inline-start': '0.25rem' },
        '.me-1': { 'margin-inline-end': '0.25rem' },
        '.ms-2': { 'margin-inline-start': '0.5rem' },
        '.me-2': { 'margin-inline-end': '0.5rem' },
        '.ms-3': { 'margin-inline-start': '0.75rem' },
        '.me-3': { 'margin-inline-end': '0.75rem' },
        '.ms-4': { 'margin-inline-start': '1rem' },
        '.me-4': { 'margin-inline-end': '1rem' },
        '.ms-5': { 'margin-inline-start': '1.25rem' },
        '.me-5': { 'margin-inline-end': '1.25rem' },
        '.ms-6': { 'margin-inline-start': '1.5rem' },
        '.me-6': { 'margin-inline-end': '1.5rem' },
        '.ms-8': { 'margin-inline-start': '2rem' },
        '.me-8': { 'margin-inline-end': '2rem' },
        '.text-start': { 'text-align': 'start' },
        '.text-end': { 'text-align': 'end' },
        '.float-start': { float: 'inline-start' },
        '.float-end': { float: 'inline-end' },
        '.border-s': { 'border-inline-start-width': '1px' },
        '.border-e': { 'border-inline-end-width': '1px' },
        '.rounded-s': {
          'border-start-start-radius': 'var(--radius)',
          'border-end-start-radius': 'var(--radius)',
        },
        '.rounded-e': {
          'border-start-end-radius': 'var(--radius)',
          'border-end-end-radius': 'var(--radius)',
        },
      })
    },
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config
