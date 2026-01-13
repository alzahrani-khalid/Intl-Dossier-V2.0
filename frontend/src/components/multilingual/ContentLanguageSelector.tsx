/**
 * ContentLanguageSelector Component
 * Feature: Multi-language content authoring and storage
 *
 * Language selector for content authoring with RTL support
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ContentLanguage,
  ContentLanguageSelectorProps,
} from '@/types/multilingual-content.types'
import {
  LANGUAGE_METADATA,
  UN_OFFICIAL_LANGUAGES,
  isRTLLanguage,
} from '@/types/multilingual-content.types'

/**
 * Get display name for a language
 */
function getLanguageDisplayName(
  code: ContentLanguage,
  showNativeName: boolean,
  uiLanguage: string,
): string {
  const meta = LANGUAGE_METADATA[code]
  if (showNativeName) {
    return uiLanguage === code ? meta.name_native : `${meta.name_native} (${meta.name_en})`
  }
  return meta.name_en
}

/**
 * ContentLanguageSelector - Dropdown selector for content languages
 */
export function ContentLanguageSelector({
  value,
  onChange,
  availableLanguages,
  showAllLanguages = false,
  showNativeName = true,
  showFlag = true,
  disabled = false,
  className,
  size = 'default',
}: ContentLanguageSelectorProps) {
  const { t, i18n } = useTranslation('multilingual')
  const isRTL = i18n.language === 'ar'

  // Determine which languages to show
  const languages = useMemo(() => {
    if (showAllLanguages) {
      return Object.keys(LANGUAGE_METADATA) as ContentLanguage[]
    }
    if (availableLanguages && availableLanguages.length > 0) {
      return availableLanguages
    }
    // Default to UN official languages
    return UN_OFFICIAL_LANGUAGES
  }, [showAllLanguages, availableLanguages])

  const selectedMeta = LANGUAGE_METADATA[value]

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue as ContentLanguage)
    },
    [onChange],
  )

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg',
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={cn('min-w-[140px]', sizeClasses[size], className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            {showFlag && selectedMeta.flag_emoji && (
              <span className="text-base">{selectedMeta.flag_emoji}</span>
            )}
            <span dir={isRTLLanguage(value) ? 'rtl' : 'ltr'}>
              {showNativeName ? selectedMeta.name_native : selectedMeta.name_en}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
        {languages.map((code) => {
          const meta = LANGUAGE_METADATA[code]
          return (
            <SelectItem key={code} value={code}>
              <span className="flex items-center gap-2">
                {showFlag && meta.flag_emoji && (
                  <span className="text-base">{meta.flag_emoji}</span>
                )}
                <span dir={isRTLLanguage(code) ? 'rtl' : 'ltr'}>
                  {getLanguageDisplayName(code, showNativeName, i18n.language)}
                </span>
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

/**
 * ContentLanguageTabs - Tab-style language selector
 */
export interface ContentLanguageTabsProps {
  value: ContentLanguage
  onChange: (language: ContentLanguage) => void
  availableLanguages: ContentLanguage[]
  showFlag?: boolean
  showNativeName?: boolean
  disabled?: boolean
  className?: string
}

export function ContentLanguageTabs({
  value,
  onChange,
  availableLanguages,
  showFlag = true,
  showNativeName = false,
  disabled = false,
  className,
}: ContentLanguageTabsProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn('flex flex-wrap gap-1 p-1 bg-muted rounded-lg', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="tablist"
    >
      {availableLanguages.map((code) => {
        const meta = LANGUAGE_METADATA[code]
        const isSelected = value === code

        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => onChange(code)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              'transition-colors min-h-9 min-w-9',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            dir={isRTLLanguage(code) ? 'rtl' : 'ltr'}
          >
            {showFlag && meta.flag_emoji && <span className="text-base">{meta.flag_emoji}</span>}
            <span>{showNativeName ? meta.name_native : meta.name_en}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * LanguageDropdownMenu - Dropdown menu variant for adding languages
 */
export interface LanguageDropdownMenuProps {
  availableLanguages: ContentLanguage[]
  selectedLanguages: ContentLanguage[]
  onSelectLanguage: (language: ContentLanguage) => void
  disabled?: boolean
  className?: string
}

export function LanguageDropdownMenu({
  availableLanguages,
  selectedLanguages,
  onSelectLanguage,
  disabled = false,
  className,
}: LanguageDropdownMenuProps) {
  const { t, i18n } = useTranslation('multilingual')
  const isRTL = i18n.language === 'ar'

  // Languages not yet selected
  const unselectedLanguages = useMemo(() => {
    return availableLanguages.filter((lang) => !selectedLanguages.includes(lang))
  }, [availableLanguages, selectedLanguages])

  if (unselectedLanguages.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className={cn('gap-2', className)}>
          <Languages className="h-4 w-4" />
          <span>{t('addLanguage')}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} dir={isRTL ? 'rtl' : 'ltr'}>
        <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unselectedLanguages.map((code) => {
          const meta = LANGUAGE_METADATA[code]
          return (
            <DropdownMenuItem key={code} onClick={() => onSelectLanguage(code)} className="gap-2">
              {meta.flag_emoji && <span className="text-base">{meta.flag_emoji}</span>}
              <span dir={isRTLLanguage(code) ? 'rtl' : 'ltr'}>{meta.name_native}</span>
              <span className="text-muted-foreground text-xs ms-auto">{meta.name_en}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * LanguageIndicator - Shows current language with RTL indicator
 */
export interface LanguageIndicatorProps {
  language: ContentLanguage
  showRTLIndicator?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function LanguageIndicator({
  language,
  showRTLIndicator = true,
  size = 'default',
  className,
}: LanguageIndicatorProps) {
  const meta = LANGUAGE_METADATA[language]
  const isRTLLang = isRTLLanguage(language)

  const sizeClasses = {
    sm: 'text-xs gap-1',
    default: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }

  return (
    <span
      className={cn('inline-flex items-center text-muted-foreground', sizeClasses[size], className)}
      dir={isRTLLang ? 'rtl' : 'ltr'}
    >
      {meta.flag_emoji && <span>{meta.flag_emoji}</span>}
      <span>{meta.name_native}</span>
      {showRTLIndicator && isRTLLang && (
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">RTL</span>
      )}
    </span>
  )
}

export default ContentLanguageSelector
