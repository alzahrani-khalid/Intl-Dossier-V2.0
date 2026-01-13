import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Theme extension data interface
interface ThemeExtension {
  parent_theme_id?: string | null;
  category_code: string;
  hierarchy_level?: number;
  icon?: string | null;
  color?: string | null;
  attributes?: Record<string, unknown>;
  sort_order?: number;
  is_standard?: boolean;
  external_url?: string | null;
}

// Full theme create/update request
interface ThemeRequest {
  // Base dossier fields
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status?: 'active' | 'inactive' | 'archived';
  sensitivity_level?: number;
  tags?: string[];
  // Theme extension fields
  extension?: ThemeExtension;
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
      pathParts[pathParts.length - 1] !== 'themes' ? pathParts[pathParts.length - 1] : null;

    // Check for special endpoints
    const isTreeEndpoint = pathParts.includes('tree');
    const isAncestorsEndpoint = pathParts.includes('ancestors');
    const isDescendantsEndpoint = pathParts.includes('descendants');
    const isChildrenEndpoint = pathParts.includes('children');

    switch (req.method) {
      case 'GET': {
        // Handle tree endpoint
        if (isTreeEndpoint) {
          const { data, error } = await supabaseClient.rpc('get_theme_tree');
          if (error) throw error;
          return new Response(JSON.stringify({ data: data || [], total: (data || []).length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Handle ancestors endpoint
        if (isAncestorsEndpoint && id) {
          const themeId = pathParts[pathParts.indexOf('ancestors') - 1];
          const { data, error } = await supabaseClient.rpc('get_theme_ancestors', {
            theme_id: themeId,
          });
          if (error) throw error;
          return new Response(JSON.stringify({ data: data || [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Handle descendants endpoint
        if (isDescendantsEndpoint && id) {
          const themeId = pathParts[pathParts.indexOf('descendants') - 1];
          const { data, error } = await supabaseClient.rpc('get_theme_descendants', {
            theme_id: themeId,
          });
          if (error) throw error;
          return new Response(JSON.stringify({ data: data || [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Handle children endpoint
        if (isChildrenEndpoint) {
          const parentId = url.searchParams.get('parent_id');
          let query = supabaseClient
            .from('themes')
            .select('*')
            .order('sort_order')
            .order('category_code');

          if (parentId === null || parentId === 'null') {
            query = query.is('parent_theme_id', null);
          } else if (parentId) {
            query = query.eq('parent_theme_id', parentId);
          }

          const { data: themeExts, error } = await query;
          if (error) throw error;

          if (!themeExts || themeExts.length === 0) {
            return new Response(JSON.stringify({ data: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Get dossiers
          const themeIds = themeExts.map((t) => t.id);
          const { data: dossiers } = await supabaseClient
            .from('dossiers')
            .select('*')
            .in('id', themeIds)
            .eq('type', 'theme')
            .neq('status', 'archived');

          const extMap = themeExts.reduce(
            (acc, ext) => {
              acc[ext.id] = ext;
              return acc;
            },
            {} as Record<string, ThemeExtension>
          );

          const themes = (dossiers || []).map((d) => ({
            ...d,
            extension: extMap[d.id] || {},
          }));

          return new Response(JSON.stringify({ data: themes }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (id) {
          // Get single theme with extension data using view
          const { data: themeDetails, error } = await supabaseClient
            .from('theme_details')
            .select('*')
            .eq('id', id)
            .single();

          if (error || !themeDetails) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 'NOT_FOUND',
                  message_en: 'Theme not found',
                  message_ar: 'الموضوع غير موجود',
                },
              }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get base dossier
          const { data: dossier } = await supabaseClient
            .from('dossiers')
            .select('*')
            .eq('id', id)
            .single();

          const theme = {
            ...dossier,
            extension: {
              id: themeDetails.id,
              parent_theme_id: themeDetails.parent_theme_id,
              category_code: themeDetails.category_code,
              hierarchy_level: themeDetails.hierarchy_level,
              icon: themeDetails.icon,
              color: themeDetails.color,
              attributes: themeDetails.attributes,
              sort_order: themeDetails.sort_order,
              is_standard: themeDetails.is_standard,
              external_url: themeDetails.external_url,
            },
            parent_name_en: themeDetails.parent_name_en,
            parent_name_ar: themeDetails.parent_name_ar,
            parent_category_code: themeDetails.parent_category_code,
            children_count: themeDetails.children_count,
          };

          return new Response(JSON.stringify(theme), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // List themes with pagination and filtering
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const status = searchParams.get('status');
          const parentThemeId = searchParams.get('parent_theme_id');
          const isStandard = searchParams.get('is_standard');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('dossiers')
            .select('*', { count: 'exact' })
            .eq('type', 'theme')
            .neq('status', 'archived');

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

          // Get extension data for all themes
          const themeIds = dossiers?.map((d) => d.id) || [];
          let extensions: Record<string, ThemeExtension> = {};

          if (themeIds.length > 0) {
            let extQuery = supabaseClient.from('themes').select('*').in('id', themeIds);

            if (parentThemeId !== null) {
              if (parentThemeId === 'null') {
                extQuery = extQuery.is('parent_theme_id', null);
              } else if (parentThemeId) {
                extQuery = extQuery.eq('parent_theme_id', parentThemeId);
              }
            }

            if (isStandard !== null) {
              extQuery = extQuery.eq('is_standard', isStandard === 'true');
            }

            const { data: themeExts } = await extQuery;

            if (themeExts) {
              extensions = themeExts.reduce(
                (acc, ext) => {
                  acc[ext.id] = ext;
                  return acc;
                },
                {} as Record<string, ThemeExtension>
              );
            }
          }

          // Combine dossier and extension data
          const themes =
            dossiers?.map((d) => ({
              ...d,
              extension: extensions[d.id] || {},
            })) || [];

          return new Response(
            JSON.stringify({
              data: themes,
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
        const body: ThemeRequest = await req.json();

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

        if (!body.extension?.category_code) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message_en: 'category_code is required in extension',
                message_ar: 'رمز الفئة مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create base dossier
        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .insert({
            type: 'theme',
            name_en: body.name_en,
            name_ar: body.name_ar,
            description_en: body.description_en || null,
            description_ar: body.description_ar || null,
            status: body.status || 'active',
            sensitivity_level: body.sensitivity_level || 1,
            tags: body.tags || [],
          })
          .select()
          .single();

        if (dossierError) {
          console.error('Error creating theme dossier:', dossierError);
          return new Response(
            JSON.stringify({
              error: {
                code: 'CREATE_ERROR',
                message_en: 'Failed to create theme',
                message_ar: 'فشل في إنشاء الموضوع',
                details: dossierError.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create theme extension
        const { error: extError } = await supabaseClient.from('themes').insert({
          id: dossier.id,
          parent_theme_id: body.extension.parent_theme_id || null,
          category_code: body.extension.category_code,
          icon: body.extension.icon || null,
          color: body.extension.color || null,
          attributes: body.extension.attributes || {},
          sort_order: body.extension.sort_order || 0,
          is_standard: body.extension.is_standard || false,
          external_url: body.extension.external_url || null,
        });

        if (extError) {
          console.error('Error creating theme extension:', extError);
          // Rollback dossier creation
          await supabaseClient.from('dossiers').delete().eq('id', dossier.id);
          return new Response(
            JSON.stringify({
              error: {
                code: 'CREATE_ERROR',
                message_en: 'Failed to create theme extension',
                message_ar: 'فشل في إنشاء ملحق الموضوع',
                details: extError.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const theme = {
          ...dossier,
          extension: body.extension || {},
        };

        return new Response(JSON.stringify(theme), {
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
                message_en: 'Theme ID required',
                message_ar: 'معرف الموضوع مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<ThemeRequest> = await req.json();

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

        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .update(dossierUpdate)
          .eq('id', id)
          .eq('type', 'theme')
          .select()
          .single();

        if (dossierError || !dossier) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message_en: 'Theme not found',
                message_ar: 'الموضوع غير موجود',
              },
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update theme extension if provided
        let themeExt = null;
        if (body.extension) {
          // Check if extension exists
          const { data: existingExt } = await supabaseClient
            .from('themes')
            .select('id')
            .eq('id', id)
            .single();

          const extUpdate: Record<string, unknown> = {};
          if (body.extension.parent_theme_id !== undefined)
            extUpdate.parent_theme_id = body.extension.parent_theme_id;
          if (body.extension.category_code !== undefined)
            extUpdate.category_code = body.extension.category_code;
          if (body.extension.icon !== undefined) extUpdate.icon = body.extension.icon;
          if (body.extension.color !== undefined) extUpdate.color = body.extension.color;
          if (body.extension.attributes !== undefined)
            extUpdate.attributes = body.extension.attributes;
          if (body.extension.sort_order !== undefined)
            extUpdate.sort_order = body.extension.sort_order;
          if (body.extension.is_standard !== undefined)
            extUpdate.is_standard = body.extension.is_standard;
          if (body.extension.external_url !== undefined)
            extUpdate.external_url = body.extension.external_url;

          if (existingExt) {
            // Update existing extension
            const { data: updatedExt, error: extError } = await supabaseClient
              .from('themes')
              .update(extUpdate)
              .eq('id', id)
              .select()
              .single();

            if (!extError) themeExt = updatedExt;
          } else {
            // Create new extension
            const { data: newExt, error: extError } = await supabaseClient
              .from('themes')
              .insert({
                id: id,
                ...extUpdate,
                category_code: body.extension.category_code || 'UNKNOWN',
              })
              .select()
              .single();

            if (!extError) themeExt = newExt;
          }
        } else {
          // Fetch existing extension
          const { data: existingExt } = await supabaseClient
            .from('themes')
            .select('*')
            .eq('id', id)
            .single();
          themeExt = existingExt;
        }

        const theme = {
          ...dossier,
          extension: themeExt || {},
        };

        return new Response(JSON.stringify(theme), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message_en: 'Theme ID required',
                message_ar: 'معرف الموضوع مطلوب',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for children
        const { data: children } = await supabaseClient
          .from('themes')
          .select('id')
          .eq('parent_theme_id', id)
          .limit(1);

        if (children && children.length > 0) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'HAS_CHILDREN',
                message_en: 'Cannot delete theme with child themes. Delete children first.',
                message_ar: 'لا يمكن حذف موضوع لديه مواضيع فرعية. احذف الفرعية أولاً.',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Soft delete by updating status to archived
        const { error: deleteError } = await supabaseClient
          .from('dossiers')
          .update({ status: 'archived' })
          .eq('id', id)
          .eq('type', 'theme');

        if (deleteError) {
          console.error('Error deleting theme:', deleteError);
          return new Response(
            JSON.stringify({
              error: {
                code: 'DELETE_ERROR',
                message_en: 'Failed to delete theme',
                message_ar: 'فشل في حذف الموضوع',
                details: deleteError.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message_en: 'Theme deleted successfully',
            message_ar: 'تم حذف الموضوع بنجاح',
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
    console.error('Error in themes function:', error);
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
