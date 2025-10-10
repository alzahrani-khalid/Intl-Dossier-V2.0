/**
 * Blue Sky Theme Configuration
 * Twitter/X-inspired modern design system
 * Based on Twitter's official design tokens from tweakcn
 */

import type { ThemeConfig } from './gastat'

export const blueSkyTheme: ThemeConfig = {
  name: 'blue-sky',
  displayName: 'Blue Sky',
  colors: {
    light: {
      // Twitter Blue primary brand color
      primary: '205 98% 53%',          // #1D9BF0 - Twitter Blue
      primaryForeground: '0 0% 100%',  // White text on primary

      // Secondary colors for subtle actions
      secondary: '204 14% 93%',        // #E7ECEF - Light gray with better contrast
      secondaryForeground: '204 39% 7%', // #0F1419 - Almost black

      // Accent for hover states and highlights
      accent: '205 82% 91%',           // #D4E5F9 - Blue tinted accent
      accentForeground: '204 39% 7%',  // #0F1419 - Dark text

      // Muted colors for secondary content
      muted: '204 14% 93%',            // #E7ECEF - Light gray background
      mutedForeground: '207 8% 32%',   // #4B5563 - Darker gray for better contrast

      // Base backgrounds and text
      background: '0 0% 100%',          // #FFFFFF - Pure white
      foreground: '204 39% 7%',        // #0F1419 - Twitter black

      // Card surfaces
      card: '0 0% 100%',                // #FFFFFF - White cards
      cardForeground: '204 39% 7%',    // #0F1419 - Dark text

      // Popover/dropdown surfaces
      popover: '0 0% 100%',             // #FFFFFF - White popovers
      popoverForeground: '204 39% 7%', // #0F1419 - Dark text

      // Borders and inputs
      border: '204 16% 87%',            // #CFD9DE - Twitter border
      input: '204 16% 87%',             // #CFD9DE - Input borders
      ring: '205 98% 53%',              // #1D9BF0 - Focus ring

      // Semantic colors
      destructive: '353 88% 58%',      // #F4212E - Twitter red
      destructiveForeground: '0 0% 100%',
      success: '146 72% 38%',          // #00BA7C - Twitter green
      successForeground: '0 0% 100%',
      warning: '37 100% 51%',          // #FFD400 - Twitter yellow
      warningForeground: '204 39% 7%',
      info: '205 98% 53%',             // #1D9BF0 - Twitter blue
      infoForeground: '0 0% 100%',

      // Sidebar specific colors
      sidebar: '0 0% 100%',            // White sidebar
      sidebarForeground: '204 39% 7%',
      sidebarPrimary: '205 98% 53%',   // Twitter blue
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '205 82% 91%',    // Blue tinted accent
      sidebarAccentForeground: '204 39% 7%',
      sidebarBorder: '204 16% 87%',    // Twitter border
      sidebarRing: '205 98% 53%',      // Focus ring
    },
    dark: {
      // Twitter Blue adapted for dark mode
      primary: '205 92% 62%',          // #1D9BF0 brightened for dark
      primaryForeground: '0 0% 100%',  // White text

      // Secondary colors for dark theme
      secondary: '207 13% 16%',        // #1E2732 - Dark secondary
      secondaryForeground: '204 5% 97%', // #F7F9F9 - Light text

      // Accent for dark theme
      accent: '208 18% 19%',           // #263340 - Dark accent
      accentForeground: '204 5% 97%',  // Light text

      // Muted colors for secondary content
      muted: '208 18% 19%',            // #263340 - Muted dark
      mutedForeground: '206 5% 69%',   // #8B98A5 - Muted text

      // Dark theme backgrounds
      background: '209 33% 12%',       // #15202B - Twitter dark bg
      foreground: '204 5% 97%',        // #F7F9F9 - Light text

      // Card surfaces in dark mode
      card: '207 13% 16%',             // #1E2732 - Elevated surface
      cardForeground: '204 5% 97%',    // Light text

      // Popover surfaces in dark mode
      popover: '207 13% 16%',          // #1E2732 - Dark popover
      popoverForeground: '204 5% 97%', // Light text

      // Borders and inputs for dark mode
      border: '207 13% 28%',           // #38444D - Dark border
      input: '207 13% 28%',            // #38444D - Dark input
      ring: '205 92% 62%',             // Twitter blue for focus

      // Semantic colors (brightened for dark mode)
      destructive: '353 88% 58%',      // #F4212E - Twitter red
      destructiveForeground: '0 0% 100%',
      success: '146 72% 45%',          // #00BA7C brightened
      successForeground: '0 0% 100%',
      warning: '37 100% 51%',          // #FFD400 - Yellow
      warningForeground: '209 33% 12%',
      info: '205 92% 62%',             // Twitter blue brightened
      infoForeground: '0 0% 100%',

      // Sidebar for dark mode
      sidebar: '209 33% 12%',          // Dark sidebar
      sidebarForeground: '204 5% 97%',
      sidebarPrimary: '205 92% 62%',   // Twitter blue
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '208 18% 19%',    // Dark accent
      sidebarAccentForeground: '204 5% 97%',
      sidebarBorder: '207 13% 28%',    // Dark border
      sidebarRing: '205 92% 62%',      // Focus ring
    }
  },
  radius: {
    base: '1rem',        // 16px - Twitter's standard border radius
    sm: '0.5rem',        // 8px - Small elements
    md: '0.75rem',       // 12px - Medium elements
    lg: '1rem',          // 16px - Large elements
    xl: '1.25rem',       // 20px - Extra large elements
    full: '9999px'       // Fully rounded (pills, avatars)
  },
  typography: {
    fonts: {
      // Standardized font stack
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'Consolas, "Courier New", monospace'
    },
    sizes: {
      xs: '0.75rem',     // 12px - Smallest text
      sm: '0.8125rem',   // 13px - Small annotations
      base: '0.9375rem', // 15px - Twitter's base font size
      lg: '1.0625rem',   // 17px - Large body text
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
    // Twitter-inspired subtle shadows
    sm: 'rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px',
    base: 'rgba(101, 119, 134, 0.2) 0px 1px 8px, rgba(101, 119, 134, 0.25) 0px 0px 1px',
    md: 'rgba(101, 119, 134, 0.2) 0px 2px 12px, rgba(101, 119, 134, 0.25) 0px 0px 2px',
    lg: 'rgba(101, 119, 134, 0.2) 0px 4px 20px, rgba(101, 119, 134, 0.15) 0px 1px 3px',
    xl: 'rgba(101, 119, 134, 0.2) 0px 8px 28px, rgba(101, 119, 134, 0.15) 0px 2px 4px',
    '2xl': 'rgba(101, 119, 134, 0.25) 0px 12px 40px, rgba(101, 119, 134, 0.15) 0px 3px 6px',
    inner: 'inset 0 2px 4px 0 rgba(101, 119, 134, 0.06)',
    none: 'none'
  },
  transitions: {
    fast: '100ms',       // Instant feedback
    base: '200ms',       // Twitter's standard transition
    slow: '300ms',       // Smooth animations
    slower: '500ms'      // Complex transitions
  }
}
