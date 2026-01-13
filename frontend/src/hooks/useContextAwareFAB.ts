/**
 * useContextAwareFAB Hook
 *
 * Provides context-aware FAB configuration based on the current route.
 * Determines the primary action and speed dial actions for each screen context.
 */

import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Edit,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  FolderOpen,
  Search,
  ClipboardList,
  Building2,
  Globe,
  LayoutList,
  FileSpreadsheet,
  UserPlus,
  CalendarPlus,
  Upload,
  BookOpen,
  Settings,
  CheckSquare,
} from 'lucide-react'
import type { FABAction, SpeedDialAction } from '@/components/ui/context-aware-fab'

export interface UseContextAwareFABConfig {
  /** Override the current route path */
  currentRoute?: string
  /** Custom callback for creating entities */
  onCreateDossier?: () => void
  onCreateEngagement?: () => void
  onCreateBrief?: () => void
  onCreateEvent?: () => void
  onCreateTask?: () => void
  onCreatePerson?: () => void
  onCreateForum?: () => void
  onOpenSearch?: () => void
  onUploadDocument?: () => void
  onAddComment?: () => void
  onEditDossier?: (id: string) => void
  onLogAfterAction?: (engagementId: string) => void
}

export interface UseContextAwareFABResult {
  /** Context-based actions map for the ContextAwareFAB component */
  contextActions: Record<string, FABAction>
  /** Speed dial actions for the current context */
  speedDialActions: SpeedDialAction[]
  /** Default action when no context matches */
  defaultAction: FABAction
  /** Current route path */
  currentRoute: string
  /** Whether the FAB should be visible on this route */
  shouldShowFAB: boolean
}

/**
 * Hook to configure context-aware FAB based on current route
 */
