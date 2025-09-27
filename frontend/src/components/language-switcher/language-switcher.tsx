import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../../hooks/use-language';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'button' | 'dropdown';
}

export function LanguageSwitcher({ 
  className, 
  variant = 'dropdown' 
}: LanguageSwitcherProps): React.ReactElement {
  const { language, setLanguage } = useLanguage();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  ];

  const currentLanguage = languages.find(l => l.code === language);

  const handleLanguageChange = (langCode: 'en' | 'ar'): void => {
    if (langCode === language) return;
    
    // Store focus before language change
    const focusedElement = document.activeElement as HTMLElement;
    const focusedId = focusedElement?.id;
    const focusedClass = focusedElement?.className;
    const focusedTag = focusedElement?.tagName;
    
    setLanguage(langCode);
    
    // Restore focus after DOM updates
    requestAnimationFrame(() => {
      if (focusedId) {
        document.getElementById(focusedId)?.focus();
      } else if (focusedClass && focusedTag) {
        const selector = `${focusedTag.toLowerCase()}.${focusedClass.split(' ').join('.')}`;
        const element = document.querySelector(selector) as HTMLElement;
        element?.focus();
      } else if (triggerRef.current) {
        triggerRef.current.focus();
      }
    });
  };

  if (variant === 'button') {
    const targetLanguage = language === 'en' ? 'ar' : 'en';
    const targetLang = languages.find(l => l.code === targetLanguage);
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleLanguageChange(targetLanguage as 'en' | 'ar')}
        className={className}
        aria-label={
          language === 'ar' 
            ? `تغيير اللغة إلى ${targetLang?.name}`
            : `Switch language to ${targetLang?.nativeName}`
        }
      >
        <Globe className="h-4 w-4 me-2" />
        <span>{targetLang?.nativeName}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          ref={triggerRef}
          variant="outline" 
          size="sm"
          className={className}
          aria-label={language === 'ar' ? 'اختر اللغة' : 'Select language'}
          aria-haspopup="true"
          aria-expanded="false"
        >
          <Globe className="h-4 w-4 me-2" />
          <span className="hidden sm:inline-block">
            {currentLanguage?.nativeName}
          </span>
          <span className="sm:hidden">
            {currentLanguage?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as 'en' | 'ar')}
            className={language === lang.code ? 'bg-accent' : ''}
            aria-current={language === lang.code ? 'true' : 'false'}
            role="option"
            aria-selected={language === lang.code}
          >
            <span className="me-2">{lang.flag}</span>
            <span className="me-2">{lang.nativeName}</span>
            {language !== lang.code && (
              <span className="text-muted-foreground text-sm">
                ({lang.name})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}