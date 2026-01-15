-- 20260115500001_field_level_permissions.sql
-- Granular field-level permissions allowing administrators to control visibility and editability
-- Supports role-based access, inherited permissions from entity relationships, and field-level audit trails

-- =============================================
-- ENUMS
-- =============================================

-- Field permission action type
CREATE TYPE field_permission_action AS ENUM ('view', 'edit');

-- Field permission scope type (who the permission applies to)
CREATE TYPE field_permission_scope AS ENUM ('role', 'user', 'team');

-- Entity type for field permissions (extends existing entity_type)
-- Using TEXT with CHECK for flexibility since we may add more entity types
CREATE TYPE field_permission_entity_type AS ENUM (
    'country', 'organization', 'mou', 'event', 'forum', 'brief',
    'intelligence_report', 'data_library_item', 'dossier', 'person',
    'engagement', 'commitment', 'position', 'task', 'intake_ticket',
    'working_group', 'theme'
);

-- =============================================
-- FIELD DEFINITIONS TABLE
-- =============================================

-- Store field metadata for each entity type
CREATE TABLE IF NOT EXISTS public.field_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Entity and field identification
    entity_type field_permission_entity_type NOT NULL,
    field_name TEXT NOT NULL,

    -- Field metadata
    field_label_en TEXT NOT NULL,
    field_label_ar TEXT NOT NULL,
    field_description_en TEXT,
    field_description_ar TEXT,
    field_category TEXT DEFAULT 'base' CHECK (field_category IN ('base', 'extension', 'metadata', 'relationship', 'sensitive')),
    data_type TEXT DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'boolean', 'date', 'datetime', 'json', 'array', 'uuid', 'enum')),

    -- Field sensitivity
    is_sensitive BOOLEAN DEFAULT false,
    sensitivity_level TEXT DEFAULT 'low' CHECK (sensitivity_level IN ('low', 'medium', 'high', 'critical')),

    -- Display configuration
    display_order INTEGER DEFAULT 0,
    is_system_field BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,

    -- Default visibility (can be overridden by permissions)
    default_visible BOOLEAN DEFAULT true,
    default_editable BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),

    -- Unique constraint per entity type and field
    CONSTRAINT uq_field_definition_entity_field UNIQUE (entity_type, field_name)
);

-- =============================================
-- FIELD PERMISSIONS TABLE
-- =============================================

-- Store granular field-level permissions
CREATE TABLE IF NOT EXISTS public.field_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Target scope (who the permission applies to)
    scope_type field_permission_scope NOT NULL,
    scope_value TEXT NOT NULL, -- role name, user_id, or team_id

    -- Entity targeting
    entity_type field_permission_entity_type NOT NULL,
    entity_id UUID, -- NULL means all entities of this type

    -- Field targeting
    field_name TEXT NOT NULL, -- '*' for all fields

    -- Permission settings
    can_view BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT true,

    -- Conditions (JSONB for flexible conditional logic)
    -- Example: {"field_value": {"status": "draft"}, "user_attribute": {"department": "legal"}}
    conditions JSONB DEFAULT '{}'::JSONB,

    -- Priority for conflict resolution (higher = more specific)
    priority INTEGER DEFAULT 0,

    -- Inheritance settings
    inherits_from_parent BOOLEAN DEFAULT false,
    parent_entity_type field_permission_entity_type,
    parent_entity_id UUID,
    inheritance_depth INTEGER DEFAULT 1, -- How many levels to inherit

    -- Metadata
    description_en TEXT,
    description_ar TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- FIELD PERMISSION AUDIT TABLE
-- =============================================

-- Audit trail for field permission changes
CREATE TABLE IF NOT EXISTS public.field_permission_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Permission reference
    permission_id UUID REFERENCES public.field_permissions(id) ON DELETE SET NULL,

    -- Action details
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate', 'expire')),

    -- Changes
    old_values JSONB,
    new_values JSONB,

    -- Context
    reason TEXT,

    -- User context
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_by_email TEXT,
    performed_by_role TEXT,

    -- Session context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- INHERITED PERMISSIONS VIEW
-- =============================================

