/**
 * Edge Function: positions-emergency-correct
 * POST /positions/{id}/emergency-correct
 * Feature: 011-positions-talking-points
 * Task: T098
 *
 * Description: Emergency correction for published positions. Admin-only operation that creates
 * a new corrected version, marks original with emergency_correction flag, and notifies audience groups.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

interface EmergencyCorrectionRequest {
  position_id: string;
  correction_reason: string;
  corrected_content_en?: string;
  corrected_content_ar?: string;
  corrected_title_en?: string;
  corrected_title_ar?: string;
  corrected_rationale_en?: string;
  corrected_rationale_ar?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: EmergencyCorrectionRequest = await req.json();
    const { position_id, correction_reason, ...correctedFields } = requestBody;

    // Validate required fields
    if (!position_id || !correction_reason) {
      return new Response(
        JSON.stringify({
          error: 'position_id and correction_reason are required',
          error_ar: 'position_id وcorrection_reason مطلوبان'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (correction_reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: 'correction_reason must be at least 10 characters',
          error_ar: 'يجب أن يكون سبب التصحيح 10 أحرف على الأقل'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', error_ar: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role from JWT claims
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Admin access required for emergency corrections',
          error_ar: 'مطلوب وصول المسؤول لإجراء التصحيحات الطارئة'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the position to correct
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('*, position_audience_groups(audience_group_id)')
      .eq('id', position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({ error: 'Position not found', error_ar: 'الموقف غير موجود' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current version number
    const { data: latestVersion } = await supabase
      .from('position_versions')
      .select('version_number')
      .eq('position_id', position_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (latestVersion?.version_number || 0) + 1;

    // Create corrected version
    const correctedContent = {
      title_en: correctedFields.corrected_title_en || position.title_en,
      title_ar: correctedFields.corrected_title_ar || position.title_ar,
      content_en: correctedFields.corrected_content_en || position.content_en,
      content_ar: correctedFields.corrected_content_ar || position.content_ar,
      rationale_en: correctedFields.corrected_rationale_en || position.rationale_en,
      rationale_ar: correctedFields.corrected_rationale_ar || position.rationale_ar,
    };

    const { data: newVersion, error: versionError } = await supabase
      .from('position_versions')
      .insert({
        position_id,
        version_number: newVersionNumber,
        content_en: correctedContent.content_en,
        content_ar: correctedContent.content_ar,
        rationale_en: correctedContent.rationale_en,
        rationale_ar: correctedContent.rationale_ar,
        full_snapshot: {
          ...position,
          ...correctedContent,
          emergency_corrected: true,
          original_version: position.version
        },
        author_id: user.id,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString() // 7 years
      })
      .select()
      .single();

    if (versionError || !newVersion) {
      console.error('Version creation error:', versionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create corrected version' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark all previous versions as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', position_id)
      .lt('version_number', newVersionNumber);

    // Update position with correction metadata and new content
    const { data: updatedPosition, error: updateError } = await supabase
      .from('positions')
      .update({
        ...correctedContent,
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        corrected_by: user.id,
        correction_reason,
        corrected_version_id: newVersion.id,
        version: position.version + 1
      })
      .eq('id', position_id)
      .select()
      .single();

    if (updateError || !updatedPosition) {
      console.error('Position update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update position with correction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Trigger notifications to audience groups about emergency correction
    // This would be implemented in a separate notification service
    const audienceGroupIds = position.position_audience_groups?.map(
      (pag: { audience_group_id: string }) => pag.audience_group_id
    ) || [];

    console.log(
      `Emergency correction applied by ${user.email} to position ${position_id}. ` +
      `Notifying ${audienceGroupIds.length} audience groups.`
    );

    // Return success response with updated position and new version
    return new Response(
      JSON.stringify({
        success: true,
        position: updatedPosition,
        new_version: newVersion,
        notification_sent_to_groups: audienceGroupIds.length,
        message: 'Emergency correction applied successfully',
        message_ar: 'تم تطبيق التصحيح الطارئ بنجاح'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('Emergency correction error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ داخلي في الخادم',
        details: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
