/**
 * Centralized Cache TTL Configuration
 *
 * This file defines TTL (Time-To-Live) values for all cached entity types
 * in the application. These values can be overridden via environment variables.
 *
 * TTL Guidelines:
 * - Static/rarely changing data: 1 hour (3600s)
 * - User-related data: 15 minutes (900s)
 * - Dossiers/frequently accessed: 5 minutes (300s)
 * - Real-time/volatile data: 1 minute (60s)
 */

/**
 * Entity types that can be cached
 */
export type CacheableEntityType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'
  | 'user'
  | 'session'
  | 'translation'
  | 'document'
  | 'position'
  | 'mou'
  | 'task'
  | 'commitment'
  | 'contact'
  | 'relationship'
  | 'calendar'
  | 'search'
  | 'suggestion'
  | 'embedding'
  | 'ai_response'
  | 'static'
  | 'default'

/**
 * TTL values in seconds for each entity type
 */
export const CACHE_TTL: Record<CacheableEntityType, number> = {
  // Dossier types - 5 minutes (frequently accessed, needs freshness)
  dossier: parseInt(process.env.CACHE_TTL_DOSSIER || '300', 10),
  country: parseInt(process.env.CACHE_TTL_COUNTRY || '300', 10),
  organization: parseInt(process.env.CACHE_TTL_ORGANIZATION || '300', 10),
  forum: parseInt(process.env.CACHE_TTL_FORUM || '300', 10),
  engagement: parseInt(process.env.CACHE_TTL_ENGAGEMENT || '300', 10),
  topic: parseInt(process.env.CACHE_TTL_TOPIC || '300', 10),
  working_group: parseInt(process.env.CACHE_TTL_WORKING_GROUP || '300', 10),
  person: parseInt(process.env.CACHE_TTL_PERSON || '300', 10),
  elected_official: parseInt(process.env.CACHE_TTL_ELECTED_OFFICIAL || '300', 10),

  // User-related - 15 minutes (balance between freshness and performance)
  user: parseInt(process.env.CACHE_TTL_USER || '900', 10),
  session: parseInt(process.env.CACHE_TTL_SESSION || '1800', 10),

  // Static/reference data - 1 hour (rarely changes)
  translation: parseInt(process.env.CACHE_TTL_TRANSLATION || '3600', 10),
  static: parseInt(process.env.CACHE_TTL_STATIC || '3600', 10),

  // Documents & positions - 4-5 minutes
  document: parseInt(process.env.CACHE_TTL_DOCUMENT || '240', 10),
  position: parseInt(process.env.CACHE_TTL_POSITION || '300', 10),
  mou: parseInt(process.env.CACHE_TTL_MOU || '300', 10),

  // Work items - 5 minutes
  task: parseInt(process.env.CACHE_TTL_TASK || '300', 10),
  commitment: parseInt(process.env.CACHE_TTL_COMMITMENT || '300', 10),

  // Contacts & relationships - 5 minutes
  contact: parseInt(process.env.CACHE_TTL_CONTACT || '300', 10),
  relationship: parseInt(process.env.CACHE_TTL_RELATIONSHIP || '300', 10),
  calendar: parseInt(process.env.CACHE_TTL_CALENDAR || '300', 10),

  // Search & suggestions - 5 minutes
  search: parseInt(process.env.CACHE_TTL_SEARCH || '300', 10),
  suggestion: parseInt(process.env.CACHE_TTL_SUGGESTION || '300', 10),

  // AI/ML - short TTL for freshness
  embedding: parseInt(process.env.CACHE_TTL_EMBEDDING || '1800', 10),
  ai_response: parseInt(process.env.CACHE_TTL_AI_RESPONSE || '60', 10),

  // Default fallback
  default: parseInt(process.env.CACHE_TTL_DEFAULT || '300', 10),
}

/**
 * Cache key prefixes for different entity types
 */
export const CACHE_KEY_PREFIX: Record<CacheableEntityType, string> = {
  dossier: 'dossier:',
  country: 'country:',
  organization: 'org:',
  forum: 'forum:',
  engagement: 'engagement:',
  topic: 'topic:',
  working_group: 'wg:',
  person: 'person:',
  elected_official: 'elected:',
  user: 'user:',
  session: 'session:',
  translation: 'trans:',
  document: 'doc:',
  position: 'pos:',
  mou: 'mou:',
  task: 'task:',
  commitment: 'commit:',
  contact: 'contact:',
  relationship: 'rel:',
  calendar: 'cal:',
  search: 'search:',
  suggestion: 'suggest:',
  embedding: 'embed:',
  ai_response: 'ai:',
  static: 'static:',
  default: 'cache:',
}

