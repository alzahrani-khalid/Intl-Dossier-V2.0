import { ThemeConfiguration } from './types';

export const blueSkyTheme: ThemeConfiguration = {
  name: 'blueSky',
  displayName: {
    en: 'Blue Sky',
    ar: 'السماء الزرقاء',
  },
  fonts: {
    sans: 'Inter, "Open Sans", system-ui, -apple-system, sans-serif',
    serif: 'Lexend, "Open Sans", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  radius: '1rem',
  cssVariables: {
    light: {
      background: '0 0% 100%',
      foreground: '210 0% 20%',

      primary: 'oklch(0.58 0.176 244.4)',
      primaryForeground: '255 70% 96%',

      secondary: 'oklch(0.712 0.106 228.857)',
      secondaryForeground: '223 9.6% 20%',

      accent: 'oklch(0.6576 0 0)',
      accentForeground: '204 70% 96%',

      destructive: '12 94% 33%',
      destructiveForeground: '210 20% 96%',

      muted: '217 16% 85%',
      mutedForeground: '223 10% 9%',

      border: '216 12.2% 92%',
      input: '216 12.2% 92%',
      ring: 'oklch(0.58 0.176 244.4)',

      card: '0 0% 100%',
      cardForeground: '210 7% 10%',

      popover: '0 0% 100%',
      popoverForeground: '210 7% 10%',

      sidebar: '0 0% 100%',
      sidebarForeground: '210 7% 10%',
      sidebarPrimary: '220 13% 9%',
      sidebarPrimaryForeground: '210 20% 98%',
      sidebarAccent: '210 16% 87%',
      sidebarAccentForeground: '222 47% 11%',
      sidebarBorder: '216 12% 84%',
      sidebarRing: '215 20% 65%',

      chart1: '198 93% 60%',
      chart2: '232 97% 83%',
      chart3: '158 64% 52%',
      chart4: '42 100% 65%',
      chart5: '15 100% 60%',

      shadow2xs: '0 1px 2px 0px rgb(15 23 42 / 0.12)',
      shadowXs: '0 2px 4px 0px rgb(15 23 42 / 0.14)',
      shadowSm: '0 4px 8px 0px #1d4ed81f',
      shadow: '0 10px 30px 0px #1d4ed81f',
      shadowMd: '0 10px 20px 0px #1d4ed81f',
      shadowLg: '0 20px 70px 0px #1d4ed81f',
      shadowXl: '0 25px 50px -12px rgb(15 23 42 / 0.35)',
      shadow2xl: '0 35px 100px -20px rgb(15 23 42 / 0.4)',
    },
    dark: {
      background: '210 20% 4%',
      foreground: '210 20% 98%',

      primary: 'oklch(0.527 0.187 241.966)',
      primaryForeground: '210 17% 95%',

      secondary: 'oklch(0.533 0.139 221.723)',
      secondaryForeground: '0 0% 100%',

      accent: 'oklch(0.533 0.139 221.723)',
      accentForeground: '0 0% 100%',

      destructive: '12 94% 33%',
      destructiveForeground: '210 20% 96%',

      muted: '215 27.9% 16.9%',
      mutedForeground: '216 12.2% 73%',

      border: '215 20% 65%',
      input: '212 3.7% 26.3%',
      ring: 'oklch(0.527 0.187 241.966)',

      card: '215 27.9% 16.9%',
      cardForeground: '0 0% 100%',

      popover: '215 27.9% 16.9%',
      popoverForeground: '0 0% 100%',

      sidebar: '217 33% 17%',
      sidebarForeground: '210 20% 98%',
      sidebarPrimary: '0 0% 100%',
      sidebarPrimaryForeground: '210 25% 8%',
      sidebarAccent: '217 19% 27%',
      sidebarAccentForeground: '210 20% 98%',
      sidebarBorder: '215 20% 65%',
      sidebarRing: '217 91% 60%',

      chart1: '198 93% 60%',
      chart2: '232 97% 83%',
      chart3: '158 64% 52%',
      chart4: '42 100% 65%',
      chart5: '15 100% 60%',

      shadow2xs: '0 1px 2px 0px rgb(15 23 42 / 0.2)',
      shadowXs: '0 2px 4px 0px rgb(15 23 42 / 0.25)',
      shadowSm: '0 4px 8px 0px #1d4ed81f',
      shadow: '0 10px 30px 0px #1d4ed81f',
      shadowMd: '0 10px 20px 0px #1d4ed81f',
      shadowLg: '0 20px 70px 0px #1d4ed81f',
      shadowXl: '0 25px 50px -12px rgb(15 23 42 / 0.35)',
      shadow2xl: '0 35px 100px -20px rgb(15 23 42 / 0.4)',
    },
  },
};
