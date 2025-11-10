export interface ThemeVariables {
  // Colors
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  
  // Component-specific
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Sidebar
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  
  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  
  // Shadows
  shadow2xs: string;
  shadowXs: string;
  shadowSm: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadow2xl: string;
}

export interface ThemeConfiguration {
  name: 'gastat' | 'natural' | 'zinc';
  displayName: {
    en: string;
    ar: string;
  };
  cssVariables: {
    light: ThemeVariables;
    dark: ThemeVariables;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  radius: string;
}

export interface LanguageConfiguration {
  code: 'en' | 'ar';
  name: {
    en: string;
    ar: string;
  };
  direction: 'ltr' | 'rtl';
  locale: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
  calendar: 'gregorian' | 'hijri';
}

export interface UserPreference {
  id: string;
  userId: string;
  theme: 'gastat' | 'natural' | 'zinc';
  colorMode: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceUpdate {
  theme?: 'gastat' | 'natural' | 'zinc';
  colorMode?: 'light' | 'dark' | 'system';
  language?: 'en' | 'ar';
}