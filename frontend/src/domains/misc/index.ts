/**
 * Misc Domain Barrel
 * @module domains/misc
 */

export { commentKeys, useComments, useCreateComment, useUpdateComment, useDeleteComment, useCommentThread, useReactToComment, useResolveComment, useMentionUsers } from './hooks/useComments'
export { timelineKeys, useStakeholderTimeline, useAddTimelineEvent, useTimelineCategories } from './hooks/useStakeholderTimeline'
export { influenceKeys, useStakeholderInfluence, useUpdateInfluenceScore, useInfluenceNetwork, useInfluenceHistory, useCompareInfluence } from './hooks/useStakeholderInfluence'
export { reportKeys, useReportTemplates, useGenerateReport, useReportStatus, useReportHistory } from './hooks/useReportBuilder'
export { scenarioKeys, useScenarios, useCreateScenario, useRunScenario, useScenarioResults } from './hooks/useScenarioSandbox'
export { multiLangKeys, useMultiLangContent, useSaveTranslation } from './hooks/useMultiLangContent'
export { sampleDataKeys, useSampleDataSets, useSampleDataStatus, useLoadSampleData, useClearSampleData } from './hooks/useSampleData'
export { onboardingKeys, useOnboardingChecklist, useUpdateChecklistItem, useDismissOnboarding, useResetOnboarding } from './hooks/useOnboardingChecklist'
export { disclosureKeys, useProgressiveDisclosure, useUpdateDisclosureState, useFeatureGates, useUnlockFeature, useUserProgress, useRecordInteraction } from './hooks/useProgressiveDisclosure'
export { usePullToRefresh } from './hooks/usePullToRefresh'

export * as miscRepo from './repositories/misc.repository'
export * from './types'
