/**
 * Topics Domain Barrel
 * @module domains/topics
 *
 * Re-exports all hooks, repository, and types for the topics domain.
 * Canonical import path for consumers: `@/domains/topics`
 */

// Hooks
export { topicKeys, useTopicSubtopics } from './hooks/useTopics'

// Repository
export * as topicsRepo from './repositories/topics.repository'

// Types
export * from './types'
