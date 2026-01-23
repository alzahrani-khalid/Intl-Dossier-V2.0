import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-versions-compare
 * GET /positions/{id}/versions/compare?v1={version1}&v2={version2}
 *
 * Compares two versions of a position and returns a diff
 * Returns field-by-field comparison showing what changed between versions
 */

interface VersionComparison {
  version1: {
    version_number: number;
    created_at: string;
    author_id: string;
  };
  version2: {
    version_number: number;
    created_at: string;
    author_id: string;
  };
  changes: {
    field: string;
    v1_value: any;
    v2_value: any;
    changed: boolean;
  }[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const position_id = url.searchParams.get('position_id');
    const v1 = url.searchParams.get('v1');
    const v2 = url.searchParams.get('v2');

    if (!position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!v1 || !v2) {
      return new Response(
        JSON.stringify({
          error: 'Both v1 and v2 version numbers are required',
          error_ar: 'رقما الإصدار v1 و v2 مطلوبان',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const version1 = parseInt(v1, 10);
    const version2 = parseInt(v2, 10);

    if (isNaN(version1) || isNaN(version2) || version1 < 1 || version2 < 1) {
      return new Response(
        JSON.stringify({
          error: 'Invalid version numbers. Must be positive integers.',
          error_ar: 'أرقام إصدار غير صالحة. يجب أن تكون أعداد صحيحة موجبة.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (version1 === version2) {
      return new Response(
        JSON.stringify({
          error: 'Cannot compare a version with itself',
          error_ar: 'لا يمكن مقارنة إصدار بنفسه',
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

    // Verify user has access to the position
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('id')
      .eq('id', position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({
          error: 'Position not found or access denied',
          error_ar: 'الموقف غير موجود أو تم رفض الوصول',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch both versions
    const { data: versions, error: versionsError } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', position_id)
      .in('version_number', [version1, version2])
      .order('version_number', { ascending: true });

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch versions',
          error_ar: 'فشل في جلب الإصدارات',
          details: versionsError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!versions || versions.length !== 2) {
      return new Response(
        JSON.stringify({
          error: 'One or both versions not found',
          error_ar: 'إصدار واحد أو كلاهما غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const versionData1 = versions.find((v) => v.version_number === Math.min(version1, version2))!;
    const versionData2 = versions.find((v) => v.version_number === Math.max(version1, version2))!;

    // Compare fields from full_snapshot
    const snapshot1 = versionData1.full_snapshot || {};
    const snapshot2 = versionData2.full_snapshot || {};

    const fieldsToCompare = [
      'title_en',
      'title_ar',
      'content_en',
      'content_ar',
      'rationale_en',
      'rationale_ar',
      'alignment_notes_en',
      'alignment_notes_ar',
      'thematic_category',
      'status',
      'current_stage',
    ];

    const changes = fieldsToCompare.map((field) => ({
      field,
      v1_value: snapshot1[field] ?? null,
      v2_value: snapshot2[field] ?? null,
      changed: JSON.stringify(snapshot1[field]) !== JSON.stringify(snapshot2[field]),
    }));

    const comparison: VersionComparison = {
      version1: {
        version_number: versionData1.version_number,
        created_at: versionData1.created_at,
        author_id: versionData1.author_id,
      },
      version2: {
        version_number: versionData2.version_number,
        created_at: versionData2.created_at,
        author_id: versionData2.author_id,
      },
      changes,
    };

    return new Response(JSON.stringify(comparison), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
