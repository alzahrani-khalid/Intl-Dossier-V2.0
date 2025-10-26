/**
 * Edge Function: Search Interaction Notes
 *
 * Searches interaction notes across all contacts using keyword search on details field
 *
 * @endpoint GET /functions/v1/interaction-notes-search
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid interaction types
const INTERACTION_TYPES = ['meeting', 'email', 'call', 'conference', 'other'];

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

    // Parse query parameters
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('query') || '';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const types = url.searchParams.get('types')?.split(',').filter(t => t);
    const contactIds = url.searchParams.get('contact_ids')?.split(',').filter(id => id);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const includeContact = url.searchParams.get('include_contact') === 'true';

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'limit must be between 1 and 100' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (offset < 0) {
      return new Response(
        JSON.stringify({ error: 'offset must be non-negative' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate types if provided
    if (types) {
      for (const type of types) {
        if (!INTERACTION_TYPES.includes(type)) {
          return new Response(
            JSON.stringify({ error: `Invalid type: ${type}. Must be one of: ${INTERACTION_TYPES.join(', ')}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      }
    }

    if (!['date', 'created_at'].includes(sortBy)) {
      return new Response(
        JSON.stringify({ error: 'sort_by must be either "date" or "created_at"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return new Response(
        JSON.stringify({ error: 'sort_order must be either "asc" or "desc"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Build query with optional contact information
    const selectColumns = includeContact
      ? '*, cd_contacts!inner(id, full_name, position, organization_id, email_addresses, phone_numbers)'
      : '*';

    let query = supabaseClient
      .from('cd_interaction_notes')
      .select(selectColumns)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply full-text search on details field if query provided
    if (searchQuery && searchQuery.trim().length > 0) {
      // Use textSearch for full-text search
      query = query.textSearch('details', searchQuery, {
        type: 'websearch',
        config: 'simple'
      });
    }

    // Apply date range filters
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    // Filter by types (multiple)
    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    // Filter by contact IDs if provided
    if (contactIds && contactIds.length > 0) {
      query = query.in('contact_id', contactIds);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count if needed
    let totalCount = null;
    if (url.searchParams.get('count') === 'true') {
      let countQuery = supabaseClient
        .from('cd_interaction_notes')
        .select('*', { count: 'exact', head: true });

      // Apply same filters for count
      if (searchQuery && searchQuery.trim().length > 0) {
        countQuery = countQuery.textSearch('details', searchQuery, {
          type: 'websearch',
          config: 'simple'
        });
      }
      if (dateFrom) {
        countQuery = countQuery.gte('date', dateFrom);
      }
      if (dateTo) {
        countQuery = countQuery.lte('date', dateTo);
      }
      if (types && types.length > 0) {
        countQuery = countQuery.in('type', types);
      }
      if (contactIds && contactIds.length > 0) {
        countQuery = countQuery.in('contact_id', contactIds);
      }

      const { count: totalRows } = await countQuery;
      totalCount = totalRows;
    }

    // Group results by contact if requested
    const groupByContact = url.searchParams.get('group_by_contact') === 'true';
    let resultData = data || [];

    if (groupByContact && includeContact) {
      // Group notes by contact
      const grouped = new Map();

      for (const note of resultData) {
        const contactId = note.contact_id;
        if (!grouped.has(contactId)) {
          grouped.set(contactId, {
            contact: note.cd_contacts,
            notes: [],
            totalNotes: 0,
          });
        }

        // Remove nested contact info from note
        const { cd_contacts, ...noteWithoutContact } = note;
        grouped.get(contactId).notes.push(noteWithoutContact);
        grouped.get(contactId).totalNotes++;
      }

      resultData = Array.from(grouped.values());
    }

    // Calculate statistics if requested
    const includeStats = url.searchParams.get('include_stats') === 'true';
    let statistics = null;

    if (includeStats && data) {
      const byType: Record<string, number> = {
        meeting: 0,
        email: 0,
        call: 0,
        conference: 0,
        other: 0,
      };

      let mostRecentDate = null;
      const uniqueContacts = new Set();

      for (const note of data) {
        byType[note.type]++;
        uniqueContacts.add(note.contact_id);
        if (!mostRecentDate || note.date > mostRecentDate) {
          mostRecentDate = note.date;
        }
      }

      statistics = {
        totalNotes: data.length,
        uniqueContacts: uniqueContacts.size,
        notesByType: byType,
        mostRecentInteraction: mostRecentDate,
      };
    }

    // Prepare response
    const response = {
      data: resultData,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: totalCount ? (offset + limit) < totalCount : null,
      },
      ...(statistics && { statistics }),
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error searching interaction notes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});