-- View to resolve inherited permissions from entity relationships
CREATE OR REPLACE VIEW public.resolved_field_permissions AS
WITH RECURSIVE permission_chain AS (
    -- Base case: direct permissions
    SELECT
        fp.id,
        fp.scope_type,
        fp.scope_value,
        fp.entity_type,
        fp.entity_id,
        fp.field_name,
        fp.can_view,
        fp.can_edit,
        fp.conditions,
        fp.priority,
        fp.is_active,
        fp.expires_at,
        0 as inheritance_level,
        ARRAY[fp.id] as permission_path
    FROM public.field_permissions fp
    WHERE fp.deleted_at IS NULL
      AND fp.is_active = true
      AND (fp.expires_at IS NULL OR fp.expires_at > NOW())

    UNION ALL

    -- Recursive case: inherited permissions
    SELECT
        fp.id,
        fp.scope_type,
        fp.scope_value,
        fp.entity_type,
        fp.entity_id,
        fp.field_name,
        fp.can_view,
        fp.can_edit,
        fp.conditions,
        fp.priority - (pc.inheritance_level + 1), -- Reduce priority for inherited
        fp.is_active,
        fp.expires_at,
        pc.inheritance_level + 1,
        pc.permission_path || fp.id
    FROM public.field_permissions fp
    INNER JOIN permission_chain pc ON fp.parent_entity_type = pc.entity_type
                                   AND fp.parent_entity_id = pc.entity_id
    WHERE fp.deleted_at IS NULL
      AND fp.is_active = true
      AND fp.inherits_from_parent = true
      AND pc.inheritance_level < fp.inheritance_depth
      AND NOT (fp.id = ANY(pc.permission_path)) -- Prevent cycles
)
SELECT DISTINCT ON (scope_type, scope_value, entity_type, entity_id, field_name)
    id,
    scope_type,
    scope_value,
    entity_type,
    entity_id,
    field_name,
    can_view,
    can_edit,
    conditions,
    priority,
    inheritance_level
FROM permission_chain
ORDER BY scope_type, scope_value, entity_type, entity_id, field_name,
         priority DESC, inheritance_level ASC;

-- =============================================
-- INDEXES
-- =============================================

-- Field definitions indexes
CREATE INDEX idx_field_definitions_entity_type ON public.field_definitions(entity_type);
CREATE INDEX idx_field_definitions_sensitive ON public.field_definitions(is_sensitive) WHERE is_sensitive = true;
CREATE INDEX idx_field_definitions_category ON public.field_definitions(entity_type, field_category);

