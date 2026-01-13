/**
 * Document Classification Edge Function
 *
 * Handles document classification operations:
 * - GET: Retrieve documents with classification-aware filtering
 * - POST: Update document classification level
 * - PUT: Approve pending classification changes
 *
 * Implements need-to-know principles and automatic redaction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassificationRequest {
  action: 'list' | 'get' | 'change' | 'approve' | 'access-log' | 'pending-approvals';
  documentId?: string;
  entityType?: string;
  entityId?: string;
  newClassification?: 'public' | 'internal' | 'confidential' | 'secret';
  reason?: string;
  changeId?: string;
  limit?: number;
  offset?: number;
}

interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by: string;
  classification: string;
  classification_label?: string;
  can_download?: boolean;
  handling_instructions?: string;
  declassification_date?: string;
  _redacted_fields?: string[];
  _user_clearance?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: ClassificationRequest = await req.json();
    const {
      action,
      documentId,
      entityType,
      entityId,
      newClassification,
      reason,
      changeId,
      limit = 50,
      offset = 0,
    } = body;

    let result: unknown;

    switch (action) {
      case 'list': {
        // Get accessible documents for an entity
        if (!entityType || !entityId) {
          return new Response(JSON.stringify({ error: 'entityType and entityId are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: documents, error: listError } = await supabase.rpc(
          'get_accessible_documents',
          {
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_user_id: user.id,
            p_include_classification_info: true,
          }
        );

        if (listError) {
          throw listError;
        }

        result = { documents, total: documents?.length || 0 };
        break;
      }

      case 'get': {
        // Get single document with redaction
        if (!documentId) {
          return new Response(JSON.stringify({ error: 'documentId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: document, error: getError } = await supabase.rpc(
          'get_document_with_redaction',
          {
            p_document_id: documentId,
            p_user_id: user.id,
          }
        );

        if (getError) {
          throw getError;
        }

        if (document?.error) {
          return new Response(JSON.stringify({ error: document.error, code: document.code }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        result = { document };
        break;
      }

      case 'change': {
        // Change document classification
        if (!documentId || !newClassification || !reason) {
          return new Response(
            JSON.stringify({ error: 'documentId, newClassification, and reason are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: changeId, error: changeError } = await supabase.rpc(
          'change_document_classification',
          {
            p_document_id: documentId,
            p_new_classification: newClassification,
            p_reason: reason,
            p_user_id: user.id,
          }
        );

        if (changeError) {
          throw changeError;
        }

        // Check if change was auto-approved
        const { data: changeRecord } = await supabase
          .from('document_classification_changes')
          .select('is_approved')
          .eq('id', changeId)
          .single();

        result = {
          changeId,
          approved: changeRecord?.is_approved || false,
          message: changeRecord?.is_approved
            ? 'Classification changed successfully'
            : 'Classification change submitted for approval',
        };
        break;
      }

      case 'approve': {
        // Approve pending classification change
        if (!changeId) {
          return new Response(JSON.stringify({ error: 'changeId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: approved, error: approveError } = await supabase.rpc(
          'approve_classification_change',
          {
            p_change_id: changeId,
            p_approver_id: user.id,
          }
        );

        if (approveError) {
          throw approveError;
        }

        result = { approved, message: 'Classification change approved' };
        break;
      }

      case 'access-log': {
        // Get access log for a document (admin/manager only)
        if (!documentId) {
          return new Response(JSON.stringify({ error: 'documentId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: logs, error: logError } = await supabase
          .from('document_access_log')
          .select(
            `
            id,
            access_type,
            user_clearance,
            document_classification,
            access_granted,
            denial_reason,
            accessed_at,
            redacted_fields,
            user_id
          `
          )
          .eq('document_id', documentId)
          .order('accessed_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (logError) {
          throw logError;
        }

        result = { logs, total: logs?.length || 0 };
        break;
      }

      case 'pending-approvals': {
        // Get pending classification changes (admin/manager only)
        const { data: pendingChanges, error: pendingError } = await supabase
          .from('document_classification_changes')
          .select(
            `
            id,
            document_id,
            old_classification,
            new_classification,
            change_reason,
            changed_by,
            changed_at,
            documents (
              file_name,
              entity_type,
              entity_id
            )
          `
          )
          .eq('is_approved', false)
          .order('changed_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (pendingError) {
          throw pendingError;
        }

        result = { pendingChanges, total: pendingChanges?.length || 0 };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            validActions: ['list', 'get', 'change', 'approve', 'access-log', 'pending-approvals'],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Document classification error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CLASSIFICATION_ERROR',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
