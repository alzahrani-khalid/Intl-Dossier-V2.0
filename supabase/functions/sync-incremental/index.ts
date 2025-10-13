// T140 - Incremental sync Edge Function (Simplified for debugging)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client for auth validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create authenticated client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Parse query params
    const url = new URL(req.url)
    const lastModifiedSince = url.searchParams.get('last_modified_since')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    console.log('Sync request:', { userId: user.id, lastModifiedSince, limit, offset })

    // Build query for dossiers (will use authenticated context for RLS)
    let query = supabase
      .from('dossiers')
      .select('*', { count: 'exact' })
      .eq('archived', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If lastModifiedSince is provided, only get entities updated after that timestamp
    if (lastModifiedSince) {
      query = query.gt('updated_at', lastModifiedSince)
    }

    const { data: dossiers, error: dossiersError, count } = await query

    if (dossiersError) {
      console.error('Error fetching dossiers:', dossiersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch dossiers', details: dossiersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform dossiers into sync entities with _entity_type
    const entities = (dossiers || []).map(dossier => ({
      id: dossier.id,
      _entity_type: 'dossiers',
      ...dossier
    }))

    console.log(`Returning ${entities.length} dossiers (total: ${count})`)

    const response = {
      entities,
      last_sync_timestamp: new Date().toISOString(),
      has_more: entities.length >= limit,
      total_count: count || 0
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
