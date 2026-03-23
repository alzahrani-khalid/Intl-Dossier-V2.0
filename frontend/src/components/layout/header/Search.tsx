import { useTranslation } from 'react-i18next'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcutContext } from '@/components/keyboard-shortcuts/KeyboardShortcutProvider'

export function HeaderSearch({ className }: { className?: string }) {
  const { t } = useTranslation('common')
  const { openCommandPalette, isMac } = useKeyboardShortcutContext()

  return (
    <>
      {/* Desktop: Input-like button with shortcut hint */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'hidden lg:flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors h-8 w-56 xl:w-64',
          className,
        )}
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 text-start truncate">{t('search.search', 'Search...')}</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl+'}K
        </kbd>
      </button>

      {/* Mobile: Icon button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={openCommandPalette}
        className="lg:hidden size-8"
        aria-label={t('search.openSearch', 'Open search')}
      >
        <SearchIcon className="size-4" />
      </Button>
    </>
  )
}
