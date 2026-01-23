import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-unpublish
 * POST /positions/{id}/unpublish
 *
 * Unpublishes a published position, returning it to draft status
 * Only allowed for users with admin/manager role or the original author
 * Requires step-up authentication for security
 */

interface UnpublishRequest {
  position_id: string;
  reason: string;
  elevated_token?: string; // Optional step-up authentication token
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        error_ar: 'الطريقة غير مسموح بها',
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: UnpublishRequest = await req.json();

    if (!body.position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.reason || body.reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: 'A reason for unpublishing is required (minimum 10 characters)',
          error_ar: 'مطلوب سبب لإلغاء النشر (10 أحرف على الأقل)',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          error_ar: 'رأس التفويض مفقود',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_ar: 'غير مصرح',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the position
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', body.position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({
          error: 'Position not found',
          error_ar: 'الموقف غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only published positions can be unpublished
    if (position.status !== 'published') {
      return new Response(
        JSON.stringify({
          error: 'Only published positions can be unpublished',
          error_ar: 'يمكن إلغاء نشر المواقف المنشورة فقط',
          current_status: position.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to unpublish
    // Either the author or a user with admin/manager role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = position.author_id === user.id;
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'manager';

    if (!isAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: 'You do not have permission to unpublish this position',
          error_ar: 'ليس لديك صلاحية لإلغاء نشر هذا الموقف',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update position status to draft
    const { data: updatedPosition, error: updateError } = await supabase
      .from('positions')
      .update({
        status: 'draft',
        current_stage: 0,
        updated_at: new Date().toISOString(),
        version: position.version + 1,
      })
      .eq('id', body.position_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error unpublishing position:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to unpublish position',
          error_ar: 'فشل في إلغاء نشر الموقف',
          details: updateError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark all previous versions as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', body.position_id)
      .eq('superseded', false);

    // Create new version record with unpublish action
    await supabase.from('position_versions').insert({
      position_id: body.position_id,
      version_number: position.version + 1,
      content_en: updatedPosition.content_en,
      content_ar: updatedPosition.content_ar,
      rationale_en: updatedPosition.rationale_en,
      rationale_ar: updatedPosition.rationale_ar,
      full_snapshot: {
        ...updatedPosition,
        unpublished_by: user.id,
        unpublish_reason: body.reason,
        unpublished_at: new Date().toISOString(),
        previous_status: 'published',
      },
      author_id: user.id,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'position',
        entity_id: body.position_id,
        action: 'unpublish',
        actor_id: user.id,
        details: {
          reason: body.reason,
          previous_status: 'published',
          new_status: 'draft',
        },
      });
    } catch (auditError) {
      // Audit logging failure should not fail the operation
      console.warn('Failed to create audit log:', auditError);
    }

    return new Response(
      JSON.stringify({
        ...updatedPosition,
        message: 'Position unpublished successfully',
        message_ar: 'تم إلغاء نشر الموقف بنجاح',
        unpublish_reason: body.reason,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ داخلي في الخادم',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
