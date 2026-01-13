/**
 * CommandPalette Component
 *
 * A discoverable command palette (Cmd/Ctrl+K) that shows available shortcuts
 * and allows quick navigation and action execution.
 *
 * Features:
 * - Full keyboard navigation (Arrow keys, Enter, Escape)
 * - Typeahead search
 * - Grouped shortcuts by category
 * - Mobile-first responsive design
 * - RTL support
 * - Visual shortcut hints
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  Settings,
  Search,
  HelpCircle,
  Keyboard,
  ArrowLeft,
  ArrowRight,
  Folder,
  Plus,
  Save,
  Trash2,
  Edit,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  FileText,
  Users,
  Command as CommandIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKeyboardShortcutContext } from './KeyboardShortcutProvider'
import type { KeyboardShortcut, ModifierKey } from '@/hooks/useKeyboardShortcuts'

interface CommandPaletteProps {
  /** Additional class names */
  className?: string
}

// Icon mapping for shortcuts
const categoryIcons: Record<string, React.ElementType> = {
  navigation: LayoutDashboard,
  actions: Plus,
  editing: Edit,
  view: FileText,
  help: HelpCircle,
}

const shortcutIcons: Record<string, React.ElementType> = {
  'go-dashboard': LayoutDashboard,
  'go-my-work': Briefcase,
  'go-dossiers': Folder,
  'go-calendar': CalendarDays,
  'go-tasks': CheckSquare,
  'go-analytics': TrendingUp,
  'go-settings': Settings,
  'go-back': ArrowLeft,
  'go-forward': ArrowRight,
  'new-task': Plus,
  save: Save,
  delete: Trash2,
  edit: Edit,
  refresh: RefreshCw,
  'list-move-up': ChevronUp,
  'list-move-down': ChevronDown,
  'command-palette': CommandIcon,
  'show-shortcuts': Keyboard,
}

