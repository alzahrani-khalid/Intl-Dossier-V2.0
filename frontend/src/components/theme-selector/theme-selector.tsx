import React, { useState } from 'react';
import { useTheme } from '../../hooks/use-theme';
import { useLanguage } from '../../hooks/use-language';
import { ChevronDown, Palette, Sun, Moon, Check } from 'lucide-react';

interface ThemeOption {
 id: 'natural' | 'slate' | 'zinc';
 name: { en: string; ar: string };
 preview: {
 primary: string;
 secondary: string;
 accent: string;
 };
}

const themes: ThemeOption[] = [
 {
 id: 'natural',
 name: { en: 'Natural', ar: 'طبيعي' },
 preview: {
 primary: 'hsl(0 0% 20.5%)', // Dark gray
 secondary: 'hsl(0 0% 97%)', // Light gray
 accent: 'hsl(0 0% 55.6%)', // Medium gray
 },
 },
 {
 id: 'slate',
 name: { en: 'Slate', ar: 'رمادي' },
 preview: {
 primary: 'hsl(222.2 47.4% 11.2%)', // Dark slate
 secondary: 'hsl(210 40% 96.1%)', // Light slate
 accent: 'hsl(215.4 16.3% 46.9%)', // Medium slate
 },
 },
 {
 id: 'zinc',
 name: { en: 'Zinc', ar: 'زنك' },
 preview: {
 primary: 'hsl(240 5.9% 10%)', // Deep zinc
 secondary: 'hsl(240 4.8% 95.9%)', // Light zinc
 accent: 'hsl(240 3.8% 46.1%)', // Medium zinc
 },
 },
];

export function ThemeSelector() {
 const { theme, setTheme, colorMode, setColorMode } = useTheme();
 const { language } = useLanguage();
 const [isOpen, setIsOpen] = useState(false);

 const currentTheme = themes.find(t => t.id === theme) || themes[0];

 const handleThemeSelect = (themeId: 'natural' | 'slate' | 'zinc') => {
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
 <div className="flex items-center gap-1">
 {/* Theme Dropdown */}
 <div className="relative">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-accent transition-colors"
 aria-label={language === 'en' ? 'Select theme' : 'اختر السمة'}
 aria-expanded={isOpen}
 aria-haspopup="true"
 >
 <Palette className="w-3.5 h-3.5" aria-hidden="true" />
 <span className="text-xs font-medium">
 {currentTheme.name[language]}
 </span>
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
 <span className="text-xs font-medium">
 {themeOption.name[language]}
 </span>
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

 {/* Color Mode Toggle */}
 <button
 onClick={toggleColorMode}
 className="p-1.5 rounded-md border border-border bg-background hover:bg-accent transition-colors"
 aria-label={
 colorMode === 'light'
 ? (language === 'en' ? 'Switch to dark mode' : 'التبديل إلى الوضع الداكن')
 : (language === 'en' ? 'Switch to light mode' : 'التبديل إلى الوضع الفاتح')
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
 );
}
