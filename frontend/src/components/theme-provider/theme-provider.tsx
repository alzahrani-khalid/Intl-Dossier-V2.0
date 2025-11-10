import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { zincTheme } from '../../config/themes/zinc';
import type { ThemeConfig } from '../../config/themes/zinc';
import { processColorForCSS } from '../../utils/color-converter';

type Theme = 'natural' | 'slate' | 'zinc';
type ColorMode = 'light' | 'dark';

interface ThemeContextValue {
 theme: Theme;
 colorMode: ColorMode;
 setTheme: (theme: Theme) => void;
 setColorMode: (mode: ColorMode) => void;
 currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Use zinc theme as base for natural and slate
// CSS variables in index.css control the actual colors
const themes: Record<Theme, ThemeConfig> = {
 'natural': zincTheme, // Uses natural CSS variables
 'slate': zincTheme, // Uses slate CSS variables
 'zinc': zincTheme, // Uses zinc CSS variables
};

interface ThemeProviderProps {
 children: React.ReactNode;
 initialTheme?: Theme;
 initialColorMode?: ColorMode;
 initialLanguage?: string;
}

export function ThemeProvider({
 children,
 initialTheme = 'natural',
 initialColorMode = 'light',
}: ThemeProviderProps) {
 const [theme, setThemeState] = useState<Theme>(() => {
 // Initialize theme from localStorage if available
 const stored = localStorage.getItem('user-preferences');
 if (stored) {
 try {
 const prefs = JSON.parse(stored);
 if (prefs.theme) {
 const validThemes: Theme[] = ['natural', 'slate', 'zinc'];
 if (validThemes.includes(prefs.theme)) {
 return prefs.theme;
 }
 }
 } catch (e) {
 console.warn('Failed to parse user preferences:', e);
 }
 }
 return initialTheme;
 });

 const [colorMode, setColorModeState] = useState<ColorMode>(() => {
 // Initialize color mode from localStorage or system preference
 const stored = localStorage.getItem('user-preferences');
 if (stored) {
 try {
 const prefs = JSON.parse(stored);
 if (prefs.colorMode && (prefs.colorMode === 'light' || prefs.colorMode === 'dark')) {
 return prefs.colorMode;
 }
 } catch (e) {
 console.warn('Failed to parse user preferences:', e);
 }
 }
 // Check system preference for color mode
 const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 return prefersDark ? 'dark' : 'light';
 });

 // Apply theme to document
 useEffect(() => {
 const config = themes[theme];
 if (!config) {
 console.error(`Theme config not found for: ${theme}`);
 return;
 }

 const root = document.documentElement;

 // Set data attributes for CSS
 // The actual colors are controlled by CSS variables in index.css
 root.setAttribute('data-theme', theme);
 root.setAttribute('data-color-mode', colorMode);

 // Only apply non-color CSS variables from theme config
 // Colors are handled by data-theme attribute in index.css

 // Apply radius variables
 if (config.radius) {
 Object.entries(config.radius).forEach(([key, value]) => {
 root.style.setProperty(`--radius-${key}`, value);
 });
 }

 // Apply font variables
 if (config.typography?.fonts) {
 root.style.setProperty('--font-sans', config.typography.fonts.sans);
 if (config.typography.fonts.serif) {
 root.style.setProperty('--font-serif', config.typography.fonts.serif);
 }
 root.style.setProperty('--font-mono', config.typography.fonts.mono);
 }

 // Apply shadow variables
 if (config.shadows) {
 Object.entries(config.shadows).forEach(([key, value]) => {
 root.style.setProperty(`--shadow-${key}`, value);
 });
 }
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
