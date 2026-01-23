/**
 * CommandPalette Component
 *
 * A comprehensive command palette (Cmd/Ctrl+K) for power users with:
 * - Global entity search across dossiers and work items
 * - Quick navigation shortcuts to any page
 * - Action shortcuts (create task, new intake, new dossier)
 * - Recent items from localStorage
 * - Context-aware suggestions based on current page
 * - Grouped shortcuts by category
 * - Mobile-first responsive design
 * - Full RTL support with logical properties
 * - Visual shortcut hints
 *
 * Keyboard controls:
 * - Cmd/Ctrl+K: Open palette
 * - Shift+?: Open palette (alternative)
 * - Arrow keys: Navigate items
 * - Enter: Select/execute
 * - Escape: Close palette
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
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
  Globe,
  Building2,
  MessageSquare,
  Tag,
  UsersRound,
  Vote,
  FileCheck,
  ClipboardList,
  Inbox,
  FileSignature,
  Loader2,
  Clock,
  FolderPlus,
  UserPlus,
  PlusCircle,
  Sparkles,
  Network,
  History,
  BookOpen,
  ScrollText,
  Brain,
  BarChart3,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKeyboardShortcutContext } from './KeyboardShortcutProvider'
import type { KeyboardShortcut, ModifierKey } from '@/hooks/useKeyboardShortcuts'
import {
  useQuickSwitcherSearch,
  type QuickSwitcherDossier,
  type QuickSwitcherWorkItem,
} from '@/hooks/useQuickSwitcherSearch'
import type { DossierType } from '@/lib/dossier-type-guards'

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

// Icons for dossier types
const dossierTypeIcons: Record<DossierType, React.ElementType> = {
  country: Globe,
  organization: Building2,
  person: Users,
  engagement: Briefcase,
  forum: MessageSquare,
  working_group: UsersRound,
  topic: Tag,
  elected_official: Vote,
}

// Icons for work item types
const workTypeIcons: Record<string, React.ElementType> = {
  position: FileCheck,
  task: CheckSquare,
  commitment: ClipboardList,
  intake: Inbox,
  mou: FileSignature,
  document: FileText,
}

// Labels for dossier types
const dossierTypeLabels: Record<DossierType, { en: string; ar: string }> = {
  country: { en: 'Country', ar: 'دولة' },
  organization: { en: 'Organization', ar: 'منظمة' },
  person: { en: 'Person', ar: 'شخص' },
  engagement: { en: 'Engagement', ar: 'مشاركة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  topic: { en: 'Topic', ar: 'موضوع' },
  elected_official: { en: 'Official', ar: 'مسؤول' },
}

// Labels for work item types
const workTypeLabels: Record<string, { en: string; ar: string }> = {
  position: { en: 'Position', ar: 'موقف' },
  task: { en: 'Task', ar: 'مهمة' },
  commitment: { en: 'Commitment', ar: 'التزام' },
  intake: { en: 'Request', ar: 'طلب' },
  mou: { en: 'MoU', ar: 'مذكرة تفاهم' },
  document: { en: 'Document', ar: 'وثيقة' },
}

// Badge colors for dossier types
const dossierTypeBadgeColors: Record<DossierType, string> = {
  country: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  organization: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  person: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  engagement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  forum: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  working_group: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  topic: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  elected_official: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Badge colors for work item types
const workTypeBadgeColors: Record<string, string> = {
  position: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  commitment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  intake: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  mou: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  document: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

// Context-aware route patterns for suggestions
interface RouteContext {
  pattern?: RegExp
  contextType: 'dossier' | 'task' | 'calendar' | 'analytics' | 'settings' | 'admin' | 'general'
  suggestedActions: string[]
}

const routeContexts: RouteContext[] = [
  {
    pattern: /^\/dossiers\/countries/,
    contextType: 'dossier',
    suggestedActions: ['create-country', 'view-relationships'],
  },
  {
    pattern: /^\/dossiers\/organizations/,
    contextType: 'dossier',
    suggestedActions: ['create-organization', 'view-relationships'],
  },
  {
    pattern: /^\/dossiers\/forums/,
    contextType: 'dossier',
    suggestedActions: ['create-forum', 'view-relationships'],
  },
  {
    pattern: /^\/dossiers\/engagements/,
    contextType: 'dossier',
    suggestedActions: ['create-engagement', 'view-calendar'],
  },
  {
    pattern: /^\/dossiers\/persons/,
    contextType: 'dossier',
    suggestedActions: ['create-person', 'view-relationships'],
  },
  { pattern: /^\/dossiers\/topics/, contextType: 'dossier', suggestedActions: ['create-topic'] },
  {
    pattern: /^\/dossiers\/elected_officials/,
    contextType: 'dossier',
    suggestedActions: ['create-official', 'view-relationships'],
  },
  {
    pattern: /^\/dossiers\/working_groups/,
    contextType: 'dossier',
    suggestedActions: ['create-working-group', 'view-relationships'],
  },
  {
    pattern: /^\/dossiers/,
    contextType: 'dossier',
    suggestedActions: ['create-dossier', 'view-relationships'],
  },
  { pattern: /^\/tasks/, contextType: 'task', suggestedActions: ['create-task', 'view-my-work'] },
  {
    pattern: /^\/my-work/,
    contextType: 'task',
    suggestedActions: ['create-task', 'create-intake', 'view-calendar'],
  },
  {
    pattern: /^\/calendar/,
    contextType: 'calendar',
    suggestedActions: ['create-event', 'create-engagement'],
  },
  {
    pattern: /^\/analytics/,
    contextType: 'analytics',
    suggestedActions: ['export-report', 'view-dashboard'],
  },
  {
    pattern: /^\/settings/,
    contextType: 'settings',
    suggestedActions: ['view-profile', 'view-help'],
  },
  {
    pattern: /^\/admin/,
    contextType: 'admin',
    suggestedActions: ['view-users', 'view-monitoring'],
  },
  {
    pattern: /^\/commitments/,
    contextType: 'task',
    suggestedActions: ['create-commitment', 'view-my-work'],
  },
  {
    pattern: /^\/positions/,
    contextType: 'dossier',
    suggestedActions: ['create-position', 'view-dossiers'],
  },
  {
    pattern: /^\/briefs/,
    contextType: 'general',
    suggestedActions: ['create-brief', 'view-briefing-books'],
  },
]

export function CommandPalette({ className }: CommandPaletteProps) {
  const { t, i18n } = useTranslation('keyboard-shortcuts')
  const { t: tQs } = useTranslation('quickswitcher')
  const navigate = useNavigate()
  const location = useLocation()
  const isRTL = i18n.language === 'ar'

  const { isCommandPaletteOpen, closeCommandPalette, getAllShortcuts, formatShortcut, isMac } =
    useKeyboardShortcutContext()

  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current route context for suggestions
  const currentContext = useMemo((): RouteContext => {
    const pathname = location.pathname
    for (const ctx of routeContexts) {
      if (ctx.pattern && ctx.pattern.test(pathname)) {
        return ctx
      }
    }
    return { contextType: 'general', suggestedActions: [] }
  }, [location.pathname])

  // Use the QuickSwitcher search hook for dossier/work item search
  const {
    setQuery: setDossierQuery,
    dossiers,
    relatedWork,
    recentItems,
    isLoading: isSearchLoading,
    handleDossierSelect,
    handleWorkItemSelect,
    getDisplayTitle,
  } = useQuickSwitcherSearch({ enabled: isCommandPaletteOpen, debounceMs: 200 })

  // Sync search query with dossier query
  useEffect(() => {
    setDossierQuery(searchQuery)
  }, [searchQuery, setDossierQuery])

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
      const categoryArray = categories[shortcut.category]
      if (categoryArray) {
        categoryArray.push(shortcut)
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

  // Helper to navigate - uses type assertion for routes that may not be in the router yet
  const navigateTo = useCallback(
    (path: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: path as any })
      closeCommandPalette()
    },
    [navigate, closeCommandPalette],
  )

  // Create actions for power users
  const createActions = useMemo(
    () => [
      {
        id: 'create-task',
        label: t('createActions.newTask', 'Create New Task'),
        icon: CheckSquare,
        action: () => navigateTo('/tasks?action=create'),
        shortcut: formatShortcut('n', isMac ? ['meta'] : ['ctrl']),
        category: 'create',
      },
      {
        id: 'create-intake',
        label: t('createActions.newIntake', 'Create New Intake Request'),
        icon: Inbox,
        action: () => navigateTo('/my-work/intake?action=create'),
        shortcut: formatShortcut('i', isMac ? ['meta', 'shift'] : ['ctrl', 'shift']),
        category: 'create',
      },
      {
        id: 'create-dossier',
        label: t('createActions.newDossier', 'Create New Dossier'),
        icon: FolderPlus,
        action: () => navigateTo('/dossiers?action=create'),
        shortcut: formatShortcut('d', isMac ? ['meta', 'shift'] : ['ctrl', 'shift']),
        category: 'create',
      },
      {
        id: 'create-commitment',
        label: t('createActions.newCommitment', 'Create New Commitment'),
        icon: FileCheck,
        action: () => navigateTo('/commitments?action=create'),
        category: 'create',
      },
      {
        id: 'create-position',
        label: t('createActions.newPosition', 'Create New Position'),
        icon: MessageSquare,
        action: () => navigateTo('/positions?action=create'),
        category: 'create',
      },
      {
        id: 'create-country',
        label: t('createActions.newCountry', 'Create New Country Dossier'),
        icon: Globe,
        action: () => navigateTo('/dossiers/countries?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-organization',
        label: t('createActions.newOrganization', 'Create New Organization Dossier'),
        icon: Building2,
        action: () => navigateTo('/dossiers/organizations?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-forum',
        label: t('createActions.newForum', 'Create New Forum Dossier'),
        icon: UsersRound,
        action: () => navigateTo('/dossiers/forums?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-engagement',
        label: t('createActions.newEngagement', 'Create New Engagement'),
        icon: CalendarDays,
        action: () => navigateTo('/dossiers/engagements?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-person',
        label: t('createActions.newPerson', 'Create New Person Dossier'),
        icon: UserPlus,
        action: () => navigateTo('/dossiers/persons?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-topic',
        label: t('createActions.newTopic', 'Create New Topic Dossier'),
        icon: Tag,
        action: () => navigateTo('/dossiers/topics?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-working-group',
        label: t('createActions.newWorkingGroup', 'Create New Working Group'),
        icon: Briefcase,
        action: () => navigateTo('/dossiers/working_groups?action=create'),
        category: 'create-dossier',
      },
      {
        id: 'create-official',
        label: t('createActions.newElectedOfficial', 'Create New Elected Official'),
        icon: Vote,
        action: () => navigateTo('/dossiers/elected_officials?action=create'),
        category: 'create-dossier',
      },
    ],
    [t, navigateTo, formatShortcut, isMac],
  )

  // Quick actions for common navigation
  const quickActions = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        label: t('quickActions.dashboard', 'Go to Dashboard'),
        icon: LayoutDashboard,
        action: () => navigateTo('/dashboard'),
        shortcut: formatShortcut('d', ['alt']),
      },
      {
        id: 'nav-my-work',
        label: t('quickActions.myWork', 'Go to My Work'),
        icon: Briefcase,
        action: () => navigateTo('/my-work'),
        shortcut: formatShortcut('w', ['alt']),
      },
      {
        id: 'nav-dossiers',
        label: t('quickActions.dossiers', 'Go to Dossiers'),
        icon: Folder,
        action: () => navigateTo('/dossiers'),
        shortcut: formatShortcut('o', ['alt']),
      },
      {
        id: 'nav-calendar',
        label: t('quickActions.calendar', 'Go to Calendar'),
        icon: CalendarDays,
        action: () => navigateTo('/calendar'),
        shortcut: formatShortcut('c', ['alt']),
      },
      {
        id: 'nav-tasks',
        label: t('quickActions.tasks', 'Go to Tasks'),
        icon: CheckSquare,
        action: () => navigateTo('/tasks'),
        shortcut: formatShortcut('t', ['alt']),
      },
      {
        id: 'nav-analytics',
        label: t('quickActions.analytics', 'Go to Analytics'),
        icon: TrendingUp,
        action: () => navigateTo('/analytics'),
        shortcut: formatShortcut('a', ['alt']),
      },
      {
        id: 'nav-settings',
        label: t('quickActions.settings', 'Go to Settings'),
        icon: Settings,
        action: () => navigateTo('/settings'),
        shortcut: formatShortcut('s', ['alt']),
      },
      {
        id: 'nav-relationships',
        label: t('quickActions.relationships', 'View Relationship Graph'),
        icon: Network,
        action: () => navigateTo('/relationships'),
      },
      {
        id: 'nav-activity',
        label: t('quickActions.recentActivity', 'Recent Activity'),
        icon: History,
        action: () => navigateTo('/activity'),
      },
      {
        id: 'nav-briefs',
        label: t('quickActions.briefs', 'Go to Briefs'),
        icon: ScrollText,
        action: () => navigateTo('/briefs'),
      },
      {
        id: 'nav-briefing-books',
        label: t('quickActions.briefingBooks', 'Go to Briefing Books'),
        icon: BookOpen,
        action: () => navigateTo('/briefing-books'),
      },
      {
        id: 'nav-intelligence',
        label: t('quickActions.intelligence', 'Go to Intelligence'),
        icon: Brain,
        action: () => navigateTo('/intelligence'),
      },
      {
        id: 'nav-reports',
        label: t('quickActions.reports', 'Go to Reports'),
        icon: BarChart3,
        action: () => navigateTo('/reports'),
      },
      {
        id: 'nav-sla',
        label: t('quickActions.slaMonitoring', 'SLA Monitoring'),
        icon: Gauge,
        action: () => navigateTo('/sla-monitoring'),
      },
    ],
    [t, formatShortcut, navigateTo],
  )

  // Context-aware suggestions based on current page
  const contextSuggestions = useMemo(() => {
    const suggestions: Array<{
      id: string
      label: string
      icon: React.ElementType
      action: () => void
    }> = []

    for (const actionId of currentContext.suggestedActions) {
      // Find in create actions
      const createAction = createActions.find((a) => a.id === actionId)
      if (createAction) {
        suggestions.push({
          id: createAction.id,
          label: createAction.label,
          icon: createAction.icon,
          action: createAction.action,
        })
        continue
      }

      // Find in quick actions
      const quickAction = quickActions.find((a) => a.id === `nav-${actionId.replace('view-', '')}`)
      if (quickAction) {
        suggestions.push({
          id: quickAction.id,
          label: quickAction.label,
          icon: quickAction.icon,
          action: quickAction.action,
        })
      }
    }

    return suggestions
  }, [currentContext, createActions, quickActions])

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

  // Filter create actions
  const filteredCreateActions = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show only primary create actions when not searching
      return createActions.filter((a) => a.category === 'create')
    }

    const query = searchQuery.toLowerCase()
    // When searching, include all create actions
    return createActions.filter(
      (action) =>
        action.label.toLowerCase().includes(query) || action.id.toLowerCase().includes(query),
    )
  }, [createActions, searchQuery])

  // Handle shortcut item selection
  const handleSelect = useCallback(
    (shortcut: KeyboardShortcut) => {
      shortcut.action()
      closeCommandPalette()
    },
    [closeCommandPalette],
  )

  // Handle dossier selection
  const handleDossierClick = useCallback(
    (dossier: QuickSwitcherDossier) => {
      const url = handleDossierSelect(dossier)
      navigate({ to: url })
      closeCommandPalette()
      setSearchQuery('')
    },
    [handleDossierSelect, navigate, closeCommandPalette],
  )

  // Handle work item selection
  const handleWorkItemClick = useCallback(
    (item: QuickSwitcherWorkItem) => {
      const url = handleWorkItemSelect(item)
      navigate({ to: url })
      closeCommandPalette()
      setSearchQuery('')
    },
    [handleWorkItemSelect, navigate, closeCommandPalette],
  )

  // Get dossier badge info
  const getDossierBadge = (type: DossierType) => {
    const label = isRTL ? dossierTypeLabels[type]?.ar : dossierTypeLabels[type]?.en
    const color = dossierTypeBadgeColors[type]
    return { label, color }
  }

  // Get work item badge info
  const getWorkItemBadge = (type: string) => {
    const label = isRTL ? workTypeLabels[type]?.ar : workTypeLabels[type]?.en
    const color = workTypeBadgeColors[type] || 'bg-gray-100 text-gray-700'
    return { label, color }
  }

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

          {/* Loading indicator for search */}
          {isSearchLoading && searchQuery.trim().length >= 2 && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="me-2 size-4 animate-spin" />
              {tQs('searching', 'Searching...')}
            </div>
          )}

          {/* Context-Aware Suggestions (when no search query and context exists) */}
          {searchQuery.trim().length < 2 && contextSuggestions.length > 0 && (
            <>
              <CommandGroup heading={t('contextSuggestions.title', 'Suggested')}>
                {contextSuggestions.map((suggestion) => {
                  const SuggestionIcon = suggestion.icon
                  return (
                    <CommandItem
                      key={`ctx-${suggestion.id}`}
                      value={`ctx-${suggestion.id}`}
                      onSelect={suggestion.action}
                      className="flex items-center gap-3"
                    >
                      <Sparkles className="size-3 shrink-0 text-amber-500" />
                      <SuggestionIcon className="size-4 shrink-0" />
                      <span className="flex-1">{suggestion.label}</span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        {t('contextSuggestions.suggested', 'Suggested')}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Recent Items (when no search query) */}
          {searchQuery.trim().length < 2 && recentItems.length > 0 && (
            <>
              <CommandGroup heading={tQs('recent', 'Recent')}>
                {recentItems.slice(0, 5).map((item) => {
                  let RecentIcon: React.ElementType = Clock
                  if (item.dossierType && item.dossierType in dossierTypeIcons) {
                    RecentIcon = dossierTypeIcons[item.dossierType as DossierType]
                  } else if (item.type in workTypeIcons) {
                    RecentIcon = workTypeIcons[item.type] || Clock
                  }
                  const displayTitle = isRTL
                    ? item.title_ar || item.title_en
                    : item.title_en || item.title_ar
                  return (
                    <CommandItem
                      key={`recent-${item.id}`}
                      value={`recent-${item.id}`}
                      onSelect={() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        navigate({ to: item.url as any })
                        closeCommandPalette()
                        setSearchQuery('')
                      }}
                      className="flex items-center gap-3"
                    >
                      <RecentIcon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{displayTitle}</span>
                      {item.dossierType && (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-xs ${dossierTypeBadgeColors[item.dossierType as DossierType] || ''}`}
                        >
                          {isRTL
                            ? dossierTypeLabels[item.dossierType as DossierType]?.ar
                            : dossierTypeLabels[item.dossierType as DossierType]?.en}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* DOSSIERS Section (when searching) */}
          {searchQuery.trim().length >= 2 && dossiers.length > 0 && (
            <>
              <CommandGroup heading={tQs('dossiers_section', 'Dossiers')}>
                {dossiers.map((dossier) => {
                  const DossierIcon: React.ElementType = dossierTypeIcons[dossier.type] || Folder
                  const badge = getDossierBadge(dossier.type)
                  return (
                    <CommandItem
                      key={`dossier-${dossier.id}`}
                      value={`dossier-${dossier.id}-${dossier.name_en}`}
                      onSelect={() => handleDossierClick(dossier)}
                      className="flex items-center gap-3"
                    >
                      <DossierIcon className="size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="truncate">
                          {getDisplayTitle({ name_en: dossier.name_en, name_ar: dossier.name_ar })}
                        </span>
                        {(isRTL ? dossier.description_ar : dossier.description_en) && (
                          <p className="truncate text-xs text-muted-foreground">
                            {isRTL ? dossier.description_ar : dossier.description_en}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className={`shrink-0 text-xs ${badge.color}`}>
                        {badge.label}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {relatedWork.length > 0 && <CommandSeparator />}
            </>
          )}

          {/* RELATED WORK Section (when searching) */}
          {searchQuery.trim().length >= 2 && relatedWork.length > 0 && (
            <>
              <CommandGroup heading={tQs('related_work_section', 'Related Work')}>
                {relatedWork.map((item) => {
                  const WorkIcon: React.ElementType = workTypeIcons[item.type] || FileText
                  const badge = getWorkItemBadge(item.type)
                  return (
                    <CommandItem
                      key={`work-${item.id}`}
                      value={`work-${item.id}-${item.title_en}`}
                      onSelect={() => handleWorkItemClick(item)}
                      className="flex items-center gap-3"
                    >
                      <WorkIcon className="size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="truncate">
                          {getDisplayTitle({ title_en: item.title_en, title_ar: item.title_ar })}
                        </span>
                        {item.dossier_context && (
                          <p className="truncate text-xs text-muted-foreground">
                            {isRTL
                              ? item.dossier_context.name_ar || item.dossier_context.name_en
                              : item.dossier_context.name_en || item.dossier_context.name_ar}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className={`shrink-0 text-xs ${badge.color}`}>
                        {badge.label}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Create Actions */}
          {filteredCreateActions.length > 0 && (
            <>
              <CommandGroup heading={t('createActions.title', 'Create New')}>
                {filteredCreateActions.map((action) => {
                  const CreateIcon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={action.action}
                      className="flex items-center gap-3"
                    >
                      <PlusCircle className="size-3 shrink-0 text-green-500" />
                      <CreateIcon className="size-4 shrink-0" />
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <CommandGroup heading={t('quickActions.title', 'Quick Navigation')}>
                {filteredQuickActions.map((action) => {
                  const QuickIcon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={action.action}
                      className="flex items-center gap-3"
                    >
                      <QuickIcon className="size-4 shrink-0" />
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
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
                  const ShortcutIcon = getShortcutIcon(shortcut)
                  return (
                    <CommandItem
                      key={shortcut.id}
                      value={shortcut.id}
                      onSelect={() => handleSelect(shortcut)}
                      className="flex items-center gap-3"
                    >
                      <ShortcutIcon className="size-4 shrink-0" />
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
