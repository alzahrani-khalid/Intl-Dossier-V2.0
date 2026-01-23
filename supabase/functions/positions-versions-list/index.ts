import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-versions-list
 * GET /positions/{id}/versions?limit=10&offset=0
 *
 * Returns paginated list of all versions for a position
 * Ordered by version_number descending (newest first)
 */

interface VersionSummary {
  id: string;
  position_id: string;
  version_number: number;
  author_id: string;
  created_at: string;
  superseded: boolean;
  content_preview_en: string | null;
  content_preview_ar: string | null;
}

interface ListVersionsResponse {
  versions: VersionSummary[];
  total_count: number;
  has_more: boolean;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const position_id = url.searchParams.get('position_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    if (!position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return new Response(
        JSON.stringify({
          error: 'Invalid limit parameter',
          error_ar: 'معامل الحد غير صالح',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid offset parameter',
          error_ar: 'معامل الإزاحة غير صالح',
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

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('position_versions')
      .select('*', { count: 'exact', head: true })
      .eq('position_id', position_id);

    if (countError) {
      console.error('Error counting versions:', countError);
      return new Response(
        JSON.stringify({
          error: 'Failed to count versions',
          error_ar: 'فشل في حساب الإصدارات',
          details: countError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch versions with pagination
    const { data: versions, error: versionsError } = await supabase
      .from('position_versions')
      .select(
        'id, position_id, version_number, author_id, created_at, superseded, content_en, content_ar'
      )
      .eq('position_id', position_id)
      .order('version_number', { ascending: false })
      .range(offset, offset + limit - 1);

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

    // Transform to include content previews (truncated to 200 chars)
    const versionSummaries: VersionSummary[] = (versions || []).map((v) => ({
      id: v.id,
      position_id: v.position_id,
      version_number: v.version_number,
      author_id: v.author_id,
      created_at: v.created_at,
      superseded: v.superseded,
      content_preview_en: v.content_en
        ? v.content_en.substring(0, 200) + (v.content_en.length > 200 ? '...' : '')
        : null,
      content_preview_ar: v.content_ar
        ? v.content_ar.substring(0, 200) + (v.content_ar.length > 200 ? '...' : '')
        : null,
    }));

    const response: ListVersionsResponse = {
      versions: versionSummaries,
      total_count: totalCount ?? 0,
      has_more: offset + limit < (totalCount ?? 0),
    };

    return new Response(JSON.stringify(response), {
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
