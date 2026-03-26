/**
 * @deprecated Import from '@/domains/engagements' instead.
 * This file exists for backward compatibility only.
 */
export {
  useEngagementBriefs,
  useEngagementBriefContext,
  useGenerateEngagementBrief,
  useLinkBriefToEngagement,
  useUnlinkBriefFromEngagement,
  useInvalidateEngagementBriefs,
  engagementBriefKeys,
} from '@/domains/engagements'
export type {
  BriefType,
  BriefStatus,
  EngagementBrief,
  EngagementBriefsListResponse,
  BriefGenerationContext,
  GenerateBriefParams,
  LinkBriefParams,
  BriefsSearchParams,
} from '@/domains/engagements'
