import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth.context';
import { useTheme } from '../components/theme-provider/theme-provider';
import { useLanguage } from '../components/language-provider/language-provider';
import { PreferencePersistenceService, UserPreferences } from '../services/preference-persistence';

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