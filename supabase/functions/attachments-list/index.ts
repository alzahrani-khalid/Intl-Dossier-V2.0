import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: attachments-list
 * GET /positions/{id}/attachments?limit=20&offset=0
 *
 * Lists all attachments for a position
 * Returns signed URLs for downloading files
 */

interface AttachmentListItem {
  id: string;
  position_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploader_id: string;
  created_at: string;
  download_url: string | null;
}

interface ListAttachmentsResponse {
  attachments: AttachmentListItem[];
  total_count: number;
  has_more: boolean;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        error_ar: 'الطريقة غير مسموح بها',
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const position_id = url.searchParams.get('position_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
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

    // Verify user has access to the position (RLS enforces this)
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
      .from('attachments')
      .select('*', { count: 'exact', head: true })
      .eq('position_id', position_id);

    if (countError) {
      console.error('Error counting attachments:', countError);
      return new Response(
        JSON.stringify({
          error: 'Failed to count attachments',
          error_ar: 'فشل في حساب المرفقات',
          details: countError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch attachments with pagination
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select(
        'id, position_id, file_name, file_size, file_type, storage_path, uploader_id, created_at'
      )
      .eq('position_id', position_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch attachments',
          error_ar: 'فشل في جلب المرفقات',
          details: attachmentsError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URLs for each attachment (24-hour expiry)
    const attachmentsWithUrls: AttachmentListItem[] = await Promise.all(
      (attachments || []).map(async (att) => {
        let downloadUrl: string | null = null;

        try {
          const { data: signedUrl } = await supabase.storage
            .from('position-attachments')
            .createSignedUrl(att.storage_path, 86400); // 24 hours

          downloadUrl = signedUrl?.signedUrl ?? null;
        } catch (err) {
          console.warn(`Failed to generate signed URL for ${att.id}:`, err);
        }

        return {
          id: att.id,
          position_id: att.position_id,
          file_name: att.file_name,
          file_size: att.file_size,
          file_type: att.file_type,
          uploader_id: att.uploader_id,
          created_at: att.created_at,
          download_url: downloadUrl,
        };
      })
    );

    const response: ListAttachmentsResponse = {
      attachments: attachmentsWithUrls,
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
