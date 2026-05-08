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
 * Note: elected_official is now a person_subtype, cache uses 'person' type
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
  // Dossier-related tags (elected_officials merged into persons)
  DOSSIERS: 'dossiers',
  COUNTRIES: 'countries',
  ORGANIZATIONS: 'organizations',
  FORUMS: 'forums',
  ENGAGEMENTS: 'engagements',
  TOPICS: 'topics',
  WORKING_GROUPS: 'working_groups',
  PERSONS: 'persons',

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
 * Get cache key prefix for a specific entity type
 */
export function getKeyPrefix(entityType: CacheableEntityType): string {
  return CACHE_KEY_PREFIX[entityType] ?? CACHE_KEY_PREFIX.default
}
