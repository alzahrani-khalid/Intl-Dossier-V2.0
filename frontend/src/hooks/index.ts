/**
 * Hooks - Public API
 *
 * This module exports all custom React hooks used throughout the application.
 * Hooks are organized into 40+ categories for easy discovery and maintenance.
 *
 * @example Basic Hook Import
 * ```typescript
 * import { useAuth, useDossier, useToast } from '@/hooks'
 *
 * function MyComponent() {
 *   const { user } = useAuth()
 *   const { data: dossier } = useDossier(dossierId)
 *   const { toast } = useToast()
 *   // ...
 * }
 * ```
 *
 * @example Type Import (for exported types from hooks)
 * ```typescript
 * import {
 *   useAuth,
 *   type DossierPresenceUser,
 *   type WorkItem
 * } from '@/hooks'
 * ```
 *
 * @example Category-Specific Imports
 * ```typescript
 * // Dossier operations
 * import { useDossier, useCreateDossier, useArchiveDossier } from '@/hooks'
 *
 * // Calendar & Events
 * import { useCalendar, useCreateCalendarEvent, useRecurringEvents } from '@/hooks'
 *
 * // AI & Intelligence
 * import { useAIChat, useSemanticSearch, useContextualSuggestions } from '@/hooks'
 * ```
 *
 * @migration Migration from Direct Imports
 * If you're currently importing hooks directly from their files:
 *
 * ```typescript
 * // ❌ Old: Direct import (deprecated)
 * import { useAuth } from '@/hooks/useAuth'
 * import { useDossier } from '@/hooks/useDossier'
 * import { useToast } from '@/hooks/use-toast'
 *
 * // ✅ New: Import from barrel export
 * import { useAuth, useDossier, useToast } from '@/hooks'
 * ```
 *
 * Benefits of barrel exports:
 * - Cleaner imports (single import statement)
 * - Easier refactoring (import paths don't change if hook file moves)
 * - Better tree-shaking with modern bundlers
 * - Centralized public API surface
 *
 * @note Hook Categories
 * This module organizes hooks into 40+ categories including:
 * - Access & Security, After Action, AI & Intelligence
 * - Calendar & Events, Collaboration, Commitments
 * - Documents, Dossiers, Engagements
 * - Forms, Health & Monitoring, Kanban
 * - Navigation, Notifications, Relationships
 * - Search, Tasks, Timeline, Workflows, and more
 *
 * Browse the categories below to discover available hooks.
 */

// ============================================================================
// Access & Security Hooks
// ============================================================================

export * from './use-access-review'
export * from './useAuth'
export * from './useFieldPermissions'
export * from './usePermissionError'

// ============================================================================
// After Action Hooks
// ============================================================================

export * from './use-after-action'
export * from './useAfterAction'
export * from './usePublishAfterAction'

// ============================================================================
// AI & Intelligence Hooks
// ============================================================================

export * from './use-ai-extraction'
export * from './use-ai-suggestions'
export * from './useAIChat'
export * from './useAIHealth'
export * from './useAIInteractionLogs'
export * from './useAIPolicyBriefOutline'
export * from './useAISummary'
export * from './useContextualSuggestions'
export * from './useEmbeddingQueue'
export * from './useIntelligence'
export * from './useSemanticSearch'

// ============================================================================
// Assignment & Work Queue Hooks
// ============================================================================

export * from './useAssignmentDetail'
export * from './useAssignmentQueue'
export * from './useAutoAssign'
export * from './useCapacityCheck'
export * from './useCompleteAssignment'
export * from './useEscalateAssignment'
export * from './useMyAssignments'
export * from './useRelatedAssignments'

// ============================================================================
// Audit & Compliance Hooks
// ============================================================================

export * from './use-compliance'
export * from './useAuditLogs'
export * from './useComplianceRules'
export * from './useContentExpiration'
export * from './useRetentionPolicies'

// ============================================================================
// Bulk Operations Hooks
// ============================================================================

export * from './use-bulk-selection'
export * from './useBulkActions'
export * from './useBulkDossierStats'
export * from './useBulkKanbanOperations'

// ============================================================================
// Calendar & Events Hooks
// ============================================================================

export * from './useCalendar'
export * from './useCalendarConflicts'
export * from './useCalendarEvents'
export * from './useCalendarSync'
export * from './useCreateCalendarEvent'
export * from './useRecurringEvents'
export * from './useTimelineEvents'
export * from './useUpdateCalendarEvent'

// ============================================================================
// Collaboration Hooks
// ============================================================================

export * from './use-contributors'
export * from './useCollaborativeEditing'
export * from './useComments'
export * from './useDossierPresence'
export * from './usePresence'
export * from './useTeamCollaboration'

// ============================================================================
// Commitment & Deliverables Hooks
// ============================================================================

export * from './useCommitmentDeliverables'
export * from './useCommitments'
export * from './useDeliverables'

// ============================================================================
// CQRS & Event Sourcing Hooks
// ============================================================================

export * from './useCQRS'
export * from './useEventStore'

