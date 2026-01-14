/**
 * Relationship Guidance Types
 * Feature: relationship-type-guidance
 *
 * Types for the guided relationship type selection system
 * that helps users choose correct relationship types with
 * visual examples and validation.
 */

import type { DossierRelationshipType, DossierType } from './relationship.types'

// ============================================================================
// Relationship Category Types
// ============================================================================

/**
 * Categories for grouping relationship types
 */
export type RelationshipCategory =
  | 'membership'
  | 'hierarchy'
  | 'cooperation'
  | 'participation'
  | 'temporal'
  | 'association'

/**
 * Category metadata
 */
export interface RelationshipCategoryInfo {
  id: RelationshipCategory
  labelKey: string
  descriptionKey: string
  icon: string
}

// ============================================================================
// Relationship Type Metadata
// ============================================================================

/**
 * Detailed metadata for a relationship type
 */
export interface RelationshipTypeMetadata {
  type: DossierRelationshipType
  category: RelationshipCategory
  labelKey: string
  descriptionKey: string
  exampleKey: string
  icon: string
  isSymmetric: boolean
  /** Valid source dossier types for this relationship */
  validSourceTypes: DossierType[]
  /** Valid target dossier types for this relationship */
  validTargetTypes: DossierType[]
  /** When true, this relationship type is recommended for the source/target combination */
  recommendedFor?: Array<{ source: DossierType; target: DossierType }>
  /** Types that are commonly confused with this one */
  commonlyConfusedWith?: DossierRelationshipType[]
  /** Tips for avoiding incorrect usage */
  usageTipKey?: string
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of relationship type validation
 */
export interface RelationshipTypeValidation {
  isValid: boolean
  isRecommended: boolean
  warningKey?: string
  suggestionKey?: string
  suggestedTypes?: DossierRelationshipType[]
}

/**
 * Props for relationship type selector
 */
export interface RelationshipTypeSelectorProps {
  value: DossierRelationshipType | ''
  onChange: (value: DossierRelationshipType) => void
  sourceDossierType: DossierType
  targetDossierType?: DossierType
  disabled?: boolean
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * All relationship categories with metadata
 */
export const RELATIONSHIP_CATEGORIES: RelationshipCategoryInfo[] = [
  {
    id: 'membership',
    labelKey: 'guidance.categories.membership.label',
    descriptionKey: 'guidance.categories.membership.description',
    icon: 'Users',
  },
  {
    id: 'hierarchy',
    labelKey: 'guidance.categories.hierarchy.label',
    descriptionKey: 'guidance.categories.hierarchy.description',
    icon: 'GitBranch',
  },
  {
    id: 'cooperation',
    labelKey: 'guidance.categories.cooperation.label',
    descriptionKey: 'guidance.categories.cooperation.description',
    icon: 'Handshake',
  },
  {
    id: 'participation',
    labelKey: 'guidance.categories.participation.label',
    descriptionKey: 'guidance.categories.participation.description',
    icon: 'Calendar',
  },
  {
    id: 'temporal',
    labelKey: 'guidance.categories.temporal.label',
    descriptionKey: 'guidance.categories.temporal.description',
    icon: 'Clock',
  },
  {
    id: 'association',
    labelKey: 'guidance.categories.association.label',
    descriptionKey: 'guidance.categories.association.description',
    icon: 'Link',
  },
]

/**
 * All relationship types with detailed metadata
 */
export const RELATIONSHIP_TYPE_METADATA: RelationshipTypeMetadata[] = [
  // Membership category
  {
    type: 'member_of',
    category: 'membership',
    labelKey: 'types.member_of',
    descriptionKey: 'guidance.types.member_of.description',
    exampleKey: 'guidance.types.member_of.example',
    icon: 'UserPlus',
    isSymmetric: false,
    validSourceTypes: ['country', 'organization', 'person'],
    validTargetTypes: ['organization', 'forum', 'working_group'],
    recommendedFor: [
      { source: 'country', target: 'forum' },
      { source: 'country', target: 'organization' },
      { source: 'organization', target: 'forum' },
      { source: 'person', target: 'organization' },
      { source: 'person', target: 'working_group' },
    ],
    commonlyConfusedWith: ['participant_in', 'affiliate_of'],
    usageTipKey: 'guidance.types.member_of.tip',
  },
  {
    type: 'participant_in',
    category: 'membership',
    labelKey: 'types.participant_in',
    descriptionKey: 'guidance.types.participant_in.description',
    exampleKey: 'guidance.types.participant_in.example',
    icon: 'UserCheck',
    isSymmetric: false,
    validSourceTypes: ['country', 'organization', 'person'],
    validTargetTypes: ['forum', 'engagement', 'working_group'],
    recommendedFor: [
      { source: 'country', target: 'engagement' },
      { source: 'organization', target: 'engagement' },
      { source: 'person', target: 'engagement' },
    ],
    commonlyConfusedWith: ['member_of'],
    usageTipKey: 'guidance.types.participant_in.tip',
  },
  {
    type: 'observer_of',
    category: 'membership',
    labelKey: 'types.observer_of',
    descriptionKey: 'guidance.types.observer_of.description',
    exampleKey: 'guidance.types.observer_of.example',
    icon: 'Eye',
    isSymmetric: false,
    validSourceTypes: ['country', 'organization', 'person'],
    validTargetTypes: ['organization', 'forum', 'working_group'],
    recommendedFor: [
      { source: 'country', target: 'forum' },
      { source: 'organization', target: 'forum' },
    ],
    commonlyConfusedWith: ['member_of', 'participant_in'],
    usageTipKey: 'guidance.types.observer_of.tip',
  },
  {
    type: 'affiliate_of',
    category: 'membership',
    labelKey: 'types.affiliate_of',
    descriptionKey: 'guidance.types.affiliate_of.description',
    exampleKey: 'guidance.types.affiliate_of.example',
    icon: 'Building2',
    isSymmetric: false,
    validSourceTypes: ['organization'],
    validTargetTypes: ['organization'],
    recommendedFor: [{ source: 'organization', target: 'organization' }],
    commonlyConfusedWith: ['subsidiary_of', 'member_of'],
    usageTipKey: 'guidance.types.affiliate_of.tip',
  },

  // Hierarchy category
  {
    type: 'parent_of',
    category: 'hierarchy',
    labelKey: 'types.parent_of',
    descriptionKey: 'guidance.types.parent_of.description',
    exampleKey: 'guidance.types.parent_of.example',
    icon: 'GitBranch',
    isSymmetric: false,
    validSourceTypes: ['organization'],
    validTargetTypes: ['organization', 'working_group'],
    recommendedFor: [
      { source: 'organization', target: 'organization' },
      { source: 'organization', target: 'working_group' },
    ],
    commonlyConfusedWith: ['subsidiary_of'],
    usageTipKey: 'guidance.types.parent_of.tip',
  },
  {
    type: 'subsidiary_of',
    category: 'hierarchy',
    labelKey: 'types.subsidiary_of',
    descriptionKey: 'guidance.types.subsidiary_of.description',
    exampleKey: 'guidance.types.subsidiary_of.example',
    icon: 'GitCommitVertical',
    isSymmetric: false,
    validSourceTypes: ['organization', 'working_group'],
    validTargetTypes: ['organization'],
    recommendedFor: [
      { source: 'organization', target: 'organization' },
      { source: 'working_group', target: 'organization' },
    ],
    commonlyConfusedWith: ['parent_of', 'affiliate_of'],
    usageTipKey: 'guidance.types.subsidiary_of.tip',
  },
  {
    type: 'represents',
    category: 'hierarchy',
    labelKey: 'types.represents',
    descriptionKey: 'guidance.types.represents.description',
    exampleKey: 'guidance.types.represents.example',
    icon: 'Briefcase',
    isSymmetric: false,
    validSourceTypes: ['person', 'organization'],
    validTargetTypes: ['country', 'organization'],
    recommendedFor: [
      { source: 'person', target: 'country' },
      { source: 'person', target: 'organization' },
      { source: 'organization', target: 'country' },
    ],
    usageTipKey: 'guidance.types.represents.tip',
  },

  // Cooperation category
  {
    type: 'cooperates_with',
    category: 'cooperation',
    labelKey: 'types.cooperates_with',
    descriptionKey: 'guidance.types.cooperates_with.description',
    exampleKey: 'guidance.types.cooperates_with.example',
    icon: 'Handshake',
    isSymmetric: true,
    validSourceTypes: ['country', 'organization'],
    validTargetTypes: ['country', 'organization'],
    recommendedFor: [
      { source: 'country', target: 'country' },
      { source: 'organization', target: 'organization' },
    ],
    commonlyConfusedWith: ['bilateral_relation', 'partnership'],
    usageTipKey: 'guidance.types.cooperates_with.tip',
  },
  {
    type: 'bilateral_relation',
    category: 'cooperation',
    labelKey: 'types.bilateral_relation',
    descriptionKey: 'guidance.types.bilateral_relation.description',
    exampleKey: 'guidance.types.bilateral_relation.example',
    icon: 'ArrowLeftRight',
    isSymmetric: true,
    validSourceTypes: ['country'],
    validTargetTypes: ['country'],
    recommendedFor: [{ source: 'country', target: 'country' }],
    commonlyConfusedWith: ['cooperates_with'],
    usageTipKey: 'guidance.types.bilateral_relation.tip',
  },
  {
    type: 'partnership',
    category: 'cooperation',
    labelKey: 'types.partnership',
    descriptionKey: 'guidance.types.partnership.description',
    exampleKey: 'guidance.types.partnership.example',
    icon: 'HeartHandshake',
    isSymmetric: true,
    validSourceTypes: ['country', 'organization'],
    validTargetTypes: ['country', 'organization'],
    recommendedFor: [
      { source: 'organization', target: 'organization' },
      { source: 'country', target: 'organization' },
    ],
    commonlyConfusedWith: ['cooperates_with'],
    usageTipKey: 'guidance.types.partnership.tip',
  },

  // Participation category
  {
    type: 'participates_in',
    category: 'participation',
    labelKey: 'types.participates_in',
    descriptionKey: 'guidance.types.participates_in.description',
    exampleKey: 'guidance.types.participates_in.example',
    icon: 'Users',
    isSymmetric: false,
    validSourceTypes: ['country', 'organization', 'person'],
    validTargetTypes: ['engagement', 'forum', 'working_group'],
    recommendedFor: [
      { source: 'country', target: 'engagement' },
      { source: 'organization', target: 'engagement' },
      { source: 'person', target: 'engagement' },
    ],
    commonlyConfusedWith: ['member_of'],
    usageTipKey: 'guidance.types.participates_in.tip',
  },
  {
    type: 'involves',
    category: 'participation',
    labelKey: 'types.involves',
    descriptionKey: 'guidance.types.involves.description',
    exampleKey: 'guidance.types.involves.example',
    icon: 'Network',
    isSymmetric: false,
    validSourceTypes: ['engagement', 'working_group'],
    validTargetTypes: ['country', 'organization', 'person', 'topic'],
    recommendedFor: [
      { source: 'engagement', target: 'country' },
      { source: 'engagement', target: 'organization' },
      { source: 'engagement', target: 'topic' },
    ],
    usageTipKey: 'guidance.types.involves.tip',
  },
  {
    type: 'discusses',
    category: 'participation',
    labelKey: 'types.discusses',
    descriptionKey: 'guidance.types.discusses.description',
    exampleKey: 'guidance.types.discusses.example',
    icon: 'MessageSquare',
    isSymmetric: false,
    validSourceTypes: ['engagement', 'working_group', 'forum'],
    validTargetTypes: ['topic'],
    recommendedFor: [
      { source: 'engagement', target: 'topic' },
      { source: 'working_group', target: 'topic' },
    ],
    usageTipKey: 'guidance.types.discusses.tip',
  },
  {
    type: 'hosted_by',
    category: 'participation',
    labelKey: 'types.hosted_by',
    descriptionKey: 'guidance.types.hosted_by.description',
    exampleKey: 'guidance.types.hosted_by.example',
    icon: 'Home',
    isSymmetric: false,
    validSourceTypes: ['engagement', 'forum'],
    validTargetTypes: ['country', 'organization'],
    recommendedFor: [
      { source: 'engagement', target: 'country' },
      { source: 'engagement', target: 'organization' },
      { source: 'forum', target: 'organization' },
    ],
    commonlyConfusedWith: ['sponsored_by'],
    usageTipKey: 'guidance.types.hosted_by.tip',
  },
  {
    type: 'sponsored_by',
    category: 'participation',
    labelKey: 'types.sponsored_by',
    descriptionKey: 'guidance.types.sponsored_by.description',
    exampleKey: 'guidance.types.sponsored_by.example',
    icon: 'Award',
    isSymmetric: false,
    validSourceTypes: ['engagement', 'forum', 'working_group'],
    validTargetTypes: ['country', 'organization'],
    recommendedFor: [
      { source: 'engagement', target: 'organization' },
      { source: 'forum', target: 'organization' },
    ],
    commonlyConfusedWith: ['hosted_by'],
    usageTipKey: 'guidance.types.sponsored_by.tip',
  },

  // Temporal category
  {
    type: 'successor_of',
    category: 'temporal',
    labelKey: 'types.successor_of',
    descriptionKey: 'guidance.types.successor_of.description',
    exampleKey: 'guidance.types.successor_of.example',
    icon: 'ArrowRight',
    isSymmetric: false,
    validSourceTypes: ['organization', 'forum', 'working_group', 'person'],
    validTargetTypes: ['organization', 'forum', 'working_group', 'person'],
    recommendedFor: [
      { source: 'organization', target: 'organization' },
      { source: 'forum', target: 'forum' },
      { source: 'person', target: 'person' },
    ],
    commonlyConfusedWith: ['predecessor_of'],
    usageTipKey: 'guidance.types.successor_of.tip',
  },
  {
    type: 'predecessor_of',
    category: 'temporal',
    labelKey: 'types.predecessor_of',
    descriptionKey: 'guidance.types.predecessor_of.description',
    exampleKey: 'guidance.types.predecessor_of.example',
    icon: 'ArrowLeft',
    isSymmetric: false,
    validSourceTypes: ['organization', 'forum', 'working_group', 'person'],
    validTargetTypes: ['organization', 'forum', 'working_group', 'person'],
    recommendedFor: [
      { source: 'organization', target: 'organization' },
      { source: 'forum', target: 'forum' },
    ],
    commonlyConfusedWith: ['successor_of'],
    usageTipKey: 'guidance.types.predecessor_of.tip',
  },

  // Association category
  {
    type: 'related_to',
    category: 'association',
    labelKey: 'types.related_to',
    descriptionKey: 'guidance.types.related_to.description',
    exampleKey: 'guidance.types.related_to.example',
    icon: 'Link',
    isSymmetric: true,
    validSourceTypes: [
      'country',
      'organization',
      'forum',
      'person',
      'engagement',
      'working_group',
      'topic',
    ],
    validTargetTypes: [
      'country',
      'organization',
      'forum',
      'person',
      'engagement',
      'working_group',
      'topic',
    ],
    usageTipKey: 'guidance.types.related_to.tip',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get metadata for a specific relationship type
 */
export function getRelationshipTypeMetadata(
  type: DossierRelationshipType,
): RelationshipTypeMetadata | undefined {
  return RELATIONSHIP_TYPE_METADATA.find((m) => m.type === type)
}

/**
 * Get all relationship types in a category
 */
export function getRelationshipTypesByCategory(
  category: RelationshipCategory,
): RelationshipTypeMetadata[] {
  return RELATIONSHIP_TYPE_METADATA.filter((m) => m.category === category)
}

/**
 * Validate if a relationship type is valid for the given source/target dossier types
 */
export function validateRelationshipType(
  type: DossierRelationshipType,
  sourceType: DossierType,
  targetType?: DossierType,
): RelationshipTypeValidation {
  const metadata = getRelationshipTypeMetadata(type)

  if (!metadata) {
    return {
      isValid: false,
      isRecommended: false,
      warningKey: 'guidance.validation.unknownType',
    }
  }

  // Check if source type is valid
  if (!metadata.validSourceTypes.includes(sourceType)) {
    return {
      isValid: false,
      isRecommended: false,
      warningKey: 'guidance.validation.invalidSourceType',
      suggestionKey: 'guidance.validation.suggestAlternative',
      suggestedTypes: getSuggestedTypes(sourceType, targetType),
    }
  }

  // Check if target type is valid (if provided)
  if (targetType && !metadata.validTargetTypes.includes(targetType)) {
    return {
      isValid: false,
      isRecommended: false,
      warningKey: 'guidance.validation.invalidTargetType',
      suggestionKey: 'guidance.validation.suggestAlternative',
      suggestedTypes: getSuggestedTypes(sourceType, targetType),
    }
  }

  // Check if this is a recommended combination
  const isRecommended =
    targetType &&
    metadata.recommendedFor?.some((r) => r.source === sourceType && r.target === targetType)

  return {
    isValid: true,
    isRecommended: isRecommended || false,
  }
}

/**
 * Get recommended relationship types for a source/target combination
 */
export function getRecommendedTypes(
  sourceType: DossierType,
  targetType?: DossierType,
): DossierRelationshipType[] {
  return RELATIONSHIP_TYPE_METADATA.filter((m) => {
    if (!targetType) {
      return m.validSourceTypes.includes(sourceType)
    }
    return m.recommendedFor?.some((r) => r.source === sourceType && r.target === targetType)
  }).map((m) => m.type)
}

/**
 * Get valid relationship types for a source/target combination
 */
export function getValidTypes(
  sourceType: DossierType,
  targetType?: DossierType,
): DossierRelationshipType[] {
  return RELATIONSHIP_TYPE_METADATA.filter((m) => {
    if (!m.validSourceTypes.includes(sourceType)) {
      return false
    }
    if (targetType && !m.validTargetTypes.includes(targetType)) {
      return false
    }
    return true
  }).map((m) => m.type)
}

/**
 * Get suggested alternative types when validation fails
 */
export function getSuggestedTypes(
  sourceType: DossierType,
  targetType?: DossierType,
): DossierRelationshipType[] {
  const recommended = getRecommendedTypes(sourceType, targetType)
  if (recommended.length > 0) {
    return recommended.slice(0, 3)
  }

  const valid = getValidTypes(sourceType, targetType)
  return valid.slice(0, 3)
}

/**
 * Group relationship types by category for display
 */
export function getGroupedRelationshipTypes(
  sourceType: DossierType,
  targetType?: DossierType,
): Map<RelationshipCategory, RelationshipTypeMetadata[]> {
  const grouped = new Map<RelationshipCategory, RelationshipTypeMetadata[]>()

  for (const category of RELATIONSHIP_CATEGORIES) {
    const types = RELATIONSHIP_TYPE_METADATA.filter((m) => {
      if (m.category !== category.id) return false
      if (!m.validSourceTypes.includes(sourceType)) return false
      if (targetType && !m.validTargetTypes.includes(targetType)) return false
      return true
    })

    if (types.length > 0) {
      grouped.set(category.id, types)
    }
  }

  return grouped
}
