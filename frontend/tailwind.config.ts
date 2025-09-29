import type { Config } from 'tailwindcss';
import rtl from 'tailwindcss-rtl';

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
      sm: '768px',
      md: '1024px',
      lg: '1440px',
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
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
      boxShadow: {
        '2xs': '0 0 0 1px hsl(var(--shadow-2xs) / 0.05)',
        xs: '0 1px 2px 0 hsl(var(--shadow-xs) / 0.05)',
        sm: '0 1px 3px 0 hsl(var(--shadow-sm) / 0.1), 0 1px 2px 0 hsl(var(--shadow-sm) / 0.06)',
        DEFAULT: '0 4px 6px -1px hsl(var(--shadow) / 0.1), 0 2px 4px -1px hsl(var(--shadow) / 0.06)',
        md: '0 10px 15px -3px hsl(var(--shadow-md) / 0.1), 0 4px 6px -2px hsl(var(--shadow-md) / 0.05)',
        lg: '0 20px 25px -5px hsl(var(--shadow-lg) / 0.1), 0 10px 10px -5px hsl(var(--shadow-lg) / 0.04)',
        xl: '0 25px 50px -12px hsl(var(--shadow-xl) / 0.25)',
        '2xl': '0 35px 60px -15px hsl(var(--shadow-2xl) / 0.3)',
      },
    },
  },
  plugins: [
    rtl,
    // RTL support plugin
    ({ addUtilities }: any) => {
      addUtilities({
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
      });
    },
    // Logical properties utilities
    ({ addUtilities }: any) => {
      const logicalUtilities = {
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
      };
      addUtilities(logicalUtilities);
    },
  ],
  // Enable RTL support
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
