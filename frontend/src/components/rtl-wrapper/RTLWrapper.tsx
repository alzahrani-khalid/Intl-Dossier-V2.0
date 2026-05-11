import { useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getDirection } from '@/i18n'

interface RTLWrapperProps {
  children: ReactNode
}

export function RTLWrapper({ children }: RTLWrapperProps) {
  const { i18n } = useTranslation()
  const language = i18n.language
  const direction = useMemo(() => getDirection(language), [language])

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = language
    document.body.setAttribute('dir', direction)
    document.body.dataset.language = language
  }, [direction, language])

  return (
    <div dir={direction} data-dir={direction} className={direction === 'rtl' ? 'rtl' : 'ltr'}>
      {children}
    </div>
  )
}
