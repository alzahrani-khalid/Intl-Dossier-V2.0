import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export interface ToolbarSearchProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  debounceMs?: number
}

export function ToolbarSearch({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
}: ToolbarSearchProps): ReactNode {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [local, setLocal] = useState(value)
  const [lastSyncedValue, setLastSyncedValue] = useState(value)
  const debounced = useDebouncedValue(local, debounceMs)

  // Sync external -> internal when caller resets the value (e.g. clear).
  // Adjust state during render rather than in an effect to avoid a double-pass.
  if (value !== lastSyncedValue) {
    setLastSyncedValue(value)
    setLocal(value)
  }

  // Push debounced changes back to parent.
  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced)
    }
  }, [debounced])

  return (
    <input
      type="search"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder ?? t('common.search', { defaultValue: 'Search' })}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="id-input h-11 w-full min-w-0 text-start"
      aria-label={placeholder ?? t('common.search', { defaultValue: 'Search' })}
    />
  )
}
