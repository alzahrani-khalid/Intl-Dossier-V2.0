import { describe, it, expect } from 'vitest';

// Preference merging logic to test
export interface Preferences {
  theme: 'gastat' | 'blueSky';
  colorMode: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'gastat',
  colorMode: 'light',
  language: 'en',
};

export const mergePreferences = (
  ...sources: (Partial<Preferences> | null | undefined)[]
): Preferences => {
  const result = { ...DEFAULT_PREFERENCES };
  
  for (const source of sources) {
    if (!source) continue;
    
    if (source.theme && isValidTheme(source.theme)) {
      result.theme = source.theme;
    }
    
    if (source.colorMode && isValidColorMode(source.colorMode)) {
      result.colorMode = source.colorMode;
    }
    
    if (source.language && isValidLanguage(source.language)) {
      result.language = source.language;
    }
  }
  
  return result;
};

export const mergeWithPriority = (
  systemPrefs: Partial<Preferences> | null,
  localStoragePrefs: Partial<Preferences> | null,
  supabasePrefs: Partial<Preferences> | null,
  userOverrides: Partial<Preferences> | null = null
): Preferences => {
  // Priority: userOverrides > supabase > localStorage > system > defaults
  return mergePreferences(
    DEFAULT_PREFERENCES,
    systemPrefs,
    localStoragePrefs,
    supabasePrefs,
    userOverrides
  );
};

export const detectSystemPreferences = (): Partial<Preferences> => {
  const preferences: Partial<Preferences> = {};
  
  // Detect color mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      preferences.colorMode = 'dark';
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      preferences.colorMode = 'light';
    }
  }
  
  // Detect language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ar')) {
      preferences.language = 'ar';
    } else if (browserLang.startsWith('en')) {
      preferences.language = 'en';
    }
  }
  
  return preferences;
};