export function CommandPalette({ className }: CommandPaletteProps) {
  const { t, i18n } = useTranslation('keyboard-shortcuts')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    getAllShortcuts,
    getShortcutsByCategory,
    formatShortcut,
    isMac,
  } = useKeyboardShortcutContext()

  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const shortcuts = getAllShortcuts()
    const categories: Record<string, KeyboardShortcut[]> = {
      navigation: [],
      actions: [],
      editing: [],
      view: [],
      help: [],
    }

    shortcuts.forEach((shortcut) => {
      if (categories[shortcut.category]) {
        categories[shortcut.category].push(shortcut)
      }
    })

    // Filter out empty categories
    return Object.entries(categories).filter(([_, items]) => items.length > 0)
  }, [getAllShortcuts])

  // Filter shortcuts based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedShortcuts
    }

    const query = searchQuery.toLowerCase()
    return groupedShortcuts
      .map(([category, shortcuts]) => {
        const filtered = shortcuts.filter(
          (s) =>
            s.description.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            s.key.toLowerCase().includes(query),
        )
        return [category, filtered] as [string, KeyboardShortcut[]]
      })
      .filter(([_, items]) => items.length > 0)
  }, [groupedShortcuts, searchQuery])

  // Quick actions for common navigation
  const quickActions = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        label: t('quickActions.dashboard', 'Go to Dashboard'),
        icon: LayoutDashboard,
        action: () => {
          navigate({ to: '/dashboard' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('d', ['alt']),
      },
      {
        id: 'nav-my-work',
        label: t('quickActions.myWork', 'Go to My Work'),
        icon: Briefcase,
        action: () => {
          navigate({ to: '/my-work' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('w', ['alt']),
      },
      {
        id: 'nav-dossiers',
        label: t('quickActions.dossiers', 'Go to Dossiers'),
        icon: Folder,
        action: () => {
          navigate({ to: '/dossiers' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('o', ['alt']),
      },
      {
        id: 'nav-calendar',
        label: t('quickActions.calendar', 'Go to Calendar'),
        icon: CalendarDays,
        action: () => {
          navigate({ to: '/calendar' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('c', ['alt']),
      },
      {
        id: 'nav-tasks',
        label: t('quickActions.tasks', 'Go to Tasks'),
        icon: CheckSquare,
        action: () => {
          navigate({ to: '/tasks' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('t', ['alt']),
      },
      {
        id: 'nav-analytics',
        label: t('quickActions.analytics', 'Go to Analytics'),
        icon: TrendingUp,
        action: () => {
          navigate({ to: '/analytics' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('a', ['alt']),
      },
      {
        id: 'nav-settings',
        label: t('quickActions.settings', 'Go to Settings'),
        icon: Settings,
        action: () => {
          navigate({ to: '/settings' })
          closeCommandPalette()
        },
        shortcut: formatShortcut('s', ['alt']),
      },
    ],
    [t, navigate, closeCommandPalette, formatShortcut],
  )

  // Filter quick actions
  const filteredQuickActions = useMemo(() => {
    if (!searchQuery.trim()) {
      return quickActions
    }

    const query = searchQuery.toLowerCase()
    return quickActions.filter(
      (action) =>
        action.label.toLowerCase().includes(query) || action.id.toLowerCase().includes(query),
    )
  }, [quickActions, searchQuery])

  // Handle item selection
  const handleSelect = useCallback(
    (shortcut: KeyboardShortcut) => {
      shortcut.action()
      closeCommandPalette()
    },
    [closeCommandPalette],
  )

  // Reset search when dialog closes
  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setSearchQuery('')
    }
  }, [isCommandPaletteOpen])

  // Focus input when dialog opens
  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isCommandPaletteOpen])

  // Get category label
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      navigation: t('categories.navigation', 'Navigation'),
      actions: t('categories.actions', 'Actions'),
      editing: t('categories.editing', 'Editing'),
      view: t('categories.view', 'View'),
      help: t('categories.help', 'Help'),
    }
    return labels[category] || category
  }

  // Get icon for a shortcut
  const getShortcutIcon = (shortcut: KeyboardShortcut): React.ElementType => {
    return shortcutIcons[shortcut.id] || categoryIcons[shortcut.category] || HelpCircle
  }

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={(open) => {
        if (!open) closeCommandPalette()
      }}
    >
      <div className={cn('flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CommandInput
          ref={inputRef}
          placeholder={t('searchPlaceholder', 'Type a command or search...')}
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="border-0"
        />
        <CommandList className="max-h-[60vh] overflow-y-auto sm:max-h-[400px]">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="mb-2 size-8 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">{t('noResults', 'No results found.')}</p>
              <p className="text-xs text-muted-foreground">
                {t('tryDifferentSearch', 'Try a different search term.')}
              </p>
            </div>
          </CommandEmpty>

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <CommandGroup heading={t('quickActions.title', 'Quick Actions')}>
                {filteredQuickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={action.action}
                      className="flex items-center gap-3"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{action.label}</span>
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Grouped Shortcuts */}
          {filteredGroups.map(([category, shortcuts], index) => (
            <React.Fragment key={category}>
              <CommandGroup heading={getCategoryLabel(category)}>
                {shortcuts.map((shortcut) => {
                  const Icon = getShortcutIcon(shortcut)
                  return (
                    <CommandItem
                      key={shortcut.id}
                      value={shortcut.id}
                      onSelect={() => handleSelect(shortcut)}
                      className="flex items-center gap-3"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{shortcut.description}</span>
                      <CommandShortcut>
                        {formatShortcut(shortcut.key, shortcut.modifiers)}
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {index < filteredGroups.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>

        {/* Footer with keyboard hints */}
        <div className="border-t px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
                <span className="hidden sm:inline">{t('footer.navigate', 'Navigate')}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
                <span className="hidden sm:inline">{t('footer.select', 'Select')}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                <span className="hidden sm:inline">{t('footer.close', 'Close')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Keyboard className="size-3" />
              <span>
                {isMac ? '⌘K' : 'Ctrl+K'} {t('footer.toOpen', 'to open')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CommandDialog>
  )
}

/**
 * ShortcutHint component for displaying shortcut keys inline
 */
interface ShortcutHintProps {
  shortcutKey: string
  modifiers?: ModifierKey[]
  className?: string
}

export function ShortcutHint({ shortcutKey, modifiers, className }: ShortcutHintProps) {
  const { formatShortcut, isRTL } = useKeyboardShortcutContext()

  return (
    <kbd
      className={cn(
        'inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {formatShortcut(shortcutKey, modifiers)}
    </kbd>
  )
}

/**
 * Component to show available shortcuts for a context
 */
interface ShortcutGuideProps {
  category?: KeyboardShortcut['category']
  maxItems?: number
  className?: string
}

export function ShortcutGuide({ category, maxItems = 5, className }: ShortcutGuideProps) {
  const { t, i18n } = useTranslation('keyboard-shortcuts')
  const isRTL = i18n.language === 'ar'
  const { getShortcutsByCategory, getAllShortcuts, formatShortcut } = useKeyboardShortcutContext()

  const shortcuts = useMemo(() => {
    const items = category ? getShortcutsByCategory(category) : getAllShortcuts()
    return items.slice(0, maxItems)
  }, [category, getShortcutsByCategory, getAllShortcuts, maxItems])

  if (shortcuts.length === 0) {
    return null
  }

  return (
    <div
      className={cn('flex flex-col gap-1 text-xs text-muted-foreground', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-1 font-medium text-foreground">
        {t('guide.title', 'Keyboard Shortcuts')}
      </div>
      {shortcuts.map((shortcut) => (
        <div key={shortcut.id} className="flex items-center justify-between gap-2">
          <span className="truncate">{shortcut.description}</span>
          <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {formatShortcut(shortcut.key, shortcut.modifiers)}
          </kbd>
        </div>
      ))}
    </div>
  )
}
