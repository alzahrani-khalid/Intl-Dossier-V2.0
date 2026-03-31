import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './en/common.json'
import arCommon from './ar/common.json'
import enIntake from './en/intake.json'
import arIntake from './ar/intake.json'
import enDossiers from './en/dossiers.json'
import arDossiers from './ar/dossiers.json'
import enDossier from './en/dossier.json'
import arDossier from './ar/dossier.json'
import enPositions from './en/positions.json'
import arPositions from './ar/positions.json'
import enAssignments from './en/assignments.json'
import arAssignments from './ar/assignments.json'
import enForums from './en/forums.json'
import arForums from './ar/forums.json'
import enContacts from './en/contacts.json'
import arContacts from './ar/contacts.json'
import enCommitments from './en/commitments.json'
import arCommitments from './ar/commitments.json'
import enWorkCreation from './en/work-creation.json'
import arWorkCreation from './ar/work-creation.json'
import enUnifiedKanban from './en/unified-kanban.json'
import arUnifiedKanban from './ar/unified-kanban.json'
import enPersons from './en/persons.json'
import arPersons from './ar/persons.json'
import enWorkingGroups from './en/working-groups.json'
import arWorkingGroups from './ar/working-groups.json'
import enEngagements from './en/engagements.json'
import arEngagements from './ar/engagements.json'
import enActivityFeed from './en/activity-feed.json'
import arActivityFeed from './ar/activity-feed.json'
import enEngagementBriefs from './en/engagement-briefs.json'
import arEngagementBriefs from './ar/engagement-briefs.json'
import enRelationships from './en/relationships.json'
import arRelationships from './ar/relationships.json'
import enAdvancedSearch from './en/advanced-search.json'
import arAdvancedSearch from './ar/advanced-search.json'
import enAuditLogs from './en/audit-logs.json'
import arAuditLogs from './ar/audit-logs.json'
import enBulkActions from './en/bulk-actions.json'
import arBulkActions from './ar/bulk-actions.json'
import enDashboardWidgets from './en/dashboard-widgets.json'
import arDashboardWidgets from './ar/dashboard-widgets.json'
import enDashboard from './en/dashboard.json'
import arDashboard from './ar/dashboard.json'
import enDelegation from './en/delegation.json'
import arDelegation from './ar/delegation.json'
import enEmail from './en/email.json'
import arEmail from './ar/email.json'
import enCalendar from './en/calendar.json'
import arCalendar from './ar/calendar.json'
import enExportImport from './en/export-import.json'
import arExportImport from './ar/export-import.json'
import enNotificationCenter from './en/notification-center.json'
import arNotificationCenter from './ar/notification-center.json'
import enGraphTraversal from './en/graph-traversal.json'
import arGraphTraversal from './ar/graph-traversal.json'
import enComments from './en/comments.json'
import arComments from './ar/comments.json'
import enAnalytics from './en/analytics.json'
import arAnalytics from './ar/analytics.json'
import enSla from './en/sla.json'
import arSla from './ar/sla.json'
import enTags from './en/tags.json'
import arTags from './ar/tags.json'
import enWebhooks from './en/webhooks.json'
import arWebhooks from './ar/webhooks.json'
import enCalendarSync from './en/calendar-sync.json'
import arCalendarSync from './ar/calendar-sync.json'
import enReportBuilder from './en/report-builder.json'
import arReportBuilder from './ar/report-builder.json'
import enEntityComparison from './en/entity-comparison.json'
import arEntityComparison from './ar/entity-comparison.json'
import enAvailabilityPolling from './en/availability-polling.json'
import arAvailabilityPolling from './ar/availability-polling.json'
import enEngagementRecommendations from './en/engagement-recommendations.json'
import arEngagementRecommendations from './ar/engagement-recommendations.json'
import enWorkflowAutomation from './en/workflow-automation.json'
import arWorkflowAutomation from './ar/workflow-automation.json'
import enMultilingual from './en/multilingual.json'
import arMultilingual from './ar/multilingual.json'
import enFormWizard from './en/form-wizard.json'
import arFormWizard from './ar/form-wizard.json'
import enEmptyStates from './en/empty-states.json'
import arEmptyStates from './ar/empty-states.json'
import enValidation from './en/validation.json'
import arValidation from './ar/validation.json'
import enContextualHelp from './en/contextual-help.json'
import arContextualHelp from './ar/contextual-help.json'
import enViewPreferences from './en/view-preferences.json'
import arViewPreferences from './ar/view-preferences.json'
import enEnhancedSearch from './en/enhanced-search.json'
import arEnhancedSearch from './ar/enhanced-search.json'
import enLoading from './en/loading.json'
import arLoading from './ar/loading.json'
import enKeyboardShortcuts from './en/keyboard-shortcuts.json'
import arKeyboardShortcuts from './ar/keyboard-shortcuts.json'
import enGuidedTours from './en/guided-tours.json'
import arGuidedTours from './ar/guided-tours.json'
import enSampleData from './en/sample-data.json'
import arSampleData from './ar/sample-data.json'
import enOnboarding from './en/onboarding.json'
import arOnboarding from './ar/onboarding.json'
import enContextualSuggestions from './en/contextual-suggestions.json'
import arContextualSuggestions from './ar/contextual-suggestions.json'
import enProgressiveDisclosure from './en/progressive-disclosure.json'
import arProgressiveDisclosure from './ar/progressive-disclosure.json'
import enMilestonePlanning from './en/milestone-planning.json'
import arMilestonePlanning from './ar/milestone-planning.json'
import enSwipeGestures from './en/swipe-gestures.json'
import arSwipeGestures from './ar/swipe-gestures.json'
import enBottomSheet from './en/bottom-sheet.json'
import arBottomSheet from './ar/bottom-sheet.json'
import enFab from './en/fab.json'
import arFab from './ar/fab.json'
import enSmartInput from './en/smart-input.json'
import arSmartInput from './ar/smart-input.json'
import enFieldHistory from './en/field-history.json'
import arFieldHistory from './ar/field-history.json'
import enEntityTemplates from './en/entity-templates.json'
import arEntityTemplates from './ar/entity-templates.json'
import enDuplicateDetection from './en/duplicate-detection.json'
import arDuplicateDetection from './ar/duplicate-detection.json'
import enMeetingMinutes from './en/meeting-minutes.json'
import arMeetingMinutes from './ar/meeting-minutes.json'
import enCompliance from './en/compliance.json'
import arCompliance from './ar/compliance.json'
import enStakeholderInfluence from './en/stakeholder-influence.json'
import arStakeholderInfluence from './ar/stakeholder-influence.json'
import enScenarioSandbox from './en/scenario-sandbox.json'
import arScenarioSandbox from './ar/scenario-sandbox.json'
import enFormAutoSave from './en/form-auto-save.json'
import arFormAutoSave from './ar/form-auto-save.json'
import enUserManagement from './en/user-management.json'
import arUserManagement from './ar/user-management.json'
import enActionableErrors from './en/actionable-errors.json'
import arActionableErrors from './ar/actionable-errors.json'
import enProgressiveForm from './en/progressive-form.json'
import arProgressiveForm from './ar/progressive-form.json'
import enActiveFilters from './en/active-filters.json'
import arActiveFilters from './ar/active-filters.json'
import enEmailDigest from './en/email-digest.json'
import arEmailDigest from './ar/email-digest.json'
import enCommitmentDeliverables from './en/commitment-deliverables.json'
import arCommitmentDeliverables from './ar/commitment-deliverables.json'
import enFieldPermissions from './en/field-permissions.json'
import arFieldPermissions from './ar/field-permissions.json'
import enIntegrations from './en/integrations.json'
import arIntegrations from './ar/integrations.json'
import enAgenda from './en/agenda.json'
import arAgenda from './ar/agenda.json'
import enStakeholderInteractions from './en/stakeholder-interactions.json'
import arStakeholderInteractions from './ar/stakeholder-interactions.json'
import enScheduledReports from './en/scheduled-reports.json'
import arScheduledReports from './ar/scheduled-reports.json'
import enLegislation from './en/legislation.json'
import arLegislation from './ar/legislation.json'
import enDossierSearch from './en/dossier-search.json'
import arDossierSearch from './ar/dossier-search.json'
import enDossierOverview from './en/dossier-overview.json'
import arDossierOverview from './ar/dossier-overview.json'
import enQuickswitcher from './en/quickswitcher.json'
import arQuickswitcher from './ar/quickswitcher.json'
import enDossierRecommendations from './en/dossier-recommendations.json'
import arDossierRecommendations from './ar/dossier-recommendations.json'
import enCollaboration from './en/collaboration.json'
import arCollaboration from './ar/collaboration.json'
import enDossierExport from './en/dossier-export.json'
import arDossierExport from './ar/dossier-export.json'
import enSettings from './en/settings.json'
import arSettings from './ar/settings.json'
import enCommittees from './en/committees.json'
import arCommittees from './ar/committees.json'
import enMyWork from './en/my-work.json'
import arMyWork from './ar/my-work.json'
import enLifecycle from './en/lifecycle.json'
import arLifecycle from './ar/lifecycle.json'
import enOperationsHub from './en/operations-hub.json'
import arOperationsHub from './ar/operations-hub.json'
import enWorkspace from './en/workspace.json'
import arWorkspace from './ar/workspace.json'
// Force reload - updated 2026-03-31 - v112 - Added workspace namespace

