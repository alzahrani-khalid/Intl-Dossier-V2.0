import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Forum extension data interface
interface ForumExtension {
  number_of_sessions?: number;
  keynote_speakers?: Array<{
    name_en: string;
    name_ar: string;
    title_en?: string;
    title_ar?: string;
    bio_en?: string;
    bio_ar?: string;
  }>;
  sponsors?: Array<{
    name_en: string;
    name_ar: string;
    logo_url?: string;
    tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
  }>;
  registration_fee?: number;
  currency?: string;
  agenda_url?: string;
  live_stream_url?: string;
}

// Full forum create/update request
interface ForumRequest {
  // Base dossier fields
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status?: 'active' | 'inactive' | 'archived';
  sensitivity_level?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  // Forum extension fields
  extension?: ForumExtension;
}

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

    // Verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Authentication required',
            message_ar: 'المصادقة مطلوبة',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id =
      pathParts[pathParts.length - 1] !== 'forums' ? pathParts[pathParts.length - 1] : null;

    switch (req.method) {
      case 'GET': {
        if (id) {
          // Get single forum with extension data
          const { data: dossier, error: dossierError } = await supabaseClient
            .from('dossiers')
            .select('*')
            .eq('id', id)
            .eq('type', 'forum')
            .single();

          if (dossierError || !dossier) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 'NOT_FOUND',
                  message_en: 'Forum not found',
                  message_ar: 'المنتدى غير موجود',
                },
              }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get forum extension data
          const { data: forumExt } = await supabaseClient
            .from('forums')
            .select('*')
            .eq('id', id)
            .single();

          const forum = {
            ...dossier,
            extension: forumExt || {},
          };

          return new Response(JSON.stringify(forum), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // List forums with pagination and filtering
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const status = searchParams.get('status');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('dossiers')
            .select('*', { count: 'exact' })
            .eq('type', 'forum');

          if (search) {
            query = query.or(
              `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,description_en.ilike.%${search}%,description_ar.ilike.%${search}%`
            );
          }
          if (status) {
            query = query.eq('status', status);
          }

          query = query.order('name_en').range(offset, offset + limit - 1);

          const { data: dossiers, error, count } = await query;

          if (error) throw error;

          // Get extension data for all forums
          const forumIds = dossiers?.map((d) => d.id) || [];
          let extensions: Record<string, ForumExtension> = {};

          if (forumIds.length > 0) {
            const { data: forumExts } = await supabaseClient
              .from('forums')
              .select('*')
              .in('id', forumIds);

            if (forumExts) {
              extensions = forumExts.reduce(
                (acc, ext) => {
                  acc[ext.id] = ext;
                  return acc;
                },
                {} as Record<string, ForumExtension>
              );
            }
          }

          // Combine dossier and extension data
          const forums =
            dossiers?.map((d) => ({
              ...d,
              extension: extensions[d.id] || {},
            })) || [];

          return new Response(
            JSON.stringify({
              data: forums,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit),
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        const body: ForumRequest = await req.json();

        // Validate required fields
        if (!body.name_en || !body.name_ar) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message_en: 'name_en and name_ar are required',
                message_ar: 'الاسم بالعربية والإنجليزية مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create base dossier
        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .insert({
            type: 'forum',
            name_en: body.name_en,
            name_ar: body.name_ar,
            description_en: body.description_en || null,
            description_ar: body.description_ar || null,
            status: body.status || 'active',
            sensitivity_level: body.sensitivity_level || 1,
            tags: body.tags || [],
            metadata: body.metadata || {},
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (dossierError) {
          console.error('Error creating forum dossier:', dossierError);
          return new Response(
            JSON.stringify({
              error: {
                code: 'CREATE_ERROR',
                message_en: 'Failed to create forum',
                message_ar: 'فشل في إنشاء المنتدى',
                details: dossierError.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create forum extension if provided
        if (body.extension) {
          const { error: extError } = await supabaseClient.from('forums').insert({
            id: dossier.id,
            number_of_sessions: body.extension.number_of_sessions,
            keynote_speakers: body.extension.keynote_speakers || [],
            sponsors: body.extension.sponsors || [],
            registration_fee: body.extension.registration_fee,
            currency: body.extension.currency,
            agenda_url: body.extension.agenda_url,
            live_stream_url: body.extension.live_stream_url,
          });

          if (extError) {
            console.error('Error creating forum extension:', extError);
            // Non-critical - dossier was created
          }
        }

        const forum = {
          ...dossier,
          extension: body.extension || {},
        };

        return new Response(JSON.stringify(forum), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message_en: 'Forum ID required',
                message_ar: 'معرف المنتدى مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<ForumRequest> = await req.json();

        // Update base dossier fields
        const dossierUpdate: Record<string, unknown> = {};
        if (body.name_en !== undefined) dossierUpdate.name_en = body.name_en;
        if (body.name_ar !== undefined) dossierUpdate.name_ar = body.name_ar;
        if (body.description_en !== undefined) dossierUpdate.description_en = body.description_en;
        if (body.description_ar !== undefined) dossierUpdate.description_ar = body.description_ar;
        if (body.status !== undefined) dossierUpdate.status = body.status;
        if (body.sensitivity_level !== undefined)
          dossierUpdate.sensitivity_level = body.sensitivity_level;
        if (body.tags !== undefined) dossierUpdate.tags = body.tags;
        if (body.metadata !== undefined) dossierUpdate.metadata = body.metadata;
        dossierUpdate.updated_by = user.id;

        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .update(dossierUpdate)
          .eq('id', id)
          .eq('type', 'forum')
          .select()
          .single();

        if (dossierError || !dossier) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message_en: 'Forum not found',
                message_ar: 'المنتدى غير موجود',
              },
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update forum extension if provided
        let forumExt = null;
        if (body.extension) {
          // Check if extension exists
          const { data: existingExt } = await supabaseClient
            .from('forums')
            .select('id')
            .eq('id', id)
            .single();

          if (existingExt) {
            // Update existing extension
            const { data: updatedExt, error: extError } = await supabaseClient
              .from('forums')
              .update({
                number_of_sessions: body.extension.number_of_sessions,
                keynote_speakers: body.extension.keynote_speakers,
                sponsors: body.extension.sponsors,
                registration_fee: body.extension.registration_fee,
                currency: body.extension.currency,
                agenda_url: body.extension.agenda_url,
                live_stream_url: body.extension.live_stream_url,
              })
              .eq('id', id)
              .select()
              .single();

            if (!extError) forumExt = updatedExt;
          } else {
            // Create new extension
            const { data: newExt, error: extError } = await supabaseClient
              .from('forums')
              .insert({
                id: id,
                number_of_sessions: body.extension.number_of_sessions,
                keynote_speakers: body.extension.keynote_speakers || [],
                sponsors: body.extension.sponsors || [],
                registration_fee: body.extension.registration_fee,
                currency: body.extension.currency,
                agenda_url: body.extension.agenda_url,
                live_stream_url: body.extension.live_stream_url,
              })
              .select()
              .single();

            if (!extError) forumExt = newExt;
          }
        } else {
          // Fetch existing extension
          const { data: existingExt } = await supabaseClient
            .from('forums')
            .select('*')
            .eq('id', id)
            .single();
          forumExt = existingExt;
        }

        const forum = {
          ...dossier,
          extension: forumExt || {},
        };

        return new Response(JSON.stringify(forum), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message_en: 'Forum ID required',
                message_ar: 'معرف المنتدى مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete forum extension first (CASCADE should handle this, but be explicit)
        await supabaseClient.from('forums').delete().eq('id', id);

        // Delete base dossier
        const { error: deleteError } = await supabaseClient
          .from('dossiers')
          .delete()
          .eq('id', id)
          .eq('type', 'forum');

        if (deleteError) {
          console.error('Error deleting forum:', deleteError);
          return new Response(
            JSON.stringify({
              error: {
                code: 'DELETE_ERROR',
                message_en: 'Failed to delete forum',
                message_ar: 'فشل في حذف المنتدى',
                details: deleteError.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message_en: 'Forum deleted successfully',
            message_ar: 'تم حذف المنتدى بنجاح',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message_en: 'Method not allowed',
              message_ar: 'الطريقة غير مسموح بها',
            },
          }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in forums function:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: error.message || 'Internal server error',
          message_ar: 'خطأ داخلي في الخادم',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
