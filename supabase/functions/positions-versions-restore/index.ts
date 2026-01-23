import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-versions-restore
 * POST /positions/{id}/versions/{version_number}/restore
 *
 * Restores a position to a previous version
 * Creates a new version with the content from the specified old version
 * Only allowed on draft positions by the author
 */

interface RestoreVersionRequest {
  position_id: string;
  version_number: number;
  current_version: number; // For optimistic locking
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
    const body: RestoreVersionRequest = await req.json();

    if (!body.position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.version_number || body.version_number < 1) {
      return new Response(
        JSON.stringify({
          error: 'Valid version_number is required',
          error_ar: 'رقم إصدار صالح مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.current_version === undefined) {
      return new Response(
        JSON.stringify({
          error: 'current_version is required for optimistic locking',
          error_ar: 'الإصدار الحالي مطلوب لمنع التعارض',
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

    // Fetch current position
    const { data: currentPosition, error: positionError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', body.position_id)
      .single();

    if (positionError || !currentPosition) {
      return new Response(
        JSON.stringify({
          error: 'Position not found or access denied',
          error_ar: 'الموقف غير موجود أو تم رفض الوصول',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow restore on draft positions
    if (currentPosition.status !== 'draft') {
      return new Response(
        JSON.stringify({
          error: 'Can only restore versions for positions in draft status',
          error_ar: 'يمكن استعادة الإصدارات فقط للمواقف في حالة المسودة',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optimistic locking check
    if (currentPosition.version !== body.current_version) {
      return new Response(
        JSON.stringify({
          error: 'Concurrent modification detected. Please refresh and try again.',
          error_ar: 'تم اكتشاف تعديل متزامن. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
          current_version: currentPosition.version,
          provided_version: body.current_version,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the version to restore
    const { data: versionToRestore, error: versionError } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', body.position_id)
      .eq('version_number', body.version_number)
      .single();

    if (versionError || !versionToRestore) {
      return new Response(
        JSON.stringify({
          error: 'Version not found',
          error_ar: 'الإصدار غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const snapshot = versionToRestore.full_snapshot || {};

    // Build update from snapshot
    const updateData: any = {
      title_en: snapshot.title_en || currentPosition.title_en,
      title_ar: snapshot.title_ar || currentPosition.title_ar,
      content_en: snapshot.content_en,
      content_ar: snapshot.content_ar,
      rationale_en: snapshot.rationale_en,
      rationale_ar: snapshot.rationale_ar,
      alignment_notes_en: snapshot.alignment_notes_en,
      alignment_notes_ar: snapshot.alignment_notes_ar,
      thematic_category: snapshot.thematic_category,
      updated_at: new Date().toISOString(),
      version: currentPosition.version + 1,
    };

    // Update the position
    const { data: restoredPosition, error: updateError } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', body.position_id)
      .eq('version', body.current_version) // Double-check version
      .select()
      .single();

    if (updateError || !restoredPosition) {
      console.error('Error restoring position:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to restore position',
          error_ar: 'فشل في استعادة الموقف',
          details: updateError?.message,
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

    // Create new version record (marking it as a restore)
    const newVersionNumber = currentPosition.version + 1;
    await supabase.from('position_versions').insert({
      position_id: body.position_id,
      version_number: newVersionNumber,
      content_en: restoredPosition.content_en,
      content_ar: restoredPosition.content_ar,
      rationale_en: restoredPosition.rationale_en,
      rationale_ar: restoredPosition.rationale_ar,
      full_snapshot: {
        ...restoredPosition,
        restored_from_version: body.version_number,
      },
      author_id: user.id,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        ...restoredPosition,
        restored_from_version: body.version_number,
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
