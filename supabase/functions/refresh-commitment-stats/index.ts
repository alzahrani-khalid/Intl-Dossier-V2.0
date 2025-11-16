import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshResponse {
  success: boolean
  refreshedAt: string
  executionTimeMs: number
  rowsUpdated: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Call the refresh function
    const { data, error } = await supabaseClient.rpc('refresh_commitment_stats')

    if (error) {
      console.error('[REFRESH-COMMITMENT-STATS] Refresh error:', error)
      return new Response(
        JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to refresh materialized view',
          details: {
            timestamp: new Date().toISOString(),
            errorDetails: error
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get count of rows in the materialized view
    const { count: rowsUpdated } = await supabaseClient
      .from('dossier_commitment_stats')
      .select('*', { count: 'exact', head: true })

    const executionTimeMs = Date.now() - startTime
    const refreshedAt = new Date().toISOString()

    const response: RefreshResponse = {
      success: true,
      refreshedAt,
      executionTimeMs,
      rowsUpdated: rowsUpdated ?? 0
    }

    console.log(`[REFRESH-COMMITMENT-STATS] Successfully refreshed materialized view in ${executionTimeMs}ms`)

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[REFRESH-COMMITMENT-STATS] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { timestamp: new Date().toISOString() }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
