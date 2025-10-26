/**
 * Edge Function: Manage Relationships
 *
 * Handles GET, POST, and DELETE operations for contact relationships
 *
 * @endpoint /functions/v1/relationships-manage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

/**
 * Validate relationship data before insertion
 */
function validateRelationship(rel: any) {
  const errors: string[] = [];

  // Validate required fields
  if (!rel.from_contact_id) {
    errors.push('from_contact_id is required');
  }

  if (!rel.to_contact_id) {
    errors.push('to_contact_id is required');
  }

  if (!rel.relationship_type) {
    errors.push('relationship_type is required');
  }

  // Prevent self-relationships
  if (rel.from_contact_id === rel.to_contact_id) {
    errors.push('Cannot create a relationship from a contact to itself');
  }

  // Validate relationship type
  const allowedTypes = [
    'reports_to',
    'manages',
    'colleague',
    'partner',
    'client',
    'vendor',
    'advisor',
    'board_member',
    'family',
    'friend',
    'other'
  ];

  if (rel.relationship_type && !allowedTypes.includes(rel.relationship_type)) {
    errors.push(`relationship_type must be one of: ${allowedTypes.join(', ')}`);
  }

  // Validate dates if provided
  if (rel.start_date && rel.end_date) {
    const startDate = new Date(rel.start_date);
    const endDate = new Date(rel.end_date);
    if (endDate < startDate) {
      errors.push('end_date cannot be before start_date');
    }
  }

  // Validate notes length
  if (rel.notes && rel.notes.length > 1000) {
    errors.push('notes cannot exceed 1000 characters');
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

    const url = new URL(req.url);
    const method = req.method;

    // Handle GET - List relationships for a contact
    if (method === 'GET') {
      const contactId = url.searchParams.get('contact_id');

      if (!contactId) {
        return new Response(
          JSON.stringify({ error: 'contact_id parameter is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get outgoing relationships
      const { data: outgoing, error: outgoingError } = await supabaseClient
        .from('cd_contact_relationships')
        .select('*')
        .eq('from_contact_id', contactId)
        .order('created_at', { ascending: false });

      if (outgoingError) throw outgoingError;

      // Get incoming relationships
      const { data: incoming, error: incomingError } = await supabaseClient
        .from('cd_contact_relationships')
        .select('*')
        .eq('to_contact_id', contactId)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      return new Response(
        JSON.stringify({
          data: {
            incoming: incoming || [],
            outgoing: outgoing || []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle POST - Create new relationship
    if (method === 'POST') {
      const relData = await req.json();

      // Validate relationship data
      const validationErrors = validateRelationship(relData);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: validationErrors }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if relationship already exists
      const { data: existing } = await supabaseClient
        .from('cd_contact_relationships')
        .select('id')
        .eq('from_contact_id', relData.from_contact_id)
        .eq('to_contact_id', relData.to_contact_id)
        .eq('relationship_type', relData.relationship_type)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This relationship already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      // Verify both contacts exist
      const { data: fromContact } = await supabaseClient
        .from('cd_contacts')
        .select('id')
        .eq('id', relData.from_contact_id)
        .single();

      if (!fromContact) {
        return new Response(
          JSON.stringify({ error: 'from_contact_id does not exist' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data: toContact } = await supabaseClient
        .from('cd_contacts')
        .select('id')
        .eq('id', relData.to_contact_id)
        .single();

      if (!toContact) {
        return new Response(
          JSON.stringify({ error: 'to_contact_id does not exist' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Insert relationship
      const { data, error } = await supabaseClient
        .from('cd_contact_relationships')
        .insert(relData)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }

    // Handle DELETE - Delete relationship
    if (method === 'DELETE') {
      const relationshipId = url.searchParams.get('id');

      if (!relationshipId) {
        return new Response(
          JSON.stringify({ error: 'id parameter is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabaseClient
        .from('cd_contact_relationships')
        .delete()
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Relationship not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: `Method ${method} not allowed` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    console.error('Error managing relationships:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});