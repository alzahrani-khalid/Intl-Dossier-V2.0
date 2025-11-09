import React, { useState } from 'react';
import { useLanguage } from '../../hooks/use-language';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageOption {
 code: 'en' | 'ar';
 name: { en: string; ar: string };
 nativeName: string;
 flag: string;
}

const languages: LanguageOption[] = [
 {
 code: 'en',
 name: { en: 'English', ar: 'الإنجليزية' },
 nativeName: 'English',
 flag: '🇬🇧',
 },
 {
 code: 'ar',
 name: { en: 'Arabic', ar: 'العربية' },
 nativeName: 'العربية',
 flag: '🇸🇦',
 },
];

export function LanguageSwitcher() {
 const { language, setLanguage } = useLanguage();
 const [isOpen, setIsOpen] = useState(false);

 const currentLanguage = languages.find(l => l.code === language) || languages[0];

 const handleLanguageSelect = (languageCode: 'en' | 'ar') => {
 setLanguage(languageCode);
 setIsOpen(false);
 
 // Announce change for screen readers
 const announcement = document.createElement('div');
 announcement.setAttribute('role', 'status');
 announcement.setAttribute('aria-live', 'polite');
 announcement.className = 'sr-only';
 announcement.textContent = `Language changed to ${languageCode === 'en' ? 'English' : 'Arabic'}`;
 document.body.appendChild(announcement);
 setTimeout(() => document.body.removeChild(announcement), 1000);
 };

 return (
 <div className="relative">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
 aria-label={language === 'en' ? 'Select language' : 'اختر اللغة'}
 aria-expanded={isOpen}
 aria-haspopup="true"
 >
 <Globe className="w-4 h-4" aria-hidden="true" />
 <span className="text-sm font-medium">
 {currentLanguage.nativeName}
 </span>
 <span className="text-lg" aria-hidden="true">
 {currentLanguage.flag}
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
 className="absolute top-full mt-2 end-0 z-20 w-48 rounded-lg border border-border bg-popover shadow-lg"
 role="menu"
 aria-orientation="vertical"
 >
 {languages.map((lang) => (
 <button
 key={lang.code}
 onClick={() => handleLanguageSelect(lang.code)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
 role="menuitem"
 aria-selected={language === lang.code}
 lang={lang.code}
 >
 <div className="flex items-center gap-3">
 <span className="text-lg" aria-hidden="true">
 {lang.flag}
 </span>
 <div className="text-start">
 <div className="text-sm font-medium">
 {lang.nativeName}
 </div>
 <div className="text-xs text-muted-foreground">
 {lang.name[language]}
 </div>
 </div>
 </div>
 
 {/* Selected Indicator */}
 {language === lang.code && (
 <Check className="w-4 h-4 text-primary" aria-label="Selected" />
 )}
 </button>
 ))}
 </div>
 </>
 )}
 </div>
 );
}