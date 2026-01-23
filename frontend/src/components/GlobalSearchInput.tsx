/**
 * Global Search Input Component
 * Feature: 015-search-retrieval-spec
 * Task: T042
 *
 * Bilingual search input with:
 * - Debounced onChange (200ms)
 * - Keyboard shortcuts (/ to focus)
 * - Clear button
 * - Loading indicator
 * - RTL/LTR support
 * - ARIA labels for accessibility
 */

import React, { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

export interface GlobalSearchInputProps {
  /** Current search query */
  value: string
  /** Callback when search query changes */
  onChange: (value: string) => void
  /** Callback when user submits search (Enter key) */
  onSearch?: (value: string) => void
  /** Show loading indicator */
  isLoading?: boolean
  /** Placeholder text override */
  placeholder?: string
  /** Auto-focus on mount */
  autoFocus?: boolean
  /** CSS class name */
  className?: string
  /** Callback when input gains focus */
  onFocus?: () => void
  /** Callback when input loses focus */
  onBlur?: () => void
}

export function GlobalSearchInput({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder,
  autoFocus = false,
  className = '',
  onFocus,
  onBlur,
}: GlobalSearchInputProps) {
  const { t, i18n } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localValue, setLocalValue] = useState(value)

  // Debounce the onChange callback (200ms)
  const debouncedValue = useDebouncedValue(localValue, 200)

  // Call onChange with debounced value
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on '/' key (unless already in an input)
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault()
      onSearch(localValue)
    }

    // Escape to clear
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClear()
    }
  }

  // Determine text direction based on current language
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr'

  // Get placeholder text
  const placeholderText =
    placeholder || t('search.placeholder', 'Search dossiers, people, positions...')

  return (
    <div className={`relative w-full ${className}`} dir={direction}>
      {/* Search Icon */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'end-3' : 'start-3'} pointer-events-none text-muted-foreground`}
      >
        <Search className="size-4" />
      </div>

      {/* Search Input */}
      <Input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholderText}
        className={`w-full ${direction === 'rtl' ? 'pe-10 ps-20' : 'pe-20 ps-10'}`}
        dir="auto" // Auto-detect text direction
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        // Accessibility
        role="searchbox"
        aria-label={t('search.label', 'Global search')}
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-expanded={false} // Will be controlled by parent
      />

      {/* Right Side Actions */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'start-2' : 'end-2'} flex items-center gap-1`}
      >
        {/* Loading Indicator */}
        {isLoading && (
          <div className="me-1" aria-label={t('search.loading', 'Loading...')}>
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Clear Button */}
        {localValue && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="size-7 p-0 hover:bg-muted"
            aria-label={t('search.clear', 'Clear search')}
          >
            <X className="size-4" />
          </Button>
        )}

        {/* Keyboard Shortcut Hint */}
        {!localValue && !isLoading && (
          <div className="hidden items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground sm:flex">
            <kbd className="font-mono">/</kbd>
          </div>
        )}
      </div>
    </div>
  )
}