// ============================================================================
// Dashboard & Analytics Hooks
// ============================================================================

export * from './useAnalyticsDashboard'
export * from './useDashboardHealthAggregations'
export * from './useDossierDashboard'
export * from './useRoleBasedDashboard'
export * from './useWidgetDashboard'

// ============================================================================
// Data Import/Export Hooks
// ============================================================================

export * from './useDossierExport'
export * from './useExportData'
export * from './useGraphExport'
export * from './useImportChecklistTemplate'
export * from './useImportData'
export * from './useSmartImportSuggestions'

// ============================================================================
// Delegation Hooks
// ============================================================================

export * from './use-delegation'

// ============================================================================
// Document Hooks
// ============================================================================

export * from './useCitations'
export * from './useDocumentClassification'
export * from './useDocumentContentSearch'
export * from './useDocumentOCR'
export * from './useDocumentPreview'
export * from './useDocumentTemplates'
export * from './useDocumentVersions'
export * from './useDocuments'
export * from './useOCR'
export * from './useUploadDocument'

// ============================================================================
// Dossier Core Hooks
// ============================================================================

export * from './useArchiveDossier'
export * from './useCreateDossier'
export * from './useDossier'
export * from './useDossierActivityTimeline'
export * from './useDossierContext'
export * from './useDossierOverview'
export * from './useDossierRecommendations'
export * from './useDossierSearch'
export * from './useDossierStatistics'
export * from './useDossierStats'
export * from './useDossiers'
export * from './useUnifiedDossierActivity'

// ============================================================================
// Dossier Linking Hooks
// ============================================================================

export * from './useAddToDossierActions'
export * from './useCreateWorkItemDossierLinks'
export * from './useDeleteWorkItemDossierLink'
export * from './useDossierPositionLinks'
export * from './useWorkItemDossierLinks'

// ============================================================================
// Engagement Hooks
// ============================================================================

export * from './useEngagement'
export * from './useEngagementBriefs'
export * from './useEngagementKanban'
export * from './useEngagementPositions'
export * from './useEngagementRecommendations'
export * from './useEngagements'

// ============================================================================
// Entity Management Hooks
// ============================================================================

export * from './use-entity-links'
export * from './use-entity-search'
export * from './useEntityComparison'
export * from './useEntityDependencies'
export * from './useEntityNavigation'
export * from './useEntityTemplates'

// ============================================================================
// Error Handling Hooks
// ============================================================================

export * from './useActionableErrors'
export * from './useEmergencyCorrect'

// ============================================================================
// Field Management Hooks
// ============================================================================

export * from './useFieldHistory'
export * from './useFieldValidation'

// ============================================================================
// Form Hooks
// ============================================================================

export * from './useAutoSaveForm'
export * from './useProgressiveForm'

// ============================================================================
// Forum Hooks
// ============================================================================

export * from './useForums'

// ============================================================================
// Geographic & Visualization Hooks
// ============================================================================

export * from './useGeographicVisualization'
export * from './useGraphTraversal'

// ============================================================================
// Health & Monitoring Hooks
// ============================================================================

export * from './useHealthScore'
export * from './useRelationshipHealth'
export * from './useSLAMonitoring'

// ============================================================================
// Intake Hooks
// ============================================================================

export * from './useIntakeApi'

// ============================================================================
// Kanban Hooks
// ============================================================================

export * from './useKanbanRealtime'
export * from './useUnifiedKanban'

// ============================================================================
// Language & Internationalization Hooks
// ============================================================================

export * from './use-language'
export * from './useMultiLangContent'
export * from './useTranslateContent'

// ============================================================================
// Legislation & Agreements Hooks
// ============================================================================

export * from './useBilateralAgreements'
export * from './useLegislation'
export * from './useMouNotifications'
export * from './useMouRenewals'

// ============================================================================
// Link Management Hooks
// ============================================================================

export * from './use-link-reorder'

// ============================================================================
// Meeting Hooks
// ============================================================================

export * from './useMeetingAgenda'
export * from './useMeetingMinutes'

// ============================================================================
// Mobile & Touch Hooks
// ============================================================================

export * from './use-mobile'
export * from './useHapticFeedback'
export * from './usePullToRefresh'
export * from './useSwipeGesture'
export * from './useTouchGraphControls'

// ============================================================================
// Navigation Hooks
// ============================================================================

export * from './useKeyboardNavigation'
export * from './useKeyboardShortcuts'
export * from './useNavigation'
export * from './useNavigationState'
export * from './useQuickSwitcherSearch'

// ============================================================================
// Notification Hooks
// ============================================================================

export * from './useEmailNotifications'
export * from './useNotificationCenter'
export * from './useNotifications'

// ============================================================================
// Offline & Sync Hooks
// ============================================================================

export * from './use-offline-state'
export * from './useAvailabilityPolling'
export * from './useLastSyncInfo'

// ============================================================================
// Onboarding Hooks
// ============================================================================

export * from './useOnboardingChecklist'

// ============================================================================
// Optimistic Updates Hooks
// ============================================================================

