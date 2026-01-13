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
import enMLClassification from './en/ml-classification.json'
import arMLClassification from './ar/ml-classification.json'
import enAISummary from './en/ai-summary.json'
import arAISummary from './ar/ai-summary.json'
import enAuditLogs from './en/audit-logs.json'
import arAuditLogs from './ar/audit-logs.json'
import enBulkActions from './en/bulk-actions.json'
import arBulkActions from './ar/bulk-actions.json'
import enMouRenewals from './en/mou-renewals.json'
import arMouRenewals from './ar/mou-renewals.json'
import enDashboardWidgets from './en/dashboard-widgets.json'
import arDashboardWidgets from './ar/dashboard-widgets.json'
import enDelegation from './en/delegation.json'
import arDelegation from './ar/delegation.json'
import enRetentionPolicies from './en/retention-policies.json'
import arRetentionPolicies from './ar/retention-policies.json'
import enDocumentOcr from './en/document-ocr.json'
import arDocumentOcr from './ar/document-ocr.json'
import enEmail from './en/email.json'
import arEmail from './ar/email.json'
import enCalendar from './en/calendar.json'
import arCalendar from './ar/calendar.json'
import enExportImport from './en/export-import.json'
import arExportImport from './ar/export-import.json'
import enDocumentPreview from './en/document-preview.json'
import arDocumentPreview from './ar/document-preview.json'
import enNotificationCenter from './en/notification-center.json'
import arNotificationCenter from './ar/notification-center.json'
import enGraphTraversal from './en/graph-traversal.json'
import arGraphTraversal from './ar/graph-traversal.json'
import enComments from './en/comments.json'
import arComments from './ar/comments.json'
import enRelationshipHealth from './en/relationship-health.json'
import arRelationshipHealth from './ar/relationship-health.json'
import enSemanticSearch from './en/semantic-search.json'
import arSemanticSearch from './ar/semantic-search.json'
import enAnalytics from './en/analytics.json'
import arAnalytics from './ar/analytics.json'
import enSla from './en/sla.json'
import arSla from './ar/sla.json'
import enTags from './en/tags.json'
import arTags from './ar/tags.json'
import enTranslation from './en/translation.json'
import arTranslation from './ar/translation.json'
import enDocumentVersions from './en/document-versions.json'
import arDocumentVersions from './ar/document-versions.json'
import enWebhooks from './en/webhooks.json'
import arWebhooks from './ar/webhooks.json'
import enCalendarSync from './en/calendar-sync.json'
import arCalendarSync from './ar/calendar-sync.json'
import enReportBuilder from './en/report-builder.json'
import arReportBuilder from './ar/report-builder.json'
import enEntityComparison from './en/entity-comparison.json'
import arEntityComparison from './ar/entity-comparison.json'
import enGeographicVisualization from './en/geographic-visualization.json'
import arGeographicVisualization from './ar/geographic-visualization.json'
import enGraphExport from './en/graph-export.json'
import arGraphExport from './ar/graph-export.json'
import enAvailabilityPolling from './en/availability-polling.json'
import arAvailabilityPolling from './ar/availability-polling.json'
import enEngagementRecommendations from './en/engagement-recommendations.json'
import arEngagementRecommendations from './ar/engagement-recommendations.json'
import enWorkflowAutomation from './en/workflow-automation.json'
import arWorkflowAutomation from './ar/workflow-automation.json'
import enMultilingual from './en/multilingual.json'
import arMultilingual from './ar/multilingual.json'
import enDocumentClassification from './en/document-classification.json'
import arDocumentClassification from './ar/document-classification.json'
import enBriefingBooks from './en/briefing-books.json'
import arBriefingBooks from './ar/briefing-books.json'
import enDocumentTemplates from './en/document-templates.json'
import arDocumentTemplates from './ar/document-templates.json'
import enCollaborativeEditing from './en/collaborative-editing.json'
import arCollaborativeEditing from './ar/collaborative-editing.json'
import enCitations from './en/citations.json'
import arCitations from './ar/citations.json'
import enVoiceMemos from './en/voice-memos.json'
import arVoiceMemos from './ar/voice-memos.json'
import enAnnotations from './en/annotations.json'
import arAnnotations from './ar/annotations.json'
import enContentExpiration from './en/content-expiration.json'
import arContentExpiration from './ar/content-expiration.json'
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
import enSmartImport from './en/smart-import.json'
import arSmartImport from './ar/smart-import.json'
import enContextualSuggestions from './en/contextual-suggestions.json'
import arContextualSuggestions from './ar/contextual-suggestions.json'
import enProgressiveDisclosure from './en/progressive-disclosure.json'
import arProgressiveDisclosure from './ar/progressive-disclosure.json'
import enAIPolicyBrief from './en/ai-policy-brief.json'
import arAIPolicyBrief from './ar/ai-policy-brief.json'
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
// Force reload - updated 2026-01-12 - v73 - Added smart-input namespace

