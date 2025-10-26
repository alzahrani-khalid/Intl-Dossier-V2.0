/**
 * Edge Function: Manage Tags
 *
 * Handles GET and POST operations for tags
 *
 * @endpoint /functions/v1/tags-manage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Validate tag data before insertion
 */
function validateTag(tag: any) {
  const errors: string[] = [];

  // Validate name
  if (!tag.name || tag.name.trim().length < 2) {
    errors.push('name is required and must be at least 2 characters');
  }
  if (tag.name && tag.name.length > 100) {
    errors.push('name cannot exceed 100 characters');
  }

  // Validate category
  if (!tag.category) {
    errors.push('category is required');
  }

  const allowedCategories = [
    'skill',
    'department',
    'project',
    'location',
    'language',
    'certification',
    'industry',
    'interest',
    'other'
  ];

  if (tag.category && !allowedCategories.includes(tag.category)) {
    errors.push(`category must be one of: ${allowedCategories.join(', ')}`);
  }

  // Validate color if provided (hex color format)
  if (tag.color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(tag.color)) {
      errors.push('color must be a valid hex color (e.g., #FF5733 or #F53)');
    }
  }

  // Validate icon if provided
  if (tag.icon) {
    // Check if it's an emoji or icon name
    const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
    const iconNameRegex = /^[a-z0-9-]+$/;

    if (!emojiRegex.test(tag.icon) && !iconNameRegex.test(tag.icon)) {
      errors.push('icon must be either an emoji or a lowercase icon name (e.g., "user-circle")');
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

    const url = new URL(req.url);
    const method = req.method;

    // Handle GET - List tags
    if (method === 'GET') {
      const params = url.searchParams;
      const category = params.get('category') || undefined;
      const search = params.get('search') || undefined;
      const limit = Math.min(parseInt(params.get('limit') || '100'), 200);
      const offset = parseInt(params.get('offset') || '0');

      // Build query
      let query = supabaseClient
        .from('cd_tags')
        .select('*', { count: 'exact' });

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Apply sorting
      query = query
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({
          data: data || [],
          count: count || 0,
          limit,
          offset
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle POST - Create new tag(s)
    if (method === 'POST') {
      const body = await req.json();

      // Check if it's a bulk operation
      const isBulk = Array.isArray(body);
      const tags = isBulk ? body : [body];

      // Validate all tags
      const allErrors: string[] = [];
      tags.forEach((tag, index) => {
        const errors = validateTag(tag);
        if (errors.length > 0) {
          errors.forEach(error => {
            allErrors.push(isBulk ? `Tag ${index + 1}: ${error}` : error);
          });
        }
      });

      if (allErrors.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: allErrors }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check for duplicates within the batch
      if (isBulk) {
        const nameSet = new Set<string>();
        for (const tag of tags) {
          const key = `${tag.category}:${tag.name}`;
          if (nameSet.has(key)) {
            return new Response(
              JSON.stringify({
                error: `Duplicate tag in batch: "${tag.name}" in category "${tag.category}"`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          nameSet.add(key);
        }
      }

      // Check for existing tags in database
      for (const tag of tags) {
        const { data: existing } = await supabaseClient
          .from('cd_tags')
          .select('id')
          .eq('name', tag.name)
          .eq('category', tag.category)
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({
              error: `Tag with name "${tag.name}" already exists in category "${tag.category}"`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
          );
        }
      }

      // Insert tag(s)
      if (isBulk) {
        const { data, error } = await supabaseClient
          .from('cd_tags')
          .insert(tags)
          .select();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'One or more tags already exist' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        );
      } else {
        const { data, error } = await supabaseClient
          .from('cd_tags')
          .insert(body)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Tag already exists' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: `Method ${method} not allowed` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    console.error('Error managing tags:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});