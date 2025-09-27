import { ThemeConfiguration } from './types';

export const blueSkyTheme: ThemeConfiguration = {
  name: 'blueSky',
  displayName: {
    en: 'Blue Sky',
    ar: 'السماء الزرقاء',
  },
  fonts: {
    sans: 'Open Sans, system-ui, -apple-system, sans-serif',
    serif: 'Lora, Georgia, serif',
    mono: 'Fira Code, Consolas, monospace',
  },
  radius: '0.75rem',
  cssVariables: {
    light: {
      // Core colors
      background: '0 0% 100%',
      foreground: '222.2 47.4% 11.2%',
      
      // Primary - Sky Blue
      primary: '203.8863 88.2845% 53.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - Light Sky Blue
      secondary: '203.4783 29.3478% 85.4902%',
      secondaryForeground: '222.2 47.4% 11.2%',
      
      // Accent
      accent: '203.4783 29.3478% 95%',
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
      ring: '203.8863 88.2845% 53.1373%',
      
      // Card
      card: '0 0% 100%',
      cardForeground: '222.2 47.4% 11.2%',
      
      // Popover
      popover: '0 0% 100%',
      popoverForeground: '222.2 47.4% 11.2%',
      
      // Sidebar
      sidebar: '220.0000 13.0435% 95.0980%',
      sidebarForeground: '220.0000 3.4483% 53.3333%',
      sidebarPrimary: '203.8863 88.2845% 53.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '220.0000 13.0435% 91.1765%',
      sidebarAccentForeground: '220.9091 39.3939% 11.1765%',
      sidebarBorder: '220 13% 91%',
      sidebarRing: '203.8863 88.2845% 53.1373%',
      
      // Charts - Blue palette
      chart1: '221.1268 82.6667% 60.3922%',
      chart2: '203.8863 88.2845% 53.1373%',
      chart3: '187.0588 95.1807% 41.7647%',
      chart4: '174.5455 77.6119% 45.6863%',
      chart5: '197.6471 70.7317% 72.5490%',
      
      // Shadows (blue tinted)
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
      // Core colors - Pure black background for Blue Sky
      background: '0 0% 0%',
      foreground: '0 0% 95%',
      
      // Primary - Sky Blue (adjusted for pure black)
      primary: '203.8863 88.2845% 53.1373%',
      primaryForeground: '0 0% 100%',
      
      // Secondary - Dark blue variant
      secondary: '220.0000 20% 15%',
      secondaryForeground: '0 0% 98%',
      
      // Accent
      accent: '203.4783 29.3478% 20%',
      accentForeground: '0 0% 98%',
      
      // Destructive
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 85.7% 97.3%',
      
      // Muted
      muted: '220 14.3% 15%',
      mutedForeground: '220 13% 65%',
      
      // Borders and inputs
      border: '220 13% 18%',
      input: '220 13% 18%',
      ring: '203.8863 88.2845% 53.1373%',
      
      // Card
      card: '0 0% 3%',
      cardForeground: '0 0% 95%',
      
      // Popover
      popover: '0 0% 3%',
      popoverForeground: '0 0% 95%',
      
      // Sidebar
      sidebar: '0 0% 2%',
      sidebarForeground: '240 4.8% 65.9%',
      sidebarPrimary: '203.8863 88.2845% 53.1373%',
      sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '0 0% 8%',
      sidebarAccentForeground: '240 4.8% 85.9%',
      sidebarBorder: '220 13% 12%',
      sidebarRing: '203.8863 88.2845% 53.1373%',
      
      // Charts (bright for pure black background)
      chart1: '221.1268 82.6667% 70.3922%',
      chart2: '203.8863 88.2845% 63.1373%',
      chart3: '187.0588 95.1807% 51.7647%',
      chart4: '174.5455 77.6119% 55.6863%',
      chart5: '197.6471 70.7317% 82.5490%',
      
      // Shadows (very subtle on pure black)
      shadow2xs: '0deg 0% 100%',
      shadowXs: '0deg 0% 100%',
      shadowSm: '0deg 0% 100%',
      shadow: '0deg 0% 100%',
      shadowMd: '0deg 0% 100%',
      shadowLg: '0deg 0% 100%',
      shadowXl: '0deg 0% 100%',
      shadow2xl: '0deg 0% 100%',
    },
  },
};