export const parseStoredPreferences = (
  stored: string | null
): Partial<Preferences> | null => {
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;
    
    const result: Partial<Preferences> = {};
    
    if (parsed.theme && isValidTheme(parsed.theme)) {
      result.theme = parsed.theme;
    }
    
    if (parsed.colorMode && isValidColorMode(parsed.colorMode)) {
      result.colorMode = parsed.colorMode;
    }
    
    if (parsed.language && isValidLanguage(parsed.language)) {
      result.language = parsed.language;
    }
    
    // Check if preferences are expired (older than 24 hours)
    if (parsed.timestamp && typeof parsed.timestamp === 'number') {
      const age = Date.now() - parsed.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        return null; // Expired
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
};

// Helper functions
const isValidTheme = (theme: any): theme is Preferences['theme'] => {
  return theme === 'gastat' || theme === 'blueSky';
};

const isValidColorMode = (mode: any): mode is Preferences['colorMode'] => {
  return mode === 'light' || mode === 'dark' || mode === 'system';
};

const isValidLanguage = (lang: any): lang is Preferences['language'] => {
  return lang === 'en' || lang === 'ar';
};

describe('Preference Merging Logic Unit Tests', () => {
  describe('mergePreferences', () => {
    it('should return defaults when no sources provided', () => {
      const result = mergePreferences();
      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should return defaults when all sources are null/undefined', () => {
      const result = mergePreferences(null, undefined, null);
      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should merge single source with defaults', () => {
      const result = mergePreferences({ theme: 'blueSky' });
      expect(result).toEqual({
        theme: 'blueSky',
        colorMode: 'light',
        language: 'en',
      });
    });

    it('should merge multiple sources in order', () => {
      const source1 = { theme: 'blueSky' };
      const source2 = { colorMode: 'dark' };
      const source3 = { language: 'ar' };
      
      const result = mergePreferences(source1, source2, source3);
      expect(result).toEqual({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
      });
    });

    it('should override earlier sources with later ones', () => {
      const source1 = { theme: 'blueSky', colorMode: 'dark' };
      const source2 = { theme: 'gastat' }; // Should override blueSky
      
      const result = mergePreferences(source1, source2);
      expect(result).toEqual({
        theme: 'gastat',
        colorMode: 'dark',
        language: 'en',
      });
    });

    it('should ignore invalid values', () => {
      const invalidSource = {
        theme: 'invalid' as any,
        colorMode: 'wrong' as any,
        language: 'unsupported' as any,
      };
      
      const result = mergePreferences(invalidSource);
      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should handle mixed valid and invalid values', () => {
      const mixedSource = {
        theme: 'blueSky',
        colorMode: 'invalid' as any,
        language: 'ar',
      };
      
      const result = mergePreferences(mixedSource);
      expect(result).toEqual({
        theme: 'blueSky',
        colorMode: 'light', // Default
        language: 'ar',
      });
    });
  });

  describe('mergeWithPriority', () => {
    it('should respect priority order: user > supabase > localStorage > system > defaults', () => {
      const systemPrefs = { theme: 'blueSky', colorMode: 'dark' };
      const localStoragePrefs = { theme: 'gastat', language: 'ar' };
      const supabasePrefs = { colorMode: 'light' };
      const userOverrides = { theme: 'blueSky' };
      
      const result = mergeWithPriority(
        systemPrefs,
        localStoragePrefs,
        supabasePrefs,
        userOverrides
      );
      
      expect(result).toEqual({
        theme: 'blueSky', // From userOverrides
        colorMode: 'light', // From supabase
        language: 'ar', // From localStorage
      });
    });

    it('should work without user overrides', () => {
      const systemPrefs = { colorMode: 'dark' };
      const localStoragePrefs = { language: 'ar' };
      const supabasePrefs = { theme: 'blueSky' };
      
      const result = mergeWithPriority(
        systemPrefs,
        localStoragePrefs,
        supabasePrefs
      );
      
      expect(result).toEqual({
        theme: 'blueSky', // From supabase
        colorMode: 'dark', // From system
        language: 'ar', // From localStorage
      });
    });

    it('should handle all null sources', () => {
      const result = mergeWithPriority(null, null, null, null);
      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should use system preferences as baseline', () => {
      const systemPrefs = { colorMode: 'dark', language: 'ar' };
      
      const result = mergeWithPriority(systemPrefs, null, null, null);
      
      expect(result).toEqual({
        theme: 'gastat', // Default
        colorMode: 'dark', // From system
        language: 'ar', // From system
      });
    });
  });

  describe('detectSystemPreferences', () => {
    it('should detect dark mode preference', () => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
      });
      
      const result = detectSystemPreferences();
      expect(result.colorMode).toBe('dark');
    });

    it('should detect light mode preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: light)',
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
      });
      
      const result = detectSystemPreferences();
      expect(result.colorMode).toBe('light');
    });

    it('should detect Arabic language preference', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'ar-SA',
      });
      
      const result = detectSystemPreferences();
      expect(result.language).toBe('ar');
    });

    it('should detect English language preference', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-US',
      });
      
      const result = detectSystemPreferences();
      expect(result.language).toBe('en');
    });

    it('should handle unsupported language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'fr-FR',
      });
      
      const result = detectSystemPreferences();
      expect(result.language).toBeUndefined();
    });
  });

  describe('parseStoredPreferences', () => {
    it('should parse valid stored preferences', () => {
      const stored = JSON.stringify({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
        timestamp: Date.now(),
      });
      
      const result = parseStoredPreferences(stored);
      expect(result).toEqual({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
      });
    });

    it('should return null for null/empty input', () => {
      expect(parseStoredPreferences(null)).toBeNull();
      expect(parseStoredPreferences('')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseStoredPreferences('invalid json')).toBeNull();
      expect(parseStoredPreferences('{broken')).toBeNull();
    });

    it('should filter out invalid fields', () => {
      const stored = JSON.stringify({
        theme: 'invalid',
        colorMode: 'dark',
        language: 'ar',
        extraField: 'value',
        timestamp: Date.now(),
      });
      
      const result = parseStoredPreferences(stored);
      expect(result).toEqual({
        colorMode: 'dark',
        language: 'ar',
      });
      expect(result).not.toHaveProperty('theme');
      expect(result).not.toHaveProperty('extraField');
    });

    it('should return null for expired preferences', () => {
      const stored = JSON.stringify({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      });
      
      const result = parseStoredPreferences(stored);
      expect(result).toBeNull();
    });

    it('should accept preferences without timestamp', () => {
      const stored = JSON.stringify({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
      });
      
      const result = parseStoredPreferences(stored);
      expect(result).toEqual({
        theme: 'blueSky',
        colorMode: 'dark',
        language: 'ar',
      });
    });

    it('should return null for non-object JSON', () => {
      expect(parseStoredPreferences('123')).toBeNull();
      expect(parseStoredPreferences('"string"')).toBeNull();
      expect(parseStoredPreferences('[]')).toBeNull();
    });

    it('should return null if all fields are invalid', () => {
      const stored = JSON.stringify({
        theme: 'wrong',
        colorMode: 'invalid',
        language: 'unsupported',
        timestamp: Date.now(),
      });
      
      const result = parseStoredPreferences(stored);
      expect(result).toBeNull();
    });
  });
});