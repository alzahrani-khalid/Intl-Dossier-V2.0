/**
 * User Preferences Hook
 * @module hooks/use-preferences
 *
 * Hook for managing user preferences (theme, color mode, language) with automatic
 * persistence to database and local storage.
 *
 * @description
 * This module provides a unified hook for managing user preferences across the application:
 * - Automatic loading of preferences on mount (from database or localStorage)
 * - Real-time synchronization with PreferencePersistenceService
 * - Cross-tab preference updates via subscription mechanism
 * - Automatic saving when preferences change
 * - Seamless integration with theme and language providers
 * - Authenticated user preferences stored in database
 * - Anonymous user preferences stored in localStorage only
 *
 * @example
 * // Basic usage in a settings page
 * const { theme, colorMode, language, setTheme, setColorMode, setLanguage } = usePreferences();
 *
 * @example
 * // Change theme
 * setTheme('dark');
 *
 * @example
 * // Change language
 * setLanguage('ar');
 *
 * @example
 * // Change color mode
 * setColorMode('purple');
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth.context';
import { useTheme } from '../components/theme-provider/theme-provider';
import { useLanguage } from '../components/language-provider/language-provider';
import { PreferencePersistenceService, UserPreferences } from '../services/preference-persistence';

/**
 * Hook to manage user preferences with automatic persistence
 *
 * @description
 * Provides a centralized way to access and update user preferences (theme, colorMode, language).
 * Automatically loads preferences on mount from the database (for authenticated users) or
 * localStorage (for anonymous users). Changes are automatically persisted and synchronized
 * across browser tabs.
 *
 * The hook:
 * 1. Initializes PreferencePersistenceService on mount
 * 2. Loads stored preferences and applies them to theme/language providers
 * 3. Subscribes to preference changes for cross-tab sync
 * 4. Automatically saves any preference changes
 * 5. Cleans up subscriptions on unmount
 *
 * @returns Object containing current preferences and setter functions
 *   - theme: Current theme ('light' | 'dark' | 'system')
 *   - colorMode: Current color mode ('blue' | 'purple' | 'green', etc.)
 *   - language: Current language code ('en' | 'ar')
 *   - setTheme: Function to update theme
 *   - setColorMode: Function to update color mode
 *   - setLanguage: Function to update language
 *
 * @example
 * // Basic usage
 * const {
 *   theme,
 *   colorMode,
 *   language,
 *   setTheme,
 *   setColorMode,
 *   setLanguage
 * } = usePreferences();
 *
 * @example
 * // Settings form
 * <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 *   <option value="system">System</option>
 * </Select>
 */
export function usePreferences() {
  const { user } = useAuth();
  const { theme, colorMode, setTheme, setColorMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const serviceRef = useRef<PreferencePersistenceService>();

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new PreferencePersistenceService();
    }

    const loadPreferences = async () => {
      const preferences = await serviceRef.current!.loadPreferences(user?.id);
      if (preferences) {
        setTheme(preferences.theme);
        setColorMode(preferences.colorMode);
        setLanguage(preferences.language);
      }
    };

    loadPreferences();

    const unsubscribe = serviceRef.current.subscribeToChanges((prefs) => {
      setTheme(prefs.theme);
      setColorMode(prefs.colorMode);
      setLanguage(prefs.language);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, setTheme, setColorMode, setLanguage]);

  useEffect(() => {
    if (!serviceRef.current) return;

    const preferences: UserPreferences = {
      theme,
      colorMode,
      language,
    };

    serviceRef.current.savePreferences(preferences, user?.id);
  }, [theme, colorMode, language, user?.id]);

  return {
    theme,
    colorMode,
    language,
    setTheme,
    setColorMode,
    setLanguage,
  };
}