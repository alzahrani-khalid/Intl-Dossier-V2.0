import React, { useState } from 'react'
import { useTheme, AVAILABLE_THEMES } from '../../hooks/use-theme'
import { useLanguage } from '../../hooks/use-language'
import { ChevronDown, Palette, Sun, Moon, Check } from 'lucide-react'

interface ThemeOption {
  id: 'canvas'
  name: { en: string; ar: string }
  preview: {
    primary: string
    secondary: string
    accent: string
  }
}

// Canvas theme with Eucalyptus green primary
const themes: ThemeOption[] = [
  {
    id: 'canvas',
    name: { en: 'Canvas', ar: 'كانفس' },
    preview: {
      primary: 'hsl(155 50.6% 37.3%)', // Eucalyptus green
      secondary: 'hsl(0 0% 89.8%)', // Alabaster gray
      accent: 'hsl(155 55.8% 58.4%)', // Light eucalyptus
    },
  },
]

export function ThemeSelector() {
  const { theme, setTheme, colorMode, setColorMode } = useTheme()
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentTheme = themes.find((t) => t.id === theme) || themes[0]

  const handleThemeSelect = (themeId: 'canvas') => {
    setTheme(themeId)
    setIsOpen(false)

    // Announce change for screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = `Theme changed to ${themeId}`
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const toggleColorMode = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light'
    setColorMode(newMode)

    // Announce change for screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = `Color mode changed to ${newMode}`
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  // If only one theme, show simplified selector
  const singleTheme = themes.length === 1

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Theme Dropdown - shows when multiple themes available */}
        {singleTheme ? (
          // Single theme: just display the name with the primary color indicator
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentTheme.preview.primary }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium">{currentTheme.name[language]}</span>
          </div>
        ) : (
          // Multiple themes: show dropdown
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-accent transition-colors"
              aria-label={language === 'en' ? 'Select theme' : 'اختر السمة'}
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              <Palette className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs font-medium">{currentTheme.name[language]}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                  className="absolute top-full mt-2 start-0 z-20 w-56 rounded-lg border border-border bg-popover shadow-lg"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => handleThemeSelect(themeOption.id)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                      role="menuitem"
                      aria-selected={theme === themeOption.id}
                    >
                      <div className="flex items-center gap-2">
                        {/* Theme Preview */}
                        <div className="flex gap-0.5" aria-hidden="true">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeOption.preview.primary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeOption.preview.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeOption.preview.accent }}
                          />
                        </div>

                        {/* Theme Name */}
                        <span className="text-xs font-medium">{themeOption.name[language]}</span>
                      </div>

                      {/* Selected Indicator */}
                      {theme === themeOption.id && (
                        <Check className="w-3.5 h-3.5 text-primary" aria-label="Selected" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Color Mode Toggle */}
        <button
          onClick={toggleColorMode}
          className="p-1.5 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          aria-label={
            colorMode === 'light'
              ? language === 'en'
                ? 'Switch to dark mode'
                : 'التبديل إلى الوضع الداكن'
              : language === 'en'
                ? 'Switch to light mode'
                : 'التبديل إلى الوضع الفاتح'
          }
        >
          {colorMode === 'light' ? (
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Sun className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