/**
 * Tags for cache invalidation grouping
 */
export const CACHE_TAGS = {
  // Dossier-related tags
  DOSSIERS: 'dossiers',
  COUNTRIES: 'countries',
  ORGANIZATIONS: 'organizations',
  FORUMS: 'forums',
  ENGAGEMENTS: 'engagements',
  TOPICS: 'topics',
  WORKING_GROUPS: 'working_groups',
  PERSONS: 'persons',
  ELECTED_OFFICIALS: 'elected_officials',

  // User & auth tags
  USERS: 'users',
  SESSIONS: 'sessions',

  // Content tags
  DOCUMENTS: 'documents',
  POSITIONS: 'positions',
  MOUS: 'mous',

  // Work item tags
  TASKS: 'tasks',
  COMMITMENTS: 'commitments',

  // Relationship tags
  CONTACTS: 'contacts',
  RELATIONSHIPS: 'relationships',
  CALENDAR: 'calendar',

  // Search & AI tags
  SEARCH: 'search',
  SUGGESTIONS: 'suggestions',
  EMBEDDINGS: 'embeddings',
  AI_RESPONSES: 'ai_responses',

  // Static content
  TRANSLATIONS: 'translations',
  STATIC: 'static',
} as const

/**
 * Get TTL for a specific entity type
 */
export function getTTL(entityType: CacheableEntityType): number {
  return CACHE_TTL[entityType] ?? CACHE_TTL.default
}

/**
 * Get cache key prefix for a specific entity type
 */
export function getKeyPrefix(entityType: CacheableEntityType): string {
  return CACHE_KEY_PREFIX[entityType] ?? CACHE_KEY_PREFIX.default
}

/**
 * Generate a cache key with proper prefix
 */
export function generateCacheKey(
  entityType: CacheableEntityType,
  identifier: string | Record<string, unknown>,
): string {
  const prefix = getKeyPrefix(entityType)
  if (typeof identifier === 'string') {
    return `${prefix}${identifier}`
  }
  // For objects, create a deterministic hash
  const sortedJson = JSON.stringify(identifier, Object.keys(identifier).sort())
  const hash = simpleHash(sortedJson)
  return `${prefix}${hash}`
}

/**
 * Simple hash function for cache key generation
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Get tags for an entity type (for invalidation grouping)
 */
export function getTagsForEntity(entityType: CacheableEntityType): string[] {
  const tagMap: Partial<Record<CacheableEntityType, string[]>> = {
    dossier: [CACHE_TAGS.DOSSIERS],
    country: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.COUNTRIES],
    organization: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.ORGANIZATIONS],
    forum: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.FORUMS],
    engagement: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.ENGAGEMENTS],
    topic: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.TOPICS],
    working_group: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.WORKING_GROUPS],
    person: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.PERSONS],
    elected_official: [CACHE_TAGS.DOSSIERS, CACHE_TAGS.ELECTED_OFFICIALS],
    user: [CACHE_TAGS.USERS],
    session: [CACHE_TAGS.SESSIONS, CACHE_TAGS.USERS],
    translation: [CACHE_TAGS.TRANSLATIONS, CACHE_TAGS.STATIC],
    document: [CACHE_TAGS.DOCUMENTS],
    position: [CACHE_TAGS.POSITIONS, CACHE_TAGS.DOCUMENTS],
    mou: [CACHE_TAGS.MOUS, CACHE_TAGS.DOCUMENTS],
    task: [CACHE_TAGS.TASKS],
    commitment: [CACHE_TAGS.COMMITMENTS, CACHE_TAGS.TASKS],
    contact: [CACHE_TAGS.CONTACTS],
    relationship: [CACHE_TAGS.RELATIONSHIPS],
    calendar: [CACHE_TAGS.CALENDAR],
    search: [CACHE_TAGS.SEARCH],
    suggestion: [CACHE_TAGS.SUGGESTIONS, CACHE_TAGS.SEARCH],
    embedding: [CACHE_TAGS.EMBEDDINGS],
    ai_response: [CACHE_TAGS.AI_RESPONSES],
    static: [CACHE_TAGS.STATIC],
  }

  return tagMap[entityType] ?? []
}

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
