import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { switchLanguage, SupportedLanguage } from '../i18n'

export function LanguageToggle() {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await switchLanguage(lang)
  }

  const currentLanguage = i18n.language as SupportedLanguage
  const languageNames = {
    en: 'English',
    ar: 'العربية'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{languageNames[currentLanguage]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className={currentLanguage === 'en' ? 'bg-accent' : ''}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('ar')}
          className={currentLanguage === 'ar' ? 'bg-accent' : ''}
        >
          🇸🇦 العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

