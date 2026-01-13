import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

type RenewalStatus =
  | 'pending'
  | 'initiated'
  | 'negotiation'
  | 'approved'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'expired';
type AlertType =
  | 'expiration_90_days'
  | 'expiration_60_days'
  | 'expiration_30_days'
  | 'expiration_7_days'
  | 'expired'
  | 'renewal_initiated'
  | 'renewal_approved'
  | 'renewal_completed';
type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'dismissed';

interface RenewalRequest {
  mou_id: string;
  proposed_expiry_date?: string;
  renewal_period_months?: number;
  notes_en?: string;
  notes_ar?: string;
}

interface StatusUpdateRequest {
  renewal_id: string;
  new_status: RenewalStatus;
  notes_en?: string;
  notes_ar?: string;
  decline_reason_en?: string;
  decline_reason_ar?: string;
}

interface CompleteRenewalRequest {
  renewal_id: string;
  new_mou_id: string;
  terms_changed?: boolean;
  terms_change_summary_en?: string;
  terms_change_summary_ar?: string;
}

interface NegotiationRequest {
  renewal_id: string;
  summary_en: string;
  summary_ar: string;
  proposed_changes?: Record<string, unknown>;
  outcome?: 'positive' | 'negative' | 'pending' | 'follow_up_required';
  next_steps_en?: string;
  next_steps_ar?: string;
  next_meeting_date?: string;
}

interface AlertAcknowledgeRequest {
  alert_id: string;
}

