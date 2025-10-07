import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Validation schemas
const CreateEngagementSchema = z.object({
  dossier_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  engagement_type: z.enum(['meeting', 'consultation', 'coordination', 'workshop', 'conference', 'site_visit', 'other']),
  engagement_date: z.string().datetime(),
  location: z.string().max(500).optional(),
  description: z.string().optional(),
});

const UpdateEngagementSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  engagement_type: z.enum(['meeting', 'consultation', 'coordination', 'workshop', 'conference', 'site_visit', 'other']).optional(),
  engagement_date: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  description: z.string().optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // POST /engagements - Create engagement
    if (req.method === 'POST' && pathParts.length === 1) {
      const body = await req.json();

      // Validate request body
      const validationResult = CreateEngagementSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request body',
            details: validationResult.error.issues,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: engagement, error } = await supabaseClient
        .from('engagements')
        .insert({
          ...validationResult.data,
          created_by: (await supabaseClient.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301') {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify(engagement), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /engagements/{id} - Get engagement by ID
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[0] === 'engagements') {
      const engagementId = pathParts[1];

      const { data: engagement, error } = await supabaseClient
        .from('engagements')
        .select('*')
        .eq('id', engagementId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Engagement not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify(engagement), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /engagements/{id} - Update engagement
    if (req.method === 'PATCH' && pathParts.length === 2 && pathParts[0] === 'engagements') {
      const engagementId = pathParts[1];
      const body = await req.json();

      // Validate request body
      const validationResult = UpdateEngagementSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request body',
            details: validationResult.error.issues,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: engagement, error } = await supabaseClient
        .from('engagements')
        .update(validationResult.data)
        .eq('id', engagementId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Engagement not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        if (error.code === 'PGRST301') {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify(engagement), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /dossiers/{dossierId}/engagements - List engagements for dossier
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[0] === 'dossiers' && pathParts[2] === 'engagements') {
      const dossierId = pathParts[1];
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Validate pagination params
      if (limit < 1 || limit > 100) {
        return new Response(
          JSON.stringify({ error: 'Limit must be between 1 and 100' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (offset < 0) {
        return new Response(
          JSON.stringify({ error: 'Offset must be non-negative' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get total count
      const { count, error: countError } = await supabaseClient
        .from('engagements')
        .select('*', { count: 'exact', head: true })
        .eq('dossier_id', dossierId);

      if (countError) throw countError;

      // Get paginated data
      const { data: engagements, error } = await supabaseClient
        .from('engagements')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('engagement_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          data: engagements || [],
          total: count || 0,
          limit,
          offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route not found
    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Engagements function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
