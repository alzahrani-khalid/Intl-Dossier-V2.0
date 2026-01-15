import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
type FieldPermissionEntityType =
  | 'country'
  | 'organization'
  | 'mou'
  | 'event'
  | 'forum'
  | 'brief'
  | 'intelligence_report'
  | 'data_library_item'
  | 'dossier'
  | 'person'
  | 'engagement'
  | 'commitment'
  | 'position'
  | 'task'
  | 'intake_ticket'
  | 'working_group'
  | 'theme';

type FieldPermissionScope = 'role' | 'user' | 'team';

interface FieldPermission {
  id: string;
  scope_type: FieldPermissionScope;
  scope_value: string;
  entity_type: FieldPermissionEntityType;
  entity_id: string | null;
  field_name: string;
  can_view: boolean;
  can_edit: boolean;
  conditions: Record<string, unknown>;
  priority: number;
  inherits_from_parent: boolean;
  parent_entity_type: FieldPermissionEntityType | null;
  parent_entity_id: string | null;
  inheritance_depth: number;
  description_en: string | null;
  description_ar: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FieldDefinition {
  id: string;
  entity_type: FieldPermissionEntityType;
  field_name: string;
  field_label_en: string;
  field_label_ar: string;
  field_description_en: string | null;
  field_description_ar: string | null;
  field_category: string;
  data_type: string;
  is_sensitive: boolean;
  sensitivity_level: string;
  display_order: number;
  is_system_field: boolean;
  is_readonly: boolean;
  default_visible: boolean;
  default_editable: boolean;
}

interface CreatePermissionRequest {
  scope_type: FieldPermissionScope;
  scope_value: string;
  entity_type: FieldPermissionEntityType;
  entity_id?: string;
  field_name: string;
  can_view?: boolean;
  can_edit?: boolean;
  conditions?: Record<string, unknown>;
  priority?: number;
  inherits_from_parent?: boolean;
  parent_entity_type?: FieldPermissionEntityType;
  parent_entity_id?: string;
  inheritance_depth?: number;
  description_en?: string;
  description_ar?: string;
  expires_at?: string;
}

interface UpdatePermissionRequest {
  can_view?: boolean;
  can_edit?: boolean;
  conditions?: Record<string, unknown>;
  priority?: number;
  description_en?: string;
  description_ar?: string;
  is_active?: boolean;
  expires_at?: string | null;
}

interface CheckPermissionsRequest {
  entity_type: FieldPermissionEntityType;
  entity_id?: string;
  field_names?: string[];
}

// Helpers
function createErrorResponse(
  code: string,
  messageEn: string,
  messageAr: string,
  status: number,
  details?: unknown
) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message_en: messageEn,
        message_ar: messageAr,
        details,
      },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function createSuccessResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse URL and extract path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Missing authorization header',
        'رأس التفويض مفقود',
        401
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Invalid user session',
        'جلسة مستخدم غير صالحة',
        401
      );
    }

    // Get user role
    const { data: userData, error: userRoleError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'User profile not found',
        'لم يتم العثور على ملف المستخدم',
        401
      );
    }

    const userRole = userData.role;

    // Route based on method and path
    switch (req.method) {
      case 'GET': {
        // GET /field-permissions - List all permissions (admin only)
        // GET /field-permissions/definitions - List field definitions
        // GET /field-permissions/check - Check user permissions for entity
        // GET /field-permissions/audit - Get audit logs
        // GET /field-permissions/:id - Get single permission

        if (action === 'definitions') {
          // List field definitions
          const entityType = url.searchParams.get('entity_type');

          let query = supabaseClient
            .from('field_definitions')
            .select('*')
            .order('display_order', { ascending: true });

          if (entityType) {
            query = query.eq('entity_type', entityType);
          }

          const { data, error } = await query;

          if (error) {
            return createErrorResponse(
              'QUERY_ERROR',
              'Failed to fetch field definitions',
              'فشل في جلب تعريفات الحقول',
              500,
              error
            );
          }

          return createSuccessResponse({ data });
        }

        if (action === 'check') {
          // Check permissions for current user
          const entityType = url.searchParams.get('entity_type') as FieldPermissionEntityType;
          const entityId = url.searchParams.get('entity_id');
          const fieldNamesParam = url.searchParams.get('field_names');

          if (!entityType) {
            return createErrorResponse(
              'VALIDATION_ERROR',
              'entity_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }

          if (fieldNamesParam) {
            // Check specific fields
            const fieldNames = fieldNamesParam.split(',');
            const { data, error } = await supabaseClient.rpc('check_field_permissions_bulk', {
              p_user_id: user.id,
              p_entity_type: entityType,
              p_entity_id: entityId || null,
              p_field_names: fieldNames,
            });

            if (error) {
              return createErrorResponse(
                'RPC_ERROR',
                'Failed to check field permissions',
                'فشل في التحقق من صلاحيات الحقول',
                500,
                error
              );
            }

            return createSuccessResponse({ data });
          } else {
            // Get all permissions for entity type
            const { data, error } = await supabaseClient.rpc('get_field_permissions_for_user', {
              p_user_id: user.id,
              p_entity_type: entityType,
              p_entity_id: entityId || null,
            });

            if (error) {
              return createErrorResponse(
                'RPC_ERROR',
                'Failed to get field permissions',
                'فشل في جلب صلاحيات الحقول',
                500,
                error
              );
            }

            return createSuccessResponse({ data });
          }
        }

        if (action === 'audit') {
          // Get audit logs (admin only)
          if (!['super_admin', 'admin'].includes(userRole)) {
            return createErrorResponse(
              'FORBIDDEN',
              'Only admins can view audit logs',
              'فقط المسؤولون يمكنهم عرض سجلات التدقيق',
              403
            );
          }

          const permissionId = url.searchParams.get('permission_id');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          let query = supabaseClient
            .from('field_permission_audit')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (permissionId) {
            query = query.eq('permission_id', permissionId);
          }

          const { data, error, count } = await query;

          if (error) {
            return createErrorResponse(
              'QUERY_ERROR',
              'Failed to fetch audit logs',
              'فشل في جلب سجلات التدقيق',
              500,
              error
            );
          }

          return createSuccessResponse({
            data,
            pagination: {
              limit,
              offset,
              total: count,
            },
          });
        }

        // List all permissions or get single
        if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
          return createErrorResponse(
            'FORBIDDEN',
            'You do not have permission to view field permissions',
            'ليس لديك صلاحية لعرض صلاحيات الحقول',
            403
          );
        }

        // Check if specific ID requested
        const permissionId = pathParts.length > 1 ? pathParts[1] : null;

        if (permissionId && permissionId !== 'field-permissions') {
          // Get single permission
          const { data, error } = await supabaseClient
            .from('field_permissions')
            .select('*')
            .eq('id', permissionId)
            .is('deleted_at', null)
            .single();

          if (error) {
            return createErrorResponse(
              'NOT_FOUND',
              'Permission not found',
              'الصلاحية غير موجودة',
              404,
              error
            );
          }

          return createSuccessResponse(data);
        }

        // List all permissions
        const entityTypeFilter = url.searchParams.get('entity_type');
        const scopeTypeFilter = url.searchParams.get('scope_type');
        const scopeValueFilter = url.searchParams.get('scope_value');
        const activeOnlyFilter = url.searchParams.get('active_only') !== 'false';

        let query = supabaseClient
          .from('field_permissions')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (entityTypeFilter) {
          query = query.eq('entity_type', entityTypeFilter);
        }
        if (scopeTypeFilter) {
          query = query.eq('scope_type', scopeTypeFilter);
        }
        if (scopeValueFilter) {
          query = query.eq('scope_value', scopeValueFilter);
        }
        if (activeOnlyFilter) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
          return createErrorResponse(
            'QUERY_ERROR',
            'Failed to fetch permissions',
            'فشل في جلب الصلاحيات',
            500,
            error
          );
        }

        return createSuccessResponse({ data });
      }

      case 'POST': {
        // Create new permission (admin only)
        if (!['super_admin', 'admin'].includes(userRole)) {
          return createErrorResponse(
            'FORBIDDEN',
            'Only admins can create field permissions',
            'فقط المسؤولون يمكنهم إنشاء صلاحيات الحقول',
            403
          );
        }

        const body: CreatePermissionRequest = await req.json();

        // Validation
        const validationErrors: string[] = [];

        if (!body.scope_type || !['role', 'user', 'team'].includes(body.scope_type)) {
          validationErrors.push('scope_type must be one of: role, user, team');
        }
        if (!body.scope_value) {
          validationErrors.push('scope_value is required');
        }
        if (!body.entity_type) {
          validationErrors.push('entity_type is required');
        }
        if (!body.field_name) {
          validationErrors.push('field_name is required');
        }

        if (validationErrors.length > 0) {
          return createErrorResponse(
            'VALIDATION_ERROR',
            'Validation failed',
            'فشل التحقق من الصحة',
            400,
            validationErrors
          );
        }

        const { data, error } = await supabaseClient
          .from('field_permissions')
          .insert({
            scope_type: body.scope_type,
            scope_value: body.scope_value,
            entity_type: body.entity_type,
            entity_id: body.entity_id || null,
            field_name: body.field_name,
            can_view: body.can_view ?? true,
            can_edit: body.can_edit ?? true,
            conditions: body.conditions || {},
            priority: body.priority || 0,
            inherits_from_parent: body.inherits_from_parent || false,
            parent_entity_type: body.parent_entity_type || null,
            parent_entity_id: body.parent_entity_id || null,
            inheritance_depth: body.inheritance_depth || 1,
            description_en: body.description_en || null,
            description_ar: body.description_ar || null,
            expires_at: body.expires_at || null,
            is_active: true,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) {
          return createErrorResponse(
            'INSERT_ERROR',
            'Failed to create permission',
            'فشل في إنشاء الصلاحية',
            500,
            error
          );
        }

        return createSuccessResponse(data, 201);
      }

      case 'PUT':
      case 'PATCH': {
        // Update permission (admin only)
        if (!['super_admin', 'admin'].includes(userRole)) {
          return createErrorResponse(
            'FORBIDDEN',
            'Only admins can update field permissions',
            'فقط المسؤولون يمكنهم تحديث صلاحيات الحقول',
            403
          );
        }

        const permissionId = url.searchParams.get('id') || pathParts[1];

        if (!permissionId) {
          return createErrorResponse(
            'VALIDATION_ERROR',
            'Permission ID is required',
            'معرف الصلاحية مطلوب',
            400
          );
        }

        const body: UpdatePermissionRequest = await req.json();

        const updateData: Record<string, unknown> = {
          updated_by: user.id,
        };

        if (body.can_view !== undefined) updateData.can_view = body.can_view;
        if (body.can_edit !== undefined) updateData.can_edit = body.can_edit;
        if (body.conditions !== undefined) updateData.conditions = body.conditions;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.description_en !== undefined) updateData.description_en = body.description_en;
        if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;

        const { data, error } = await supabaseClient
          .from('field_permissions')
          .update(updateData)
          .eq('id', permissionId)
          .is('deleted_at', null)
          .select()
          .single();

        if (error) {
          return createErrorResponse(
            'UPDATE_ERROR',
            'Failed to update permission',
            'فشل في تحديث الصلاحية',
            500,
            error
          );
        }

        return createSuccessResponse(data);
      }

      case 'DELETE': {
        // Soft delete permission (super_admin only)
        if (userRole !== 'super_admin') {
          return createErrorResponse(
            'FORBIDDEN',
            'Only super admins can delete field permissions',
            'فقط المسؤولون الفائقون يمكنهم حذف صلاحيات الحقول',
            403
          );
        }

        const permissionId = url.searchParams.get('id') || pathParts[1];

        if (!permissionId) {
          return createErrorResponse(
            'VALIDATION_ERROR',
            'Permission ID is required',
            'معرف الصلاحية مطلوب',
            400
          );
        }

        const { error } = await supabaseClient
          .from('field_permissions')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
          })
          .eq('id', permissionId)
          .is('deleted_at', null);

        if (error) {
          return createErrorResponse(
            'DELETE_ERROR',
            'Failed to delete permission',
            'فشل في حذف الصلاحية',
            500,
            error
          );
        }

        return createSuccessResponse({
          message_en: 'Permission deleted successfully',
          message_ar: 'تم حذف الصلاحية بنجاح',
        });
      }

      default:
        return createErrorResponse(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها',
          405
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500,
      { correlation_id: crypto.randomUUID() }
    );
  }
});
