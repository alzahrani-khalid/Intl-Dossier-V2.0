/**
 * AI Repository
 * @module domains/ai/repositories/ai.repository
 *
 * All AI-related API operations targeting the Express backend.
 * Uses raw fetch for SSE streaming endpoints, apiGet for simple endpoints.
 * CRITICAL: All functions use baseUrl: 'express' (Express backend, not Edge Functions).
 */

import { supabase } from '@/lib/supabase'
import type { ChatRequestParams, FieldAssistParams, BriefContent } from '../types'
import { apiGet } from '@/lib/api-client'

// ============================================================================
// Helpers
// ============================================================================

function getExpressBaseUrl(): string {
  return import.meta.env.VITE_API_URL || '/api'
}

function getEdgeBaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
}

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// ============================================================================
// AI Chat (SSE streaming — uses Express backend)
// ============================================================================

/**
 * Send a chat message and receive an SSE streaming response.
 * Returns the raw Response for the hook to handle streaming.
 */
export async function chatWithAI(
  params: ChatRequestParams,
  signal?: AbortSignal,
): Promise<Response> {
  const token = await getAuthToken()
  const response = await fetch(`${getExpressBaseUrl()}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as Record<string, string>).error || 'Chat request failed',
    )
  }

  return response
}

// ============================================================================
// AI Field Assist (Express first, Edge Function fallback)
// ============================================================================

/**
 * Request AI-assisted field pre-filling for dossier creation.
 * Tries Express backend first, falls back to Edge Function.
 */
export async function getFieldAssist(
  params: FieldAssistParams,
  signal?: AbortSignal,
): Promise<Response> {
  const token = await getAuthToken()

  // Try Express backend first (can reach local AnythingLLM), fallback to Edge Function
  const backendUrl = import.meta.env.VITE_API_URL
  const backendAvailable = Boolean(backendUrl) && backendUrl !== 'undefined'
  const apiUrl = backendAvailable
    ? `${backendUrl}/ai/dossier-field-assist`
    : `${getEdgeBaseUrl()}/dossier-field-assist`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(backendAvailable ? {} : { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }),
    },
    body: JSON.stringify({
      dossier_type: params.dossier_type,
      description: params.description.trim(),
      language: params.language || 'en',
    }),
    signal,
  })

  return response
}

// ============================================================================
// Brief Generation (SSE streaming — uses Express backend)
// ============================================================================

/**
 * Generate an AI brief with SSE streaming.
 * Returns the raw Response for the hook to handle streaming.
 */
export async function generateBrief(
  params: {
    engagement_id?: string
    dossier_id?: string
    custom_prompt?: string
    language: string
  },
  signal?: AbortSignal,
): Promise<Response> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('UNAUTHORIZED')
  }

  const response = await fetch(`${getExpressBaseUrl()}/ai/briefs/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as Record<string, string>).error || 'Failed to generate brief',
    )
  }

  return response
}

/**
 * Fetch a completed brief by ID.
 */
export async function getBrief(briefId: string): Promise<{ data: BriefContent }> {
  return apiGet<{ data: BriefContent }>(`/ai/briefs/${briefId}`, { baseUrl: 'express' })
}
