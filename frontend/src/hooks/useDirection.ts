import { useLanguage } from '@/components/language-provider/language-provider'

export function useDirection(): { direction: 'ltr' | 'rtl'; isRTL: boolean } {
  const { direction } = useLanguage()
  return { direction, isRTL: direction === 'rtl' }
}
