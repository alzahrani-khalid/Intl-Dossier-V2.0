import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { switchLanguage, type SupportedLanguage } from '../i18n'
import { useUIStore } from '../store/uiStore'

interface LanguageSwitcherProps {
  compact?: boolean
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useUIStore()

  const handleChange = useCallback(
    async (next: SupportedLanguage) => {
      if (next === language) return
      await switchLanguage(next)
      setLanguage(next)
    },
    [language, setLanguage]
  )

  const labelMap: Record<SupportedLanguage, string> = {
    en: i18n.getFixedT('en')('languages.english', 'English'),
    ar: i18n.getFixedT('ar')('languages.arabic', 'العربية'),
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'icon' : 'sm'}
          className="gap-2"
          aria-label={i18n.t('languages.switch', 'Switch language')}
        >
          <Globe className="size-4" />
          {!compact && <span>{labelMap[language]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {(Object.keys(labelMap) as SupportedLanguage[]).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onSelect={() => handleChange(lang)}
            className="flex items-center justify-between"
          >
            <span>{labelMap[lang]}</span>
            {language === lang && <Check className="size-4 text-primary-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
