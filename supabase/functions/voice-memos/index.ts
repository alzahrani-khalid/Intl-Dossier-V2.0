/**
 * Voice Memos Edge Function
 * CRUD operations for voice memos attached to documents/entities
 * Supports: GET (list/single), POST (create), PUT (update), DELETE (soft delete)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CreateVoiceMemoInput {
  organization_id: string;
  document_id?: string;
  entity_type: string;
  entity_id: string;
  title?: string;
  description?: string;
  duration_seconds: number;
  file_size_bytes: number;
  mime_type?: string;
  sample_rate?: number;
  channels?: number;
  recorded_on_device?: string;
  recorded_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const voiceMemoId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // GET: List or single voice memo
    if (req.method === 'GET') {
      // Single voice memo by ID
      if (voiceMemoId && voiceMemoId !== 'voice-memos') {
        const { data: voiceMemo, error } = await supabaseClient
          .from('voice_memos')
          .select(
            `
            *,
            profiles:recorded_by (full_name, avatar_url)
          `
          )
          .eq('id', voiceMemoId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate signed URL for playback
        const { data: signedUrl } = await supabaseClient.storage
          .from(voiceMemo.storage_bucket)
          .createSignedUrl(voiceMemo.storage_path, 3600); // 1 hour expiry

        return new Response(
          JSON.stringify({
            ...voiceMemo,
            playback_url: signedUrl?.signedUrl,
            playback_url_expiry: new Date(Date.now() + 3600000).toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List voice memos with filters
      const entityType = url.searchParams.get('entity_type');
      const entityId = url.searchParams.get('entity_id');
      const documentId = url.searchParams.get('document_id');
      const status = url.searchParams.get('status');
      const recordedBy = url.searchParams.get('recorded_by');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const searchQuery = url.searchParams.get('q');

      let query = supabaseClient
        .from('voice_memos')
        .select(
          `
          *,
          profiles:recorded_by (full_name, avatar_url)
        `,
          { count: 'exact' }
        )
        .is('deleted_at', null)
        .order('recorded_at', { ascending: false });

      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);
      if (documentId) query = query.eq('document_id', documentId);
      if (status) query = query.eq('status', status);
      if (recordedBy) query = query.eq('recorded_by', recordedBy);
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,transcription.ilike.%${searchQuery}%`);
      }

      const { data: voiceMemos, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          voice_memos: voiceMemos,
          total: count,
          has_more: (count || 0) > offset + limit,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: Create voice memo
    if (req.method === 'POST') {
      const body: CreateVoiceMemoInput = await req.json();

      // Validate required fields
      if (
        !body.organization_id ||
        !body.entity_type ||
        !body.entity_id ||
        !body.duration_seconds ||
        !body.file_size_bytes
      ) {
        return new Response(
          JSON.stringify({
            error:
              'Missing required fields: organization_id, entity_type, entity_id, duration_seconds, file_size_bytes',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate storage path
      const timestamp = Date.now();
      const storagePath = `${user.id}/${body.entity_type}/${body.entity_id}/${timestamp}.m4a`;

      // Create voice memo record
      const { data: voiceMemo, error: insertError } = await supabaseClient
        .from('voice_memos')
        .insert({
          organization_id: body.organization_id,
          document_id: body.document_id,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          title: body.title,
          description: body.description,
          duration_seconds: body.duration_seconds,
          file_size_bytes: body.file_size_bytes,
          mime_type: body.mime_type || 'audio/m4a',
          sample_rate: body.sample_rate || 44100,
          channels: body.channels || 1,
          storage_path: storagePath,
          storage_bucket: 'voice-memos',
          recorded_by: user.id,
          recorded_on_device: body.recorded_on_device,
          recorded_location: body.recorded_location,
          tags: body.tags || [],
          metadata: body.metadata || {},
          status: 'processing',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate upload URL
      const { data: uploadUrl, error: uploadError } = await supabaseClient.storage
        .from('voice-memos')
        .createSignedUploadUrl(storagePath);

      if (uploadError) {
        console.error('Upload URL error:', uploadError);
        // Cleanup the created record
        await supabaseClient.from('voice_memos').delete().eq('id', voiceMemo.id);
        return new Response(JSON.stringify({ error: 'Failed to generate upload URL' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          voice_memo: voiceMemo,
          upload_url: uploadUrl.signedUrl,
          upload_token: uploadUrl.token,
          transcription_queued: true,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT: Update voice memo
    if (req.method === 'PUT') {
      if (!voiceMemoId || voiceMemoId === 'voice-memos') {
        return new Response(JSON.stringify({ error: 'Voice memo ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const allowedFields = ['title', 'description', 'tags', 'metadata'];
      const updateData: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      updateData.updated_at = new Date().toISOString();

      const { data: voiceMemo, error } = await supabaseClient
        .from('voice_memos')
        .update(updateData)
        .eq('id', voiceMemoId)
        .eq('recorded_by', user.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(voiceMemo), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Soft delete voice memo
    if (req.method === 'DELETE') {
      if (!voiceMemoId || voiceMemoId === 'voice-memos') {
        return new Response(JSON.stringify({ error: 'Voice memo ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabaseClient
        .from('voice_memos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', voiceMemoId)
        .eq('recorded_by', user.id)
        .is('deleted_at', null);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in voice-memos:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
