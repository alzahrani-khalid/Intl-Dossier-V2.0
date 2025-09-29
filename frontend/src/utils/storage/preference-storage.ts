/**
 * Local storage utility for user preferences
 * Provides immediate persistence with fallback handling
 */

export interface StoredPreferences {
  theme: 'gastat' | 'blue-sky';
  colorMode: 'light' | 'dark';
  language: 'en' | 'ar';
  updatedAt: string;
}

const STORAGE_KEY = 'user-preferences';

/**
 * Get preferences from localStorage
 */
export function getStoredPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Validate the stored data
    if (
      typeof parsed.theme === 'string' &&
      typeof parsed.colorMode === 'string' &&
      typeof parsed.language === 'string' &&
      typeof parsed.updatedAt === 'string'
    ) {
      return parsed as StoredPreferences;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to read preferences from localStorage:', error);
    return null;
  }
}

/**
 * Save preferences to localStorage
 */
export function setStoredPreferences(preferences: Omit<StoredPreferences, 'updatedAt'>): boolean {
  try {
    const toStore: StoredPreferences = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    return true;
  } catch (error) {
    // Handle quota exceeded or security errors
    console.error('Failed to save preferences to localStorage:', error);
    return false;
  }
}

/**
 * Clear stored preferences
 */
export function clearStoredPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear preferences from localStorage:', error);
  }
}

/**
 * Get system color mode preference
 */
export function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get system language preference
 */
export function getSystemLanguage(): 'en' | 'ar' {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ar') ? 'ar' : 'en';
}

/**
 * Watch for storage changes from other tabs
 */
export function watchStorageChanges(
  callback: (preferences: StoredPreferences | null) => void
): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const newValue = event.newValue ? JSON.parse(event.newValue) : null;
      callback(newValue);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}