/**
 * Engagements Domain Barrel
 * @module domains/engagements
 *
 * Re-exports all hooks, repository, and types for the engagements domain.
 * Canonical import path for consumers: `@/domains/engagements`
 */

// Query Key Factory (canonical source)
export { engagementKeys as engagementDomainKeys } from './keys'

// Hooks - Main engagement CRUD
export {
  useEngagements,
  useEngagement,
  useCreateEngagement,
  useUpdateEngagement,
  useArchiveEngagement,
  useEngagementParticipants,
  useAddEngagementParticipant,
  useRemoveEngagementParticipant,
  useEngagementAgenda,
  useAddEngagementAgendaItem,
  useUpdateEngagementAgendaItem,
  useRemoveEngagementAgendaItem,
  useInvalidateEngagements,
  engagementKeys,
} from './hooks/useEngagements'

// Hooks - Lifecycle
export {
  useLifecycleHistory,
  useLifecycleTransition,
  usePromoteIntake,
  useCreateForumSession,
  useForumSessions,
  lifecycleKeys,
} from './hooks/useLifecycle'

// Hooks - Kanban
export { useEngagementKanban } from './hooks/useEngagementKanban'

// Hooks - Briefs
export {
  useEngagementBriefs,
  useEngagementBriefContext,
  useGenerateEngagementBrief,
  useLinkBriefToEngagement,
  useUnlinkBriefFromEngagement,
  useInvalidateEngagementBriefs,
  engagementBriefKeys,
} from './hooks/useEngagementBriefs'

// Hooks - Recommendations
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
} from './hooks/useEngagementRecommendations'

// Repository
export * as engagementsRepo from './repositories/engagements.repository'

// Types
export * from './types'
