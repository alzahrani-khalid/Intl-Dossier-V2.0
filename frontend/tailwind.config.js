/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base (Alabaster) - Neutral Gray Scale
        base: {
          50: 'hsl(var(--base-50))',
          100: 'hsl(var(--base-100))',
          200: 'hsl(var(--base-200))',
          300: 'hsl(var(--base-300))',
          400: 'hsl(var(--base-400))',
          500: 'hsl(var(--base-500))',
          600: 'hsl(var(--base-600))',
          700: 'hsl(var(--base-700))',
          800: 'hsl(var(--base-800))',
          900: 'hsl(var(--base-900))',
          950: 'hsl(var(--base-950))',
          1000: 'hsl(var(--base-1000))',
        },
        // Primary (Eucalyptus) - Green Scale
        primary: {
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
          950: 'hsl(var(--primary-950))',
          1000: 'hsl(var(--primary-1000))',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Semantic colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
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
        // Sidebar colors
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
        // Chart colors
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        // Display font for headings (Inter)
        display: ['var(--display-family)', 'system-ui', 'sans-serif'],
        // Text font for body (Inter for LTR)
        text: ['var(--text-family)', 'system-ui', 'sans-serif'],
        // Arabic font (Alexandria for RTL)
        arabic: ['var(--text-family-rtl)', 'system-ui', 'sans-serif'],
        // Default sans-serif
        sans: ['var(--text-family)', 'system-ui', 'sans-serif'],
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      // Touch target sizes (iOS/Android standards)
      spacing: {
        // Touch target minimum sizes
        'touch-sm': '44px', // WCAG AA minimum
        touch: '48px', // iOS/Android recommended
        'touch-lg': '56px', // Comfortable touch target
      },
      minWidth: {
        'touch-sm': '44px',
        touch: '48px',
        'touch-lg': '56px',
      },
      minHeight: {
        'touch-sm': '44px',
        touch: '48px',
        'touch-lg': '56px',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        'skeleton-pulse': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'skeleton-pulse': 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // RTL support via Tailwind's built-in logical properties
    function ({ addUtilities }) {
      addUtilities({
        '.dir-rtl': {
          direction: 'rtl',
        },
        '.dir-ltr': {
          direction: 'ltr',
        },
      })
    },
    // Touch target utilities for mobile accessibility
    function ({ addUtilities, addComponents, theme }) {
      // Base touch target utilities
      addUtilities({
        // Optimize touch handling (disables double-tap zoom)
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        // Touch target expansion class
        '.touch-target': {
          'min-height': '48px',
          'min-width': '48px',
        },
        '.touch-target-sm': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.touch-target-lg': {
          'min-height': '56px',
          'min-width': '56px',
        },
        // Touch-friendly spacing between interactive elements
        '.touch-gap': {
          gap: '12px', // Minimum 8px, comfortable 12px
        },
        '.touch-gap-tight': {
          gap: '8px',
        },
        '.touch-gap-comfortable': {
          gap: '16px',
        },
        // Ensure adequate padding for touch targets
        '.touch-padding': {
          padding: '12px',
        },
      })

      // Touch target component utilities
      addComponents({
        // Wrapper that ensures 48px touch target
        '.touch-area': {
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-height': '48px',
          'min-width': '48px',
          'touch-action': 'manipulation',
          position: 'relative',
        },
        // Touch-friendly button group with proper spacing
        '.touch-button-group': {
          display: 'flex',
          gap: '12px',
          '& > *': {
            'min-height': '48px',
            'min-width': '48px',
          },
        },
      })
    },
  ],
}
