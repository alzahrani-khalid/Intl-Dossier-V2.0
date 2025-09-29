import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { gastatTheme } from '../../config/themes/gastat';
import { blueSkyTheme } from '../../config/themes/blue-sky';
import type { ThemeConfig } from '../../config/themes/gastat';
import { processColorForCSS } from '../../utils/color-converter';

type Theme = 'gastat' | 'blue-sky';
type ColorMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorMode: ColorMode;
  setTheme: (theme: Theme) => void;
  setColorMode: (mode: ColorMode) => void;
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themes: Record<Theme, ThemeConfig> = {
  'gastat': gastatTheme,
  'blue-sky': blueSkyTheme,
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialColorMode?: ColorMode;
  initialLanguage?: string;
}

export function ThemeProvider({
  children,
  initialTheme = 'gastat',
  initialColorMode = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(initialColorMode);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user-preferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        if (prefs.theme && themes[prefs.theme]) {
          setThemeState(prefs.theme);
        }
        if (prefs.colorMode && (prefs.colorMode === 'light' || prefs.colorMode === 'dark')) {
          setColorModeState(prefs.colorMode);
        }
      } catch (e) {
        // Silently ignore parse errors
      }
    } else {
      // Check system preference for color mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorModeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const config = themes[theme];
    const colors = config.colors[colorMode];
    const root = document.documentElement;

    // Set data attributes for CSS
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-mode', colorMode);

    // Apply CSS variables with color conversion
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      // Convert HEX colors to HSL for CSS variables
      const cssValue = processColorForCSS(value as string);
      root.style.setProperty(cssVarName, cssValue);
    });

    // Apply radius variables
    Object.entries(config.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply font variables
    root.style.setProperty('--font-sans', config.typography.fonts.sans);
    if (config.typography.fonts.serif) {
      root.style.setProperty('--font-serif', config.typography.fonts.serif);
    }
    root.style.setProperty('--font-mono', config.typography.fonts.mono);

    // Apply shadow variables
    Object.entries(config.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, [theme, colorMode]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (!themes[newTheme]) {
      console.error(`Invalid theme: ${newTheme}`);
      return;
    }

    setThemeState(newTheme);

    // Save to localStorage
    const stored = localStorage.getItem('user-preferences');
    let prefs = { theme: newTheme, colorMode, language: 'en', updatedAt: new Date().toISOString() };
    if (stored) {
      try {
        const existing = JSON.parse(stored);
        prefs = { ...existing, theme: newTheme, updatedAt: new Date().toISOString() };
      } catch (e) {
        // Use defaults
      }
    }
    localStorage.setItem('user-preferences', JSON.stringify(prefs));

    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme: newTheme, colorMode }
    }));

    // Dispatch for cross-tab sync
    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: { theme: newTheme }
    }));
  }, [colorMode]);

  const setColorMode = useCallback((newMode: ColorMode) => {
    setColorModeState(newMode);

    // Save to localStorage
    const stored = localStorage.getItem('user-preferences');
    let prefs = { theme, colorMode: newMode, language: 'en', updatedAt: new Date().toISOString() };
    if (stored) {
      try {
        const existing = JSON.parse(stored);
        prefs = { ...existing, colorMode: newMode, updatedAt: new Date().toISOString() };
      } catch (e) {
        // Use defaults
      }
    }
    localStorage.setItem('user-preferences', JSON.stringify(prefs));

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme, colorMode: newMode }
    }));

    // Dispatch for cross-tab sync
    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: { colorMode: newMode }
    }));
  }, [theme]);

  // Listen for theme changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user-preferences' && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue);
          if (prefs.theme && themes[prefs.theme]) {
            setThemeState(prefs.theme);
          }
          if (prefs.colorMode && (prefs.colorMode === 'light' || prefs.colorMode === 'dark')) {
            setColorModeState(prefs.colorMode);
          }
        } catch (err) {
          console.warn('Failed to parse preference update:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: ThemeContextValue = {
    theme,
    colorMode,
    setTheme,
    setColorMode,
    currentThemeConfig: themes[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      <div data-testid="theme-provider">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
