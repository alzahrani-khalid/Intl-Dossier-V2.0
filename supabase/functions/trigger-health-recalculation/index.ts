import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthRecalcRequest {
  dossierIds: string[]
  priority?: 'high' | 'normal'
}

interface HealthRecalcResult {
  dossierId: string
  success: boolean
  overallScore?: number | null
  error?: string
}

interface HealthRecalcResponse {
  success: boolean
  dossierCount: number
  triggeredAt: string
  priority: 'high' | 'normal'
  estimatedCompletionTime?: string
  results?: HealthRecalcResult[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const body: HealthRecalcRequest = await req.json()
    const { dossierIds, priority = 'normal' } = body

    // Validate request
    if (!dossierIds || !Array.isArray(dossierIds) || dossierIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'dossierIds array is required and cannot be empty',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (dossierIds.length > 100) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'dossierIds array cannot exceed 100 items',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate all dossier IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    for (const dossierId of dossierIds) {
      if (!uuidRegex.test(dossierId)) {
        return new Response(
          JSON.stringify({
            error: 'INVALID_REQUEST',
            message: `Invalid UUID format: ${dossierId}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const triggeredAt = new Date().toISOString()

    if (priority === 'high') {
      // Synchronous mode: calculate all health scores now and return results
      const results: HealthRecalcResult[] = []

      for (const dossierId of dossierIds) {
        try {
          const calcResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-health-score`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                dossierId,
                forceRecalculation: true
              })
            }
          )

          if (calcResponse.ok) {
            const calcData = await calcResponse.json()
            results.push({
              dossierId,
              success: true,
              overallScore: calcData.overallScore
            })
          } else {
            const errorText = await calcResponse.text()
            results.push({
              dossierId,
              success: false,
              error: errorText || 'Calculation failed'
            })
          }
        } catch (error) {
          results.push({
            dossierId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      const response: HealthRecalcResponse = {
        success: true,
        dossierCount: dossierIds.length,
        triggeredAt,
        priority: 'high',
        results
      }

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } else {
      // Normal priority: Queue to background job (async mode)
      // For now, we'll simulate queueing by immediately triggering calculations
      // In production, this would use Redis/BullMQ or similar job queue
      
      // Estimate 2 seconds per dossier calculation
      const estimatedSeconds = dossierIds.length * 2
      const estimatedCompletionTime = new Date(Date.now() + estimatedSeconds * 1000).toISOString()

      // Fire and forget - trigger calculations in background
      Promise.all(
        dossierIds.map(dossierId =>
          fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-health-score`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                dossierId,
                forceRecalculation: true
              })
            }
          ).catch(error => {
            console.error(`[TRIGGER-HEALTH-RECALC] Background calculation failed for ${dossierId}:`, error)
          })
        )
      ).catch(error => {
        console.error('[TRIGGER-HEALTH-RECALC] Background calculation batch failed:', error)
      })

      const response: HealthRecalcResponse = {
        success: true,
        dossierCount: dossierIds.length,
        triggeredAt,
        priority: 'normal',
        estimatedCompletionTime
      }

      console.log(`[TRIGGER-HEALTH-RECALC] Triggered ${dossierIds.length} health score calculations (priority: ${priority})`)

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('[TRIGGER-HEALTH-RECALC] Unexpected error:', error)
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
