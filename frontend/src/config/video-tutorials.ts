/**
 * Video Tutorial Configuration
 *
 * This file contains the metadata for all video tutorials embedded in empty states.
 * Videos should be 30-90 seconds long and demonstrate real-world use cases.
 *
 * To add a new tutorial:
 * 1. Create the video (MP4/WebM, 720p or 1080p recommended)
 * 2. Generate a thumbnail image (16:9 aspect ratio)
 * 3. Write the transcript (for accessibility)
 * 4. Add the entry to the appropriate entity type section
 * 5. Add i18n translations in empty-states.json (EN and AR)
 */

import type { TutorialVideo, TranscriptSegment } from '@/components/empty-states'
import type { EntityType } from '@/components/empty-states'

/**
 * Video tutorial for a specific use case within an entity type.
 * Extends TutorialVideo with additional metadata for organization.
 */
export interface VideoTutorialConfig extends TutorialVideo {
  /** Target audience/role for this tutorial */
  targetRole?: 'diplomat' | 'policy-analyst' | 'manager' | 'general'
  /** Skill level required */
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  /** Related feature or workflow */
  feature?: string
  /** Whether this tutorial is featured/recommended */
  featured?: boolean
  /** Order within the entity type tutorials (lower = first) */
  order?: number
}

/**
 * Creates a transcript segment with translated text keys.
 * The actual translations are in i18n/[lang]/empty-states.json
 */
function createTranscript(
  basePath: string,
  segments: Array<{ start: number; end: number }>,
): TranscriptSegment[] {
  return segments.map((segment, index) => ({
    startTime: segment.start,
    endTime: segment.end,
    text: `${basePath}.${index}`,
  }))
}

/**
 * All video tutorials organized by entity type.
 * These are shown in empty states to help users get started.
 */
export const VIDEO_TUTORIALS: Record<EntityType, VideoTutorialConfig[]> = {
  // Country Dossier Tutorials
  dossier: [
    {
      id: 'dossier-create',
      src: '/tutorials/create-country-dossier.mp4',
      poster: '/tutorials/thumbnails/create-country-dossier.jpg',
      title: 'video.tutorials.dossier.create.title',
      description: 'video.tutorials.dossier.create.description',
      duration: 45,
      entityType: 'dossier',
      targetRole: 'diplomat',
      skillLevel: 'beginner',
      feature: 'dossier-creation',
      featured: true,
      order: 1,
      tags: ['getting-started', 'diplomat', 'country'],
      transcript: createTranscript('video.tutorials.dossier.create.transcript', [
        { start: 0, end: 5 },
        { start: 5, end: 15 },
        { start: 15, end: 30 },
        { start: 30, end: 45 },
      ]),
    },
  ],

  // Engagement Tutorials
  engagement: [
    {
      id: 'engagement-link-brief',
      src: '/tutorials/link-brief-engagement.mp4',
      poster: '/tutorials/thumbnails/link-brief-engagement.jpg',
      title: 'video.tutorials.engagement.linkBrief.title',
      description: 'video.tutorials.engagement.linkBrief.description',
      duration: 60,
      entityType: 'engagement',
      targetRole: 'policy-analyst',
      skillLevel: 'intermediate',
      feature: 'brief-linking',
      featured: true,
      order: 1,
      tags: ['intermediate', 'policy-analyst', 'briefs'],
      transcript: createTranscript('video.tutorials.engagement.linkBrief.transcript', [
        { start: 0, end: 10 },
        { start: 10, end: 25 },
        { start: 25, end: 45 },
        { start: 45, end: 60 },
      ]),
    },
  ],

  // Commitment Tutorials
  commitment: [
    {
      id: 'commitment-track',
      src: '/tutorials/track-commitments.mp4',
      poster: '/tutorials/thumbnails/track-commitments.jpg',
      title: 'video.tutorials.commitment.track.title',
      description: 'video.tutorials.commitment.track.description',
      duration: 55,
      entityType: 'commitment',
      targetRole: 'general',
      skillLevel: 'beginner',
      feature: 'commitment-tracking',
      featured: true,
      order: 1,
      tags: ['getting-started', 'workflow'],
      transcript: createTranscript('video.tutorials.commitment.track.transcript', [
        { start: 0, end: 10 },
        { start: 10, end: 25 },
        { start: 25, end: 40 },
        { start: 40, end: 55 },
      ]),
    },
  ],

  // Document Tutorials
  document: [
    {
      id: 'document-upload',
      src: '/tutorials/upload-documents.mp4',
      poster: '/tutorials/thumbnails/upload-documents.jpg',
      title: 'video.tutorials.document.upload.title',
      description: 'video.tutorials.document.upload.description',
      duration: 35,
      entityType: 'document',
      targetRole: 'general',
      skillLevel: 'beginner',
      feature: 'document-upload',
      featured: true,
      order: 1,
      tags: ['getting-started', 'documents'],
      transcript: createTranscript('video.tutorials.document.upload.transcript', [
        { start: 0, end: 8 },
        { start: 8, end: 18 },
        { start: 18, end: 28 },
        { start: 28, end: 35 },
      ]),
    },
  ],

  // Organization Tutorials
  organization: [
    {
      id: 'organization-manage',
      src: '/tutorials/manage-organizations.mp4',
      poster: '/tutorials/thumbnails/manage-organizations.jpg',
      title: 'video.tutorials.organization.manage.title',
      description: 'video.tutorials.organization.manage.description',
      duration: 50,
      entityType: 'organization',
      targetRole: 'diplomat',
      skillLevel: 'intermediate',
      feature: 'organization-management',
      featured: true,
      order: 1,
      tags: ['intermediate', 'organizations'],
      transcript: createTranscript('video.tutorials.organization.manage.transcript', [
        { start: 0, end: 10 },
        { start: 10, end: 25 },
        { start: 25, end: 38 },
        { start: 38, end: 50 },
      ]),
    },
  ],

  // Country Portfolio Tutorials
  country: [
    {
      id: 'country-portfolio',
      src: '/tutorials/country-portfolio.mp4',
      poster: '/tutorials/thumbnails/country-portfolio.jpg',
      title: 'video.tutorials.country.portfolio.title',
      description: 'video.tutorials.country.portfolio.description',
      duration: 75,
      entityType: 'country',
      targetRole: 'diplomat',
      skillLevel: 'beginner',
      feature: 'portfolio-management',
      featured: true,
      order: 1,
      tags: ['getting-started', 'diplomat', 'portfolio'],
      transcript: createTranscript('video.tutorials.country.portfolio.transcript', [
        { start: 0, end: 15 },
        { start: 15, end: 35 },
        { start: 35, end: 55 },
        { start: 55, end: 75 },
      ]),
    },
  ],

  // MOU Tutorials
  mou: [
    {
      id: 'mou-track-renewals',
      src: '/tutorials/track-mou-renewals.mp4',
      poster: '/tutorials/thumbnails/track-mou-renewals.jpg',
      title: 'video.tutorials.mou.trackRenewals.title',
      description: 'video.tutorials.mou.trackRenewals.description',
      duration: 40,
      entityType: 'mou',
      targetRole: 'diplomat',
      skillLevel: 'intermediate',
      feature: 'mou-tracking',
      featured: true,
      order: 1,
      tags: ['intermediate', 'legal', 'renewals'],
      transcript: createTranscript('video.tutorials.mou.trackRenewals.transcript', [
        { start: 0, end: 8 },
        { start: 8, end: 20 },
        { start: 20, end: 32 },
        { start: 32, end: 40 },
      ]),
    },
  ],

  // Forum Tutorials
  forum: [],

  // Event Tutorials
  event: [],

  // Task Tutorials
  task: [],

  // Person/Contact Tutorials
  person: [],

  // Position Tutorials
  position: [],

  // Generic Tutorials (shown when no specific tutorials exist)
  generic: [
    {
      id: 'relationship-network',
      src: '/tutorials/relationship-network.mp4',
      poster: '/tutorials/thumbnails/relationship-network.jpg',
      title: 'video.tutorials.relationship.network.title',
      description: 'video.tutorials.relationship.network.description',
      duration: 65,
      entityType: 'generic',
      targetRole: 'general',
      skillLevel: 'advanced',
      feature: 'network-visualization',
      featured: false,
      order: 99,
      tags: ['advanced', 'visualization', 'relationships'],
      transcript: createTranscript('video.tutorials.relationship.network.transcript', [
        { start: 0, end: 12 },
        { start: 12, end: 30 },
        { start: 30, end: 48 },
        { start: 48, end: 65 },
      ]),
    },
  ],
}

