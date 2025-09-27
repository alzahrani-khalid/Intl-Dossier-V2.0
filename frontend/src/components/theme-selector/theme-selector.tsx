import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/use-theme';
import { useLanguage } from '../../hooks/use-language';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps): React.ReactElement {
  const { theme, colorMode, setTheme, setColorMode } = useTheme();
  const { language, t } = useLanguage();
  const buttonGroupRef = useRef<HTMLDivElement>(null);

  const themes = [
    { value: 'gastat', label: language === 'ar' ? 'الهيئة العامة للإحصاء' : 'GASTAT' },
    { value: 'blueSky', label: language === 'ar' ? 'السماء الزرقاء' : 'Blue Sky' },
  ];

  const colorModes = [
    { value: 'light', icon: Sun, label: language === 'ar' ? 'فاتح' : 'Light' },
    { value: 'dark', icon: Moon, label: language === 'ar' ? 'داكن' : 'Dark' },
    { value: 'system', icon: Monitor, label: language === 'ar' ? 'النظام' : 'System' },
  ];

  const handleThemeChange = (value: string): void => {
    setTheme(value as 'gastat' | 'blueSky');
    
    const message = language === 'ar' 
      ? `تم تغيير المظهر إلى ${themes.find(t => t.value === value)?.label}`
      : `Theme changed to ${themes.find(t => t.value === value)?.label}`;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const handleColorModeChange = (value: 'light' | 'dark' | 'system'): void => {
    setColorMode(value);
    
    const modeName = colorModes.find(m => m.value === value)?.label;
    const message = language === 'ar' 
      ? `تم تغيير الوضع إلى ${modeName}`
      : `Color mode changed to ${modeName}`;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Select value={theme} onValueChange={handleThemeChange}>
        <SelectTrigger 
          className="w-[140px]"
          aria-label={language === 'ar' ? 'اختر المظهر' : 'Select theme'}
        >
          <SelectValue placeholder={language === 'ar' ? 'اختر المظهر' : 'Select theme'} />
        </SelectTrigger>
        <SelectContent>
          {themes.map((themeOption) => (
            <SelectItem key={themeOption.value} value={themeOption.value}>
              {themeOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div 
        ref={buttonGroupRef}
        className="flex items-center rounded-md border"
        role="group"
        aria-label={language === 'ar' ? 'وضع الألوان' : 'Color mode'}
        onKeyDown={(e) => {
          if (!buttonGroupRef.current) return;
          const buttons = Array.from(buttonGroupRef.current.querySelectorAll('button'));
          const currentIndex = buttons.findIndex(btn => btn === document.activeElement);
          
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            let nextIndex: number;
            
            if (language === 'ar') {
              // RTL: reverse arrow key behavior
              nextIndex = e.key === 'ArrowRight' 
                ? currentIndex - 1 
                : currentIndex + 1;
            } else {
              // LTR: normal arrow key behavior
              nextIndex = e.key === 'ArrowRight' 
                ? currentIndex + 1 
                : currentIndex - 1;
            }
            
            if (nextIndex < 0) nextIndex = buttons.length - 1;
            if (nextIndex >= buttons.length) nextIndex = 0;
            
            buttons[nextIndex]?.focus();
          }
          
          if (e.key === 'Home') {
            e.preventDefault();
            buttons[0]?.focus();
          }
          
          if (e.key === 'End') {
            e.preventDefault();
            buttons[buttons.length - 1]?.focus();
          }
        }}
      >
        {colorModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.value}
              variant={colorMode === mode.value ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleColorModeChange(mode.value as 'light' | 'dark' | 'system')}
              aria-label={mode.label}
              aria-pressed={colorMode === mode.value}
              className="rounded-none first:rounded-s-md last:rounded-e-md focus:z-10"
              tabIndex={colorMode === mode.value ? 0 : -1}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}