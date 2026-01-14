/**
 * Access Requests Edge Function
 * Handles creating, listing, and responding to access requests
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface AccessRequestPayload {
  action: 'create' | 'list' | 'respond' | 'cancel' | 'get-granters';
  // For create
  requesterId?: string;
  granterId?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  requestedPermission?: string;
  reason?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  requestedDuration?: number;
  // For respond
  requestId?: string;
  approved?: boolean;
  responseMessage?: string;
  durationDays?: number;
  // For list
  role?: 'requester' | 'granter';
  status?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_ar: 'غير مصرح',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid authentication',
          error_ar: 'المصادقة غير صالحة',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: AccessRequestPayload = await req.json();

    switch (payload.action) {
      // =======================================================================
      // CREATE ACCESS REQUEST
      // =======================================================================
      case 'create': {
        if (
          !payload.granterId ||
          !payload.resourceType ||
          !payload.requestedPermission ||
          !payload.reason
        ) {
          return new Response(
            JSON.stringify({
              error:
                'Missing required fields: granterId, resourceType, requestedPermission, reason',
              error_ar: 'حقول مطلوبة مفقودة: granterId, resourceType, requestedPermission, reason',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for existing pending request
        const { data: existingRequest } = await supabase
          .from('access_requests')
          .select('id')
          .eq('requester_id', user.id)
          .eq('granter_id', payload.granterId)
          .eq('resource_type', payload.resourceType)
          .eq('requested_permission', payload.requestedPermission)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingRequest) {
          return new Response(
            JSON.stringify({
              error: 'You already have a pending request for this resource',
              error_ar: 'لديك طلب معلق بالفعل لهذا المورد',
              existing_request_id: existingRequest.id,
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create the request
        const { data: newRequest, error: createError } = await supabase
          .from('access_requests')
          .insert({
            requester_id: user.id,
            granter_id: payload.granterId,
            resource_type: payload.resourceType,
            resource_id: payload.resourceId || null,
            resource_name: payload.resourceName || null,
            requested_permission: payload.requestedPermission,
            reason: payload.reason,
            urgency: payload.urgency || 'medium',
            requested_duration_days: payload.requestedDuration || null,
            granter_notified: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create error:', createError);
          return new Response(
            JSON.stringify({
              error: 'Failed to create access request',
              error_ar: 'فشل في إنشاء طلب الوصول',
              details: createError.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // TODO: Send notification to granter (via notification system)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              request_id: newRequest.id,
              status: newRequest.status,
              message: 'Access request submitted successfully',
              message_ar: 'تم تقديم طلب الوصول بنجاح',
            },
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =======================================================================
      // LIST ACCESS REQUESTS
      // =======================================================================
      case 'list': {
        const role = payload.role || 'requester';
        const statusFilter = payload.status;

        let query = supabase
          .from('access_requests')
          .select(
            `
            *,
            requester:users!access_requests_requester_id_fkey(id, full_name, email),
            granter:users!access_requests_granter_id_fkey(id, full_name, email)
          `
          )
          .order('created_at', { ascending: false });

        if (role === 'requester') {
          query = query.eq('requester_id', user.id);
        } else if (role === 'granter') {
          query = query.eq('granter_id', user.id);
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data: requests, error: listError } = await query;

        if (listError) {
          return new Response(
            JSON.stringify({
              error: 'Failed to list access requests',
              error_ar: 'فشل في استرجاع طلبات الوصول',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: requests,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =======================================================================
      // RESPOND TO ACCESS REQUEST
      // =======================================================================
      case 'respond': {
        if (!payload.requestId || payload.approved === undefined) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: requestId, approved',
              error_ar: 'حقول مطلوبة مفقودة: requestId, approved',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify user is the granter
        const { data: existingRequest, error: fetchError } = await supabase
          .from('access_requests')
          .select('*')
          .eq('id', payload.requestId)
          .single();

        if (fetchError || !existingRequest) {
          return new Response(
            JSON.stringify({
              error: 'Access request not found',
              error_ar: 'طلب الوصول غير موجود',
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (existingRequest.granter_id !== user.id) {
          return new Response(
            JSON.stringify({
              error: 'You are not authorized to respond to this request',
              error_ar: 'غير مصرح لك بالرد على هذا الطلب',
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (existingRequest.status !== 'pending') {
          return new Response(
            JSON.stringify({
              error: 'This request has already been processed',
              error_ar: 'تم معالجة هذا الطلب بالفعل',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate expiration
        let accessExpiresAt = null;
        if (payload.approved && payload.durationDays) {
          const expiresDate = new Date();
          expiresDate.setDate(expiresDate.getDate() + payload.durationDays);
          accessExpiresAt = expiresDate.toISOString();
        }

        // Update the request
        const { data: updatedRequest, error: updateError } = await supabase
          .from('access_requests')
          .update({
            status: payload.approved ? 'approved' : 'denied',
            response_message: payload.responseMessage || null,
            responded_by: user.id,
            responded_at: new Date().toISOString(),
            access_expires_at: accessExpiresAt,
            requester_notified: false,
          })
          .eq('id', payload.requestId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({
              error: 'Failed to respond to access request',
              error_ar: 'فشل في الرد على طلب الوصول',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If approved, create permission delegation
        if (payload.approved) {
          await supabase.from('permission_delegations').insert({
            user_id: existingRequest.requester_id,
            delegated_by: user.id,
            entity_type: existingRequest.resource_type,
            entity_id: existingRequest.resource_id,
            permissions: { [existingRequest.requested_permission]: true },
            expires_at: accessExpiresAt,
            is_active: true,
          });
        }

        // TODO: Send notification to requester

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              request_id: updatedRequest.id,
              status: updatedRequest.status,
              message: payload.approved ? 'Access request approved' : 'Access request denied',
              message_ar: payload.approved ? 'تمت الموافقة على طلب الوصول' : 'تم رفض طلب الوصول',
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =======================================================================
      // CANCEL ACCESS REQUEST
      // =======================================================================
      case 'cancel': {
        if (!payload.requestId) {
          return new Response(
            JSON.stringify({
              error: 'Missing required field: requestId',
              error_ar: 'حقل مطلوب مفقود: requestId',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: cancelledRequest, error: cancelError } = await supabase
          .from('access_requests')
          .update({ status: 'cancelled' })
          .eq('id', payload.requestId)
          .eq('requester_id', user.id)
          .eq('status', 'pending')
          .select()
          .single();

        if (cancelError || !cancelledRequest) {
          return new Response(
            JSON.stringify({
              error: 'Failed to cancel access request or request not found',
              error_ar: 'فشل في إلغاء طلب الوصول أو الطلب غير موجود',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              request_id: cancelledRequest.id,
              status: 'cancelled',
              message: 'Access request cancelled',
              message_ar: 'تم إلغاء طلب الوصول',
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =======================================================================
      // GET POTENTIAL GRANTERS FOR A RESOURCE
      // =======================================================================
      case 'get-granters': {
        if (!payload.resourceType) {
          return new Response(
            JSON.stringify({
              error: 'Missing required field: resourceType',
              error_ar: 'حقل مطلوب مفقود: resourceType',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get users with manager or admin role who can grant permissions
        const { data: granters, error: grantersError } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .in('role', ['admin', 'manager'])
          .neq('id', user.id)
          .order('role', { ascending: false }) // admins first
          .limit(10);

        if (grantersError) {
          return new Response(
            JSON.stringify({
              error: 'Failed to fetch potential granters',
              error_ar: 'فشل في استرجاع الأشخاص المخولين',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mark first admin as primary
        const formattedGranters = (granters || []).map((g, index) => ({
          user_id: g.id,
          name: g.full_name || g.email?.split('@')[0] || 'Unknown',
          email: g.email,
          role: g.role,
          is_primary: index === 0 && g.role === 'admin',
        }));

        return new Response(
          JSON.stringify({
            success: true,
            data: formattedGranters,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            error_ar: 'إجراء غير صالح',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ في الخادم الداخلي',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
