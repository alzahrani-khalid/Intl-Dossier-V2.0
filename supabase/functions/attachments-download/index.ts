import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: attachments-download
 * GET /attachments/{id}/download
 *
 * Generates a fresh signed URL for downloading an attachment
 * Returns either the URL or redirects to it based on 'redirect' parameter
 */

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
    const attachment_id = url.searchParams.get('attachment_id');
    const redirect = url.searchParams.get('redirect') === 'true';
    const expiresIn = Math.min(
      parseInt(url.searchParams.get('expires_in') ?? '3600', 10),
      86400 // Max 24 hours
    );

    if (!attachment_id) {
      return new Response(
        JSON.stringify({
          error: 'attachment_id is required',
          error_ar: 'معرف المرفق مطلوب',
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

    // Fetch attachment with position info for access check
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('id, position_id, file_name, storage_path, file_type, file_size')
      .eq('id', attachment_id)
      .single();

    if (attachmentError || !attachment) {
      return new Response(
        JSON.stringify({
          error: 'Attachment not found',
          error_ar: 'المرفق غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to the position (RLS enforces this)
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('id')
      .eq('id', attachment.position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({
          error: 'Access denied to this attachment',
          error_ar: 'تم رفض الوصول إلى هذا المرفق',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('position-attachments')
      .createSignedUrl(attachment.storage_path, expiresIn);

    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate download URL',
          error_ar: 'فشل في إنشاء رابط التحميل',
          details: signedUrlError?.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If redirect requested, redirect to the signed URL
    if (redirect) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: signedUrl.signedUrl,
        },
      });
    }

    // Otherwise return the URL in response body
    return new Response(
      JSON.stringify({
        id: attachment.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        download_url: signedUrl.signedUrl,
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
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
