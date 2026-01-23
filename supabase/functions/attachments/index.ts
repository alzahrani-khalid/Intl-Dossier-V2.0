// T049: Supabase Edge Function for attachments CRUD
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv'
];

const MAX_FILE_SIZE = 104857600; // 100MB in bytes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /after-actions/{id}/attachments - Upload attachment
    if (req.method === 'POST' && pathSegments.includes('after-actions')) {
      const afterActionId = pathSegments[pathSegments.indexOf('after-actions') + 1];

      if (!afterActionId) {
        return new Response(
          JSON.stringify({ error: 'After-action ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if after-action exists and user has access
      const { data: afterAction, error: fetchError } = await supabaseClient
        .from('after_action_records')
        .select('id, dossier_id')
        .eq('id', afterActionId)
        .single();

      if (fetchError || !afterAction) {
        return new Response(
          JSON.stringify({ error: 'After-action record not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check attachment count (max 10)
      const { count } = await supabaseClient
        .from('aa_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('after_action_id', afterActionId);

      if (count && count >= 10) {
        return new Response(
          JSON.stringify({
            error: 'attachment_limit_exceeded',
            message: 'Maximum 10 attachments per after-action record'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse multipart form data
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'File is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            error: 'file_too_large',
            message: `File size must be less than ${MAX_FILE_SIZE / 1048576}MB`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: 'invalid_file_type',
            message: `File type ${file.type} not allowed`,
            allowed_types: ALLOWED_MIME_TYPES
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upload to Supabase Storage
      const fileName = `${afterActionId}/${crypto.randomUUID()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('after-action-attachments')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        return new Response(
          JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create attachment record (virus scan trigger will run automatically)
      const { data: attachment, error: insertError } = await supabaseClient
        .from('aa_attachments')
        .insert({
          after_action_id: afterActionId,
          file_name: file.name,
          storage_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          scan_status: 'pending',
          uploaded_by: user.user.id
        })
        .select()
        .single();

      if (insertError) {
        // Rollback: delete uploaded file
        await supabaseClient.storage.from('after-action-attachments').remove([uploadData.path]);
        return new Response(
          JSON.stringify({ error: `Failed to create attachment record: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URL (24-hour expiry)
      const { data: signedUrl } = await supabaseClient.storage
        .from('after-action-attachments')
        .createSignedUrl(uploadData.path, 86400);

      return new Response(
        JSON.stringify({
          ...attachment,
          file_url: signedUrl?.signedUrl
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /after-actions/{id}/attachments - List attachments
    if (req.method === 'GET' && pathSegments.includes('after-actions')) {
      const afterActionId = pathSegments[pathSegments.indexOf('after-actions') + 1];

      if (!afterActionId) {
        return new Response(
          JSON.stringify({ error: 'After-action ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get attachments
      const { data: attachments, error } = await supabaseClient
        .from('aa_attachments')
        .select('id, after_action_id, file_name, storage_path, file_size, mime_type, scan_status, uploaded_by, uploaded_at, virus_scan_result')
        .eq('after_action_id', afterActionId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URLs for each attachment
      const attachmentsWithUrls = await Promise.all(
        (attachments || []).map(async (att) => {
          const { data: signedUrl } = await supabaseClient.storage
            .from('after-action-attachments')
            .createSignedUrl(att.storage_path, 86400);

          return {
            ...att,
            file_url: signedUrl?.signedUrl
          };
        })
      );

      return new Response(
        JSON.stringify(attachmentsWithUrls),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /attachments/{id} - Delete attachment
    if (req.method === 'DELETE' && pathSegments.includes('attachments')) {
      const attachmentId = pathSegments[pathSegments.indexOf('attachments') + 1];

      if (!attachmentId) {
        return new Response(
          JSON.stringify({ error: 'Attachment ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get attachment (check ownership)
      const { data: attachment, error: fetchError } = await supabaseClient
        .from('aa_attachments')
        .select('id, after_action_id, storage_path, uploaded_by')
        .eq('id', attachmentId)
        .single();

      if (fetchError || !attachment) {
        return new Response(
          JSON.stringify({ error: 'Attachment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is the uploader
      if (attachment.uploaded_by !== user.user.id) {
        return new Response(
          JSON.stringify({
            error: 'forbidden',
            message: 'Only the uploader can delete this attachment'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from storage
      const { error: storageError } = await supabaseClient.storage
        .from('after-action-attachments')
        .remove([attachment.storage_path]);

      if (storageError) {
        console.error('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: deleteError } = await supabaseClient
        .from('aa_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});