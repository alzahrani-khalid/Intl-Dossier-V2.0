import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_SIZE_MB = 100;
const BUCKET_NAME = 'intake-attachments';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract ticket ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 2]; // /intake/tickets/{id}/attachments

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('intake_tickets')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: `File type ${file.type} is not allowed`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check total attachments size
    const { data: existingAttachments } = await supabase
      .from('intake_attachments')
      .select('file_size')
      .eq('ticket_id', ticketId)
      .is('deleted_at', null);

    const totalSize = (existingAttachments || []).reduce(
      (sum: number, att: any) => sum + att.file_size,
      0
    );

    if (totalSize + file.size > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          error: `Total attachments would exceed ${MAX_TOTAL_SIZE_MB}MB limit`,
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${ticketId}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const fileData = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileData, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({
          error: 'Upload failed',
          message: uploadError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('intake_attachments')
      .insert({
        ticket_id: ticketId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        scan_status: 'pending',
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      })
      .select('id, file_name, file_size, mime_type, scan_status, uploaded_at')
      .single();

    if (dbError || !attachment) {
      // Rollback storage upload
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create attachment record',
          message: dbError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Trigger virus scan if webhook is configured
    const scanWebhookUrl = Deno.env.get('VIRUS_SCAN_WEBHOOK_URL');
    if (scanWebhookUrl) {
      try {
        const { data: signedUrl } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(storagePath, 3600);

        if (signedUrl) {
          await fetch(scanWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('VIRUS_SCAN_API_KEY')}`,
            },
            body: JSON.stringify({
              attachment_id: attachment.id,
              file_url: signedUrl.signedUrl,
              callback_url: `${Deno.env.get('API_URL')}/webhooks/virus-scan`,
            }),
          });
        }
      } catch (error) {
        console.warn('Failed to trigger virus scan:', error);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        ...attachment,
        download_url: null, // Only available after scan completes
        timestamp: new Date().toISOString(),
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});