const VALID_STATUS_TRANSITIONS: Record<RenewalStatus, RenewalStatus[]> = {
  pending: ['initiated'],
  initiated: ['negotiation', 'declined'],
  negotiation: ['approved', 'declined'],
  approved: ['signed', 'declined'],
  signed: ['completed'],
  declined: [],
  expired: [],
  completed: [],
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    const action = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET': {
        // GET /mou-renewals - List renewals
        // GET /mou-renewals/expiring - Get expiring MoUs
        // GET /mou-renewals/alerts - Get alerts
        // GET /mou-renewals/:id - Get single renewal
        // GET /mou-renewals/:id/negotiations - Get negotiations for a renewal
        // GET /mou-renewals/:id/version-chain - Get version chain

        if (action === 'expiring') {
          const daysAhead = parseInt(url.searchParams.get('days_ahead') || '90');
          const includeExpired = url.searchParams.get('include_expired') === 'true';

          const { data, error } = await supabaseClient.rpc('get_expiring_mous', {
            p_days_ahead: daysAhead,
            p_include_expired: includeExpired,
          });

          if (error) throw error;

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (action === 'alerts') {
          const mouId = url.searchParams.get('mou_id');
          const status = url.searchParams.get('status') as AlertStatus | null;
          const type = url.searchParams.get('type') as AlertType | null;
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient.from('mou_expiration_alerts').select(
            `
              *,
              mou:mou_id(
                id,
                reference_number,
                title_en,
                title_ar,
                expiry_date
              )
            `,
            { count: 'exact' }
          );

          if (mouId) {
            query = query.eq('mou_id', mouId);
          }
          if (status) {
            query = query.eq('alert_status', status);
          }
          if (type) {
            query = query.eq('alert_type', type);
          }

          query = query
            .order('scheduled_for', { ascending: true })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit),
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'negotiations' && pathParts.length > 2) {
          const renewalId = pathParts[pathParts.length - 2];

          const { data, error } = await supabaseClient
            .from('mou_renewal_negotiations')
            .select(
              `
              *,
              negotiated_by_user:negotiated_by(full_name, email)
            `
            )
            .eq('renewal_id', renewalId)
            .order('negotiation_date', { ascending: false });

          if (error) throw error;

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (action === 'version-chain' && pathParts.length > 2) {
          const mouId = pathParts[pathParts.length - 2];

          const { data, error } = await supabaseClient.rpc('get_mou_version_chain', {
            p_mou_id: mouId,
          });

          if (error) throw error;

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get single renewal or list renewals
        if (action !== 'mou-renewals' && !['expiring', 'alerts'].includes(action)) {
          // Single renewal
          const { data, error } = await supabaseClient
            .from('mou_renewals')
            .select(
              `
              *,
              original_mou:original_mou_id(
                id,
                reference_number,
                title_en,
                title_ar,
                workflow_state,
                expiry_date,
                primary_party:primary_party_id(name_en, name_ar),
                secondary_party:secondary_party_id(name_en, name_ar)
              ),
              renewed_mou:renewed_mou_id(
                id,
                reference_number,
                title_en,
                title_ar
              ),
              initiated_by_user:initiated_by(full_name, email),
              approved_by_user:approved_by(full_name, email)
            `
            )
            .eq('id', action)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return new Response(JSON.stringify({ error: 'Renewal not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            throw error;
          }

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // List renewals
        const mouId = url.searchParams.get('mou_id');
        const status = url.searchParams.get('status') as RenewalStatus | null;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;

        let query = supabaseClient.from('mou_renewals').select(
          `
            *,
            original_mou:original_mou_id(
              id,
              reference_number,
              title_en,
              title_ar,
              workflow_state,
              expiry_date
            ),
            renewed_mou:renewed_mou_id(
              id,
              reference_number,
              title_en,
              title_ar
            ),
            initiated_by_user:initiated_by(full_name)
          `,
          { count: 'exact' }
        );

        if (mouId) {
          query = query.eq('original_mou_id', mouId);
        }
        if (status) {
          query = query.eq('renewal_status', status);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({
            data,
            pagination: {
              page,
              limit,
              total: count,
              totalPages: Math.ceil((count || 0) / limit),
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        // POST /mou-renewals/initiate - Initiate renewal
        // POST /mou-renewals/status - Update status
        // POST /mou-renewals/complete - Complete renewal
        // POST /mou-renewals/negotiations - Add negotiation
        // POST /mou-renewals/alerts/acknowledge - Acknowledge alert
        // POST /mou-renewals/process-alerts - Process pending alerts (cron job)
        // POST /mou-renewals/auto-expire - Auto-expire MoUs (cron job)

        if (action === 'initiate') {
          const body: RenewalRequest = await req.json();

          if (!body.mou_id) {
            return new Response(JSON.stringify({ error: 'MoU ID is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: renewalId, error } = await supabaseClient.rpc('initiate_mou_renewal', {
            p_mou_id: body.mou_id,
            p_proposed_expiry_date: body.proposed_expiry_date || null,
            p_renewal_period_months: body.renewal_period_months || null,
            p_notes_en: body.notes_en || null,
            p_notes_ar: body.notes_ar || null,
          });

          if (error) {
            if (error.message.includes('not found')) {
              return new Response(JSON.stringify({ error: 'MoU not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            if (error.message.includes('must be active')) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            if (error.message.includes('already exists')) {
              return new Response(
                JSON.stringify({ error: 'An active renewal process already exists for this MoU' }),
                { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            throw error;
          }

          // Fetch the created renewal
          const { data: renewal, error: fetchError } = await supabaseClient
            .from('mou_renewals')
            .select(
              `
              *,
              original_mou:original_mou_id(
                id,
                reference_number,
                title_en,
                title_ar
              )
            `
            )
            .eq('id', renewalId)
            .single();

          if (fetchError) throw fetchError;

          return new Response(
            JSON.stringify({
              message: 'Renewal initiated successfully',
              data: renewal,
            }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'status') {
          const body: StatusUpdateRequest = await req.json();

          if (!body.renewal_id || !body.new_status) {
            return new Response(
              JSON.stringify({ error: 'Renewal ID and new status are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get current renewal status
          const { data: currentRenewal, error: fetchError } = await supabaseClient
            .from('mou_renewals')
            .select('renewal_status')
            .eq('id', body.renewal_id)
            .single();

          if (fetchError || !currentRenewal) {
            return new Response(JSON.stringify({ error: 'Renewal not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Validate transition
          const allowedTransitions =
            VALID_STATUS_TRANSITIONS[currentRenewal.renewal_status as RenewalStatus] || [];
          if (!allowedTransitions.includes(body.new_status)) {
            return new Response(
              JSON.stringify({
                error: `Invalid status transition from ${currentRenewal.renewal_status} to ${body.new_status}`,
                allowed_transitions: allowedTransitions,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabaseClient.rpc('update_renewal_status', {
            p_renewal_id: body.renewal_id,
            p_new_status: body.new_status,
            p_notes_en: body.notes_en || null,
            p_notes_ar: body.notes_ar || null,
            p_decline_reason_en: body.decline_reason_en || null,
            p_decline_reason_ar: body.decline_reason_ar || null,
          });

          if (error) throw error;

          // Fetch updated renewal
          const { data: renewal, error: refetchError } = await supabaseClient
            .from('mou_renewals')
            .select('*')
            .eq('id', body.renewal_id)
            .single();

          if (refetchError) throw refetchError;

          return new Response(
            JSON.stringify({
              message: `Renewal status updated to ${body.new_status}`,
              data: renewal,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'complete') {
          const body: CompleteRenewalRequest = await req.json();

          if (!body.renewal_id || !body.new_mou_id) {
            return new Response(
              JSON.stringify({ error: 'Renewal ID and new MoU ID are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabaseClient.rpc('complete_mou_renewal', {
            p_renewal_id: body.renewal_id,
            p_new_mou_id: body.new_mou_id,
            p_terms_changed: body.terms_changed || false,
            p_terms_change_summary_en: body.terms_change_summary_en || null,
            p_terms_change_summary_ar: body.terms_change_summary_ar || null,
          });

          if (error) {
            if (error.message.includes('not found')) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            if (error.message.includes('must be signed')) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            throw error;
          }

          // Fetch completed renewal with version chain
          const { data: renewal, error: fetchError } = await supabaseClient
            .from('mou_renewals')
            .select(
              `
              *,
              original_mou:original_mou_id(id, reference_number, title_en, title_ar),
              renewed_mou:renewed_mou_id(id, reference_number, title_en, title_ar)
            `
            )
            .eq('id', body.renewal_id)
            .single();

          if (fetchError) throw fetchError;

          return new Response(
            JSON.stringify({
              message: 'Renewal completed successfully',
              data: renewal,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'negotiations') {
          const body: NegotiationRequest = await req.json();

          if (!body.renewal_id || !body.summary_en || !body.summary_ar) {
            return new Response(
              JSON.stringify({ error: 'Renewal ID and summaries (EN/AR) are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get current user
          const {
            data: { user },
            error: userError,
          } = await supabaseClient.auth.getUser();
          if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data, error } = await supabaseClient
            .from('mou_renewal_negotiations')
            .insert({
              renewal_id: body.renewal_id,
              negotiated_by: user.id,
              summary_en: body.summary_en,
              summary_ar: body.summary_ar,
              proposed_changes: body.proposed_changes || {},
              outcome: body.outcome || 'pending',
              next_steps_en: body.next_steps_en,
              next_steps_ar: body.next_steps_ar,
              next_meeting_date: body.next_meeting_date,
            })
            .select(
              `
              *,
              negotiated_by_user:negotiated_by(full_name, email)
            `
            )
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({
              message: 'Negotiation recorded successfully',
              data,
            }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'acknowledge') {
          const body: AlertAcknowledgeRequest = await req.json();

          if (!body.alert_id) {
            return new Response(JSON.stringify({ error: 'Alert ID is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Get current user
          const {
            data: { user },
            error: userError,
          } = await supabaseClient.auth.getUser();
          if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data, error } = await supabaseClient
            .from('mou_expiration_alerts')
            .update({
              alert_status: 'acknowledged',
              acknowledged_at: new Date().toISOString(),
              acknowledged_by: user.id,
            })
            .eq('id', body.alert_id)
            .select()
            .single();

          if (error) throw error;

          if (!data) {
            return new Response(JSON.stringify({ error: 'Alert not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(
            JSON.stringify({
              message: 'Alert acknowledged',
              data,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'process-alerts') {
          // This endpoint should be called by a scheduled job
          const { data, error } = await supabaseClient.rpc('process_pending_expiration_alerts');

          if (error) throw error;

          return new Response(
            JSON.stringify({
              message: 'Alerts processed',
              processed_count: data?.[0]?.processed_count || 0,
              alert_ids: data?.[0]?.alert_ids || [],
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'auto-expire') {
          // This endpoint should be called by a scheduled job
          const { data, error } = await supabaseClient.rpc('auto_expire_mous');

          if (error) throw error;

          return new Response(
            JSON.stringify({
              message: 'Auto-expire completed',
              expired_count: data?.[0]?.expired_count || 0,
              expired_mou_ids: data?.[0]?.expired_mou_ids || [],
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        // DELETE /mou-renewals/alerts/:id - Dismiss alert
        if (pathParts.includes('alerts') && pathParts.length > 2) {
          const alertId = pathParts[pathParts.length - 1];

          const { data, error } = await supabaseClient
            .from('mou_expiration_alerts')
            .update({
              alert_status: 'dismissed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
            .select()
            .single();

          if (error) throw error;

          if (!data) {
            return new Response(JSON.stringify({ error: 'Alert not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(
            JSON.stringify({
              message: 'Alert dismissed',
              data,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(JSON.stringify({ error: 'Delete not supported for this resource' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in mou-renewals function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
