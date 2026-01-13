import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ProcessorConfig {
  dry_run?: boolean;
  entity_type?: string;
  action?: string;
  batch_size?: number;
  send_warnings?: boolean;
  warning_days?: number;
}

interface ProcessingResult {
  execution_id: string;
  started_at: string;
  completed_at?: string;
  items_processed: number;
  items_archived: number;
  items_deleted: number;
  items_anonymized: number;
  items_skipped: number;
  items_warned: number;
  errors: Array<{ entity_id: string; error: string }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message_en: 'Method not allowed',
          message_ar: 'الطريقة غير مسموح بها',
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role for background processing
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create Supabase client with user context for permission checking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message_en: 'Admin access required',
            message_ar: 'يلزم وصول المشرف',
          },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse configuration
    const config: ProcessorConfig = await req.json();
    const {
      dry_run = false,
      entity_type = null,
      action = null,
      batch_size = 100,
      send_warnings = true,
      warning_days = 30,
    } = config;

    // Initialize result tracking
    const result: ProcessingResult = {
      execution_id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      items_processed: 0,
      items_archived: 0,
      items_deleted: 0,
      items_anonymized: 0,
      items_skipped: 0,
      items_warned: 0,
      errors: [],
    };

    // Create execution log entry
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('retention_execution_log')
      .insert({
        id: result.execution_id,
        execution_type: dry_run ? 'dry_run' : 'manual',
        started_at: result.started_at,
        entity_type: entity_type,
        executed_by: user.id,
        execution_params: config,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create execution log:', logError);
    }

    // Step 1: Send warnings for expiring entities
    if (send_warnings) {
      const warningResult = await processWarnings(
        supabaseAdmin,
        entity_type,
        warning_days,
        dry_run
      );
      result.items_warned = warningResult.warned;
      result.errors.push(...warningResult.errors);
    }

    // Step 2: Get pending retention actions
    const { data: pendingItems, error: pendingError } = await supabaseAdmin.rpc(
      'get_pending_retention_actions',
      {
        p_entity_type: entity_type,
        p_action: action,
        p_limit: batch_size,
      }
    );

    if (pendingError) {
      result.errors.push({
        entity_id: 'system',
        error: `Failed to get pending actions: ${pendingError.message}`,
      });
    } else if (pendingItems && pendingItems.length > 0) {
      // Process each pending item
      for (const item of pendingItems) {
        result.items_processed++;

        // Skip if under legal hold (should be filtered by RPC but double-check)
        if (item.under_legal_hold) {
          result.items_skipped++;
          continue;
        }

        try {
          if (dry_run) {
            // Just count what would be done
            switch (item.action) {
              case 'archive':
                result.items_archived++;
                break;
              case 'soft_delete':
              case 'hard_delete':
                result.items_deleted++;
                break;
              case 'anonymize':
                result.items_anonymized++;
                break;
            }
          } else {
            // Actually perform the action
            const actionResult = await performRetentionAction(
              supabaseAdmin,
              item.entity_type,
              item.entity_id,
              item.action,
              item.policy_id
            );

            if (actionResult.success) {
              switch (item.action) {
                case 'archive':
                  result.items_archived++;
                  break;
                case 'soft_delete':
                case 'hard_delete':
                  result.items_deleted++;
                  break;
                case 'anonymize':
                  result.items_anonymized++;
                  break;
              }
            } else {
              result.items_skipped++;
              result.errors.push({
                entity_id: item.entity_id,
                error: actionResult.error || 'Unknown error',
              });
            }
          }
        } catch (error) {
          result.items_skipped++;
          result.errors.push({
            entity_id: item.entity_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Update execution log with results
    result.completed_at = new Date().toISOString();

    await supabaseAdmin
      .from('retention_execution_log')
      .update({
        completed_at: result.completed_at,
        items_processed: result.items_processed,
        items_archived: result.items_archived,
        items_deleted: result.items_deleted,
        items_anonymized: result.items_anonymized,
        items_skipped: result.items_skipped,
        items_warned: result.items_warned,
        errors: result.errors,
      })
      .eq('id', result.execution_id);

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processWarnings(
  supabase: ReturnType<typeof createClient>,
  entityType: string | null,
  warningDays: number,
  dryRun: boolean
): Promise<{ warned: number; errors: Array<{ entity_id: string; error: string }> }> {
  const result = { warned: 0, errors: [] as Array<{ entity_id: string; error: string }> };

  try {
    // Get expiring entities that haven't been warned
    const { data: expiringItems, error } = await supabase.rpc('get_expiring_entities', {
      p_days_ahead: warningDays,
      p_entity_type: entityType,
      p_limit: 500,
    });

    if (error) {
      result.errors.push({
        entity_id: 'system',
        error: `Failed to get expiring entities: ${error.message}`,
      });
      return result;
    }

    if (!expiringItems || expiringItems.length === 0) {
      return result;
    }

    // Filter to only items that haven't been warned
    const unwarned = expiringItems.filter((item: { warning_sent: boolean }) => !item.warning_sent);

    for (const item of unwarned) {
      if (!dryRun) {
        // Mark as warned
        const { error: updateError } = await supabase
          .from('entity_retention_status')
          .update({
            expiration_warning_sent: true,
            warning_sent_at: new Date().toISOString(),
          })
          .eq('entity_type', item.entity_type)
          .eq('entity_id', item.entity_id);

        if (updateError) {
          result.errors.push({
            entity_id: item.entity_id,
            error: `Failed to mark warning sent: ${updateError.message}`,
          });
          continue;
        }

        // TODO: Send actual notification (integrate with notification system)
        // This would typically create a notification entry or send an email
      }

      result.warned++;
    }
  } catch (error) {
    result.errors.push({
      entity_id: 'system',
      error: error instanceof Error ? error.message : 'Unknown error in warning process',
    });
  }

  return result;
}

async function performRetentionAction(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string,
  action: string,
  policyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the policy details for archive path
    const { data: policy } = await supabase
      .from('data_retention_policies')
      .select('archive_storage_bucket, archive_path_template')
      .eq('id', policyId)
      .single();

    switch (action) {
      case 'archive':
        return await archiveEntity(supabase, entityType, entityId, policy);

      case 'soft_delete':
        return await softDeleteEntity(supabase, entityType, entityId);

      case 'hard_delete':
        return await hardDeleteEntity(supabase, entityType, entityId);

      case 'anonymize':
        return await anonymizeEntity(supabase, entityType, entityId);

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function archiveEntity(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string,
  policy: { archive_storage_bucket?: string; archive_path_template?: string } | null
): Promise<{ success: boolean; error?: string }> {
  // Get the table name based on entity type
  const tableMap: Record<string, string> = {
    dossier: 'dossiers',
    intake_ticket: 'intake_tickets',
    document: 'documents',
    attachment: 'attachments',
    audit_log: 'audit_logs',
    ai_interaction_log: 'ai_interaction_logs',
    commitment: 'commitments',
    after_action_record: 'after_action_records',
    position: 'positions',
    engagement: 'engagements',
    calendar_event: 'calendar_events',
    notification: 'notifications',
    activity_feed: 'activity_stream',
  };

  const tableName = tableMap[entityType];
  if (!tableName) {
    return { success: false, error: `Unknown entity type: ${entityType}` };
  }

  // Generate archive path
  const now = new Date();
  const archivePath =
    policy?.archive_path_template
      ?.replace(/{year}/g, now.getFullYear().toString())
      .replace(/{entity_type}/g, entityType)
      .replace(/{id}/g, entityId) || `archive/${now.getFullYear()}/${entityType}/${entityId}`;

  // For dossiers, update status to archived
  if (entityType === 'dossier') {
    const { error } = await supabase
      .from(tableName)
      .update({ status: 'archived', archived: true })
      .eq('id', entityId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  // Update retention status
  const { error: statusError } = await supabase
    .from('entity_retention_status')
    .update({
      archived_at: new Date().toISOString(),
      archive_location: archivePath,
    })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (statusError) {
    return { success: false, error: statusError.message };
  }

  return { success: true };
}

async function softDeleteEntity(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  const tableMap: Record<string, string> = {
    dossier: 'dossiers',
    intake_ticket: 'intake_tickets',
    document: 'documents',
    attachment: 'attachments',
    commitment: 'commitments',
    after_action_record: 'after_action_records',
    position: 'positions',
    engagement: 'engagements',
    calendar_event: 'calendar_events',
    notification: 'notifications',
    activity_feed: 'activity_stream',
  };

  const tableName = tableMap[entityType];
  if (!tableName) {
    return { success: false, error: `Unknown entity type: ${entityType}` };
  }

  // Update with deleted status where applicable
  if (entityType === 'dossier') {
    const { error } = await supabase
      .from(tableName)
      .update({ status: 'deleted', archived: true })
      .eq('id', entityId);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Try deleted_at column if available
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', entityId);

    // If deleted_at doesn't exist, this is acceptable - we'll track in retention status
    if (error && !error.message.includes('column')) {
      return { success: false, error: error.message };
    }
  }

  // Update retention status
  const { error: statusError } = await supabase
    .from('entity_retention_status')
    .update({ deleted_at: new Date().toISOString() })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (statusError) {
    return { success: false, error: statusError.message };
  }

  return { success: true };
}

async function hardDeleteEntity(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  const tableMap: Record<string, string> = {
    notification: 'notifications',
    activity_feed: 'activity_stream',
    ai_interaction_log: 'ai_interaction_logs',
  };

  // Only allow hard delete for specific entity types
  const tableName = tableMap[entityType];
  if (!tableName) {
    // For protected entities, fall back to soft delete
    return await softDeleteEntity(supabase, entityType, entityId);
  }

  // Hard delete from the table
  const { error } = await supabase.from(tableName).delete().eq('id', entityId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Remove from retention status tracking
  const { error: statusError } = await supabase
    .from('entity_retention_status')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (statusError) {
    console.warn('Failed to remove retention status:', statusError);
    // Not a critical error
  }

  return { success: true };
}

async function anonymizeEntity(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  // Anonymization is entity-type specific
  // This removes PII while keeping the structural record

  const anonymizedMarker = '[ANONYMIZED]';
  const anonymizedEmail = 'anonymized@example.com';

  switch (entityType) {
    case 'intake_ticket': {
      const { error } = await supabase
        .from('intake_tickets')
        .update({
          requester_name: anonymizedMarker,
          requester_email: anonymizedEmail,
          description: anonymizedMarker,
          notes: anonymizedMarker,
        })
        .eq('id', entityId);

      if (error) {
        return { success: false, error: error.message };
      }
      break;
    }

    case 'commitment': {
      const { error } = await supabase
        .from('commitments')
        .update({
          description: anonymizedMarker,
          notes: anonymizedMarker,
        })
        .eq('id', entityId);

      if (error) {
        return { success: false, error: error.message };
      }
      break;
    }

    default:
      // For other types, fall back to soft delete
      return await softDeleteEntity(supabase, entityType, entityId);
  }

  // Update retention status
  const { error: statusError } = await supabase
    .from('entity_retention_status')
    .update({ anonymized_at: new Date().toISOString() })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (statusError) {
    return { success: false, error: statusError.message };
  }

  return { success: true };
}
