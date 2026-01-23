import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: attachments-upload
 * POST /positions/{id}/attachments
 *
 * Uploads an attachment to a position
 * Validates file type and size before uploading
 * Only the position author or delegates can upload
 */

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'image/png',
  'image/jpeg',
];

const MAX_FILE_SIZE = 52428800; // 50MB in bytes
const MAX_ATTACHMENTS_PER_POSITION = 20;

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

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const position_id = formData.get('position_id') as string | null;

    if (!position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!file) {
      return new Response(
        JSON.stringify({
          error: 'File is required',
          error_ar: 'الملف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'file_too_large',
          message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1048576}MB`,
          error_ar: `حجم الملف يتجاوز الحد الأقصى ${MAX_FILE_SIZE / 1048576} ميجابايت`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_file_type',
          message: `File type ${file.type} is not allowed`,
          error_ar: `نوع الملف ${file.type} غير مسموح به`,
          allowed_types: ALLOWED_MIME_TYPES,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify position exists and user has access
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('id, author_id, status, delegates')
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

    // Check if user can upload (author or delegate)
    const isAuthor = position.author_id === user.id;
    const delegates = position.delegates || [];
    const isDelegate = delegates.some((d: any) => d.user_id === user.id);

    if (!isAuthor && !isDelegate) {
      return new Response(
        JSON.stringify({
          error: 'Only the author or delegates can upload attachments',
          error_ar: 'فقط المؤلف أو المفوضين يمكنهم رفع المرفقات',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attachment count limit
    const { count: attachmentCount } = await supabase
      .from('attachments')
      .select('*', { count: 'exact', head: true })
      .eq('position_id', position_id);

    if (attachmentCount && attachmentCount >= MAX_ATTACHMENTS_PER_POSITION) {
      return new Response(
        JSON.stringify({
          error: 'attachment_limit_exceeded',
          message: `Maximum ${MAX_ATTACHMENTS_PER_POSITION} attachments per position`,
          error_ar: `الحد الأقصى ${MAX_ATTACHMENTS_PER_POSITION} مرفق لكل موقف`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique storage path
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${position_id}/${crypto.randomUUID()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('position-attachments')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({
          error: 'Failed to upload file',
          error_ar: 'فشل في رفع الملف',
          details: uploadError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create attachment record in database
    const { data: attachment, error: insertError } = await supabase
      .from('attachments')
      .insert({
        position_id: position_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        uploader_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('position-attachments').remove([uploadData.path]);

      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create attachment record',
          error_ar: 'فشل في إنشاء سجل المرفق',
          details: insertError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for immediate use (24-hour expiry)
    const { data: signedUrl } = await supabase.storage
      .from('position-attachments')
      .createSignedUrl(uploadData.path, 86400);

    return new Response(
      JSON.stringify({
        ...attachment,
        download_url: signedUrl?.signedUrl ?? null,
        message: 'Attachment uploaded successfully',
        message_ar: 'تم رفع المرفق بنجاح',
      }),
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
        error_ar: 'خطأ داخلي في الخادم',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