export function useContextAwareFAB(
  config: UseContextAwareFABConfig = {},
): UseContextAwareFABResult {
  const { t } = useTranslation('fab')
  const location = useLocation()
  const navigate = useNavigate()

  const currentRoute = config.currentRoute || location.pathname

  // Default navigation handlers
  const handleCreateDossier = useCallback(() => {
    config.onCreateDossier?.() || navigate({ to: '/dossiers/create' })
  }, [config.onCreateDossier, navigate])

  const handleCreateEngagement = useCallback(() => {
    config.onCreateEngagement?.() || navigate({ to: '/engagements', search: { create: true } })
  }, [config.onCreateEngagement, navigate])

  const handleCreateEvent = useCallback(() => {
    config.onCreateEvent?.() || navigate({ to: '/calendar', search: { create: true } })
  }, [config.onCreateEvent, navigate])

  const handleCreateTask = useCallback(() => {
    config.onCreateTask?.() || navigate({ to: '/kanban', search: { create: true } })
  }, [config.onCreateTask, navigate])

  const handleCreatePerson = useCallback(() => {
    config.onCreatePerson?.() || navigate({ to: '/persons', search: { create: true } })
  }, [config.onCreatePerson, navigate])

  const handleCreateForum = useCallback(() => {
    config.onCreateForum?.() || navigate({ to: '/forums', search: { create: true } })
  }, [config.onCreateForum, navigate])

  const handleOpenSearch = useCallback(() => {
    config.onOpenSearch?.() || navigate({ to: '/search' })
  }, [config.onOpenSearch, navigate])

  const handleUploadDocument = useCallback(() => {
    config.onUploadDocument?.()
  }, [config.onUploadDocument])

  const handleAddComment = useCallback(() => {
    config.onAddComment?.()
  }, [config.onAddComment])

  // Build context actions based on routes
  const contextActions = useMemo<Record<string, FABAction>>(() => {
    return {
      // Dossier List
      '/dossiers': {
        icon: Plus,
        label: t('contexts.dossierList.primary'),
        onClick: handleCreateDossier,
        ariaLabel: t('contexts.dossierList.description'),
      },
      // Dossier Detail (pattern match)
      '/dossiers/:id': {
        icon: Edit,
        label: t('contexts.dossierDetail.primary'),
        onClick: () => {
          const id = currentRoute.split('/').pop()
          config.onEditDossier?.(id || '')
        },
        ariaLabel: t('contexts.dossierDetail.description'),
      },
      // Engagement List
      '/engagements': {
        icon: Plus,
        label: t('contexts.engagementList.primary'),
        onClick: handleCreateEngagement,
        ariaLabel: t('contexts.engagementList.description'),
      },
      // Engagement Detail
      '/engagements/:id': {
        icon: FileText,
        label: t('contexts.engagementDetail.primary'),
        onClick: () => {
          const id = currentRoute.split('/').pop()
          config.onLogAfterAction?.(id || '')
        },
        ariaLabel: t('contexts.engagementDetail.description'),
      },
      // Calendar
      '/calendar': {
        icon: CalendarPlus,
        label: t('contexts.calendar.primary'),
        onClick: handleCreateEvent,
        ariaLabel: t('contexts.calendar.description'),
      },
      // Kanban/Tasks
      '/kanban': {
        icon: Plus,
        label: t('contexts.kanban.primary'),
        onClick: handleCreateTask,
        ariaLabel: t('contexts.kanban.description'),
      },
      '/my-work': {
        icon: Plus,
        label: t('contexts.kanban.primary'),
        onClick: handleCreateTask,
        ariaLabel: t('contexts.kanban.description'),
      },
      // Search
      '/search': {
        icon: Search,
        label: t('contexts.search.primary'),
        onClick: handleOpenSearch,
        ariaLabel: t('contexts.search.description'),
      },
      // Dashboard
      '/dashboard': {
        icon: Plus,
        label: t('contexts.dashboard.primary'),
        onClick: handleCreateDossier,
        ariaLabel: t('contexts.dashboard.description'),
      },
      '/': {
        icon: Plus,
        label: t('contexts.dashboard.primary'),
        onClick: handleCreateDossier,
        ariaLabel: t('contexts.dashboard.description'),
      },
      // Persons
      '/persons': {
        icon: UserPlus,
        label: t('contexts.persons.primary'),
        onClick: handleCreatePerson,
        ariaLabel: t('contexts.persons.description'),
      },
      // Forums
      '/forums': {
        icon: Plus,
        label: t('contexts.forums.primary'),
        onClick: handleCreateForum,
        ariaLabel: t('contexts.forums.description'),
      },
      // Briefing Books
      '/briefing-books': {
        icon: Plus,
        label: t('speedDialActions.newBrief'),
        onClick: () => navigate({ to: '/briefing-books', search: { create: true } }),
        ariaLabel: t('speedDialActions.newBrief'),
      },
      // Intake Queue
      '/intake': {
        icon: Plus,
        label: t('contextActions.addNew'),
        onClick: () => navigate({ to: '/intake', search: { create: true } }),
        ariaLabel: t('contextActions.addNew'),
      },
    }
  }, [
    t,
    currentRoute,
    handleCreateDossier,
    handleCreateEngagement,
    handleCreateEvent,
    handleCreateTask,
    handleCreatePerson,
    handleCreateForum,
    handleOpenSearch,
    config.onEditDossier,
    config.onLogAfterAction,
    navigate,
  ])

  // Build speed dial actions based on current context
  const speedDialActions = useMemo<SpeedDialAction[]>(() => {
    // Common quick actions
    const commonActions: SpeedDialAction[] = [
      {
        icon: FolderOpen,
        label: t('speedDialActions.newDossier'),
        onClick: handleCreateDossier,
      },
      {
        icon: Calendar,
        label: t('speedDialActions.scheduleEvent'),
        onClick: handleCreateEvent,
      },
      {
        icon: ClipboardList,
        label: t('speedDialActions.newTask'),
        onClick: handleCreateTask,
      },
    ]

    // Route-specific additional actions
    if (currentRoute.startsWith('/dossiers/') && currentRoute !== '/dossiers/create') {
      return [
        {
          icon: Upload,
          label: t('speedDialActions.uploadDocument'),
          onClick: handleUploadDocument,
        },
        {
          icon: MessageSquare,
          label: t('speedDialActions.addNote'),
          onClick: handleAddComment,
        },
        {
          icon: Users,
          label: t('speedDialActions.addContact'),
          onClick: handleCreatePerson,
        },
        {
          icon: FileSpreadsheet,
          label: t('speedDialActions.generateReport'),
          onClick: () => navigate({ to: '/reports/index' }),
        },
      ]
    }

    if (currentRoute.startsWith('/engagements/') && currentRoute !== '/engagements') {
      return [
        {
          icon: FileText,
          label: t('speedDialActions.newBrief'),
          onClick: () => {
            const id = currentRoute.split('/').pop()
            config.onLogAfterAction?.(id || '')
          },
        },
        {
          icon: CheckSquare,
          label: t('speedDialActions.newCommitment'),
          onClick: () => navigate({ to: '/commitments', search: { create: true } }),
        },
        {
          icon: Calendar,
          label: t('speedDialActions.scheduleEvent'),
          onClick: handleCreateEvent,
        },
      ]
    }

    if (currentRoute === '/dashboard' || currentRoute === '/') {
      return [
        {
          icon: FolderOpen,
          label: t('speedDialActions.newDossier'),
          onClick: handleCreateDossier,
        },
        {
          icon: Users,
          label: t('speedDialActions.newEngagement'),
          onClick: handleCreateEngagement,
        },
        {
          icon: Calendar,
          label: t('speedDialActions.scheduleEvent'),
          onClick: handleCreateEvent,
        },
        {
          icon: Search,
          label: t('contextActions.search'),
          onClick: handleOpenSearch,
        },
      ]
    }

    if (currentRoute === '/calendar') {
      return [
        {
          icon: CalendarPlus,
          label: t('speedDialActions.newEvent'),
          onClick: handleCreateEvent,
        },
        {
          icon: Users,
          label: t('speedDialActions.newEngagement'),
          onClick: handleCreateEngagement,
        },
      ]
    }

    // Default speed dial actions
    return commonActions
  }, [
    t,
    currentRoute,
    handleCreateDossier,
    handleCreateEngagement,
    handleCreateEvent,
    handleCreateTask,
    handleCreatePerson,
    handleUploadDocument,
    handleAddComment,
    handleOpenSearch,
    config.onLogAfterAction,
    navigate,
  ])

  // Default action (generic "add" action)
  const defaultAction = useMemo<FABAction>(() => {
    return {
      icon: Plus,
      label: t('contextActions.addNew'),
      onClick: handleCreateDossier,
      ariaLabel: t('contextActions.addNew'),
    }
  }, [t, handleCreateDossier])

  // Determine if FAB should be visible on this route
  const shouldShowFAB = useMemo(() => {
    // Hide on certain routes
    const hiddenRoutes = ['/login', '/auth', '/settings']
    return !hiddenRoutes.some((route) => currentRoute.startsWith(route))
  }, [currentRoute])

  return {
    contextActions,
    speedDialActions,
    defaultAction,
    currentRoute,
    shouldShowFAB,
  }
}

export default useContextAwareFAB