-- Field permissions indexes
CREATE INDEX idx_field_permissions_scope ON public.field_permissions(scope_type, scope_value) WHERE deleted_at IS NULL;
CREATE INDEX idx_field_permissions_entity ON public.field_permissions(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_field_permissions_field ON public.field_permissions(entity_type, field_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_field_permissions_active ON public.field_permissions(is_active, expires_at) WHERE deleted_at IS NULL;

-- Composite indexes for permission lookups
CREATE INDEX idx_field_permissions_lookup ON public.field_permissions(
    scope_type, scope_value, entity_type, entity_id, field_name
) WHERE deleted_at IS NULL AND is_active = true;

-- Partial index for role-based permissions
CREATE INDEX idx_field_permissions_roles ON public.field_permissions(scope_value, entity_type, field_name)
WHERE scope_type = 'role' AND deleted_at IS NULL AND is_active = true;

-- Audit indexes
CREATE INDEX idx_field_permission_audit_permission ON public.field_permission_audit(permission_id);
CREATE INDEX idx_field_permission_audit_performed_by ON public.field_permission_audit(performed_by);
CREATE INDEX idx_field_permission_audit_created_at ON public.field_permission_audit(created_at DESC);
CREATE INDEX idx_field_permission_audit_action ON public.field_permission_audit(action);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if a user has view permission for a field
CREATE OR REPLACE FUNCTION public.can_view_field(
    p_user_id UUID,
    p_entity_type field_permission_entity_type,
    p_entity_id UUID,
    p_field_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_permission_exists BOOLEAN;
    v_can_view BOOLEAN;
    v_default_visible BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = p_user_id;

    -- Super admin and admin always have view access
    IF v_user_role IN ('super_admin', 'admin') THEN
        RETURN true;
    END IF;

    -- Get default visibility from field definition
    SELECT COALESCE(default_visible, true) INTO v_default_visible
    FROM public.field_definitions
    WHERE entity_type = p_entity_type AND field_name = p_field_name;

    -- Check for explicit permission (user-specific first, then role-based)
    SELECT
        EXISTS (
            SELECT 1 FROM public.resolved_field_permissions rfp
            WHERE (
                (rfp.scope_type = 'user' AND rfp.scope_value = p_user_id::TEXT) OR
                (rfp.scope_type = 'role' AND rfp.scope_value = v_user_role)
            )
            AND rfp.entity_type = p_entity_type
            AND (rfp.entity_id IS NULL OR rfp.entity_id = p_entity_id)
            AND (rfp.field_name = '*' OR rfp.field_name = p_field_name)
        ),
        (
            SELECT rfp.can_view
            FROM public.resolved_field_permissions rfp
            WHERE (
                (rfp.scope_type = 'user' AND rfp.scope_value = p_user_id::TEXT) OR
                (rfp.scope_type = 'role' AND rfp.scope_value = v_user_role)
            )
            AND rfp.entity_type = p_entity_type
            AND (rfp.entity_id IS NULL OR rfp.entity_id = p_entity_id)
            AND (rfp.field_name = '*' OR rfp.field_name = p_field_name)
            ORDER BY
                CASE WHEN rfp.scope_type = 'user' THEN 0 ELSE 1 END, -- User-specific first
                CASE WHEN rfp.entity_id IS NOT NULL THEN 0 ELSE 1 END, -- Entity-specific first
                CASE WHEN rfp.field_name != '*' THEN 0 ELSE 1 END, -- Field-specific first
                rfp.priority DESC
            LIMIT 1
        )
    INTO v_permission_exists, v_can_view;

    -- Return explicit permission if exists, otherwise default
    IF v_permission_exists THEN
        RETURN COALESCE(v_can_view, v_default_visible);
    END IF;

    RETURN COALESCE(v_default_visible, true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if a user has edit permission for a field
CREATE OR REPLACE FUNCTION public.can_edit_field(
    p_user_id UUID,
    p_entity_type field_permission_entity_type,
    p_entity_id UUID,
    p_field_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_permission_exists BOOLEAN;
    v_can_edit BOOLEAN;
    v_default_editable BOOLEAN;
    v_is_readonly BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = p_user_id;

    -- Super admin always has edit access
    IF v_user_role = 'super_admin' THEN
        RETURN true;
    END IF;

    -- Check if field is readonly (system field)
    SELECT is_readonly INTO v_is_readonly
    FROM public.field_definitions
    WHERE entity_type = p_entity_type AND field_name = p_field_name;

    IF v_is_readonly = true THEN
        RETURN false;
    END IF;

    -- Get default editability from field definition
    SELECT COALESCE(default_editable, true) INTO v_default_editable
    FROM public.field_definitions
    WHERE entity_type = p_entity_type AND field_name = p_field_name;

    -- Check for explicit permission (user-specific first, then role-based)
    SELECT
        EXISTS (
            SELECT 1 FROM public.resolved_field_permissions rfp
            WHERE (
                (rfp.scope_type = 'user' AND rfp.scope_value = p_user_id::TEXT) OR
                (rfp.scope_type = 'role' AND rfp.scope_value = v_user_role)
            )
            AND rfp.entity_type = p_entity_type
            AND (rfp.entity_id IS NULL OR rfp.entity_id = p_entity_id)
            AND (rfp.field_name = '*' OR rfp.field_name = p_field_name)
        ),
        (
            SELECT rfp.can_edit
            FROM public.resolved_field_permissions rfp
            WHERE (
                (rfp.scope_type = 'user' AND rfp.scope_value = p_user_id::TEXT) OR
                (rfp.scope_type = 'role' AND rfp.scope_value = v_user_role)
            )
            AND rfp.entity_type = p_entity_type
            AND (rfp.entity_id IS NULL OR rfp.entity_id = p_entity_id)
            AND (rfp.field_name = '*' OR rfp.field_name = p_field_name)
            ORDER BY
                CASE WHEN rfp.scope_type = 'user' THEN 0 ELSE 1 END,
                CASE WHEN rfp.entity_id IS NOT NULL THEN 0 ELSE 1 END,
                CASE WHEN rfp.field_name != '*' THEN 0 ELSE 1 END,
                rfp.priority DESC
            LIMIT 1
        )
    INTO v_permission_exists, v_can_edit;

    IF v_permission_exists THEN
        RETURN COALESCE(v_can_edit, v_default_editable);
    END IF;

    RETURN COALESCE(v_default_editable, true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get all field permissions for a user on an entity
CREATE OR REPLACE FUNCTION public.get_field_permissions_for_user(
    p_user_id UUID,
    p_entity_type field_permission_entity_type,
    p_entity_id UUID DEFAULT NULL
)
RETURNS TABLE(
    field_name TEXT,
    field_label_en TEXT,
    field_label_ar TEXT,
    field_category TEXT,
    can_view BOOLEAN,
    can_edit BOOLEAN,
    is_sensitive BOOLEAN,
    sensitivity_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fd.field_name,
        fd.field_label_en,
        fd.field_label_ar,
        fd.field_category,
        public.can_view_field(p_user_id, p_entity_type, p_entity_id, fd.field_name) as can_view,
        public.can_edit_field(p_user_id, p_entity_type, p_entity_id, fd.field_name) as can_edit,
        fd.is_sensitive,
        fd.sensitivity_level
    FROM public.field_definitions fd
    WHERE fd.entity_type = p_entity_type
    ORDER BY fd.display_order, fd.field_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to bulk check permissions for multiple fields
CREATE OR REPLACE FUNCTION public.check_field_permissions_bulk(
    p_user_id UUID,
    p_entity_type field_permission_entity_type,
    p_entity_id UUID,
    p_field_names TEXT[]
)
RETURNS TABLE(
    field_name TEXT,
    can_view BOOLEAN,
    can_edit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fn.field_name,
        public.can_view_field(p_user_id, p_entity_type, p_entity_id, fn.field_name) as can_view,
        public.can_edit_field(p_user_id, p_entity_type, p_entity_id, fn.field_name) as can_edit
    FROM UNNEST(p_field_names) AS fn(field_name);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to log permission changes
CREATE OR REPLACE FUNCTION public.log_field_permission_change()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_user_email TEXT;
    v_user_role TEXT;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active != NEW.is_active THEN
            v_action := CASE WHEN NEW.is_active THEN 'activate' ELSE 'deactivate' END;
        ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            v_action := 'delete';
        ELSE
            v_action := 'update';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
    END IF;

    -- Get user details
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    SELECT role INTO v_user_role FROM public.users WHERE id = auth.uid();

    -- Insert audit record
    INSERT INTO public.field_permission_audit (
        permission_id,
        action,
        old_values,
        new_values,
        performed_by,
        performed_by_email,
        performed_by_role
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        v_action,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        auth.uid(),
        v_user_email,
        v_user_role
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
CREATE TRIGGER field_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.field_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_field_permission_change();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_permission_audit ENABLE ROW LEVEL SECURITY;

-- Field definitions: Everyone can view, only admins can modify
CREATE POLICY field_definitions_select_policy ON public.field_definitions
    FOR SELECT
    USING (true);

CREATE POLICY field_definitions_insert_policy ON public.field_definitions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY field_definitions_update_policy ON public.field_definitions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY field_definitions_delete_policy ON public.field_definitions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Field permissions: Only admins can manage
CREATE POLICY field_permissions_select_policy ON public.field_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

CREATE POLICY field_permissions_insert_policy ON public.field_permissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY field_permissions_update_policy ON public.field_permissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY field_permissions_delete_policy ON public.field_permissions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Field permission audit: Only admins can view
CREATE POLICY field_permission_audit_select_policy ON public.field_permission_audit
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- =============================================
-- GRANTS
-- =============================================

GRANT SELECT ON public.field_definitions TO authenticated;
GRANT SELECT ON public.field_permissions TO authenticated;
GRANT SELECT ON public.field_permission_audit TO authenticated;
GRANT SELECT ON public.resolved_field_permissions TO authenticated;

GRANT EXECUTE ON FUNCTION public.can_view_field TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_field TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_field_permissions_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_field_permissions_bulk TO authenticated;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER field_definitions_updated_at
    BEFORE UPDATE ON public.field_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER field_permissions_updated_at
    BEFORE UPDATE ON public.field_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DEFAULT FIELD DEFINITIONS
-- =============================================

-- Dossier fields
INSERT INTO public.field_definitions (entity_type, field_name, field_label_en, field_label_ar, field_category, data_type, is_sensitive, sensitivity_level, is_system_field, is_readonly, display_order)
VALUES
    ('dossier', 'name_en', 'Name (English)', 'الاسم (انجليزي)', 'base', 'text', false, 'low', false, false, 1),
    ('dossier', 'name_ar', 'Name (Arabic)', 'الاسم (عربي)', 'base', 'text', false, 'low', false, false, 2),
    ('dossier', 'type', 'Type', 'النوع', 'base', 'enum', false, 'low', false, false, 3),
    ('dossier', 'status', 'Status', 'الحالة', 'base', 'enum', false, 'low', false, false, 4),
    ('dossier', 'sensitivity_level', 'Sensitivity Level', 'مستوى الحساسية', 'sensitive', 'enum', true, 'high', false, false, 5),
    ('dossier', 'summary_en', 'Summary (English)', 'الملخص (انجليزي)', 'extension', 'text', false, 'low', false, false, 6),
    ('dossier', 'summary_ar', 'Summary (Arabic)', 'الملخص (عربي)', 'extension', 'text', false, 'low', false, false, 7),
    ('dossier', 'tags', 'Tags', 'الوسوم', 'extension', 'array', false, 'low', false, false, 8),
    ('dossier', 'review_cadence', 'Review Cadence', 'دورة المراجعة', 'metadata', 'text', false, 'low', false, false, 9),
    ('dossier', 'last_review_date', 'Last Review Date', 'تاريخ آخر مراجعة', 'metadata', 'datetime', false, 'low', false, false, 10),
    ('dossier', 'created_at', 'Created At', 'تاريخ الإنشاء', 'metadata', 'datetime', false, 'low', true, true, 100),
    ('dossier', 'updated_at', 'Updated At', 'تاريخ التحديث', 'metadata', 'datetime', false, 'low', true, true, 101)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- Organization fields
INSERT INTO public.field_definitions (entity_type, field_name, field_label_en, field_label_ar, field_category, data_type, is_sensitive, sensitivity_level, is_system_field, is_readonly, display_order)
VALUES
    ('organization', 'code', 'Code', 'الرمز', 'base', 'text', false, 'low', false, false, 1),
    ('organization', 'name_en', 'Name (English)', 'الاسم (انجليزي)', 'base', 'text', false, 'low', false, false, 2),
    ('organization', 'name_ar', 'Name (Arabic)', 'الاسم (عربي)', 'base', 'text', false, 'low', false, false, 3),
    ('organization', 'type', 'Type', 'النوع', 'base', 'enum', false, 'low', false, false, 4),
    ('organization', 'country_id', 'Country', 'الدولة', 'relationship', 'uuid', false, 'low', false, false, 5),
    ('organization', 'parent_organization_id', 'Parent Organization', 'المنظمة الأم', 'relationship', 'uuid', false, 'low', false, false, 6),
    ('organization', 'website', 'Website', 'الموقع الإلكتروني', 'extension', 'text', false, 'low', false, false, 7),
    ('organization', 'email', 'Email', 'البريد الإلكتروني', 'extension', 'text', true, 'medium', false, false, 8),
    ('organization', 'phone', 'Phone', 'الهاتف', 'extension', 'text', true, 'medium', false, false, 9),
    ('organization', 'address_en', 'Address (English)', 'العنوان (انجليزي)', 'extension', 'text', false, 'low', false, false, 10),
    ('organization', 'address_ar', 'Address (Arabic)', 'العنوان (عربي)', 'extension', 'text', false, 'low', false, false, 11),
    ('organization', 'status', 'Status', 'الحالة', 'base', 'enum', false, 'low', false, false, 12)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- Person fields
INSERT INTO public.field_definitions (entity_type, field_name, field_label_en, field_label_ar, field_category, data_type, is_sensitive, sensitivity_level, is_system_field, is_readonly, display_order)
VALUES
    ('person', 'first_name_en', 'First Name (English)', 'الاسم الأول (انجليزي)', 'base', 'text', false, 'low', false, false, 1),
    ('person', 'first_name_ar', 'First Name (Arabic)', 'الاسم الأول (عربي)', 'base', 'text', false, 'low', false, false, 2),
    ('person', 'last_name_en', 'Last Name (English)', 'اسم العائلة (انجليزي)', 'base', 'text', false, 'low', false, false, 3),
    ('person', 'last_name_ar', 'Last Name (Arabic)', 'اسم العائلة (عربي)', 'base', 'text', false, 'low', false, false, 4),
    ('person', 'email', 'Email', 'البريد الإلكتروني', 'extension', 'text', true, 'medium', false, false, 5),
    ('person', 'phone', 'Phone', 'الهاتف', 'extension', 'text', true, 'medium', false, false, 6),
    ('person', 'title_en', 'Title (English)', 'المسمى الوظيفي (انجليزي)', 'extension', 'text', false, 'low', false, false, 7),
    ('person', 'title_ar', 'Title (Arabic)', 'المسمى الوظيفي (عربي)', 'extension', 'text', false, 'low', false, false, 8),
    ('person', 'organization_id', 'Organization', 'المنظمة', 'relationship', 'uuid', false, 'low', false, false, 9),
    ('person', 'notes', 'Notes', 'ملاحظات', 'extension', 'text', true, 'high', false, false, 10)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- Commitment fields
INSERT INTO public.field_definitions (entity_type, field_name, field_label_en, field_label_ar, field_category, data_type, is_sensitive, sensitivity_level, is_system_field, is_readonly, display_order)
VALUES
    ('commitment', 'title_en', 'Title (English)', 'العنوان (انجليزي)', 'base', 'text', false, 'low', false, false, 1),
    ('commitment', 'title_ar', 'Title (Arabic)', 'العنوان (عربي)', 'base', 'text', false, 'low', false, false, 2),
    ('commitment', 'description_en', 'Description (English)', 'الوصف (انجليزي)', 'extension', 'text', false, 'low', false, false, 3),
    ('commitment', 'description_ar', 'Description (Arabic)', 'الوصف (عربي)', 'extension', 'text', false, 'low', false, false, 4),
    ('commitment', 'status', 'Status', 'الحالة', 'base', 'enum', false, 'low', false, false, 5),
    ('commitment', 'priority', 'Priority', 'الأولوية', 'base', 'enum', false, 'low', false, false, 6),
    ('commitment', 'deadline', 'Deadline', 'الموعد النهائي', 'base', 'datetime', false, 'low', false, false, 7),
    ('commitment', 'assignee_id', 'Assignee', 'المسؤول', 'relationship', 'uuid', false, 'low', false, false, 8),
    ('commitment', 'engagement_id', 'Engagement', 'المشاركة', 'relationship', 'uuid', false, 'low', false, false, 9)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- MOU fields
INSERT INTO public.field_definitions (entity_type, field_name, field_label_en, field_label_ar, field_category, data_type, is_sensitive, sensitivity_level, is_system_field, is_readonly, display_order)
VALUES
    ('mou', 'title_en', 'Title (English)', 'العنوان (انجليزي)', 'base', 'text', false, 'low', false, false, 1),
    ('mou', 'title_ar', 'Title (Arabic)', 'العنوان (عربي)', 'base', 'text', false, 'low', false, false, 2),
    ('mou', 'status', 'Status', 'الحالة', 'base', 'enum', false, 'low', false, false, 3),
    ('mou', 'effective_date', 'Effective Date', 'تاريخ السريان', 'base', 'date', false, 'low', false, false, 4),
    ('mou', 'expiry_date', 'Expiry Date', 'تاريخ الانتهاء', 'base', 'date', false, 'low', false, false, 5),
    ('mou', 'signed_date', 'Signed Date', 'تاريخ التوقيع', 'base', 'date', false, 'low', false, false, 6),
    ('mou', 'content_en', 'Content (English)', 'المحتوى (انجليزي)', 'extension', 'text', true, 'high', false, false, 7),
    ('mou', 'content_ar', 'Content (Arabic)', 'المحتوى (عربي)', 'extension', 'text', true, 'high', false, false, 8),
    ('mou', 'organization_id', 'Organization', 'المنظمة', 'relationship', 'uuid', false, 'low', false, false, 9),
    ('mou', 'country_id', 'Country', 'الدولة', 'relationship', 'uuid', false, 'low', false, false, 10)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- =============================================
-- SEED DEFAULT ROLE PERMISSIONS
-- =============================================

-- Viewer role: Can only view non-sensitive fields
INSERT INTO public.field_permissions (scope_type, scope_value, entity_type, field_name, can_view, can_edit, priority, description_en, description_ar)
VALUES
    ('role', 'viewer', 'dossier', '*', true, false, 0, 'Viewers can view but not edit dossiers', 'المشاهدون يمكنهم عرض الملفات فقط'),
    ('role', 'viewer', 'organization', '*', true, false, 0, 'Viewers can view but not edit organizations', 'المشاهدون يمكنهم عرض المنظمات فقط'),
    ('role', 'viewer', 'person', '*', true, false, 0, 'Viewers can view but not edit persons', 'المشاهدون يمكنهم عرض الأشخاص فقط'),
    ('role', 'viewer', 'commitment', '*', true, false, 0, 'Viewers can view but not edit commitments', 'المشاهدون يمكنهم عرض الالتزامات فقط'),
    ('role', 'viewer', 'mou', '*', true, false, 0, 'Viewers can view but not edit MOUs', 'المشاهدون يمكنهم عرض مذكرات التفاهم فقط');

-- Hide sensitive fields from viewers
INSERT INTO public.field_permissions (scope_type, scope_value, entity_type, field_name, can_view, can_edit, priority, description_en, description_ar)
VALUES
    ('role', 'viewer', 'dossier', 'sensitivity_level', false, false, 10, 'Viewers cannot see sensitivity level', 'المشاهدون لا يمكنهم رؤية مستوى الحساسية'),
    ('role', 'viewer', 'person', 'email', false, false, 10, 'Viewers cannot see personal email', 'المشاهدون لا يمكنهم رؤية البريد الإلكتروني'),
    ('role', 'viewer', 'person', 'phone', false, false, 10, 'Viewers cannot see personal phone', 'المشاهدون لا يمكنهم رؤية رقم الهاتف'),
    ('role', 'viewer', 'person', 'notes', false, false, 10, 'Viewers cannot see personal notes', 'المشاهدون لا يمكنهم رؤية الملاحظات'),
    ('role', 'viewer', 'organization', 'email', false, false, 10, 'Viewers cannot see organization email', 'المشاهدون لا يمكنهم رؤية البريد الإلكتروني للمنظمة'),
    ('role', 'viewer', 'organization', 'phone', false, false, 10, 'Viewers cannot see organization phone', 'المشاهدون لا يمكنهم رؤية هاتف المنظمة'),
    ('role', 'viewer', 'mou', 'content_en', false, false, 10, 'Viewers cannot see MOU content', 'المشاهدون لا يمكنهم رؤية محتوى مذكرة التفاهم'),
    ('role', 'viewer', 'mou', 'content_ar', false, false, 10, 'Viewers cannot see MOU content', 'المشاهدون لا يمكنهم رؤية محتوى مذكرة التفاهم');

-- Analyst role: Can view all, edit non-sensitive
INSERT INTO public.field_permissions (scope_type, scope_value, entity_type, field_name, can_view, can_edit, priority, description_en, description_ar)
VALUES
    ('role', 'analyst', 'dossier', '*', true, true, 0, 'Analysts can view and edit dossiers', 'المحللون يمكنهم عرض وتعديل الملفات'),
    ('role', 'analyst', 'organization', '*', true, true, 0, 'Analysts can view and edit organizations', 'المحللون يمكنهم عرض وتعديل المنظمات'),
    ('role', 'analyst', 'person', '*', true, true, 0, 'Analysts can view and edit persons', 'المحللون يمكنهم عرض وتعديل الأشخاص'),
    ('role', 'analyst', 'commitment', '*', true, true, 0, 'Analysts can view and edit commitments', 'المحللون يمكنهم عرض وتعديل الالتزامات'),
    ('role', 'analyst', 'mou', '*', true, true, 0, 'Analysts can view and edit MOUs', 'المحللون يمكنهم عرض وتعديل مذكرات التفاهم');

-- Restrict analysts from editing sensitivity levels
INSERT INTO public.field_permissions (scope_type, scope_value, entity_type, field_name, can_view, can_edit, priority, description_en, description_ar)
VALUES
    ('role', 'analyst', 'dossier', 'sensitivity_level', true, false, 10, 'Analysts cannot edit sensitivity level', 'المحللون لا يمكنهم تعديل مستوى الحساسية');

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.field_definitions IS 'Stores metadata about entity fields for permission management';
COMMENT ON TABLE public.field_permissions IS 'Granular field-level permissions by role, user, or team';
COMMENT ON TABLE public.field_permission_audit IS 'Audit trail for field permission changes';
COMMENT ON VIEW public.resolved_field_permissions IS 'Resolved permissions including inherited permissions';

COMMENT ON FUNCTION public.can_view_field IS 'Check if a user can view a specific field';
COMMENT ON FUNCTION public.can_edit_field IS 'Check if a user can edit a specific field';
COMMENT ON FUNCTION public.get_field_permissions_for_user IS 'Get all field permissions for a user on an entity type';
COMMENT ON FUNCTION public.check_field_permissions_bulk IS 'Bulk check permissions for multiple fields';
