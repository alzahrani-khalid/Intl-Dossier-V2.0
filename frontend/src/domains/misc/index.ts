/**
 * Misc Domain Barrel
 * @module domains/misc
 */

export {
  commentKeys,
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useCommentThread,
  useReactToComment,
  useResolveComment,
  useMentionUsers,
  useSearchUsersForMention,
  useToggleReaction,
} from './hooks/useComments'
export {
  timelineKeys,
  useStakeholderTimeline,
  useAddTimelineEvent,
  useTimelineCategories,
  useStakeholderInteractionMutations,
  getAvailableInteractionTypes,
} from './hooks/useStakeholderTimeline'
export {
  influenceKeys,
  useStakeholderInfluence,
  useUpdateInfluenceScore,
  useInfluenceNetwork,
  useInfluenceHistory,
  useCompareInfluence,
  useStakeholderInfluenceList,
  useStakeholderInfluenceDetail,
  useInfluenceNetworkData,
  useTopInfluencers,
  useKeyConnectors,
  useNetworkStatistics,
  useInfluenceReports,
  useInfluenceReport,
  useCalculateInfluenceScores,
  useCreateInfluenceReport,
} from './hooks/useStakeholderInfluence'
export {
  reportKeys,
  useReportTemplates,
  useGenerateReport,
  useReportStatus,
  useReportHistory,
  useReportBuilderState,
  useReports,
  useCreateReport,
  useUpdateReport,
  useDeleteReport,
  useReportToggleFavorite,
  useReportPreview,
  useCreateSchedule,
} from './hooks/useReportBuilder'
export {
  scenarioKeys,
  useScenarios,
  useCreateScenario,
  useRunScenario,
  useScenarioResults,
  useUpdateScenario,
  useDeleteScenario,
  useCloneScenario,
  useCompareScenarios,
} from './hooks/useScenarioSandbox'
export {
  multiLangKeys,
  useMultiLangContent,
  useSaveTranslation,
  useSupportedLanguages,
} from './hooks/useMultiLangContent'
export {
  sampleDataKeys,
  useSampleData,
  useSampleDataSets,
  useSampleDataStatus,
  useLoadSampleData,
  useClearSampleData,
} from './hooks/useSampleData'
export {
  onboardingKeys,
  useOnboardingChecklist,
  useUpdateChecklistItem,
  useDismissOnboarding,
  useResetOnboarding,
} from './hooks/useOnboardingChecklist'
export {
  disclosureKeys,
  useProgressiveDisclosure,
  useUpdateDisclosureState,
  useFeatureGates,
  useUnlockFeature,
  useUserProgress,
  useRecordInteraction,
} from './hooks/useProgressiveDisclosure'
export { usePullToRefresh } from './hooks/usePullToRefresh'

export * as miscRepo from './repositories/misc.repository'
export * from './types'
