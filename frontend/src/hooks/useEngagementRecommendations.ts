/**
 * @deprecated Import from '@/domains/engagements' instead.
 * This file exists for backward compatibility only.
 */
export {
  useEngagementRecommendations,
  useInfiniteRecommendations,
  useEngagementRecommendation,
  useRecommendationStats,
  useUpdateRecommendation,
  useAcceptRecommendation,
  useDismissRecommendation,
  useAddRecommendationFeedback,
  useGenerateRecommendations,
  useHighPriorityRecommendations,
  useRelationshipRecommendations,
  useDossierRecommendations,
  useCriticalRecommendations,
  recommendationKeys,
} from '@/domains/engagements'
export type {
  EngagementRecommendationSummary,
  EngagementRecommendationListItem,
  RecommendationListParams,
  RecommendationListResponse,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  RecommendationType,
  RecommendationUrgency,
  RecommendationStatus,
} from '@/domains/engagements'
