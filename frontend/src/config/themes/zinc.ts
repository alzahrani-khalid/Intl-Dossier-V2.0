/**
 * Zinc Theme Configuration
 * shadcn/ui's most popular neutral theme with excellent contrast
 * Optimized for professional applications with full RTL support
 */

import type { ThemeConfig } from './gastat'

export const zincTheme: ThemeConfig = {
  name: 'zinc',
  displayName: 'Zinc',
  colors: {
    light: {
      // Primary colors - neutral zinc tones
      primary: '240 5.9% 10%',           // #18181B - Deep zinc
      primaryForeground: '0 0% 98%',     // #FAFAFA - Off white

      // Secondary colors
      secondary: '240 4.8% 95.9%',       // #F4F4F5 - Very light zinc
      secondaryForeground: '240 5.9% 10%', // #18181B - Deep zinc

      // Accent colors
      accent: '240 4.8% 95.9%',          // #F4F4F5 - Very light zinc
      accentForeground: '240 5.9% 10%',  // #18181B - Deep zinc

      // Muted colors for secondary content
      muted: '240 4.8% 95.9%',           // #F4F4F5 - Light zinc background
      mutedForeground: '240 3.8% 46.1%', // #71717A - Medium zinc

      // Base backgrounds and text
      background: '0 0% 100%',            // #FFFFFF - Pure white
      foreground: '240 10% 3.9%',        // #09090B - Almost black

      // Card surfaces
      card: '0 0% 100%',                  // #FFFFFF - White cards
      cardForeground: '240 10% 3.9%',    // #09090B - Dark text

      // Popover/dropdown surfaces
      popover: '0 0% 100%',               // #FFFFFF - White popovers
      popoverForeground: '240 10% 3.9%', // #09090B - Dark text

      // Borders and inputs
      border: '240 5.9% 90%',             // #E4E4E7 - Light zinc border
      input: '240 5.9% 90%',              // #E4E4E7 - Input borders
      ring: '240 5.9% 10%',               // #18181B - Focus ring

      // Semantic colors
      destructive: '0 84.2% 60.2%',      // #EF4444 - Red
      destructiveForeground: '0 0% 98%',
      success: '142 76% 36%',            // #16A34A - Green
      successForeground: '0 0% 98%',
      warning: '38 92% 50%',             // #F59E0B - Orange
      warningForeground: '240 10% 3.9%',
      info: '221 83% 53%',               // #3B82F6 - Blue
      infoForeground: '0 0% 98%',

      // Sidebar specific colors
      sidebar: '0 0% 98%',               // #FAFAFA - Off white sidebar
      sidebarForeground: '240 5.3% 26.1%',
      sidebarPrimary: '240 5.9% 10%',    // Deep zinc
      sidebarPrimaryForeground: '0 0% 98%',
      sidebarAccent: '240 4.8% 95.9%',   // Light zinc accent
      sidebarAccentForeground: '240 5.9% 10%',
      sidebarBorder: '240 5.9% 90%',     // Light zinc border
      sidebarRing: '240 5.9% 10%',       // Focus ring
    },
    dark: {
      // Primary colors for dark theme
      primary: '0 0% 98%',                // #FAFAFA - Off white
      primaryForeground: '240 5.9% 10%',  // #18181B - Deep zinc

      // Secondary colors for dark theme
      secondary: '240 3.7% 15.9%',        // #27272A - Dark zinc
      secondaryForeground: '0 0% 98%',    // #FAFAFA - Light text

      // Accent for dark theme
      accent: '240 3.7% 15.9%',           // #27272A - Dark zinc accent
      accentForeground: '0 0% 98%',       // Light text

      // Muted colors for secondary content
      muted: '240 3.7% 15.9%',            // #27272A - Muted dark
      mutedForeground: '240 5% 64.9%',    // #A1A1AA - Muted text

      // Dark theme backgrounds
      background: '240 10% 3.9%',         // #09090B - Very dark zinc
      foreground: '0 0% 98%',             // #FAFAFA - Light text

      // Card surfaces in dark mode
      card: '240 10% 3.9%',               // #09090B - Dark card
      cardForeground: '0 0% 98%',         // Light text

      // Popover surfaces in dark mode
      popover: '240 10% 3.9%',            // #09090B - Dark popover
      popoverForeground: '0 0% 98%',      // Light text

      // Borders and inputs for dark mode
      border: '240 3.7% 15.9%',           // #27272A - Dark border
      input: '240 3.7% 15.9%',            // #27272A - Dark input
      ring: '240 4.9% 83.9%',             // #D4D4D8 - Light zinc ring

      // Semantic colors (optimized for dark mode)
      destructive: '0 62.8% 30.6%',      // #991B1B - Dark red
      destructiveForeground: '0 0% 98%',
      success: '142 76% 36%',            // #16A34A - Green
      successForeground: '0 0% 98%',
      warning: '38 92% 50%',             // #F59E0B - Orange
      warningForeground: '240 10% 3.9%',
      info: '221 83% 53%',               // #3B82F6 - Blue
      infoForeground: '0 0% 98%',

      // Sidebar for dark mode
      sidebar: '240 5.9% 10%',            // #18181B - Dark sidebar
      sidebarForeground: '240 4.8% 95.9%',
      sidebarPrimary: '0 0% 98%',         // Off white
      sidebarPrimaryForeground: '240 5.9% 10%',
      sidebarAccent: '240 3.7% 15.9%',    // Dark zinc accent
      sidebarAccentForeground: '0 0% 98%',
      sidebarBorder: '240 3.7% 15.9%',    // Dark border
      sidebarRing: '240 4.9% 83.9%',      // Light zinc ring
    }
  },
  radius: {
    base: '0.5rem',      // 8px - shadcn default
    sm: '0.375rem',      // 6px - Small elements
    md: '0.5rem',        // 8px - Medium elements
    lg: '0.75rem',       // 12px - Large elements
    xl: '1rem',          // 16px - Extra large elements
    full: '9999px'       // Fully rounded (pills, avatars)
  },
  typography: {
    fonts: {
      // Professional font stack - using Geist as loaded in index.css
      sans: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'Geist Mono, Consolas, "Courier New", monospace'
    },
    sizes: {
      xs: '0.75rem',     // 12px - Smallest text
      sm: '0.875rem',    // 14px - Small text
      base: '1rem',      // 16px - Base font size
      lg: '1.125rem',    // 18px - Large body text
      xl: '1.25rem',     // 20px - Subheadings
      '2xl': '1.5rem',   // 24px - Section headers
      '3xl': '1.875rem', // 30px - Page titles
      '4xl': '2.25rem',  // 36px - Hero text
      '5xl': '3rem'      // 48px - Display text
    },
    weights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',      // Regular text
      medium: '500',      // Slightly emphasized
      semibold: '600',    // Emphasized elements
      bold: '700',        // Headlines and buttons
      extrabold: '800',   // Strong emphasis
      black: '900'        // Maximum weight
    }
  },
  shadows: {
    // Subtle, professional shadows
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
    fast: '150ms',       // Quick feedback
    base: '200ms',       // Standard transition
    slow: '300ms',       // Smooth animations
    slower: '500ms'      // Complex transitions
  }
}
