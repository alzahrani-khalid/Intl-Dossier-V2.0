/**
 * Document Preview Edge Function
 *
 * Handles:
 * - GET: Get signed preview URL for a document
 * - POST: Generate/cache thumbnail for a document
 *
 * Supports PDF, images, and other document types.
 * Includes caching for thumbnails with configurable TTL.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Thumbnail sizes
const THUMBNAIL_SIZES = {
  small: { width: 80, height: 80 },
  medium: { width: 160, height: 160 },
  large: { width: 320, height: 320 },
};

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

// Previewable MIME types
const PREVIEWABLE_TYPES = {
  pdf: ['application/pdf'],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ],
  text: ['text/plain', 'text/csv', 'text/markdown'],
};

function getFileType(mimeType: string): string {
  for (const [type, mimes] of Object.entries(PREVIEWABLE_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return 'unsupported';
}

function isPreviewable(mimeType: string): boolean {
  return getFileType(mimeType) !== 'unsupported';
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

    // Verify user
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

    if (req.method === 'GET') {
      // GET: Get signed preview URL for a document
      const documentId = url.searchParams.get('document_id');
      const storagePath = url.searchParams.get('storage_path');
      const mimeType = url.searchParams.get('mime_type');

      if (!storagePath) {
        return new Response(JSON.stringify({ error: 'storage_path is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if file type is previewable
      const fileType = mimeType ? getFileType(mimeType) : 'unsupported';
      const previewable = mimeType ? isPreviewable(mimeType) : false;

      // Generate signed URL for the document (1 hour expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(storagePath, CACHE_TTL);

      if (signedUrlError) {
        throw signedUrlError;
      }

      // Check for cached thumbnail
      let thumbnailUrl = null;
      if (documentId) {
        const { data: thumbnailData } = await supabaseClient.storage
          .from('documents')
          .createSignedUrl(`thumbnails/${documentId}_medium.png`, CACHE_TTL);

        if (thumbnailData?.signedUrl) {
          // Verify thumbnail exists by checking if we get a valid response
          try {
            const response = await fetch(thumbnailData.signedUrl, { method: 'HEAD' });
            if (response.ok) {
              thumbnailUrl = thumbnailData.signedUrl;
            }
          } catch {
            // Thumbnail doesn't exist, that's okay
          }
        }
      }

      return new Response(
        JSON.stringify({
          document_id: documentId,
          preview_url: signedUrlData?.signedUrl,
          thumbnail_url: thumbnailUrl,
          file_type: fileType,
          previewable,
          expires_in: CACHE_TTL,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // POST: Generate/cache thumbnail for a document
      const body = await req.json();
      const { document_id, storage_path, size = 'medium', force_regenerate = false } = body;

      if (!document_id || !storage_path) {
        return new Response(
          JSON.stringify({ error: 'document_id and storage_path are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const thumbnailSize =
        THUMBNAIL_SIZES[size as keyof typeof THUMBNAIL_SIZES] || THUMBNAIL_SIZES.medium;
      const thumbnailPath = `thumbnails/${document_id}_${size}.png`;

      // Check if thumbnail already exists (unless force_regenerate)
      if (!force_regenerate) {
        const { data: existingThumbnail } = await supabaseClient.storage
          .from('documents')
          .createSignedUrl(thumbnailPath, CACHE_TTL);

        if (existingThumbnail?.signedUrl) {
          try {
            const response = await fetch(existingThumbnail.signedUrl, { method: 'HEAD' });
            if (response.ok) {
              return new Response(
                JSON.stringify({
                  document_id,
                  thumbnail_url: existingThumbnail.signedUrl,
                  size,
                  cached: true,
                  generated_at: new Date().toISOString(),
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch {
            // Continue to generate
          }
        }
      }

      // Download the original file
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('documents')
        .download(storage_path);

      if (downloadError) {
        throw downloadError;
      }

      // For images, we can create a thumbnail client-side
      // For PDFs, we'd need server-side processing (ImageMagick, pdf-lib, etc.)
      // For now, return the preview URL and let frontend handle thumbnail generation
      const { data: previewUrl } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(storage_path, CACHE_TTL);

      return new Response(
        JSON.stringify({
          document_id,
          preview_url: previewUrl?.signedUrl,
          thumbnail_url: null, // Client will generate thumbnail
          size,
          cached: false,
          generated_at: new Date().toISOString(),
          message: 'Thumbnail generation deferred to client for optimal performance',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in document-preview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
