import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// GASTAT Brand Colors
const GASTATColors = {
  primary: '#1B4965', // GASTAT Dark Blue
  primaryContainer: '#CAE9FF',
  secondary: '#62B6CB', // GASTAT Light Blue
  secondaryContainer: '#C1E7F4',
  tertiary: '#5FA8D3', // GASTAT Medium Blue
  tertiaryContainer: '#D4E9F7',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  background: '#FDFCFF',
  surface: '#FDFCFF',
  surfaceVariant: '#E1E2EC',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#001D35',
  onSecondary: '#00344C',
  onSecondaryContainer: '#001E2B',
  onTertiary: '#00344D',
  onTertiaryContainer: '#001E2C',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',
  onBackground: '#1A1C1E',
  onSurface: '#1A1C1E',
  onSurfaceVariant: '#44474F',
  outline: '#74777F',
  outlineVariant: '#C4C6CF',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#91CEF4',
  elevation: {
    level0: 'transparent',
    level1: '#F5F8FA',
    level2: '#EFF3F7',
    level3: '#E9EFF4',
    level4: '#E7EDF3',
    level5: '#E3EBF1',
  },
};

const GASTATDarkColors = {
  primary: '#91CEF4',
  primaryContainer: '#004A77',
  secondary: '#B3CAD5',
  secondaryContainer: '#1E4354',
  tertiary: '#BCC7DC',
  tertiaryContainer: '#314559',
  error: '#FFB4AB',
  errorContainer: '#93000A',
  background: '#1A1C1E',
  surface: '#1A1C1E',
  surfaceVariant: '#44474F',
  onPrimary: '#003548',
  onPrimaryContainer: '#CAE9FF',
  onSecondary: '#1E3442',
  onSecondaryContainer: '#C1E7F4',
  onTertiary: '#2B3F4C',
  onTertiaryContainer: '#D4E9F7',
  onError: '#690005',
  onErrorContainer: '#FFDAD6',
  onBackground: '#E2E2E5',
  onSurface: '#E2E2E5',
  onSurfaceVariant: '#C4C6CF',
  outline: '#8E9099',
  outlineVariant: '#44474F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E2E2E5',
  inverseOnSurface: '#1A1C1E',
  inversePrimary: '#1B4965',
  elevation: {
    level0: 'transparent',
    level1: '#222527',
    level2: '#272A2D',
    level3: '#2D3032',
    level4: '#2E3133',
    level5: '#323538',
  },
};

// Custom fonts configuration (optional)
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: GASTATColors,
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: GASTATDarkColors,
  fonts: configureFonts({ config: fontConfig }),
};

export const theme = lightTheme;