const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

const resources = {
  en: {
    translation: enCommon,
    common: enCommon,
    intake: enIntake,
    dossiers: enDossiers,
    dossier: enDossier,
    positions: enPositions,
    assignments: enAssignments,
    forums: enForums,
    contacts: enContacts,
    commitments: enCommitments,
    'work-creation': enWorkCreation,
    'unified-kanban': enUnifiedKanban,
    persons: enPersons,
    'working-groups': enWorkingGroups,
    engagements: enEngagements,
    'activity-feed': enActivityFeed,
    'engagement-briefs': enEngagementBriefs,
    relationships: enRelationships,
    'advanced-search': enAdvancedSearch,
    'audit-logs': enAuditLogs,
    'bulk-actions': enBulkActions,
    'dashboard-widgets': enDashboardWidgets,
    dashboard: enDashboard,
    delegation: enDelegation,
    email: enEmail,
    calendar: enCalendar,
    'export-import': enExportImport,
    'notification-center': enNotificationCenter,
    'graph-traversal': enGraphTraversal,
    comments: enComments,
    analytics: enAnalytics,
    sla: enSla,
    tags: enTags,
    webhooks: enWebhooks,
    'calendar-sync': enCalendarSync,
    'report-builder': enReportBuilder,
    'entity-comparison': enEntityComparison,
    'availability-polling': enAvailabilityPolling,
    'engagement-recommendations': enEngagementRecommendations,
    'workflow-automation': enWorkflowAutomation,
    multilingual: enMultilingual,
    'form-wizard': enFormWizard,
    'empty-states': enEmptyStates,
    validation: enValidation,
    'contextual-help': enContextualHelp,
    'view-preferences': enViewPreferences,
    'enhanced-search': enEnhancedSearch,
    loading: enLoading,
    'keyboard-shortcuts': enKeyboardShortcuts,
    'guided-tours': enGuidedTours,
    'sample-data': enSampleData,
    onboarding: enOnboarding,
    'contextual-suggestions': enContextualSuggestions,
    'progressive-disclosure': enProgressiveDisclosure,
    'milestone-planning': enMilestonePlanning,
    'swipe-gestures': enSwipeGestures,
    'bottom-sheet': enBottomSheet,
    fab: enFab,
    'smart-input': enSmartInput,
    'field-history': enFieldHistory,
    'entity-templates': enEntityTemplates,
    'duplicate-detection': enDuplicateDetection,
    'meeting-minutes': enMeetingMinutes,
    compliance: enCompliance,
    'stakeholder-influence': enStakeholderInfluence,
    'scenario-sandbox': enScenarioSandbox,
    'form-auto-save': enFormAutoSave,
    'user-management': enUserManagement,
    'actionable-errors': enActionableErrors,
    'progressive-form': enProgressiveForm,
    'active-filters': enActiveFilters,
    'email-digest': enEmailDigest,
    'commitment-deliverables': enCommitmentDeliverables,
    'field-permissions': enFieldPermissions,
    integrations: enIntegrations,
    agenda: enAgenda,
    'stakeholder-interactions': enStakeholderInteractions,
    'scheduled-reports': enScheduledReports,
    legislation: enLegislation,
    'dossier-search': enDossierSearch,
    'dossier-overview': enDossierOverview,
    quickswitcher: enQuickswitcher,
    'dossier-recommendations': enDossierRecommendations,
    collaboration: enCollaboration,
    'dossier-export': enDossierExport,
    settings: enSettings,
    committees: enCommittees,
    'my-work': enMyWork,
    lifecycle: enLifecycle,
    'operations-hub': enOperationsHub,
    workspace: enWorkspace,
  },
  ar: {
    translation: arCommon,
    common: arCommon,
    intake: arIntake,
    dossiers: arDossiers,
    dossier: arDossier,
    positions: arPositions,
    assignments: arAssignments,
    forums: arForums,
    contacts: arContacts,
    commitments: arCommitments,
    'work-creation': arWorkCreation,
    'unified-kanban': arUnifiedKanban,
    persons: arPersons,
    'working-groups': arWorkingGroups,
    engagements: arEngagements,
    'activity-feed': arActivityFeed,
    'engagement-briefs': arEngagementBriefs,
    relationships: arRelationships,
    'advanced-search': arAdvancedSearch,
    'audit-logs': arAuditLogs,
    'bulk-actions': arBulkActions,
    'dashboard-widgets': arDashboardWidgets,
    dashboard: arDashboard,
    delegation: arDelegation,
    email: arEmail,
    calendar: arCalendar,
    'export-import': arExportImport,
    'notification-center': arNotificationCenter,
    'graph-traversal': arGraphTraversal,
    comments: arComments,
    analytics: arAnalytics,
    sla: arSla,
    tags: arTags,
    webhooks: arWebhooks,
    'calendar-sync': arCalendarSync,
    'report-builder': arReportBuilder,
    'entity-comparison': arEntityComparison,
    'availability-polling': arAvailabilityPolling,
    'engagement-recommendations': arEngagementRecommendations,
    'workflow-automation': arWorkflowAutomation,
    multilingual: arMultilingual,
    'form-wizard': arFormWizard,
    'empty-states': arEmptyStates,
    validation: arValidation,
    'contextual-help': arContextualHelp,
    'view-preferences': arViewPreferences,
    'enhanced-search': arEnhancedSearch,
    loading: arLoading,
    'keyboard-shortcuts': arKeyboardShortcuts,
    'guided-tours': arGuidedTours,
    'sample-data': arSampleData,
    onboarding: arOnboarding,
    'contextual-suggestions': arContextualSuggestions,
    'progressive-disclosure': arProgressiveDisclosure,
    'milestone-planning': arMilestonePlanning,
    'swipe-gestures': arSwipeGestures,
    'bottom-sheet': arBottomSheet,
    fab: arFab,
    'smart-input': arSmartInput,
    'field-history': arFieldHistory,
    'entity-templates': arEntityTemplates,
    'duplicate-detection': arDuplicateDetection,
    'meeting-minutes': arMeetingMinutes,
    compliance: arCompliance,
    'stakeholder-influence': arStakeholderInfluence,
    'scenario-sandbox': arScenarioSandbox,
    'form-auto-save': arFormAutoSave,
    'user-management': arUserManagement,
    'actionable-errors': arActionableErrors,
    'progressive-form': arProgressiveForm,
    'active-filters': arActiveFilters,
    'email-digest': arEmailDigest,
    'commitment-deliverables': arCommitmentDeliverables,
    'field-permissions': arFieldPermissions,
    integrations: arIntegrations,
    agenda: arAgenda,
    'stakeholder-interactions': arStakeholderInteractions,
    'scheduled-reports': arScheduledReports,
    legislation: arLegislation,
    'dossier-search': arDossierSearch,
    'dossier-overview': arDossierOverview,
    quickswitcher: arQuickswitcher,
    'dossier-recommendations': arDossierRecommendations,
    collaboration: arCollaboration,
    'dossier-export': arDossierExport,
    settings: arSettings,
    committees: arCommittees,
    'my-work': arMyWork,
    lifecycle: arLifecycle,
    'operations-hub': arOperationsHub,
    workspace: arWorkspace,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    supportedLngs: supportedLanguages,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },

    react: {
      useSuspense: false,
    },

    // Add missing keys handling
    saveMissing: false,
    missingKeyHandler: (lng, _ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`)
      }
    },
  })

// Function to check if current language is RTL
export const isRTL = (lang: string = i18n.language): boolean => {
  return lang === 'ar'
}

// Function to get text direction
export const getDirection = (lang: string = i18n.language): 'rtl' | 'ltr' => {
  return isRTL(lang) ? 'rtl' : 'ltr'
}

// Function to switch language and update document direction
export const switchLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang)
  document.documentElement.dir = getDirection(lang)
  document.documentElement.lang = lang
}

// Set initial direction
document.documentElement.dir = getDirection()
document.documentElement.lang = i18n.language

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = getDirection(lng)
  document.documentElement.lang = lng
})

export default i18n
