import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-create
 * POST /positions
 *
 * Creates a new position with bilingual content
 * Required fields:
 * - position_type_id: UUID of position type
 * - title_en, title_ar: Bilingual titles
 * - audience_groups: Array of audience group IDs
 */

interface CreatePositionRequest {
  position_type_id: string;
  title_en: string;
  title_ar: string;
  content_en?: string;
  content_ar?: string;
  rationale_en?: string;
  rationale_ar?: string;
  alignment_notes_en?: string;
  alignment_notes_ar?: string;
  thematic_category?: string;
  audience_groups: string[];
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: CreatePositionRequest = await req.json();

    // Validate required fields
    if (!body.position_type_id) {
      return new Response(
        JSON.stringify({
          error: 'position_type_id is required',
          error_ar: 'معرف نوع الموقف مطلوب'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.title_en || !body.title_ar) {
      return new Response(
        JSON.stringify({
          error: 'Both title_en and title_ar are required',
          error_ar: 'العنوان بالإنجليزية والعربية مطلوب'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.audience_groups || body.audience_groups.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'At least one audience group is required',
          error_ar: 'مجموعة جمهور واحدة على الأقل مطلوبة'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization
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

    // Get user ID from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_ar: 'غير مصرح'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify position type exists
    const { data: positionType, error: typeError } = await supabase
      .from('position_types')
      .select('id, approval_stages, default_chain_config')
      .eq('id', body.position_type_id)
      .single();

    if (typeError || !positionType) {
      return new Response(
        JSON.stringify({
          error: 'Invalid position_type_id',
          error_ar: 'معرف نوع الموقف غير صالح'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create position
    const { data: position, error: createError } = await supabase
      .from('positions')
      .insert({
        position_type_id: body.position_type_id,
        title_en: body.title_en,
        title_ar: body.title_ar,
        content_en: body.content_en || '',
        content_ar: body.content_ar || '',
        rationale_en: body.rationale_en || '',
        rationale_ar: body.rationale_ar || '',
        alignment_notes_en: body.alignment_notes_en || '',
        alignment_notes_ar: body.alignment_notes_ar || '',
        thematic_category: body.thematic_category || '',
        status: 'draft',
        current_stage: 0,
        approval_chain_config: positionType.default_chain_config,
        consistency_score: 0,
        author_id: user.id,
        version: 1,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating position:', createError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create position',
          error_ar: 'فشل في إنشاء الموقف',
          details: createError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audience group associations
    const audienceInserts = body.audience_groups.map(groupId => ({
      position_id: position.id,
      audience_group_id: groupId,
      granted_by: user.id,
    }));

    const { error: audienceError } = await supabase
      .from('position_audience_groups')
      .insert(audienceInserts);

    if (audienceError) {
      console.error('Error creating audience groups:', audienceError);
      // Rollback: delete position
      await supabase.from('positions').delete().eq('id', position.id);
      return new Response(
        JSON.stringify({
          error: 'Failed to assign audience groups',
          error_ar: 'فشل في تعيين مجموعات الجمهور'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create initial version (version 1)
    const { error: versionError } = await supabase
      .from('position_versions')
      .insert({
        position_id: position.id,
        version_number: 1,
        content_en: body.content_en || '',
        content_ar: body.content_ar || '',
        rationale_en: body.rationale_en || '',
        rationale_ar: body.rationale_ar || '',
        full_snapshot: position,
        author_id: user.id,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 7 years
      });

    if (versionError) {
      console.error('Error creating version:', versionError);
      // Continue despite version error (version is nice-to-have for draft)
    }

    return new Response(
      JSON.stringify(position),
      {
        status: 201,
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
