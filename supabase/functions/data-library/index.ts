import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface DataLibraryItemRequest {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  category: 'document' | 'dataset' | 'image' | 'video' | 'other';
  tags?: string[];
  metadata?: any;
  is_public?: boolean;
}

const ALLOWED_MIME_TYPES = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  dataset: [
    'application/json',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-sqlite3',
    'application/zip'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ],
  video: [
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ],
  other: []
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] !== 'data-library' ? pathParts[pathParts.length - 1] : null;
    const isUpload = pathParts.includes('upload');
    const isDownload = pathParts.includes('download');

    switch (req.method) {
      case 'GET': {
        if (id && isDownload) {
          const { data: item, error } = await supabaseClient
            .from('data_library_items')
            .select('*')
            .eq('id', id)
            .single();

          if (error || !item) {
            return new Response(
              JSON.stringify({ error: 'File not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          await supabaseClient
            .from('data_library_items')
            .update({ download_count: item.download_count + 1 })
            .eq('id', id);

          return new Response(
            JSON.stringify({
              download_url: item.file_url,
              filename: item.title_en,
              mime_type: item.mime_type
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (id) {
          const { data, error } = await supabaseClient
            .from('data_library_items')
            .select(`
              *,
              uploader:uploaded_by(full_name, email)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Data library item not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const category = searchParams.get('category');
          const isPublic = searchParams.get('is_public');
          const uploadedBy = searchParams.get('uploaded_by');
          const tags = searchParams.get('tags')?.split(',');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('data_library_items')
            .select(`
              *,
              uploader:uploaded_by(full_name)
            `, { count: 'exact' });

          if (search) {
            query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%,description_en.ilike.%${search}%,description_ar.ilike.%${search}%`);
          }
          if (category) {
            query = query.eq('category', category);
          }
          if (isPublic !== null) {
            query = query.eq('is_public', isPublic === 'true');
          }
          if (uploadedBy) {
            query = query.eq('uploaded_by', uploadedBy);
          }
          if (tags && tags.length > 0) {
            query = query.contains('tags', tags);
          }

          query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        if (isUpload) {
          const formData = await req.formData();
          const file = formData.get('file') as File;
          const metadata = formData.get('metadata') as string;

          if (!file) {
            return new Response(
              JSON.stringify({ error: 'No file provided' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (file.size > MAX_FILE_SIZE) {
            return new Response(
              JSON.stringify({ error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          let itemData: DataLibraryItemRequest;
          try {
            itemData = JSON.parse(metadata);
          } catch {
            return new Response(
              JSON.stringify({ error: 'Invalid metadata JSON' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const allowedTypes = ALLOWED_MIME_TYPES[itemData.category] || [];
          if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({ 
                error: `Invalid file type for category ${itemData.category}`,
                allowed_types: allowedTypes
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `data-library/${new Date().getFullYear()}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('documents')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            return new Response(
              JSON.stringify({ error: 'File upload failed', details: uploadError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: { publicUrl } } = supabaseClient.storage
            .from('documents')
            .getPublicUrl(filePath);

          const { data: user } = await supabaseClient.auth.getUser();

          const libraryItem = {
            ...itemData,
            file_url: publicUrl,
            file_type: fileExt,
            file_size_bytes: file.size,
            mime_type: file.type,
            uploaded_by: user?.user?.id,
            is_public: itemData.is_public || false
          };

          const { data, error } = await supabaseClient
            .from('data_library_items')
            .insert(libraryItem)
            .select()
            .single();

          if (error) {
            await supabaseClient.storage
              .from('documents')
              .remove([filePath]);
            throw error;
          }

          return new Response(
            JSON.stringify({
              message: 'File uploaded successfully',
              data
            }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: DataLibraryItemRequest = await req.json();

        if (!body.title_en || !body.title_ar || !body.category) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Use /data-library/upload endpoint for file uploads' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PATCH': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Item ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<DataLibraryItemRequest> = await req.json();

        const updateData: any = {};
        if (body.title_en !== undefined) updateData.title_en = body.title_en;
        if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
        if (body.description_en !== undefined) updateData.description_en = body.description_en;
        if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.metadata !== undefined) updateData.metadata = body.metadata;
        if (body.is_public !== undefined) updateData.is_public = body.is_public;

        const { data, error } = await supabaseClient
          .from('data_library_items')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Data library item not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Item ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: item } = await supabaseClient
          .from('data_library_items')
          .select('file_url')
          .eq('id', id)
          .single();

        if (item?.file_url) {
          const pathMatch = item.file_url.match(/data-library\/.*$/);
          if (pathMatch) {
            await supabaseClient.storage
              .from('documents')
              .remove([pathMatch[0]]);
          }
        }

        const { error } = await supabaseClient
          .from('data_library_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Data library item deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in data-library function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});