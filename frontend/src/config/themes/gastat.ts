/**
 * GASTAT Theme Configuration
 * Official GASTAT brand colors and design tokens
 */

export const gastatTheme = {
  name: 'gastat',
  displayName: 'GASTAT',
  colors: {
    light: {
      // Primary colors (official share link palette)
      primary: '#34A85A', // Deep emerald
      primaryForeground: '#FFFFFF',

      // Secondary colors
      secondary: '#6495ED', // Soft sky blue
      secondaryForeground: '#FFFFFF',

      // Accent colors
      accent: '#66D9EF', // Vibrant aqua accent
      accentForeground: '#333333',

      // Muted neutrals
      muted: '#DDD9C4',
      mutedForeground: '#6E6E6E',

      // Background surfaces
      background: '#F9F9FA',
      foreground: '#333333',

      // Cards & popovers
      card: '#FFFFFF',
      cardForeground: '#333333',
      popover: '#FFFFFF',
      popoverForeground: '#333333',

      // Borders & inputs
      border: '#D4D4D4',
      input: '#D4D4D4',
      ring: '#34A85A',

      // Status colors
      destructive: '#EF4444',
      destructiveForeground: '#FFFFFF',
      success: '#1A9641',
      successForeground: '#FFFFFF',
      warning: '#F5A623',
      warningForeground: '#333333',
      info: '#6495ED',
      infoForeground: '#FFFFFF',

      // Sidebar
      sidebar: '#F9F9FA',
      sidebarForeground: '#333333',
      sidebarPrimary: '#34A85A',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#66D9EF',
      sidebarAccentForeground: '#333333',
      sidebarBorder: '#D4D4D4',
      sidebarRing: '#34A85A',
    },
    dark: {
      // Primary colors
      primary: '#34A85A',
      primaryForeground: '#FFFFFF',

      // Secondary colors
      secondary: '#3364C7',
      secondaryForeground: '#E5E5E5',

      // Accent colors
      accent: '#474474',
      accentForeground: '#E5E5E5',

      // Muted neutrals
      muted: '#444444',
      mutedForeground: '#A3A3A3',

      // Background surfaces
      background: '#1A1D23',
      foreground: '#E5E5E5',

      // Cards & popovers
      card: '#2F3436',
      cardForeground: '#E5E5E5',
      popover: '#2F3436',
      popoverForeground: '#E5E5E5',

      // Border & input
      border: '#444444',
      input: '#444444',
      ring: '#34A85A',

      // Status colors
      destructive: '#EF4444',
      destructiveForeground: '#FFFFFF',
      success: '#34A85A',
      successForeground: '#0A0F12',
      warning: '#F5A623',
      warningForeground: '#0A0F12',
      info: '#6495ED',
      infoForeground: '#0A0F12',

      // Sidebar
      sidebar: '#1A1D23',
      sidebarForeground: '#E5E5E5',
      sidebarPrimary: '#34A85A',
      sidebarPrimaryForeground: '#FFFFFF',
      sidebarAccent: '#6495ED',
      sidebarAccentForeground: '#E5E5E5',
      sidebarBorder: '#444444',
      sidebarRing: '#34A85A',
    }
  },
  radius: {
    base: '0.375rem', // 6px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px'
  },
  typography: {
    fonts: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'Consolas, "Courier New", monospace'
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    weights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },
  transitions: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms'
  }
}

export type ThemeConfig = typeof gastatTheme
