import React, { useState } from 'react';
import { useTheme } from '../../hooks/use-theme';
import { useLanguage } from '../../hooks/use-language';
import { ChevronDown, Palette, Sun, Moon, Check } from 'lucide-react';

interface ThemeOption {
  id: 'gastat' | 'blue-sky';
  name: { en: string; ar: string };
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: 'gastat',
    name: { en: 'GASTAT', ar: 'الهيئة العامة للإحصاء' },
    preview: {
      primary: '#34A85A',
      secondary: '#6495ED',
      accent: '#66D9EF',
    },
  },
  {
    id: 'blue-sky',
    name: { en: 'Blue Sky', ar: 'السماء الزرقاء' },
    preview: {
      primary: 'oklch(0.58 0.176 244.4)',
      secondary: 'oklch(0.712 0.106 228.857)',
      accent: 'oklch(0.6576 0 0)',
    },
  },
];

export function ThemeSelector() {
  const { theme, setTheme, colorMode, setColorMode } = useTheme();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  const handleThemeSelect = (themeId: 'gastat' | 'blue-sky') => {
    setTheme(themeId);
    setIsOpen(false);
    
    // Announce change for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${themeId}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const toggleColorMode = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newMode);
    
    // Announce change for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Color mode changed to ${newMode}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
            aria-label={language === 'en' ? 'Select theme' : 'اختر السمة'}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <Palette className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">
              {currentTheme.name[language]}
            </span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              
              {/* Dropdown Menu */}
              <div
                className="absolute top-full mt-2 start-0 z-20 w-64 rounded-lg border border-border bg-popover shadow-lg"
                role="menu"
                aria-orientation="vertical"
              >
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeSelect(themeOption.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                    role="menuitem"
                    aria-selected={theme === themeOption.id}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme Preview */}
                      <div className="flex gap-1" aria-hidden="true">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: themeOption.preview.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: themeOption.preview.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: themeOption.preview.accent }}
                        />
                      </div>
                      
                      {/* Theme Name */}
                      <span className="text-sm font-medium">
                        {themeOption.name[language]}
                      </span>
                    </div>
                    
                    {/* Selected Indicator */}
                    {theme === themeOption.id && (
                      <Check className="w-4 h-4 text-primary" aria-label="Selected" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Color Mode Toggle */}
        <button
          onClick={toggleColorMode}
          className="p-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          aria-label={
            colorMode === 'light' 
              ? (language === 'en' ? 'Switch to dark mode' : 'التبديل إلى الوضع الداكن')
              : (language === 'en' ? 'Switch to light mode' : 'التبديل إلى الوضع الفاتح')
          }
        >
          {colorMode === 'light' ? (
            <Moon className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Sun className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
