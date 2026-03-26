/**
 * Topics Repository
 * @module domains/topics/repositories/topics.repository
 *
 * Plain function exports for topic-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet } from '@/lib/api-client'
import type { DossierWithExtension } from '@/services/dossier-api'

// ============================================================================
// Topic Subtopics
// ============================================================================

export async function getTopicSubtopics(topicId: string): Promise<DossierWithExtension[]> {
  const result = await apiGet<{ data: DossierWithExtension[] }>(`/topics/${topicId}/subtopics`)
  return result.data || []
}
