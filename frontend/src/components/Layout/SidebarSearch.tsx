/**
 * Sidebar Search Component
 *
 * Compact search input for the sidebar with quick entity search.
 * Opens command palette for full search functionality.
 * Mobile-first design with RTL support.
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Search, Command as CommandIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useKeyboardShortcutContext } from '@/components/KeyboardShortcuts/KeyboardShortcutProvider'

interface SidebarSearchProps {
  /** Whether sidebar is expanded */
  isExpanded?: boolean
  /** Additional className */
  className?: string
  /** Compact mode */
  compact?: boolean
}

export function SidebarSearch({
  isExpanded = true,
  className,
  compact = false,
}: SidebarSearchProps) {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const inputRef = useRef<HTMLInputElement>(null)

  const [searchValue, setSearchValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Get command palette context
  const { openCommandPalette, isMac } = useKeyboardShortcutContext()

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (searchValue.trim()) {
      // Navigate to search page with query
      navigate({
        to: '/search',
        search: { q: searchValue.trim() },
      })
      setSearchValue('')
    }
  }, [searchValue, navigate])

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSearchValue('')
        inputRef.current?.blur()
      }
    },
    [handleSearch],
  )

  // Clear search
  const handleClear = useCallback(() => {
    setSearchValue('')
    inputRef.current?.focus()
  }, [])

  // Collapsed view - just icon that opens command palette
  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={openCommandPalette}
              className={cn('h-10 w-10 shrink-0', 'hover:bg-sidebar-accent', className)}
              aria-label={t('search.openSearch', 'Open search')}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'}>
            <div className="flex items-center gap-2">
              <span>{t('search.search', 'Search')}</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('px-2', className)} dir={isRTL ? 'rtl' : 'ltr'} data-tour="sidebar-search">
      <div className="relative">
        {/* Search Icon */}
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 h-4 w-4',
            'text-muted-foreground pointer-events-none',
            isRTL ? 'end-2.5' : 'start-2.5',
          )}
        />

        {/* Search Input */}
        <Input
          ref={inputRef}
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t('search.quickSearch', 'Quick search...')}
          className={cn(
            'h-9 w-full',
            'bg-sidebar-accent/50 border-sidebar-border',
            'focus:bg-background focus:border-primary',
            'placeholder:text-muted-foreground/70',
            compact ? 'text-xs' : 'text-sm',
            // Padding for icons
            isRTL ? 'pe-8 ps-9' : 'pe-9 ps-8',
          )}
          aria-label={t('search.searchLabel', 'Search dossiers, people, positions...')}
        />

        {/* Right side actions */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center gap-1',
            isRTL ? 'start-1.5' : 'end-1.5',
          )}
        >
          {/* Clear button when there's text */}
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-5 w-5 p-0 hover:bg-transparent"
              aria-label={t('search.clear', 'Clear search')}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}

          {/* Command palette shortcut hint when empty */}
          {!searchValue && !isFocused && (
            <button
              onClick={openCommandPalette}
              className={cn(
                'flex items-center gap-0.5 rounded px-1 py-0.5',
                'bg-muted/70 hover:bg-muted',
                'text-[10px] text-muted-foreground',
                'transition-colors cursor-pointer',
              )}
              aria-label={t('search.openCommandPalette', 'Open command palette')}
            >
              <CommandIcon className="h-3 w-3" />
              <span className="font-mono">{isMac ? 'K' : 'K'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search hint text */}
      {isFocused && (
        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {t('search.hint', 'Press Enter to search or')} {isMac ? '⌘K' : 'Ctrl+K'}{' '}
          {t('search.forCommands', 'for commands')}
        </p>
      )}
    </div>
  )
}

export default SidebarSearch
