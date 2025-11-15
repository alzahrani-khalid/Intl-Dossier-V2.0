import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OverdueCommitment {
  id: string
  dossier_id: string
  description: string
  due_date: string
  owner_id: string
  status: string
}

interface OverdueDetectionRequest {
  dryRun?: boolean
  dossierId?: string
}

interface OverdueDetectionResponse {
  overdueCount: number
  affectedDossiers: number
  notificationsSent: number
  healthScoresRecalculated: number
  executionTimeMs: number
  dryRun: boolean
  commitments: Array<{
    id: string
    dossierId: string
    description: string
    dueDate: string
    ownerId: string
    previousStatus: string
    newStatus: string
  }>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Get request body
    const body: OverdueDetectionRequest = req.method === 'POST'
      ? await req.json()
      : {}

    const { dryRun = false, dossierId } = body

    // Validate dossierId if provided
    if (dossierId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dossierId)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'Invalid dossierId format - must be a valid UUID',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    // Query for overdue commitments
    let query = supabaseClient
      .from('aa_commitments')
      .select('id, dossier_id, description, due_date, owner_id, status')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'in_progress'])

    if (dossierId) {
      query = query.eq('dossier_id', dossierId)
    }

    const { data: overdueCommitments, error: queryError } = await query

    if (queryError) {
      console.error('[OVERDUE-DETECT] Query error:', queryError)
      return new Response(
        JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to query commitments',
          details: { timestamp: new Date().toISOString() }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const commitments = (overdueCommitments || []) as OverdueCommitment[]
    const affectedDossierIds = [...new Set(commitments.map(c => c.dossier_id))]

    let notificationsSent = 0
    let healthScoresRecalculated = 0

    // Format response commitments
    const formattedCommitments = commitments.map(c => ({
      id: c.id,
      dossierId: c.dossier_id,
      description: c.description,
      dueDate: c.due_date,
      ownerId: c.owner_id,
      previousStatus: c.status,
      newStatus: 'overdue' as const
    }))

    if (!dryRun && commitments.length > 0) {
      // Update commitment statuses to 'overdue'
      const commitmentIds = commitments.map(c => c.id)
      const { error: updateError } = await supabaseClient
        .from('aa_commitments')
        .update({ status: 'overdue', updated_at: new Date().toISOString() })
        .in('id', commitmentIds)

      if (updateError) {
        console.error('[OVERDUE-DETECT] Update error:', updateError)
        return new Response(
          JSON.stringify({
            error: 'INTERNAL_ERROR',
            message: 'Failed to update commitment statuses',
            details: { timestamp: new Date().toISOString() }
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Send notifications to commitment owners and dossier owners
      for (const commitment of commitments) {
        try {
          // Get dossier info for notification message
          const { data: dossier } = await supabaseClient
            .from('dossiers')
            .select('name, owner_id')
            .eq('id', commitment.dossier_id)
            .single()

          if (dossier) {
            const notificationMessage = `${commitment.description} is overdue (due ${commitment.due_date}). Dossier: ${dossier.name}. Recommended: Update status or extend deadline.`

            // Send notification to commitment owner
            await sendNotification(
              supabaseClient,
              commitment.owner_id,
              'Commitment Overdue',
              notificationMessage,
              { commitmentId: commitment.id, dossierId: commitment.dossier_id, type: 'overdue_commitment' }
            )
            notificationsSent++

            // Send notification to dossier owner if different from commitment owner
            if (dossier.owner_id && dossier.owner_id !== commitment.owner_id) {
              await sendNotification(
                supabaseClient,
                dossier.owner_id,
                'Commitment Overdue',
                notificationMessage,
                { commitmentId: commitment.id, dossierId: commitment.dossier_id, type: 'overdue_commitment' }
              )
              notificationsSent++
            }
          }
        } catch (notificationError) {
          // Log error but continue processing other commitments
          console.error('[OVERDUE-DETECT] Notification error for commitment:', commitment.id, notificationError)
        }
      }

      // Trigger health score recalculation for affected dossiers
      if (affectedDossierIds.length > 0) {
        try {
          const recalcResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-health-recalculation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                dossierIds: affectedDossierIds,
                priority: 'normal'
              })
            }
          )

          if (recalcResponse.ok) {
            healthScoresRecalculated = affectedDossierIds.length
          } else {
            console.error('[OVERDUE-DETECT] Health recalculation request failed:', await recalcResponse.text())
          }
        } catch (recalcError) {
          console.error('[OVERDUE-DETECT] Health recalculation error:', recalcError)
        }
      }

      console.log(`[OVERDUE-DETECT] Marked ${commitments.length} commitments as overdue`)
      console.log(`[OVERDUE-DETECT] Sent ${notificationsSent} notifications`)
      console.log(`[OVERDUE-DETECT] Triggered health recalculation for ${healthScoresRecalculated} dossiers`)
    }

    const executionTimeMs = Date.now() - startTime

    const response: OverdueDetectionResponse = {
      overdueCount: commitments.length,
      affectedDossiers: affectedDossierIds.length,
      notificationsSent,
      healthScoresRecalculated,
      executionTimeMs,
      dryRun,
      commitments: formattedCommitments
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[OVERDUE-DETECT] Unexpected error:', error)
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

// Helper function to send notifications
async function sendNotification(
  supabaseClient: any,
  userId: string,
  title: string,
  message: string,
  metadata: Record<string, any>
) {
  const { error } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      metadata,
      read: false,
      created_at: new Date().toISOString()
    })

  if (error) {
    throw error
  }
}
