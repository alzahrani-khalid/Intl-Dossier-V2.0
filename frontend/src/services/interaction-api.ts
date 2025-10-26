/**
 * Interaction Note API Client
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * Typed API client for interaction note operations using Supabase Edge Functions.
 * Handles authentication, error handling, and response parsing for interaction history tracking.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '../types/contact-directory.types';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

// Type definitions from database
type InteractionNote = Database['public']['Tables']['cd_interaction_notes']['Row'];
type InteractionNoteInsert = Database['public']['Tables']['cd_interaction_notes']['Insert'];
type InteractionNoteUpdate = Database['public']['Tables']['cd_interaction_notes']['Update'];

/**
 * Interaction Note Response (with populated data)
 */
export interface InteractionNoteResponse extends InteractionNote {
  contact?: {
    id: string;
    full_name: string;
    organization?: {
      name: string;
    };
  };
  attendee_contacts?: Array<{
    id: string;
    full_name: string;
  }>;
}

/**
 * Create Interaction Note Parameters
 */
export interface CreateInteractionNoteParams {
  contact_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  type: 'meeting' | 'email' | 'call' | 'conference' | 'other';
  details: string;
  attendees?: string[]; // Array of contact IDs
  attachments?: string[]; // Array of file paths in Supabase Storage
}

/**
 * Search Interaction Notes Parameters
 */
export interface SearchInteractionNotesParams {
  query?: string; // Full-text search in details
  contact_id?: string; // Filter by contact
  type?: string; // Filter by interaction type
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
  limit?: number; // Pagination limit (default: 50)
  offset?: number; // Pagination offset (default: 0)
}

/**
 * Search Response
 */
export interface InteractionNotesSearchResponse {
  notes: InteractionNoteResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * API Error
 */
export class InteractionAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'InteractionAPIError';
  }
}

/**
 * Get authorization headers with current user's JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new InteractionAPIError('Not authenticated', 401);
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Handle Edge Function responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new InteractionAPIError(errorMessage, response.status);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new InteractionAPIError('Failed to parse response', response.status, error);
  }
}

/**
 * Create a new interaction note
 */
export async function createNote(
  params: CreateInteractionNoteParams
): Promise<InteractionNoteResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${supabaseUrl}/functions/v1/interaction-notes-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  return handleResponse<InteractionNoteResponse>(response);
}

/**
 * Get interaction notes for a specific contact
 */
export async function getNotesForContact(contactId: string): Promise<InteractionNoteResponse[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${supabaseUrl}/functions/v1/interaction-notes-list?contact_id=${contactId}`,
    {
      method: 'GET',
      headers,
    }
  );

  const data = await handleResponse<{ notes: InteractionNoteResponse[] }>(response);
  return data.notes;
}

/**
 * Search interaction notes with filters
 */
export async function searchNotes(
  params: SearchInteractionNotesParams = {}
): Promise<InteractionNotesSearchResponse> {
  const headers = await getAuthHeaders();

  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `${supabaseUrl}/functions/v1/interaction-notes-search?${queryParams.toString()}`,
    {
      method: 'GET',
      headers,
    }
  );

  return handleResponse<InteractionNotesSearchResponse>(response);
}

/**
 * Update an existing interaction note
 */
export async function updateNote(
  id: string,
  updates: Partial<InteractionNoteUpdate>
): Promise<InteractionNoteResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${supabaseUrl}/functions/v1/interaction-notes-update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, ...updates }),
  });

  return handleResponse<InteractionNoteResponse>(response);
}

/**
 * Delete an interaction note
 */
export async function deleteNote(id: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${supabaseUrl}/functions/v1/interaction-notes-delete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id }),
  });

  await handleResponse<{ success: boolean }>(response);
}

/**
 * Upload attachment to Supabase Storage
 * Returns the storage path for the uploaded file
 */
export async function uploadAttachment(
  contactId: string,
  noteId: string,
  file: File
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new InteractionAPIError('Not authenticated', 401);
  }

  // Generate unique filename to avoid collisions
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `contacts/interactions/${contactId}/${noteId}/${timestamp}_${sanitizedFilename}`;

  const { data, error } = await supabase.storage.from('contact-files').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new InteractionAPIError(`Failed to upload file: ${error.message}`, 500, error);
  }

  return data.path;
}

/**
 * Get public URL for attachment
 */
export async function getAttachmentUrl(path: string): Promise<string> {
  const { data } = supabase.storage.from('contact-files').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download attachment
 * Returns a Blob of the file
 */
export async function downloadAttachment(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from('contact-files').download(path);

  if (error) {
    throw new InteractionAPIError(`Failed to download file: ${error.message}`, 500, error);
  }

  return data;
}

/**
 * Delete attachment from storage
 */
export async function deleteAttachment(path: string): Promise<void> {
  const { error } = await supabase.storage.from('contact-files').remove([path]);

  if (error) {
    throw new InteractionAPIError(`Failed to delete file: ${error.message}`, 500, error);
  }
}

/**
 * Get interaction notes (direct Supabase query - fallback method)
 * Used when Edge Function is unavailable
 */
export async function getNotesForContactDirect(
  contactId: string
): Promise<InteractionNoteResponse[]> {
  const { data, error } = await supabase
    .from('cd_interaction_notes')
    .select(
      `
      *,
      contact:cd_contacts!contact_id (
        id,
        full_name,
        organization:cd_organizations (name)
      )
    `
    )
    .eq('contact_id', contactId)
    .order('date', { ascending: false });

  if (error) {
    throw new InteractionAPIError(error.message, 500, error);
  }

  return data || [];
}
