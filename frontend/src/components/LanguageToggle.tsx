import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { switchLanguage, type SupportedLanguage } from '../i18n'
import { useUIStore } from '../store/uiStore'
import { cn } from '../lib/utils'

interface LanguageToggleProps {
 compact?: boolean
}

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
 const { i18n } = useTranslation()
 const { language, setLanguage } = useUIStore()

 const handleToggle = useCallback(async () => {
 const nextLang: SupportedLanguage = language === 'en' ? 'ar' : 'en'
 await switchLanguage(nextLang)
 setLanguage(nextLang)
 }, [language, setLanguage])

 const isRTL = language === 'ar'

 return (
 <button
 onClick={handleToggle}
 className={cn(
 'relative flex items-center rounded-full transition-all duration-300',
 'bg-background border border-border',
 'hover:bg-accent',
 'focus:outline-none',
 compact ? 'w-16 h-[30px] p-[3px]' : 'w-28 sm:w-32 h-9 p-1'
 )}
 aria-label={i18n.t('languages.switch', 'Switch language')}
 >
 {/* Sliding Toggle Background */}
 <div
 className={cn(
 'absolute rounded-full transition-all duration-300 ease-in-out',
 'bg-primary shadow-md',
 'flex items-center justify-center',
 compact ? 'h-[22px] w-7 top-[3px]' : 'h-7 w-12 top-1',
 isRTL ? (compact ? 'end-[3px]' : 'end-1') : (compact ? 'start-[3px]' : 'start-1')
 )}
 />

 {/* EN Label */}
 <span
 className={cn(
 'relative z-10 flex-1 text-center transition-all duration-300',
 compact ? 'text-[10px] font-semibold' : 'text-xs font-semibold',
 !isRTL ? 'text-primary-foreground' : 'text-muted-foreground'
 )}
 >
 EN
 </span>

 {/* AR Label */}
 <span
 className={cn(
 'relative z-10 flex-1 text-center transition-all duration-300',
 compact ? 'text-[10px] font-semibold' : 'text-xs font-semibold',
 isRTL ? 'text-primary-foreground' : 'text-muted-foreground'
 )}
 >
 ع
 </span>
 </button>
 )
}

