import { ThemeConfiguration } from './types';

export const gastatTheme: ThemeConfiguration = {
  name: 'gastat',
  displayName: {
    en: 'GASTAT',
    ar: 'الهيئة العامة للإحصاء',
  },
  fonts: {
    sans: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    serif: 'Merriweather, Georgia, serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  radius: '0.5rem',
  cssVariables: {
    light: {
      // Core colors
      background: '0 0% 100%',
      foreground: '222.2 47.4% 11.2%',
      
      // Primary - GASTAT Green
      primary: '139.6552 52.7273% 43.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - GASTAT Light Green
      secondary: '139.2941 22.3404% 78.6275%',
      secondaryForeground: '222.2 47.4% 11.2%',
      
      // Accent
      accent: '139.2941 22.3404% 90%',
      accentForeground: '222.2 47.4% 11.2%',
      
      // Destructive
      destructive: '0 72.22% 50.59%',
      destructiveForeground: '0 0% 98%',
      
      // Muted
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      
      // Borders and inputs
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '139.6552 52.7273% 43.1373%',
      
      // Card
      card: '0 0% 100%',
      cardForeground: '222.2 47.4% 11.2%',
      
      // Popover
      popover: '0 0% 100%',
      popoverForeground: '222.2 47.4% 11.2%',
      
      // Sidebar
      sidebar: '220.0000 13.0435% 95.0980%',
      sidebarForeground: '220.0000 3.4483% 53.3333%',
      sidebarPrimary: '139.6552 52.7273% 43.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '220.0000 13.0435% 91.1765%',
      sidebarAccentForeground: '220.9091 39.3939% 11.1765%',
      sidebarBorder: '220 13% 91%',
      sidebarRing: '139.6552 52.7273% 43.1373%',
      
      // Charts
      chart1: '173.5385 61.1940% 44.1176%',
      chart2: '139.6552 52.7273% 43.1373%',
      chart3: '48.2609 71.7391% 61.3725%',
      chart4: '36.5217 50% 66.6667%',
      chart5: '27.7895 59.5238% 59.2157%',
      
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
      background: '220.0000 14.7541% 11.9608%',
      foreground: '0 0% 95%',
      
      // Primary - GASTAT Green (adjusted for dark)
      primary: '139.6552 52.7273% 43.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - Dark variant
      secondary: '220.0000 13.0435% 20%',
      secondaryForeground: '0 0% 98%',
      
      // Accent
      accent: '139.2941 22.3404% 25%',
      accentForeground: '0 0% 98%',
      
      // Destructive
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 85.7% 97.3%',
      
      // Muted
      muted: '220 14.3% 25%',
      mutedForeground: '220 13% 65%',
      
      // Borders and inputs
      border: '220 13% 25%',
      input: '220 13% 25%',
      ring: '139.6552 52.7273% 43.1373%',
      
      // Card
      card: '220.0000 14.7541% 13.9608%',
      cardForeground: '0 0% 95%',
      
      // Popover
      popover: '220.0000 14.7541% 13.9608%',
      popoverForeground: '0 0% 95%',
      
      // Sidebar
      sidebar: '220.0000 14.7541% 8.9608%',
      sidebarForeground: '240 4.8% 65.9%',
      sidebarPrimary: '139.6552 52.7273% 43.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '220.0000 14.7541% 15.9608%',
      sidebarAccentForeground: '240 4.8% 85.9%',
      sidebarBorder: '220 13% 20%',
      sidebarRing: '139.6552 52.7273% 43.1373%',
      
      // Charts (adjusted for dark mode)
      chart1: '173.5385 61.1940% 54.1176%',
      chart2: '139.6552 52.7273% 53.1373%',
      chart3: '48.2609 71.7391% 71.3725%',
      chart4: '36.5217 50% 76.6667%',
      chart5: '27.7895 59.5238% 69.2157%',
      
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