export * from './use-optimistic-locking'
export * from './useConsistencyCheck'

// ============================================================================
// Organization Hooks
// ============================================================================

export * from './useOrganizationBenchmarks'

// ============================================================================
// Person Hooks
// ============================================================================

export * from './useKeyOfficials'
export * from './usePersonDossiers'
export * from './usePersons'

// ============================================================================
// Position Hooks
// ============================================================================

export * from './useApprovePosition'
export * from './useAttachPosition'
export * from './useCreatePosition'
export * from './useCreatePositionDossierLink'
export * from './useDeletePositionDossierLink'
export * from './useDetachPosition'
export * from './usePosition'
export * from './usePositionAnalytics'
export * from './usePositionAttachments'
export * from './usePositionConsistencyCheck'
export * from './usePositionDossierLinks'
export * from './usePositionSuggestions'
export * from './usePositions'
export * from './useSubmitPosition'
export * from './useUpdatePosition'

// ============================================================================
// Preferences & Settings Hooks
// ============================================================================

export * from './use-preferences'
export * from './useFilterPresets'
export * from './useSavedSearchTemplates'
export * from './useSavedSearches'
export * from './useViewPreferences'

// ============================================================================
// Progress & Tracking Hooks
// ============================================================================

export * from './useMilestonePlanning'
export * from './useProgressTracker'

// ============================================================================
// Queue Management Hooks
// ============================================================================

export * from './use-queue-filters'
export * from './use-waiting-queue-actions'
export * from './useWorkQueueCounts'

// ============================================================================
// Relationship Hooks
// ============================================================================

export * from './useContactRelationships'
export * from './useCreateRelationship'
export * from './useDeleteRelationship'
export * from './useRelationshipSuggestions'
export * from './useRelationships'

// ============================================================================
// Reporting Hooks
// ============================================================================

export * from './useBriefingBooks'
export * from './useBriefingPackStatus'
export * from './useGenerateBrief'
export * from './useGenerateBriefingPack'
export * from './useReportBuilder'
export * from './useScheduledReports'

// ============================================================================
// Responsive & UI Hooks
// ============================================================================

export * from './use-design-tokens'
export * from './use-outside-click'
export * from './use-responsive'
export * from './use-theme'
export * from './use-toast'
export * from './useCollapsingHeader'
export * from './useContextAwareFAB'
export * from './useInView'
export * from './usePreviewLayouts'
export * from './useProgressiveDisclosure'
export * from './useThemes'

// ============================================================================
// Role Management Hooks
// ============================================================================

export * from './use-role-assignment'
export * from './use-role-change-listener'

// ============================================================================
// Sample Data Hooks
// ============================================================================

export * from './useSampleData'

// ============================================================================
// Search Hooks
// ============================================================================

export * from './useAdvancedSearch'
export * from './useDossierFirstSearch'
export * from './useEnhancedSearch'
export * from './useNoResultsSuggestions'
export * from './useSearch'

// ============================================================================
// Session & Storage Hooks
// ============================================================================

export * from './useSessionStorage'

// ============================================================================
// Stakeholder Hooks
// ============================================================================

export * from './useStakeholderInfluence'
export * from './useStakeholderTimeline'

// ============================================================================
// Suggestions Hooks
// ============================================================================

export * from './useDuplicateDetection'
export * from './useSuggestions'
export * from './useUpdateSuggestionAction'
export * from './useWGMemberSuggestions'

// ============================================================================
// Tag Hooks
// ============================================================================

export * from './useTagHierarchy'

// ============================================================================
// Task & Checklist Hooks
// ============================================================================

export * from './use-tasks'
export * from './useAddChecklistItem'
export * from './useAddComment'
export * from './useToggleChecklistItem'
export * from './useToggleReaction'

// ============================================================================
// Tenant Hooks
// ============================================================================

export * from './useTenantQuery'

// ============================================================================
// Timeline Hooks
// ============================================================================

export * from './useUnifiedTimeline'

// ============================================================================
// Unified Work Hooks
// ============================================================================

export * from './useUnifiedWork'
export * from './useUnifiedWorkRealtime'
export * from './useWorkItemSpecification'

// ============================================================================
// User Management Hooks
// ============================================================================

export * from './use-user-deactivation'
export * from './use-user-management'
export * from './useUpdateAvailability'

// ============================================================================
// Utility Hooks
// ============================================================================

export * from './useActivityFeed'
export * from './useDebouncedValue'
export * from './useInteractions'
export * from './useObserverAction'
export * from './useResolveDossierContext'
export * from './useScenarioSandbox'
export * from './useVoiceMemos'
export * from './useWatchlist'

// ============================================================================
// Webhook Hooks
// ============================================================================

export * from './useWebhooks'

// ============================================================================
// Working Group Hooks
// ============================================================================

export * from './useWorkingGroups'

// ============================================================================
// Workflow Hooks
// ============================================================================

export * from './useEditWorkflow'
export * from './useStageTransition'
export * from './useUpdateWorkflowStage'
export * from './useWorkflowAutomation'