/**
 * Get tutorials for a specific entity type.
 * Falls back to generic tutorials if none exist for the entity type.
 */
export function getTutorialsForEntity(entityType: EntityType): VideoTutorialConfig[] {
  const tutorials = VIDEO_TUTORIALS[entityType] || []
  const genericTutorials = VIDEO_TUTORIALS.generic || []

  // If no specific tutorials, return generic ones
  if (tutorials.length === 0) {
    return genericTutorials
  }

  // Return entity-specific tutorials, sorted by order
  return [...tutorials].sort((a, b) => (a.order || 99) - (b.order || 99))
}

/**
 * Get featured tutorials across all entity types.
 */
export function getFeaturedTutorials(): VideoTutorialConfig[] {
  const allTutorials: VideoTutorialConfig[] = []

  Object.values(VIDEO_TUTORIALS).forEach((tutorials) => {
    tutorials.forEach((tutorial) => {
      if (tutorial.featured) {
        allTutorials.push(tutorial)
      }
    })
  })

  return allTutorials.sort((a, b) => (a.order || 99) - (b.order || 99))
}

/**
 * Get tutorials for a specific role.
 */
export function getTutorialsForRole(
  role: 'diplomat' | 'policy-analyst' | 'manager' | 'general',
): VideoTutorialConfig[] {
  const allTutorials: VideoTutorialConfig[] = []

  Object.values(VIDEO_TUTORIALS).forEach((tutorials) => {
    tutorials.forEach((tutorial) => {
      if (tutorial.targetRole === role || tutorial.targetRole === 'general') {
        allTutorials.push(tutorial)
      }
    })
  })

  return allTutorials.sort((a, b) => (a.order || 99) - (b.order || 99))
}

/**
 * Get tutorials by skill level.
 */
export function getTutorialsBySkillLevel(
  level: 'beginner' | 'intermediate' | 'advanced',
): VideoTutorialConfig[] {
  const allTutorials: VideoTutorialConfig[] = []

  Object.values(VIDEO_TUTORIALS).forEach((tutorials) => {
    tutorials.forEach((tutorial) => {
      if (tutorial.skillLevel === level) {
        allTutorials.push(tutorial)
      }
    })
  })

  return allTutorials.sort((a, b) => (a.order || 99) - (b.order || 99))
}
