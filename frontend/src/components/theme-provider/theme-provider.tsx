import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'gastat' | 'blueSky';
export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  colorMode: ColorMode;
  resolvedColorMode: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorMode?: ColorMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'gastat',
  defaultColorMode = 'system',
  storageKey = 'theme-preference',
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.theme || defaultTheme;
      }
    } catch {}
    
    return defaultTheme;
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return defaultColorMode;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.colorMode || defaultColorMode;
      }
    } catch {}
    
    // If no stored preference, use system preference
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const resolvedColorMode = colorMode === 'system' 
    ? (systemPrefersDark ? 'dark' : 'light')
    : colorMode;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('theme-gastat', 'theme-blueSky');
    root.classList.add(`theme-${theme}`);
    
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedColorMode);
    
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-mode', resolvedColorMode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const bgColor = resolvedColorMode === 'dark' ? '#1a1a1a' : '#ffffff';
      metaThemeColor.setAttribute('content', bgColor);
    }
  }, [theme, resolvedColorMode]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    try {
      const stored = localStorage.getItem(storageKey);
      const current = stored ? JSON.parse(stored) : {};
      localStorage.setItem(storageKey, JSON.stringify({
        ...current,
        theme: newTheme,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, [storageKey]);

  const setColorMode = useCallback((newMode: ColorMode) => {
    setColorModeState(newMode);
    
    try {
      const stored = localStorage.getItem(storageKey);
      const current = stored ? JSON.parse(stored) : {};
      localStorage.setItem(storageKey, JSON.stringify({
        ...current,
        colorMode: newMode,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save color mode preference:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key !== storageKey || !e.newValue) return;
      
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.theme && parsed.theme !== theme) {
          setThemeState(parsed.theme);
        }
        if (parsed.colorMode && parsed.colorMode !== colorMode) {
          setColorModeState(parsed.colorMode);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, theme, colorMode]);

  return (
    <ThemeContext.Provider 
      value={{
        theme,
        colorMode,
        resolvedColorMode,
        setTheme,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}