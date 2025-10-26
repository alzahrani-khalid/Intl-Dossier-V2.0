/**
 * Edge Function: Create Interaction Note
 *
 * Creates a new interaction note for a contact with validation
 *
 * @endpoint POST /functions/v1/interaction-notes-create
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid interaction types
const INTERACTION_TYPES = ['meeting', 'email', 'call', 'conference', 'other'];

/**
 * Validate interaction note data before insertion
 */
function validateInteractionNote(note: any): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!note.contact_id) {
    errors.push('contact_id is required');
  }

  if (!note.date) {
    errors.push('date is required');
  } else {
    // Validate date is not in future
    const noteDate = new Date(note.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (noteDate > today) {
      errors.push('Interaction date cannot be in the future');
    }
  }

  // Validate details
  if (!note.details || note.details.trim().length < 10) {
    errors.push('details is required and must be at least 10 characters');
  }
  if (note.details && note.details.length > 10000) {
    errors.push('details cannot exceed 10,000 characters');
  }

  // Validate interaction type
  if (!note.type || !INTERACTION_TYPES.includes(note.type)) {
    errors.push(`type must be one of: ${INTERACTION_TYPES.join(', ')}`);
  }

  // Validate attachments if provided
  if (note.attachments) {
    if (!Array.isArray(note.attachments)) {
      errors.push('attachments must be an array of file paths');
    } else {
      for (const attachment of note.attachments) {
        if (typeof attachment !== 'string' || attachment.trim().length === 0) {
          errors.push('Each attachment must be a non-empty string (file path)');
          break;
        }
        if (attachment.includes('..') || attachment.includes('~')) {
          errors.push('Invalid attachment path detected');
          break;
        }
      }
    }
  }

  // Validate attendees if provided
  if (note.attendees) {
    if (!Array.isArray(note.attendees)) {
      errors.push('attendees must be an array');
    } else {
      for (const attendee of note.attendees) {
        if (typeof attendee !== 'string' || attendee.trim().length === 0) {
          errors.push('Each attendee must be a non-empty string');
          break;
        }
      }
    }
  }

  return errors;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user (JWT validation)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const noteData = await req.json();

    // Validate interaction note data
    const validationErrors = validateInteractionNote(noteData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if contact exists and is not archived
    const { data: contact, error: contactError } = await supabaseClient
      .from('cd_contacts')
      .select('id')
      .eq('id', noteData.contact_id)
      .eq('is_archived', false)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found or is archived' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Add created_by field
    const noteToInsert = {
      ...noteData,
      created_by: user.id,
    };

    // Insert interaction note
    const { data, error } = await supabaseClient
      .from('cd_interaction_notes')
      .insert(noteToInsert)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );
  } catch (error) {
    console.error('Error creating interaction note:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});