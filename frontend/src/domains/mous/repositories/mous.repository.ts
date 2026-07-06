/**
 * MoUs Repository
 * @module domains/mous/repositories/mous.repository
 *
 * Plain function exports for MoU API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiPost } from '@/lib/api-client'
import type { CreateMouPayload, Mou } from '../types'

/**
 * Create a new MoU via the deployed `mous` edge fn. The fn resolves the caller's
 * organization from their profile and auto-generates the reference number.
 */
export async function createMou(payload: CreateMouPayload): Promise<Mou> {
  return apiPost<Mou>('/mous', payload)
}
