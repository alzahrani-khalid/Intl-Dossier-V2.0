import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: attachments-delete
 * DELETE /attachments/{id}
 *
 * Deletes an attachment from both storage and database
 * Only the uploader, position author, or admin can delete
 */

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'DELETE') {
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

    // Fetch attachment
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('id, position_id, storage_path, uploader_id, file_name')
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

    // Fetch position to check ownership
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('id, author_id, status')
      .eq('id', attachment.position_id)
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

    // Check if user can delete (uploader, position author, or admin)
    const isUploader = attachment.uploader_id === user.id;
    const isPositionAuthor = position.author_id === user.id;

    // Check for admin role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'manager';

    if (!isUploader && !isPositionAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: 'Only the uploader, position author, or admin can delete this attachment',
          error_ar: 'فقط الرافع أو مؤلف الموقف أو المسؤول يمكنه حذف هذا المرفق',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('position-attachments')
      .remove([attachment.storage_path]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
      // This ensures we don't leave orphaned records
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachment_id);

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete attachment',
          error_ar: 'فشل في حذف المرفق',
          details: deleteError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'attachment',
        entity_id: attachment_id,
        action: 'delete',
        actor_id: user.id,
        details: {
          file_name: attachment.file_name,
          position_id: attachment.position_id,
        },
      });
    } catch (auditError) {
      // Audit logging failure should not fail the operation
      console.warn('Failed to create audit log:', auditError);
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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
