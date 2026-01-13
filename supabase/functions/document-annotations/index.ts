/**
 * Document Annotations Edge Function
 * CRUD operations for document annotations (handwritten, highlights, stamps, etc.)
 * Supports: GET (list), POST (create/batch), PUT (update), DELETE (soft delete)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CreateAnnotationInput {
  organization_id: string;
  document_id: string;
  page_number?: number;
  annotation_type: 'handwritten' | 'highlight' | 'text_note' | 'shape' | 'stamp' | 'signature';
  tool?: 'pen' | 'highlighter' | 'eraser' | 'marker' | 'pencil';
  color?: string;
  stroke_width?: number;
  opacity?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  layer_index?: number;
  group_id?: string;
  created_on_device?: string;
  local_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Type-specific fields
  path_data?: string;
  stroke_points?: { x: number; y: number; pressure?: number; timestamp?: number }[];
  text_content?: string;
  font_size?: number;
  font_family?: string;
  highlighted_text?: string;
  text_range?: { startOffset: number; endOffset: number };
  stamp_type?: string;
  stamp_image_url?: string;
  signature_data?: string;
  signer_name?: string;
}

serve(async (req) => {
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
    const annotationId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // GET: List annotations for a document
    if (req.method === 'GET') {
      const documentId = url.searchParams.get('document_id');
      const pageNumber = url.searchParams.get('page_number');
      const annotationType = url.searchParams.get('annotation_type');
      const groupId = url.searchParams.get('group_id');
      const createdBy = url.searchParams.get('created_by');
      const includeGroups = url.searchParams.get('include_groups') === 'true';

      // Single annotation by ID
      if (annotationId && annotationId !== 'document-annotations') {
        const { data: annotation, error } = await supabaseClient
          .from('document_annotations')
          .select(
            `
            *,
            profiles:created_by (full_name, avatar_url)
          `
          )
          .eq('id', annotationId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(annotation), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // List annotations
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'document_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabaseClient
        .from('document_annotations')
        .select(
          `
          *,
          profiles:created_by (full_name, avatar_url)
        `,
          { count: 'exact' }
        )
        .eq('document_id', documentId)
        .is('deleted_at', null)
        .order('page_number', { ascending: true, nullsFirst: true })
        .order('layer_index', { ascending: true });

      if (pageNumber) query = query.eq('page_number', parseInt(pageNumber));
      if (annotationType) query = query.eq('annotation_type', annotationType);
      if (groupId) query = query.eq('group_id', groupId);
      if (createdBy) query = query.eq('created_by', createdBy);

      const { data: annotations, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Optionally include annotation groups
      let groups = null;
      if (includeGroups) {
        const { data: groupsData } = await supabaseClient
          .from('annotation_groups')
          .select('*')
          .eq('document_id', documentId)
          .is('deleted_at', null);
        groups = groupsData;
      }

      return new Response(
        JSON.stringify({
          annotations,
          total: count,
          groups,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: Create annotation(s)
    if (req.method === 'POST') {
      const body = await req.json();

      // Handle batch creation
      if (Array.isArray(body)) {
        const annotationsToCreate = body.map((input: CreateAnnotationInput) => ({
          ...buildAnnotationRecord(input, user.id),
          is_synced: true,
        }));

        const { data: annotations, error } = await supabaseClient
          .from('document_annotations')
          .insert(annotationsToCreate)
          .select();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ annotations, created: annotations.length }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Single annotation creation
      const input: CreateAnnotationInput = body;

      if (!input.organization_id || !input.document_id || !input.annotation_type) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields: organization_id, document_id, annotation_type',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const annotationRecord = buildAnnotationRecord(input, user.id);

      const { data: annotation, error } = await supabaseClient
        .from('document_annotations')
        .insert({
          ...annotationRecord,
          is_synced: true,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(annotation), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT: Update annotation
    if (req.method === 'PUT') {
      if (!annotationId || annotationId === 'document-annotations') {
        return new Response(JSON.stringify({ error: 'Annotation ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const allowedFields = [
        'color',
        'stroke_width',
        'opacity',
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'layer_index',
        'group_id',
        'text_content',
        'tags',
        'metadata',
        'path_data',
        'stroke_points',
      ];

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

      const { data: annotation, error } = await supabaseClient
        .from('document_annotations')
        .update(updateData)
        .eq('id', annotationId)
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(annotation), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Soft delete annotation
    if (req.method === 'DELETE') {
      if (!annotationId || annotationId === 'document-annotations') {
        return new Response(JSON.stringify({ error: 'Annotation ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabaseClient
        .from('document_annotations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', annotationId)
        .eq('created_by', user.id)
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
    console.error('Error in document-annotations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to build annotation record from input
function buildAnnotationRecord(
  input: CreateAnnotationInput,
  userId: string
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    organization_id: input.organization_id,
    document_id: input.document_id,
    page_number: input.page_number,
    annotation_type: input.annotation_type,
    tool: input.tool,
    color: input.color || '#000000',
    stroke_width: input.stroke_width || 2.0,
    opacity: input.opacity || 1.0,
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    rotation: input.rotation || 0,
    layer_index: input.layer_index || 0,
    group_id: input.group_id,
    created_by: userId,
    created_on_device: input.created_on_device,
    local_id: input.local_id,
    tags: input.tags || [],
    metadata: input.metadata || {},
  };

  // Type-specific fields
  if (input.annotation_type === 'handwritten') {
    record.path_data = input.path_data;
    record.stroke_points = input.stroke_points;
  } else if (input.annotation_type === 'text_note') {
    record.text_content = input.text_content;
    record.font_size = input.font_size || 14;
    record.font_family = input.font_family || 'sans-serif';
  } else if (input.annotation_type === 'highlight') {
    record.highlighted_text = input.highlighted_text;
    record.text_range = input.text_range;
  } else if (input.annotation_type === 'stamp') {
    record.stamp_type = input.stamp_type;
    record.stamp_image_url = input.stamp_image_url;
  } else if (input.annotation_type === 'signature') {
    record.signature_data = input.signature_data;
    record.signer_name = input.signer_name;
    record.signed_at = new Date().toISOString();
  }

  return record;
}
