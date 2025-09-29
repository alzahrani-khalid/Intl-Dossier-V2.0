import { ThemeConfiguration } from './types';

export const gastatTheme: ThemeConfiguration = {
  name: 'gastat',
  displayName: {
    en: 'GASTAT',
    ar: 'الهيئة العامة للإحصاء',
  },
  fonts: {
    sans: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    serif: 'Source Serif 4, Georgia, serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  radius: '0.5rem',
  cssVariables: {
    light: {
      // Core colors
      background: '240 9.0909% 97.8431%',
      foreground: '0 0% 20%',
      
      // Primary - GASTAT Green
      primary: '139.6552 52.7273% 43.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - sky blue
      secondary: '218.5401 79.1908% 66.0784%',
      secondaryForeground: '0 0% 100%',
      
      // Accent
      accent: '189.635 81.0651% 66.8627%',
      accentForeground: '0 0% 20%',
      
      // Destructive
      destructive: '0 84.2365% 60.1961%',
      destructiveForeground: '0 0% 100%',
      
      // Muted
      muted: '50.4 26.8817% 81.7647%',
      mutedForeground: '0 0% 43.1373%',
      
      // Borders and inputs
      border: '0 0% 83.1373%',
      input: '0 0% 83.1373%',
      ring: '139.6552 52.7273% 43.1373%',
      
      // Card
      card: '0 0% 100%',
      cardForeground: '0 0% 20%',
      
      // Popover
      popover: '0 0% 100%',
      popoverForeground: '0 0% 20%',
      
      // Sidebar
      sidebar: '240 9.0909% 97.8431%',
      sidebarForeground: '0 0% 20%',
      sidebarPrimary: '139.6552 52.7273% 43.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '189.635 81.0651% 66.8627%',
      sidebarAccentForeground: '0 0% 20%',
      sidebarBorder: '0 0% 83.1373%',
      sidebarRing: '139.6552 52.7273% 43.1373%',
      
      // Charts
      chart1: '139.6552 52.7273% 43.1373%',
      chart2: '218.5401 79.1908% 66.0784%',
      chart3: '189.635 81.0651% 66.8627%',
      chart4: '207.2727 44% 49.0196%',
      chart5: '138.871 70.4545% 34.5098%',
      
      // Shadows (GASTAT green tinted)
      shadow2xs: '0deg 0% 0%',
      shadowXs: '0deg 0% 0%',
      shadowSm: '0deg 0% 0%',
      shadow: '0deg 0% 0%',
      shadowMd: '0deg 0% 0%',
      shadowLg: '0deg 0% 0%',
      shadowXl: '0deg 0% 0%',
      shadow2xl: '0deg 0% 0%',
    },
    dark: {
      // Core colors
      background: '220 14.7541% 11.9608%',
      foreground: '0 0% 89.8039%',
      
      // Primary - GASTAT Green (adjusted for dark)
      primary: '139.6552 52.7273% 43.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - Dark variant
      secondary: '220.1351 59.2% 49.0196%',
      secondaryForeground: '0 0% 89.8039%',
      
      // Accent
      accent: '243.75 26.087% 36.0784%',
      accentForeground: '0 0% 89.8039%',
      
      // Destructive
      destructive: '0 84.2365% 60.1961%',
      destructiveForeground: '0 0% 100%',
      
      // Muted
      muted: '0 0% 26.6667%',
      mutedForeground: '0 0% 63.9216%',
      
      // Borders and inputs
      border: '0 0% 26.6667%',
      input: '0 0% 26.6667%',
      ring: '139.6552 52.7273% 43.1373%',
      
      // Card
      card: '197.1429 6.9307% 19.8039%',
      cardForeground: '0 0% 89.8039%',
      
      // Popover
      popover: '197.1429 6.9307% 19.8039%',
      popoverForeground: '0 0% 89.8039%',
      
      // Sidebar
      sidebar: '220 14.7541% 11.9608%',
      sidebarForeground: '0 0% 89.8039%',
      sidebarPrimary: '139.6552 52.7273% 43.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '218.5401 79.1908% 66.0784%',
      sidebarAccentForeground: '0 0% 89.8039%',
      sidebarBorder: '0 0% 26.6667%',
      sidebarRing: '139.6552 52.7273% 43.1373%',
      
      // Charts (adjusted for dark mode)
      chart1: '139.6552 52.7273% 43.1373%',
      chart2: '207.2727 44% 49.0196%',
      chart3: '218.5401 79.1908% 66.0784%',
      chart4: '189.635 81.0651% 66.8627%',
      chart5: '138.871 70.4545% 34.5098%',
      
      // Shadows (subtle in dark mode)
      shadow2xs: '0deg 0% 0%',
      shadowXs: '0deg 0% 0%',
      shadowSm: '0deg 0% 0%',
      shadow: '0deg 0% 0%',
      shadowMd: '0deg 0% 0%',
      shadowLg: '0deg 0% 0%',
      shadowXl: '0deg 0% 0%',
      shadow2xl: '0deg 0% 0%',
    },
  },
};
