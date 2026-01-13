/**
 * Tour Definitions
 *
 * Pre-defined tours for guiding users through empty sections.
 * Each tour explains key fields and best practices.
 */

import {
  FolderOpen,
  GitBranch,
  FileText,
  Calendar,
  FileCheck,
  Users,
  FileSignature,
  Briefcase,
  Lightbulb,
  Target,
  Info,
  Sparkles,
} from 'lucide-react'
import type { Tour, TourId } from './types'

/**
 * Tour for creating first dossier
 */
export const dossierFirstTour: Tour = {
  id: 'dossier-first',
  name: 'tours.dossier.name',
  description: 'tours.dossier.description',
  entityType: 'dossier',
  icon: FolderOpen,
  estimatedTime: 3,
  steps: [
    {
      id: 'welcome',
      title: 'tours.dossier.steps.welcome.title',
      content: 'tours.dossier.steps.welcome.content',
      hint: 'tours.dossier.steps.welcome.hint',
      placement: 'center',
      icon: Sparkles,
      highlightTarget: false,
    },
    {
      id: 'type-selection',
      target: '[data-tour="dossier-type"]',
      title: 'tours.dossier.steps.typeSelection.title',
      content: 'tours.dossier.steps.typeSelection.content',
      hint: 'tours.dossier.steps.typeSelection.hint',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'basic-info',
      target: '[data-tour="basic-info"]',
      title: 'tours.dossier.steps.basicInfo.title',
      content: 'tours.dossier.steps.basicInfo.content',
      hint: 'tours.dossier.steps.basicInfo.hint',
      placement: 'right',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'bilingual',
      target: '[data-tour="name-fields"]',
      title: 'tours.dossier.steps.bilingual.title',
      content: 'tours.dossier.steps.bilingual.content',
      hint: 'tours.dossier.steps.bilingual.hint',
      placement: 'bottom',
      icon: Lightbulb,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.dossier.steps.finish.title',
      content: 'tours.dossier.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * Tour for creating first relationship
 */
export const relationshipFirstTour: Tour = {
  id: 'relationship-first',
  name: 'tours.relationship.name',
  description: 'tours.relationship.description',
  entityType: 'relationship',
  icon: GitBranch,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.relationship.steps.intro.title',
      content: 'tours.relationship.steps.intro.content',
      hint: 'tours.relationship.steps.intro.hint',
      placement: 'center',
      icon: GitBranch,
    },
    {
      id: 'source-target',
      target: '[data-tour="relationship-entities"]',
      title: 'tours.relationship.steps.sourceTarget.title',
      content: 'tours.relationship.steps.sourceTarget.content',
      hint: 'tours.relationship.steps.sourceTarget.hint',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'relationship-type',
      target: '[data-tour="relationship-type"]',
      title: 'tours.relationship.steps.type.title',
      content: 'tours.relationship.steps.type.content',
      hint: 'tours.relationship.steps.type.hint',
      placement: 'bottom',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'graph-view',
      target: '[data-tour="graph-toggle"]',
      title: 'tours.relationship.steps.graphView.title',
      content: 'tours.relationship.steps.graphView.content',
      placement: 'left',
      icon: Lightbulb,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.relationship.steps.finish.title',
      content: 'tours.relationship.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * Tour for uploading first document
 */
export const documentFirstTour: Tour = {
  id: 'document-first',
  name: 'tours.document.name',
  description: 'tours.document.description',
  entityType: 'document',
  icon: FileText,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.document.steps.intro.title',
      content: 'tours.document.steps.intro.content',
      hint: 'tours.document.steps.intro.hint',
      placement: 'center',
      icon: FileText,
    },
    {
      id: 'upload',
      target: '[data-tour="document-upload"]',
      title: 'tours.document.steps.upload.title',
      content: 'tours.document.steps.upload.content',
      hint: 'tours.document.steps.upload.hint',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'classification',
      target: '[data-tour="document-classification"]',
      title: 'tours.document.steps.classification.title',
      content: 'tours.document.steps.classification.content',
      hint: 'tours.document.steps.classification.hint',
      placement: 'right',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.document.steps.finish.title',
      content: 'tours.document.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.uploadFirst',
    },
  ],
}

/**
 * Tour for creating first engagement
 */
export const engagementFirstTour: Tour = {
  id: 'engagement-first',
  name: 'tours.engagement.name',
  description: 'tours.engagement.description',
  entityType: 'engagement',
  icon: Calendar,
  estimatedTime: 3,
  steps: [
    {
      id: 'intro',
      title: 'tours.engagement.steps.intro.title',
      content: 'tours.engagement.steps.intro.content',
      hint: 'tours.engagement.steps.intro.hint',
      placement: 'center',
      icon: Calendar,
    },
    {
      id: 'type',
      target: '[data-tour="engagement-type"]',
      title: 'tours.engagement.steps.type.title',
      content: 'tours.engagement.steps.type.content',
      hint: 'tours.engagement.steps.type.hint',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'dates',
      target: '[data-tour="engagement-dates"]',
      title: 'tours.engagement.steps.dates.title',
      content: 'tours.engagement.steps.dates.content',
      placement: 'bottom',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'participants',
      target: '[data-tour="engagement-participants"]',
      title: 'tours.engagement.steps.participants.title',
      content: 'tours.engagement.steps.participants.content',
      hint: 'tours.engagement.steps.participants.hint',
      placement: 'bottom',
      icon: Users,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.engagement.steps.finish.title',
      content: 'tours.engagement.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * Tour for generating first brief
 */
export const briefFirstTour: Tour = {
  id: 'brief-first',
  name: 'tours.brief.name',
  description: 'tours.brief.description',
  entityType: 'brief',
  icon: FileCheck,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.brief.steps.intro.title',
      content: 'tours.brief.steps.intro.content',
      hint: 'tours.brief.steps.intro.hint',
      placement: 'center',
      icon: FileCheck,
    },
    {
      id: 'ai-generate',
      target: '[data-tour="brief-generate"]',
      title: 'tours.brief.steps.aiGenerate.title',
      content: 'tours.brief.steps.aiGenerate.content',
      hint: 'tours.brief.steps.aiGenerate.hint',
      placement: 'bottom',
      icon: Sparkles,
      highlightTarget: true,
    },
    {
      id: 'customize',
      target: '[data-tour="brief-customize"]',
      title: 'tours.brief.steps.customize.title',
      content: 'tours.brief.steps.customize.content',
      placement: 'right',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.brief.steps.finish.title',
      content: 'tours.brief.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.generateFirst',
    },
  ],
}

/**
 * Tour for creating first position
 */
export const positionFirstTour: Tour = {
  id: 'position-first',
  name: 'tours.position.name',
  description: 'tours.position.description',
  entityType: 'position',
  icon: Users,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.position.steps.intro.title',
      content: 'tours.position.steps.intro.content',
      hint: 'tours.position.steps.intro.hint',
      placement: 'center',
      icon: Users,
    },
    {
      id: 'topic',
      target: '[data-tour="position-topic"]',
      title: 'tours.position.steps.topic.title',
      content: 'tours.position.steps.topic.content',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'stance',
      target: '[data-tour="position-stance"]',
      title: 'tours.position.steps.stance.title',
      content: 'tours.position.steps.stance.content',
      hint: 'tours.position.steps.stance.hint',
      placement: 'bottom',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.position.steps.finish.title',
      content: 'tours.position.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * Tour for creating first MOU
 */
export const mouFirstTour: Tour = {
  id: 'mou-first',
  name: 'tours.mou.name',
  description: 'tours.mou.description',
  entityType: 'mou',
  icon: FileSignature,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.mou.steps.intro.title',
      content: 'tours.mou.steps.intro.content',
      hint: 'tours.mou.steps.intro.hint',
      placement: 'center',
      icon: FileSignature,
    },
    {
      id: 'parties',
      target: '[data-tour="mou-parties"]',
      title: 'tours.mou.steps.parties.title',
      content: 'tours.mou.steps.parties.content',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'dates',
      target: '[data-tour="mou-dates"]',
      title: 'tours.mou.steps.dates.title',
      content: 'tours.mou.steps.dates.content',
      hint: 'tours.mou.steps.dates.hint',
      placement: 'bottom',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.mou.steps.finish.title',
      content: 'tours.mou.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * Tour for creating first commitment
 */
export const commitmentFirstTour: Tour = {
  id: 'commitment-first',
  name: 'tours.commitment.name',
  description: 'tours.commitment.description',
  entityType: 'commitment',
  icon: Briefcase,
  estimatedTime: 2,
  steps: [
    {
      id: 'intro',
      title: 'tours.commitment.steps.intro.title',
      content: 'tours.commitment.steps.intro.content',
      hint: 'tours.commitment.steps.intro.hint',
      placement: 'center',
      icon: Briefcase,
    },
    {
      id: 'type',
      target: '[data-tour="commitment-type"]',
      title: 'tours.commitment.steps.type.title',
      content: 'tours.commitment.steps.type.content',
      placement: 'bottom',
      icon: Target,
      highlightTarget: true,
    },
    {
      id: 'deadline',
      target: '[data-tour="commitment-deadline"]',
      title: 'tours.commitment.steps.deadline.title',
      content: 'tours.commitment.steps.deadline.content',
      hint: 'tours.commitment.steps.deadline.hint',
      placement: 'bottom',
      icon: Info,
      highlightTarget: true,
    },
    {
      id: 'finish',
      title: 'tours.commitment.steps.finish.title',
      content: 'tours.commitment.steps.finish.content',
      placement: 'center',
      icon: Sparkles,
      actionText: 'tours.common.startCreating',
    },
  ],
}

/**
 * All tours registry
 */
export const tourRegistry: Record<TourId, Tour> = {
  'dossier-first': dossierFirstTour,
  'relationship-first': relationshipFirstTour,
  'document-first': documentFirstTour,
  'engagement-first': engagementFirstTour,
  'brief-first': briefFirstTour,
  'position-first': positionFirstTour,
  'mou-first': mouFirstTour,
  'commitment-first': commitmentFirstTour,
}

/**
 * Get a tour by ID
 */
export function getTour(tourId: TourId): Tour | undefined {
  return tourRegistry[tourId]
}

/**
 * Get all available tours
 */
export function getAllTours(): Tour[] {
  return Object.values(tourRegistry)
}
