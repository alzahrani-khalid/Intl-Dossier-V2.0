/**
 * Edge Function: resolve-dossier-context
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Resolves dossier context from entity relationships with sub-100ms target.
 * Supports: dossier, engagement, after_action, position entity types.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Global client for performance (reused across invocations)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

interface DossierContextRequest {
  entity_type: 'dossier' | 'engagement' | 'after_action' | 'position';
  entity_id: string;
}

interface ResolvedDossierContext {
  dossier_id: string;
  dossier_name_en: string;
  dossier_name_ar: string;
  dossier_type: string;
  dossier_status: string;
  inheritance_source: string;
  resolution_path: string[];
}

interface DossierContextResponse {
  dossiers: ResolvedDossierContext[];
  resolved_from: string;
  query_time_ms: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with user token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parse request body
    const body: DossierContextRequest = await req.json();

    // Validate request
    if (!body.entity_type || !body.entity_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: entity_type and entity_id',
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const validEntityTypes = ['dossier', 'engagement', 'after_action', 'position'];
    if (!validEntityTypes.includes(body.entity_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid entity_type: ${body.entity_type}. Must be one of: ${validEntityTypes.join(', ')}`,
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.entity_id)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid entity_id format. Must be a valid UUID.',
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call RPC function for context resolution
    const { data, error } = await supabase.rpc('resolve_dossier_context', {
      p_entity_type: body.entity_type,
      p_entity_id: body.entity_id,
    });

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to resolve dossier context',
          code: 'INTERNAL_ERROR',
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const queryTime = performance.now() - startTime;

    // Transform RPC result to response format
    const dossiers: ResolvedDossierContext[] = (data || []).map((row: any) => ({
      dossier_id: row.dossier_id,
      dossier_name_en: row.dossier_name_en,
      dossier_name_ar: row.dossier_name_ar,
      dossier_type: row.dossier_type,
      dossier_status: row.dossier_status,
      inheritance_source: row.inheritance_source,
      resolution_path: row.resolution_path || [],
    }));

    const response: DossierContextResponse = {
      dossiers,
      resolved_from: body.entity_type,
      query_time_ms: Math.round(queryTime * 100) / 100,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${Math.round(queryTime)}ms`,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
