/**
 * Team Collaboration Service
 * Feature: Collaborative Empty States
 *
 * API client for team statistics and invitation management
 * Connects to Supabase Edge Function: team-collaboration
 */

import { supabase } from '@/lib/supabase'

// ============================================================================
// Types
// ============================================================================

export interface TeamStats {
  entityType: string
  stats: {
    totalCount: number
    uniqueCreators: number
    recentCount: number
  }
  topContributors: TeamContributor[]
  suggestedUsers: SuggestedUser[]
  hasTeamActivity: boolean
}

export interface TeamContributor {
  user_id: string
  full_name: string
  avatar_url: string | null
  contribution_count: number
}

export interface SuggestedUser {
  user_id: string
  full_name: string
  avatar_url: string | null
  email: string
  department: string | null
}

export interface InvitationTemplate {
  id: string
  name_en: string
  name_ar: string
  subject_en: string
  subject_ar: string
  body_en: string
  body_ar: string
  entity_type: string
  is_default: boolean
}

export interface TeamInvitation {
  id: string
  inviter_id: string
  invitee_email: string
  invitee_id: string | null
  entity_type: string
  entity_id: string | null
  template_id: string | null
  custom_message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  sent_at: string
  responded_at: string | null
  expires_at: string
  inviter?: {
    id: string
    full_name: string
    avatar_url: string | null
    email: string
  }
  template?: {
    name_en: string
    name_ar: string
    subject_en: string
    subject_ar: string
  }
}

export interface SendInvitationRequest {
  inviteeEmail: string
  entityType: string
  entityId?: string
  templateId?: string
  customMessage?: string
}

export interface SendInvitationResponse {
  success: boolean
  invitationId: string
  inviteeExists: boolean
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get team statistics for a specific entity type
 * Used in empty states to show collaboration opportunities
 *
 * @param entityType - Entity type (dossier, document, engagement, etc.)
 * @returns Team statistics including top contributors and suggested users
 */
export async function getTeamStats(entityType: string): Promise<TeamStats> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('User not authenticated')
  }

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-collaboration`)
  url.searchParams.append('entityType', entityType)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch team stats')
  }

  return response.json()
}

/**
 * Get invitation message templates for a specific entity type
 *
 * @param entityType - Entity type to get templates for
 * @returns Array of invitation templates
 */
export async function getInvitationTemplates(entityType: string): Promise<InvitationTemplate[]> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('User not authenticated')
  }

  const url = new URL(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-collaboration/templates`,
  )
  url.searchParams.append('entityType', entityType)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch templates')
  }

  const data = await response.json()
  return data.templates
}

/**
 * Send a team collaboration invitation
 *
 * @param request - Invitation details
 * @returns Response with invitation ID and whether invitee exists
 */
export async function sendTeamInvitation(
  request: SendInvitationRequest,
): Promise<SendInvitationResponse> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-collaboration/invite`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to send invitation')
  }

  return response.json()
}

/**
 * Get all invitations for the current user (sent and received)
 *
 * @returns Array of invitations
 */
export async function getMyInvitations(): Promise<TeamInvitation[]> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-collaboration/invitations`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch invitations')
  }

  const data = await response.json()
  return data.invitations
}

/**
 * Respond to a team invitation
 *
 * @param invitationId - ID of the invitation
 * @param status - Response status (accepted or declined)
 * @returns Updated invitation
 */
export async function respondToInvitation(
  invitationId: string,
  status: 'accepted' | 'declined',
): Promise<TeamInvitation> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-collaboration/invitations/${invitationId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to respond to invitation')
  }

  const data = await response.json()
  return data.invitation
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format invitation template body with variables
 *
 * @param template - Template body text
 * @param variables - Variables to replace in template
 * @returns Formatted template
 */
export function formatTemplateBody(
  template: string,
  variables: {
    inviter_name?: string
    invitee_name?: string
    custom_message?: string
  },
): string {
  let formatted = template

  // Replace simple variables
  if (variables.inviter_name) {
    formatted = formatted.replace(/\{\{inviter_name\}\}/g, variables.inviter_name)
  }
  if (variables.invitee_name) {
    formatted = formatted.replace(/\{\{invitee_name\}\}/g, variables.invitee_name)
  }

  // Handle conditional blocks
  if (variables.custom_message) {
    // Replace {{#if custom_message}}...{{/if}} with content
    formatted = formatted.replace(
      /\{\{#if custom_message\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, content) => content.replace(/\{\{custom_message\}\}/g, variables.custom_message || ''),
    )
  } else {
    // Remove {{#if custom_message}}...{{/if}} entirely
    formatted = formatted.replace(/\{\{#if custom_message\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }

  return formatted.trim()
}

/**
 * Get entity type display name
 *
 * @param entityType - Entity type key
 * @param language - Language code (en or ar)
 * @returns Display name
 */
export function getEntityTypeDisplayName(entityType: string, language: 'en' | 'ar'): string {
  const names: Record<string, { en: string; ar: string }> = {
    dossier: { en: 'Dossiers', ar: 'الملفات' },
    document: { en: 'Documents', ar: 'المستندات' },
    engagement: { en: 'Engagements', ar: 'الارتباطات' },
    commitment: { en: 'Commitments', ar: 'الالتزامات' },
    position: { en: 'Positions', ar: 'المواقف' },
    organization: { en: 'Organizations', ar: 'المنظمات' },
    country: { en: 'Countries', ar: 'الدول' },
    forum: { en: 'Forums', ar: 'المنتديات' },
    event: { en: 'Events', ar: 'الفعاليات' },
    task: { en: 'Tasks', ar: 'المهام' },
    person: { en: 'Contacts', ar: 'جهات الاتصال' },
    mou: { en: 'MOUs', ar: 'مذكرات التفاهم' },
  }

  return names[entityType]?.[language] || entityType
}