const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

const resources = {
  en: {
    translation: enCommon,
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
    'ml-classification': enMLClassification,
    'ai-summary': enAISummary,
    'audit-logs': enAuditLogs,
    'bulk-actions': enBulkActions,
    'mou-renewals': enMouRenewals,
    'dashboard-widgets': enDashboardWidgets,
    delegation: enDelegation,
    'retention-policies': enRetentionPolicies,
    'document-ocr': enDocumentOcr,
    email: enEmail,
    calendar: enCalendar,
    'export-import': enExportImport,
    'document-preview': enDocumentPreview,
    'notification-center': enNotificationCenter,
    'graph-traversal': enGraphTraversal,
    comments: enComments,
    'relationship-health': enRelationshipHealth,
    'semantic-search': enSemanticSearch,
    analytics: enAnalytics,
    sla: enSla,
    tags: enTags,
    'translation-service': enTranslation,
    'document-versions': enDocumentVersions,
    webhooks: enWebhooks,
    'calendar-sync': enCalendarSync,
    'report-builder': enReportBuilder,
    'entity-comparison': enEntityComparison,
    'geographic-visualization': enGeographicVisualization,
    'graph-export': enGraphExport,
    'availability-polling': enAvailabilityPolling,
    'engagement-recommendations': enEngagementRecommendations,
    'workflow-automation': enWorkflowAutomation,
    multilingual: enMultilingual,
    'document-classification': enDocumentClassification,
    'briefing-books': enBriefingBooks,
    'document-templates': enDocumentTemplates,
    'collaborative-editing': enCollaborativeEditing,
    citations: enCitations,
    'voice-memos': enVoiceMemos,
    annotations: enAnnotations,
    'content-expiration': enContentExpiration,
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
    'smart-import': enSmartImport,
    'contextual-suggestions': enContextualSuggestions,
    'progressive-disclosure': enProgressiveDisclosure,
    'ai-policy-brief': enAIPolicyBrief,
    'milestone-planning': enMilestonePlanning,
    'swipe-gestures': enSwipeGestures,
    'bottom-sheet': enBottomSheet,
    fab: enFab,
    'smart-input': enSmartInput,
  },
  ar: {
    translation: arCommon,
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
    'ml-classification': arMLClassification,
    'ai-summary': arAISummary,
    'audit-logs': arAuditLogs,
    'bulk-actions': arBulkActions,
    'mou-renewals': arMouRenewals,
    'dashboard-widgets': arDashboardWidgets,
    delegation: arDelegation,
    'retention-policies': arRetentionPolicies,
    'document-ocr': arDocumentOcr,
    email: arEmail,
    calendar: arCalendar,
    'export-import': arExportImport,
    'document-preview': arDocumentPreview,
    'notification-center': arNotificationCenter,
    'graph-traversal': arGraphTraversal,
    comments: arComments,
    'relationship-health': arRelationshipHealth,
    'semantic-search': arSemanticSearch,
    analytics: arAnalytics,
    sla: arSla,
    tags: arTags,
    'translation-service': arTranslation,
    'document-versions': arDocumentVersions,
    webhooks: arWebhooks,
    'calendar-sync': arCalendarSync,
    'report-builder': arReportBuilder,
    'entity-comparison': arEntityComparison,
    'geographic-visualization': arGeographicVisualization,
    'graph-export': arGraphExport,
    'availability-polling': arAvailabilityPolling,
    'engagement-recommendations': arEngagementRecommendations,
    'workflow-automation': arWorkflowAutomation,
    multilingual: arMultilingual,
    'document-classification': arDocumentClassification,
    'briefing-books': arBriefingBooks,
    'document-templates': arDocumentTemplates,
    'collaborative-editing': arCollaborativeEditing,
    citations: arCitations,
    'voice-memos': arVoiceMemos,
    annotations: arAnnotations,
    'content-expiration': arContentExpiration,
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
    'smart-import': arSmartImport,
    'contextual-suggestions': arContextualSuggestions,
    'progressive-disclosure': arProgressiveDisclosure,
    'ai-policy-brief': arAIPolicyBrief,
    'milestone-planning': arMilestonePlanning,
    'swipe-gestures': arSwipeGestures,
    'bottom-sheet': arBottomSheet,
    fab: arFab,
    'smart-input': arSmartInput,
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
    missingKeyHandler: (lng, ns, key) => {
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
