import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-update
 * PUT /positions/{id}
 *
 * Updates a position with optimistic locking
 * Requires version field to prevent concurrent modification conflicts
 * Creates a new version record on successful update
 */

interface UpdatePositionRequest {
  position_id: string;
  version: number; // Current version for optimistic locking
  title_en?: string;
  title_ar?: string;
  content_en?: string;
  content_ar?: string;
  rationale_en?: string;
  rationale_ar?: string;
  alignment_notes_en?: string;
  alignment_notes_ar?: string;
  thematic_category?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: UpdatePositionRequest = await req.json();

    if (!body.position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.version === undefined) {
      return new Response(
        JSON.stringify({
          error: 'version field is required for optimistic locking',
          error_ar: 'حقل الإصدار مطلوب لمنع التعارض'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          error_ar: 'رأس التفويض مفقود'
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_ar: 'غير مصرح'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current position to check version and status
    const { data: currentPosition, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', body.position_id)
      .single();

    if (fetchError || !currentPosition) {
      return new Response(
        JSON.stringify({
          error: 'Position not found',
          error_ar: 'الموقف غير موجود'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optimistic locking check
    if (currentPosition.version !== body.version) {
      return new Response(
        JSON.stringify({
          error: 'Concurrent modification detected. Please refresh and try again.',
          error_ar: 'تم اكتشاف تعديل متزامن. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
          current_version: currentPosition.version,
          provided_version: body.version
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow updates on draft status (RLS also enforces author_id check)
    if (currentPosition.status !== 'draft') {
      return new Response(
        JSON.stringify({
          error: 'Can only update positions in draft status',
          error_ar: 'يمكن تحديث المواقف في حالة المسودة فقط'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentPosition.version + 1, // Increment version
    };

    if (body.title_en !== undefined) updateData.title_en = body.title_en;
    if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
    if (body.content_en !== undefined) updateData.content_en = body.content_en;
    if (body.content_ar !== undefined) updateData.content_ar = body.content_ar;
    if (body.rationale_en !== undefined) updateData.rationale_en = body.rationale_en;
    if (body.rationale_ar !== undefined) updateData.rationale_ar = body.rationale_ar;
    if (body.alignment_notes_en !== undefined) updateData.alignment_notes_en = body.alignment_notes_en;
    if (body.alignment_notes_ar !== undefined) updateData.alignment_notes_ar = body.alignment_notes_ar;
    if (body.thematic_category !== undefined) updateData.thematic_category = body.thematic_category;

    // Update position
    const { data: updatedPosition, error: updateError } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', body.position_id)
      .eq('version', body.version) // Double-check version in DB
      .select()
      .single();

    if (updateError) {
      console.error('Error updating position:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update position',
          error_ar: 'فشل في تحديث الموقف',
          details: updateError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark previous version as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', body.position_id)
      .eq('superseded', false);

    // Create new version record
    const newVersionNumber = currentPosition.version + 1;
    await supabase
      .from('position_versions')
      .insert({
        position_id: body.position_id,
        version_number: newVersionNumber,
        content_en: updatedPosition.content_en,
        content_ar: updatedPosition.content_ar,
        rationale_en: updatedPosition.rationale_en,
        rationale_ar: updatedPosition.rationale_ar,
        full_snapshot: updatedPosition,
        author_id: user.id,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    return new Response(
      JSON.stringify(updatedPosition),
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
        error_ar: 'خطأ داخلي في الخادم'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
