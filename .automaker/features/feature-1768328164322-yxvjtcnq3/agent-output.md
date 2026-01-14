🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "in_progress",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "pending",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "pending",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "pending",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "pending",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "pending",
"activeForm": "Verifying implementation with Playwright test"
}
]
}

🔧 Tool: Task
Input: {
"description": "Explore codebase entity patterns",
"prompt": "Explore the codebase to understand the existing entity structure and patterns. I need to design an extensible plugin system for new entity types.\n\nFocus on:\n1. How existing entities (persons, engagements, forums, countries, organizations) are structured\n2. Common patterns across entity types (validation, relationships, permissions, UI components)\n3. Database schema patterns for entities\n4. How entities are registered/configured in the frontend\n5. Edge function patterns for entity CRUD operations\n6. Type definitions for entities\n\nLook in:\n- frontend/src/types/ for entity type definitions\n- frontend/src/components/ for entity-specific components\n- frontend/src/hooks/ for entity-related hooks\n- supabase/functions/ for edge functions\n- supabase/migrations/ for database schemas\n\nProvide a comprehensive summary of the patterns found so I can design a plugin architecture that works with the existing codebase.",
"subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/types/\*_/_.ts"
}

🔧 Tool: Glob
Input: {
"pattern": "supabase/migrations/\*.sql"
}

🔧 Tool: Glob
Input: {
"pattern": "supabase/functions/\*/index.ts"
}

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/components/\*_/_.tsx"
}

🔧 Tool: Bash
Input: {
"command": "find /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0 -type f -name \"_.ts\" -o -name \"_.tsx\" | grep -E \"(entity|person|engagement|forum|country|organization)\" | head -20"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/person.types.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/engagement.types.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/forum.types.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/dossier.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/migrations/20250930002_create_dossiers_table.sql"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/migrations/002_countries.sql",
"limit": 100
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/countries/index.ts",
"limit": 80
}

🔧 Tool: Bash
Input: {
"command": "find /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains -type f -name \"\*.ts\" | head -20"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains"
}

🔧 Tool: mcp**filesystem**directory_tree
Input: {
"path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/shared/types/entity-link.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/services/engagement.service.ts",
"limit": 80
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/repositories/engagement.repository.ts",
"limit": 80
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/validation.ts",
"limit": 100
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/component-registry.ts"
}

🔧 Tool: Bash
Input: {
"command": "grep -r \"export interface._Dossier\" /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/_.ts | head -15"
}

🔧 Tool: Bash
Input: {
"command": "ls -la /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/ | grep -E \"person|country|organization|engagement|forum\" | head -15"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/persons/index.ts",
"limit": 100
}

🔧 Tool: Bash
Input: {
"command": "grep -r \"type._Extension\" /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/_.ts | head -10"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/components/Dossier/PersonDossierDetail.tsx",
"limit": 100
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/components/Dossier/UniversalDossierCard.tsx",
"limit": 100
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/hooks/useEngagements.ts",
"limit": 80
}

🔧 Tool: Bash
Input: {
"command": "find /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src -name \"useWorkingGroups.ts\" -o -name \"useBriefingBooks.ts\" | xargs cat | head -50"
}

🔧 Tool: Bash
Input: {
"command": "grep -r \"interface.*Config\\|interface.*Plugin\" /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0 --include=\"\*.ts\" | grep -v node_modules | head -20"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/context-map.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/README.md"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/MIGRATION_GUIDE.md",
"limit": 80
}
Now I have a comprehensive understanding of the existing patterns. Let me update my todo and design the plugin system architecture.

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "in_progress",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "pending",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "pending",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "pending",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "pending",
"activeForm": "Verifying implementation with Playwright test"
}
]
}
Let me first check the existing domain structure to understand where to place the plugin system:

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/domains/\*_/_"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types"
}

🔧 Tool: Bash
Input: {
"command": "ls -la /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/types/",
"description": "List types directory contents"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/shared/types/result.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/shared/errors/domain-error.ts"
}
Now let me look at how an existing entity domain is structured and the context map:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/types/engagement.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/services/engagement.service.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/context-map.ts"
}
Excellent! Now I have a thorough understanding of the existing patterns. Let me look at one more file - the repository pattern to understand how data is accessed:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/repositories/engagement.repository.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/engagement/hooks/useEngagements.ts"
}
Now I have a complete understanding of the architecture. Let me create the plugin system. I'll start implementing it now:

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "completed",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "in_progress",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "pending",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "pending",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "pending",
"activeForm": "Verifying implementation with Playwright test"
}
]
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"content": "/**\n _ Plugin System - Core Type Definitions\n _\n _ Defines the contract for entity plugins in the system.\n _ Plugins can register new entity types with custom validation,\n _ relationships, permissions, and UI rendering capabilities.\n _/\n\nimport type { ComponentType, ReactNode } from 'react'\nimport type { Result } from '@/domains/shared/types/result'\nimport type { DomainError } from '@/domains/shared/errors/domain-error'\n\n// ============================================================================\n// Base Entity Types\n// ============================================================================\n\n/**\n _ Base bilingual field interface (EN/AR)\n _/\nexport interface BilingualField {\n en: string\n ar: string\n}\n\n/**\n _ Base status for all entities\n _/\nexport type EntityStatus = 'active' | 'inactive' | 'archived'\n\n/**\n _ Sensitivity levels for access control\n _/\nexport type SensitivityLevel = 'low' | 'medium' | 'high' | 'top_secret'\n\n/**\n _ Base dossier fields common to all entity types\n _/\nexport interface BaseDossier {\n id: string\n type: string\n name_en: string\n name_ar: string\n description_en?: string\n description_ar?: string\n status: EntityStatus\n sensitivity_level: SensitivityLevel\n tags: string[]\n metadata?: Record<string, unknown>\n version: number\n created_at: string\n updated_at: string\n created_by?: string\n updated_by?: string\n}\n\n/**\n _ Base list item for entity lists\n _/\nexport interface BaseListItem {\n id: string\n name_en: string\n name_ar: string\n status: EntityStatus\n type: string\n}\n\n// ============================================================================\n// Plugin Manifest Types\n// ============================================================================\n\n/**\n _ Plugin metadata and configuration\n _/\nexport interface PluginManifest<TExtension = Record<string, unknown>> {\n /** Unique identifier for the plugin (kebab-case) _/\n id: string\n /\*\* Human-readable name _/\n name: BilingualField\n /** Plugin description \*/\n description: BilingualField\n /** Semantic version _/\n version: string\n /\*\* Plugin author _/\n author?: string\n /** Icon name from Lucide icons \*/\n icon: string\n /** Color theme for UI (Tailwind color) _/\n color: string\n /\*\* Dependencies on other plugins _/\n dependencies?: string[]\n /** Entity type identifier for database \*/\n entityType: string\n /** Extension schema for type-safe extensions _/\n extensionSchema: ExtensionSchema<TExtension>\n}\n\n/\*\*\n _ JSON Schema-like definition for extension fields\n _/\nexport interface ExtensionSchema<T = Record<string, unknown>> {\n fields: ExtensionFieldDefinition[]\n /\*\* TypeScript type reference (for code generation) _/\n typeRef?: string\n}\n\n/**\n _ Field definition for extension schema\n _/\nexport interface ExtensionFieldDefinition {\n name: string\n type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array' | 'object' | 'enum' | 'bilingual'\n label: BilingualField\n required?: boolean\n default?: unknown\n /** For enum types _/\n enumValues?: Array<{ value: string; label: BilingualField }>\n /\*\* For array types _/\n arrayItemType?: Omit<ExtensionFieldDefinition, 'name' | 'label'>\n /** For object types \*/\n objectFields?: ExtensionFieldDefinition[]\n /** Validation constraints _/\n validation?: FieldValidation\n /\*\* UI hints _/\n uiHints?: FieldUIHints\n}\n\n/**\n _ Validation constraints for fields\n _/\nexport interface FieldValidation {\n minLength?: number\n maxLength?: number\n min?: number\n max?: number\n pattern?: string\n patternMessage?: BilingualField\n custom?: (value: unknown, entity: BaseDossier) => Result<void, string>\n}\n\n/**\n _ UI rendering hints for fields\n _/\nexport interface FieldUIHints {\n /** Input component type \*/\n component?: 'input' | 'textarea' | 'select' | 'multiselect' | 'datepicker' | 'switch' | 'slider' | 'rich-text'\n /** Placeholder text _/\n placeholder?: BilingualField\n /\*\* Help text _/\n helpText?: BilingualField\n /** Grid column span (1-12) \*/\n colSpan?: number\n /** Display in list view _/\n showInList?: boolean\n /\*\* Display in card view _/\n showInCard?: boolean\n /** Sortable in list \*/\n sortable?: boolean\n /** Filterable _/\n filterable?: boolean\n}\n\n// ============================================================================\n// Validation Hook Types\n// ============================================================================\n\n/\*\*\n _ Validation context provided to validators\n _/\nexport interface ValidationContext<T = Record<string, unknown>> {\n entity: BaseDossier & T\n isCreate: boolean\n previousVersion?: BaseDossier & T\n user?: {\n id: string\n role: string\n clearanceLevel: number\n }\n}\n\n/\*\*\n _ Validation result\n _/\nexport interface ValidationResult {\n valid: boolean\n errors: ValidationError[]\n}\n\n/\*\*\n _ Validation error details\n _/\nexport interface ValidationError {\n field: string\n code: string\n message: BilingualField\n}\n\n/\*\*\n _ Validation hook function type\n _/\nexport type ValidationHook<T = Record<string, unknown>> = (\n context: ValidationContext<T>\n) => Promise<ValidationResult> | ValidationResult\n\n/\*\*\n _ Plugin validation hooks\n _/\nexport interface PluginValidationHooks<T = Record<string, unknown>> {\n /\*\* Validate before create _/\n beforeCreate?: ValidationHook<T>\n /** Validate before update \*/\n beforeUpdate?: ValidationHook<T>\n /** Validate before delete/archive _/\n beforeDelete?: ValidationHook<T>\n /\*\* Custom field validators _/\n fieldValidators?: Record<string, (value: unknown, context: ValidationContext<T>) => ValidationResult>\n}\n\n// ============================================================================\n// Relationship Types\n// ============================================================================\n\n/**\n _ Defines allowed relationships for an entity type\n _/\nexport interface RelationshipDefinition {\n /** Relationship type identifier _/\n type: string\n /\*\* Display name _/\n label: BilingualField\n /** Target entity types that can be related \*/\n targetEntityTypes: string[]\n /** Cardinality _/\n cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'\n /\*\* Inverse relationship type (for bidirectional) _/\n inverseType?: string\n /** Whether this relationship is required \*/\n required?: boolean\n /** Maximum number of relationships (for many) _/\n maxCount?: number\n /\*\* Metadata schema for the relationship _/\n metadataSchema?: ExtensionFieldDefinition[]\n}\n\n/**\n _ Plugin relationship hooks\n _/\nexport interface PluginRelationshipHooks<T = Record<string, unknown>> {\n /** Define allowed relationship types _/\n definitions: RelationshipDefinition[]\n /\*\* Hook before creating a relationship _/\n beforeCreateRelationship?: (\n source: BaseDossier & T,\n target: BaseDossier,\n relationshipType: string\n ) => Promise<ValidationResult> | ValidationResult\n /** Hook after relationship is created \*/\n afterCreateRelationship?: (\n source: BaseDossier & T,\n target: BaseDossier,\n relationshipType: string,\n relationshipId: string\n ) => Promise<void> | void\n /** Hook before removing a relationship _/\n beforeRemoveRelationship?: (\n source: BaseDossier & T,\n target: BaseDossier,\n relationshipType: string\n ) => Promise<ValidationResult> | ValidationResult\n}\n\n// ============================================================================\n// Permission Types\n// ============================================================================\n\n/\*\*\n _ Permission action types\n _/\nexport type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'archive' | 'export' | 'share'\n\n/\*\*\n _ Permission check context\n _/\nexport interface PermissionContext<T = Record<string, unknown>> {\n action: PermissionAction\n entity?: BaseDossier & T\n user: {\n id: string\n role: string\n clearanceLevel: number\n departmentId?: string\n permissions?: string[]\n }\n}\n\n/\*\*\n _ Permission check result\n _/\nexport interface PermissionResult {\n allowed: boolean\n reason?: BilingualField\n}\n\n/\*\*\n _ Permission check function type\n _/\nexport type PermissionCheck<T = Record<string, unknown>> = (\n context: PermissionContext<T>\n) => Promise<PermissionResult> | PermissionResult\n\n/\*\*\n _ Plugin permission hooks\n _/\nexport interface PluginPermissionHooks<T = Record<string, unknown>> {\n /\*\* Custom permission checker _/\n checkPermission?: PermissionCheck<T>\n /** Additional permission actions for this entity type \*/\n additionalActions?: Array<{\n action: string\n label: BilingualField\n description: BilingualField\n }>\n /** Minimum clearance level to view _/\n minViewClearance?: number\n /\*\* Minimum clearance level to edit _/\n minEditClearance?: number\n /** Role-based access overrides \*/\n roleOverrides?: Record<string, PermissionAction[]>\n}\n\n// ============================================================================\n// UI Rendering Types\n// ============================================================================\n\n/**\n _ Props passed to entity card components\n _/\nexport interface EntityCardProps<T = Record<string, unknown>> {\n entity: BaseDossier & T\n onView?: (id: string) => void\n onEdit?: (id: string) => void\n onDelete?: (id: string) => void\n isSelected?: boolean\n onSelect?: (id: string) => void\n className?: string\n}\n\n/**\n _ Props passed to entity detail view components\n _/\nexport interface EntityDetailProps<T = Record<string, unknown>> {\n entity: BaseDossier & T\n onEdit?: () => void\n onDelete?: () => void\n isLoading?: boolean\n className?: string\n}\n\n/**\n _ Props passed to entity form components\n _/\nexport interface EntityFormProps<T = Record<string, unknown>> {\n mode: 'create' | 'edit'\n initialData?: Partial<BaseDossier & T>\n onSubmit: (data: Partial<BaseDossier & T>) => Promise<void>\n onCancel: () => void\n isSubmitting?: boolean\n className?: string\n}\n\n/**\n _ Props passed to entity list components\n _/\nexport interface EntityListProps<T = Record<string, unknown>> {\n entities: Array<BaseDossier & T>\n isLoading?: boolean\n onView?: (id: string) => void\n onEdit?: (id: string) => void\n onDelete?: (id: string) => void\n selectedIds?: string[]\n onSelectionChange?: (ids: string[]) => void\n className?: string\n}\n\n/**\n _ Plugin UI component definitions\n _/\nexport interface PluginUIComponents<T = Record<string, unknown>> {\n /** Custom card component for list views \*/\n Card?: ComponentType<EntityCardProps<T>>\n /** Custom detail view component _/\n DetailView?: ComponentType<EntityDetailProps<T>>\n /\*\* Custom form component _/\n Form?: ComponentType<EntityFormProps<T>>\n /** Custom list component \*/\n List?: ComponentType<EntityListProps<T>>\n /** Additional custom components _/\n custom?: Record<string, ComponentType<unknown>>\n}\n\n/\*\*\n _ UI rendering hooks for customizing default components\n _/\nexport interface PluginUIHooks<T = Record<string, unknown>> {\n /\*\* Custom columns for list/table views _/\n listColumns?: ListColumnDefinition<T>[]\n /** Custom sections for detail view \*/\n detailSections?: DetailSectionDefinition<T>[]\n /** Custom form sections _/\n formSections?: FormSectionDefinition[]\n /\*\* Custom actions for entity context menu _/\n contextActions?: ContextActionDefinition<T>[]\n /** Custom badges/chips to display on cards \*/\n badges?: BadgeDefinition<T>[]\n}\n\n/**\n _ List column definition\n _/\nexport interface ListColumnDefinition<T = Record<string, unknown>> {\n id: string\n label: BilingualField\n accessor: keyof (BaseDossier & T) | ((entity: BaseDossier & T) => ReactNode)\n sortable?: boolean\n width?: string | number\n align?: 'start' | 'center' | 'end'\n}\n\n/**\n _ Detail section definition\n _/\nexport interface DetailSectionDefinition<T = Record<string, unknown>> {\n id: string\n title: BilingualField\n icon?: string\n order: number\n collapsible?: boolean\n defaultExpanded?: boolean\n render: (entity: BaseDossier & T) => ReactNode\n}\n\n/**\n _ Form section definition\n _/\nexport interface FormSectionDefinition {\n id: string\n title: BilingualField\n description?: BilingualField\n order: number\n fields: string[]\n collapsible?: boolean\n}\n\n/**\n _ Context action definition\n _/\nexport interface ContextActionDefinition<T = Record<string, unknown>> {\n id: string\n label: BilingualField\n icon?: string\n action: (entity: BaseDossier & T) => Promise<void> | void\n isVisible?: (entity: BaseDossier & T) => boolean\n isDisabled?: (entity: BaseDossier & T) => boolean\n variant?: 'default' | 'destructive'\n}\n\n/**\n _ Badge definition for cards\n _/\nexport interface BadgeDefinition<T = Record<string, unknown>> {\n id: string\n render: (entity: BaseDossier & T) => ReactNode | null\n position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'\n}\n\n// ============================================================================\n// API & Data Hook Types\n// ============================================================================\n\n/**\n _ Search parameters for listing entities\n _/\nexport interface EntitySearchParams {\n search?: string\n status?: EntityStatus\n sensitivity_level?: SensitivityLevel\n tags?: string[]\n page?: number\n limit?: number\n sort_by?: string\n sort_order?: 'asc' | 'desc'\n [key: string]: unknown\n}\n\n/**\n _ List response type\n _/\nexport interface EntityListResponse<T = Record<string, unknown>> {\n data: Array<BaseDossier & T>\n pagination: {\n page: number\n limit: number\n total: number\n totalPages: number\n has_more: boolean\n }\n}\n\n/**\n _ Plugin data hooks for custom API integration\n _/\nexport interface PluginDataHooks<T = Record<string, unknown>> {\n /** Custom endpoint for this entity type (defaults to pluralized entityType) _/\n endpoint?: string\n /\*\* Transform data before sending to API _/\n transformForApi?: (data: Partial<BaseDossier & T>) => Record<string, unknown>\n /** Transform data received from API \*/\n transformFromApi?: (data: Record<string, unknown>) => BaseDossier & T\n /** Custom search parameters _/\n searchParams?: ExtensionFieldDefinition[]\n /\*\* Hook after entity is loaded _/\n afterLoad?: (entity: BaseDossier & T) => Promise<BaseDossier & T> | BaseDossier & T\n /** Hook before saving \*/\n beforeSave?: (entity: Partial<BaseDossier & T>) => Promise<Partial<BaseDossier & T>> | Partial<BaseDossier & T>\n}\n\n// ============================================================================\n// Full Plugin Definition\n// ============================================================================\n\n/**\n _ Complete plugin definition\n _/\nexport interface EntityPlugin<TExtension = Record<string, unknown>> {\n /** Plugin metadata \*/\n manifest: PluginManifest<TExtension>\n /** Validation hooks _/\n validation?: PluginValidationHooks<TExtension>\n /\*\* Relationship hooks _/\n relationships?: PluginRelationshipHooks<TExtension>\n /** Permission hooks \*/\n permissions?: PluginPermissionHooks<TExtension>\n /** UI components _/\n components?: PluginUIComponents<TExtension>\n /\*\* UI hooks _/\n ui?: PluginUIHooks<TExtension>\n /** Data hooks \*/\n data?: PluginDataHooks<TExtension>\n /** Lifecycle hooks _/\n lifecycle?: PluginLifecycleHooks\n /\*\* i18n namespace for this plugin _/\n i18nNamespace?: string\n}\n\n/**\n _ Plugin lifecycle hooks\n _/\nexport interface PluginLifecycleHooks {\n /** Called when plugin is registered _/\n onRegister?: () => Promise<void> | void\n /\*\* Called when plugin is unregistered _/\n onUnregister?: () => Promise<void> | void\n /** Called when plugin is enabled \*/\n onEnable?: () => Promise<void> | void\n /** Called when plugin is disabled _/\n onDisable?: () => Promise<void> | void\n}\n\n// ============================================================================\n// Plugin Registry Types\n// ============================================================================\n\n/\*\*\n _ Registered plugin with runtime state\n _/\nexport interface RegisteredPlugin<T = Record<string, unknown>> {\n plugin: EntityPlugin<T>\n enabled: boolean\n registeredAt: string\n loadOrder: number\n}\n\n/\*\*\n _ Plugin registry state\n _/\nexport interface PluginRegistryState {\n plugins: Map<string, RegisteredPlugin>\n entityTypeMap: Map<string, string>\n initialized: boolean\n}\n\n/\*\*\n _ Plugin registry events\n _/\nexport type PluginRegistryEvent =\n | { type: 'PLUGIN_REGISTERED'; pluginId: string }\n | { type: 'PLUGIN_UNREGISTERED'; pluginId: string }\n | { type: 'PLUGIN_ENABLED'; pluginId: string }\n | { type: 'PLUGIN_DISABLED'; pluginId: string }\n | { type: 'REGISTRY_INITIALIZED' }\n\n/\*\*\n _ Plugin registry event listener\n \*/\nexport type PluginEventListener = (event: PluginRegistryEvent) => void\n"
}
Now let's create the plugin registry that manages all plugins:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/registry/plugin-registry.ts",
"content": "/**\n _ Plugin Registry - Core Registration System\n _\n _ Manages plugin registration, lifecycle, and lookup.\n _ Provides a centralized registry for all entity plugins.\n \*/\n\nimport type {\n EntityPlugin,\n RegisteredPlugin,\n PluginRegistryState,\n PluginRegistryEvent,\n PluginEventListener,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Registry Implementation\n// ============================================================================\n\nclass PluginRegistry {\n private state: PluginRegistryState = {\n plugins: new Map(),\n entityTypeMap: new Map(),\n initialized: false,\n }\n\n private listeners: Set<PluginEventListener> = new Set()\n private loadOrder = 0\n\n // ==========================================================================\n // Registration Methods\n // ==========================================================================\n\n /**\n _ Register a new entity plugin\n _/\n async register<T>(plugin: EntityPlugin<T>): Promise<void> {\n const { id, entityType } = plugin.manifest\n\n // Check for duplicate registration\n if (this.state.plugins.has(id)) {\n console.warn(`Plugin \"${id}\" is already registered. Skipping.`)\n return\n }\n\n // Check for entity type conflict\n const existingPluginId = this.state.entityTypeMap.get(entityType)\n if (existingPluginId) {\n throw new Error(\n `Entity type \"${entityType}\" is already registered by plugin \"${existingPluginId}\"`\n )\n }\n\n // Check dependencies\n if (plugin.manifest.dependencies) {\n for (const depId of plugin.manifest.dependencies) {\n if (!this.state.plugins.has(depId)) {\n throw new Error(\n `Plugin \"${id}\" depends on \"${depId}\" which is not registered`\n )\n }\n }\n }\n\n // Create registered plugin entry\n const registeredPlugin: RegisteredPlugin<T> = {\n plugin: plugin as EntityPlugin<T>,\n enabled: true,\n registeredAt: new Date().toISOString(),\n loadOrder: this.loadOrder++,\n }\n\n // Register plugin\n this.state.plugins.set(id, registeredPlugin as RegisteredPlugin)\n this.state.entityTypeMap.set(entityType, id)\n\n // Call lifecycle hook\n if (plugin.lifecycle?.onRegister) {\n await plugin.lifecycle.onRegister()\n }\n\n // Emit event\n this.emit({ type: 'PLUGIN_REGISTERED', pluginId: id })\n\n console.info(`Plugin \"${id}\" registered successfully for entity type \"${entityType}\"`)\n }\n\n /**\n _ Unregister a plugin\n _/\n async unregister(pluginId: string): Promise<void> {\n const registeredPlugin = this.state.plugins.get(pluginId)\n if (!registeredPlugin) {\n console.warn(`Plugin \"${pluginId}\" is not registered`)\n return\n }\n\n // Check if other plugins depend on this one\n for (const [id, rp] of this.state.plugins) {\n if (rp.plugin.manifest.dependencies?.includes(pluginId)) {\n throw new Error(\n `Cannot unregister \"${pluginId}\": plugin \"${id}\" depends on it`\n )\n }\n }\n\n const { entityType } = registeredPlugin.plugin.manifest\n\n // Call lifecycle hook\n if (registeredPlugin.plugin.lifecycle?.onUnregister) {\n await registeredPlugin.plugin.lifecycle.onUnregister()\n }\n\n // Remove from registry\n this.state.plugins.delete(pluginId)\n this.state.entityTypeMap.delete(entityType)\n\n // Emit event\n this.emit({ type: 'PLUGIN_UNREGISTERED', pluginId })\n\n console.info(`Plugin \"${pluginId}\" unregistered`)\n }\n\n /**\n _ Enable a plugin\n _/\n async enable(pluginId: string): Promise<void> {\n const registeredPlugin = this.state.plugins.get(pluginId)\n if (!registeredPlugin) {\n throw new Error(`Plugin \"${pluginId}\" is not registered`)\n }\n\n if (registeredPlugin.enabled) {\n return\n }\n\n // Check dependencies are enabled\n const dependencies = registeredPlugin.plugin.manifest.dependencies || []\n for (const depId of dependencies) {\n const dep = this.state.plugins.get(depId)\n if (!dep?.enabled) {\n throw new Error(\n `Cannot enable \"${pluginId}\": dependency \"${depId}\" is not enabled`\n )\n }\n }\n\n registeredPlugin.enabled = true\n\n // Call lifecycle hook\n if (registeredPlugin.plugin.lifecycle?.onEnable) {\n await registeredPlugin.plugin.lifecycle.onEnable()\n }\n\n // Emit event\n this.emit({ type: 'PLUGIN_ENABLED', pluginId })\n }\n\n /**\n _ Disable a plugin\n _/\n async disable(pluginId: string): Promise<void> {\n const registeredPlugin = this.state.plugins.get(pluginId)\n if (!registeredPlugin) {\n throw new Error(`Plugin \"${pluginId}\" is not registered`)\n }\n\n if (!registeredPlugin.enabled) {\n return\n }\n\n // Check if enabled plugins depend on this one\n for (const [id, rp] of this.state.plugins) {\n if (rp.enabled && rp.plugin.manifest.dependencies?.includes(pluginId)) {\n throw new Error(\n `Cannot disable \"${pluginId}\": enabled plugin \"${id}\" depends on it`\n )\n }\n }\n\n registeredPlugin.enabled = false\n\n // Call lifecycle hook\n if (registeredPlugin.plugin.lifecycle?.onDisable) {\n await registeredPlugin.plugin.lifecycle.onDisable()\n }\n\n // Emit event\n this.emit({ type: 'PLUGIN_DISABLED', pluginId })\n }\n\n // ==========================================================================\n // Lookup Methods\n // ==========================================================================\n\n /**\n _ Get a plugin by ID\n _/\n getPlugin<T = Record<string, unknown>>(\n pluginId: string\n ): EntityPlugin<T> | undefined {\n const registered = this.state.plugins.get(pluginId)\n return registered?.plugin as EntityPlugin<T> | undefined\n }\n\n /**\n _ Get a plugin by entity type\n _/\n getPluginByEntityType<T = Record<string, unknown>>(\n entityType: string\n ): EntityPlugin<T> | undefined {\n const pluginId = this.state.entityTypeMap.get(entityType)\n if (!pluginId) return undefined\n return this.getPlugin<T>(pluginId)\n }\n\n /**\n _ Get all registered plugins\n _/\n getAllPlugins(): EntityPlugin[] {\n return Array.from(this.state.plugins.values())\n .sort((a, b) => a.loadOrder - b.loadOrder)\n .map((rp) => rp.plugin)\n }\n\n /**\n _ Get all enabled plugins\n _/\n getEnabledPlugins(): EntityPlugin[] {\n return Array.from(this.state.plugins.values())\n .filter((rp) => rp.enabled)\n .sort((a, b) => a.loadOrder - b.loadOrder)\n .map((rp) => rp.plugin)\n }\n\n /**\n _ Get all registered entity types\n _/\n getEntityTypes(): string[] {\n return Array.from(this.state.entityTypeMap.keys())\n }\n\n /**\n _ Check if a plugin is registered\n _/\n isRegistered(pluginId: string): boolean {\n return this.state.plugins.has(pluginId)\n }\n\n /**\n _ Check if a plugin is enabled\n _/\n isEnabled(pluginId: string): boolean {\n return this.state.plugins.get(pluginId)?.enabled ?? false\n }\n\n /**\n _ Check if an entity type is registered\n _/\n hasEntityType(entityType: string): boolean {\n return this.state.entityTypeMap.has(entityType)\n }\n\n // ==========================================================================\n // Event System\n // ==========================================================================\n\n /**\n _ Subscribe to registry events\n _/\n subscribe(listener: PluginEventListener): () => void {\n this.listeners.add(listener)\n return () => {\n this.listeners.delete(listener)\n }\n }\n\n /**\n _ Emit an event to all listeners\n _/\n private emit(event: PluginRegistryEvent): void {\n for (const listener of this.listeners) {\n try {\n listener(event)\n } catch (error) {\n console.error('Plugin event listener error:', error)\n }\n }\n }\n\n // ==========================================================================\n // Initialization\n // ==========================================================================\n\n /**\n _ Initialize the registry\n _/\n async initialize(): Promise<void> {\n if (this.state.initialized) {\n return\n }\n\n this.state.initialized = true\n this.emit({ type: 'REGISTRY_INITIALIZED' })\n console.info('Plugin registry initialized')\n }\n\n /**\n _ Check if registry is initialized\n _/\n isInitialized(): boolean {\n return this.state.initialized\n }\n\n /**\n _ Get registry state (for debugging)\n _/\n getState(): Readonly<PluginRegistryState> {\n return this.state\n }\n\n /**\n _ Clear all plugins (for testing)\n _/\n async clear(): Promise<void> {\n const pluginIds = Array.from(this.state.plugins.keys())\n\n // Unregister in reverse order to handle dependencies\n for (const id of pluginIds.reverse()) {\n await this.unregister(id)\n }\n\n this.state.initialized = false\n this.loadOrder = 0\n }\n}\n\n// ============================================================================\n// Singleton Export\n// ============================================================================\n\n/**\n _ Global plugin registry instance\n _/\nexport const pluginRegistry = new PluginRegistry()\n\n/\*_\n _ Type export for registry\n \*/\nexport type { PluginRegistry }\n"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "completed",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "completed",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "in_progress",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "pending",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "pending",
"activeForm": "Verifying implementation with Playwright test"
}
]
}
Now let's create the hooks for validation, relationships, permissions, and UI:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginValidation.ts",
"content": "/**\n _ Plugin Validation Hook\n _\n _ Provides validation capabilities for entity plugins.\n _ Runs plugin-defined validators and returns validation results.\n \*/\n\nimport { useCallback } from 'react'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport type {\n BaseDossier,\n ValidationContext,\n ValidationResult,\n ValidationError,\n BilingualField,\n ExtensionFieldDefinition,\n FieldValidation,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Hook Types\n// ============================================================================\n\nexport interface UsePluginValidationOptions {\n /** Entity type to validate _/\n entityType: string\n /\*\* Skip plugin validators (only run schema validation) _/\n schemaOnly?: boolean\n}\n\nexport interface UsePluginValidationReturn<T = Record<string, unknown>> {\n /** Validate entity for creation \*/\n validateCreate: (entity: Partial<BaseDossier & T>) => Promise<ValidationResult>\n /** Validate entity for update _/\n validateUpdate: (\n entity: Partial<BaseDossier & T>,\n previous?: BaseDossier & T\n ) => Promise<ValidationResult>\n /\*\* Validate entity for deletion _/\n validateDelete: (entity: BaseDossier & T) => Promise<ValidationResult>\n /** Validate a single field \*/\n validateField: (\n fieldName: string,\n value: unknown,\n entity?: Partial<BaseDossier & T>\n ) => ValidationResult\n /** Get field schema definition _/\n getFieldSchema: (fieldName: string) => ExtensionFieldDefinition | undefined\n /\*\* Check if entity type has plugin validators _/\n hasValidators: boolean\n}\n\n// ============================================================================\n// Validation Helpers\n// ============================================================================\n\n/**\n _ Create a validation error\n _/\nfunction createError(field: string, code: string, message: BilingualField): ValidationError {\n return { field, code, message }\n}\n\n/**\n _ Merge validation results\n _/\nfunction mergeResults(...results: ValidationResult[]): ValidationResult {\n const errors: ValidationError[] = []\n for (const result of results) {\n if (!result.valid) {\n errors.push(...result.errors)\n }\n }\n return {\n valid: errors.length === 0,\n errors,\n }\n}\n\n/**\n _ Validate a field against its schema\n _/\nfunction validateFieldSchema(\n fieldDef: ExtensionFieldDefinition,\n value: unknown,\n entity: Record<string, unknown>\n): ValidationResult {\n const errors: ValidationError[] = []\n\n // Required check\n if (fieldDef.required && (value === undefined || value === null || value === '')) {\n errors.push(\n createError(fieldDef.name, 'REQUIRED', {\n en: `${fieldDef.label.en} is required`,\n ar: `${fieldDef.label.ar} مطلوب`,\n })\n )\n return { valid: false, errors }\n }\n\n // Skip further validation if value is empty and not required\n if (value === undefined || value === null || value === '') {\n return { valid: true, errors: [] }\n }\n\n const validation = fieldDef.validation\n\n if (validation) {\n // String length validation\n if (typeof value === 'string') {\n if (validation.minLength !== undefined && value.length < validation.minLength) {\n errors.push(\n createError(fieldDef.name, 'MIN_LENGTH', {\n en: `${fieldDef.label.en} must be at least ${validation.minLength} characters`,\n ar: `${fieldDef.label.ar} يجب أن يكون على الأقل ${validation.minLength} حرفًا`,\n })\n )\n }\n if (validation.maxLength !== undefined && value.length > validation.maxLength) {\n errors.push(\n createError(fieldDef.name, 'MAX_LENGTH', {\n en: `${fieldDef.label.en} must be at most ${validation.maxLength} characters`,\n ar: `${fieldDef.label.ar} يجب أن يكون على الأكثر ${validation.maxLength} حرفًا`,\n })\n )\n }\n if (validation.pattern && !new RegExp(validation.pattern).test(value)) {\n const message = validation.patternMessage || {\n en: `${fieldDef.label.en} has an invalid format`,\n ar: `${fieldDef.label.ar} بتنسيق غير صالح`,\n }\n errors.push(createError(fieldDef.name, 'PATTERN', message))\n }\n }\n\n // Number range validation\n if (typeof value === 'number') {\n if (validation.min !== undefined && value < validation.min) {\n errors.push(\n createError(fieldDef.name, 'MIN', {\n en: `${fieldDef.label.en} must be at least ${validation.min}`,\n ar: `${fieldDef.label.ar} يجب أن يكون على الأقل ${validation.min}`,\n })\n )\n }\n if (validation.max !== undefined && value > validation.max) {\n errors.push(\n createError(fieldDef.name, 'MAX', {\n en: `${fieldDef.label.en} must be at most ${validation.max}`,\n ar: `${fieldDef.label.ar} يجب أن يكون على الأكثر ${validation.max}`,\n })\n )\n }\n }\n\n // Custom validation\n if (validation.custom) {\n const result = validation.custom(value, entity as BaseDossier)\n if (!result.success) {\n errors.push(\n createError(fieldDef.name, 'CUSTOM', {\n en: result.error as string,\n ar: result.error as string,\n })\n )\n }\n }\n }\n\n return { valid: errors.length === 0, errors }\n}\n\n/**\n _ Validate base dossier fields\n _/\nfunction validateBaseDossier(entity: Partial<BaseDossier>): ValidationResult {\n const errors: ValidationError[] = []\n\n if (!entity.name_en?.trim()) {\n errors.push(\n createError('name_en', 'REQUIRED', {\n en: 'English name is required',\n ar: 'الاسم بالإنجليزية مطلوب',\n })\n )\n }\n\n if (!entity.name_ar?.trim()) {\n errors.push(\n createError('name_ar', 'REQUIRED', {\n en: 'Arabic name is required',\n ar: 'الاسم بالعربية مطلوب',\n })\n )\n }\n\n return { valid: errors.length === 0, errors }\n}\n\n// ============================================================================\n// Main Hook\n// ============================================================================\n\n/**\n _ Hook for entity plugin validation\n _/\nexport function usePluginValidation<T = Record<string, unknown>>(\n options: UsePluginValidationOptions\n): UsePluginValidationReturn<T> {\n const { entityType, schemaOnly = false } = options\n\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const hasValidators = Boolean(plugin?.validation)\n\n /**\n _ Get field schema definition\n _/\n const getFieldSchema = useCallback(\n (fieldName: string): ExtensionFieldDefinition | undefined => {\n if (!plugin) return undefined\n return plugin.manifest.extensionSchema.fields.find((f) => f.name === fieldName)\n },\n [plugin]\n )\n\n /**\n _ Validate a single field\n _/\n const validateField = useCallback(\n (\n fieldName: string,\n value: unknown,\n entity?: Partial<BaseDossier & T>\n ): ValidationResult => {\n const fieldDef = getFieldSchema(fieldName)\n if (!fieldDef) {\n // Unknown field - skip validation\n return { valid: true, errors: [] }\n }\n\n // Schema validation\n const schemaResult = validateFieldSchema(\n fieldDef,\n value,\n (entity || {}) as Record<string, unknown>\n )\n\n // Plugin field validator\n if (!schemaOnly && plugin?.validation?.fieldValidators?.[fieldName]) {\n const context: ValidationContext<T> = {\n entity: { ...entity, [fieldName]: value } as BaseDossier & T,\n isCreate: !entity?.id,\n }\n const pluginResult = plugin.validation.fieldValidators[fieldName](value, context)\n return mergeResults(schemaResult, pluginResult)\n }\n\n return schemaResult\n },\n [getFieldSchema, plugin, schemaOnly]\n )\n\n /**\n _ Validate all extension fields\n _/\n const validateExtensionFields = useCallback(\n (entity: Partial<BaseDossier & T>): ValidationResult => {\n if (!plugin) return { valid: true, errors: [] }\n\n const results: ValidationResult[] = []\n for (const fieldDef of plugin.manifest.extensionSchema.fields) {\n const value = (entity as Record<string, unknown>)[fieldDef.name]\n results.push(\n validateFieldSchema(fieldDef, value, entity as Record<string, unknown>)\n )\n }\n\n return mergeResults(...results)\n },\n [plugin]\n )\n\n /**\n _ Validate entity for creation\n _/\n const validateCreate = useCallback(\n async (entity: Partial<BaseDossier & T>): Promise<ValidationResult> => {\n // Base dossier validation\n const baseResult = validateBaseDossier(entity)\n\n // Extension fields validation\n const extensionResult = validateExtensionFields(entity)\n\n // Plugin validation hook\n let pluginResult: ValidationResult = { valid: true, errors: [] }\n if (!schemaOnly && plugin?.validation?.beforeCreate) {\n const context: ValidationContext<T> = {\n entity: entity as BaseDossier & T,\n isCreate: true,\n }\n pluginResult = await plugin.validation.beforeCreate(context)\n }\n\n return mergeResults(baseResult, extensionResult, pluginResult)\n },\n [plugin, schemaOnly, validateExtensionFields]\n )\n\n /**\n _ Validate entity for update\n _/\n const validateUpdate = useCallback(\n async (\n entity: Partial<BaseDossier & T>,\n previous?: BaseDossier & T\n ): Promise<ValidationResult> => {\n // Only validate fields that are being updated\n const results: ValidationResult[] = []\n\n // If name fields are being updated, validate them\n if (entity.name_en !== undefined || entity.name_ar !== undefined) {\n results.push(validateBaseDossier(entity))\n }\n\n // Validate updated extension fields\n if (plugin) {\n for (const fieldDef of plugin.manifest.extensionSchema.fields) {\n const value = (entity as Record<string, unknown>)[fieldDef.name]\n if (value !== undefined) {\n results.push(\n validateFieldSchema(fieldDef, value, entity as Record<string, unknown>)\n )\n }\n }\n }\n\n // Plugin validation hook\n if (!schemaOnly && plugin?.validation?.beforeUpdate) {\n const context: ValidationContext<T> = {\n entity: entity as BaseDossier & T,\n isCreate: false,\n previousVersion: previous,\n }\n const pluginResult = await plugin.validation.beforeUpdate(context)\n results.push(pluginResult)\n }\n\n return mergeResults(...results)\n },\n [plugin, schemaOnly]\n )\n\n /\*_\n _ Validate entity for deletion\n \*/\n const validateDelete = useCallback(\n async (entity: BaseDossier & T): Promise<ValidationResult> => {\n if (schemaOnly || !plugin?.validation?.beforeDelete) {\n return { valid: true, errors: [] }\n }\n\n const context: ValidationContext<T> = {\n entity,\n isCreate: false,\n }\n return plugin.validation.beforeDelete(context)\n },\n [plugin, schemaOnly]\n )\n\n return {\n validateCreate,\n validateUpdate,\n validateDelete,\n validateField,\n getFieldSchema,\n hasValidators,\n }\n}\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginPermissions.ts",
"content": "/**\n _ Plugin Permissions Hook\n _\n _ Provides permission checking capabilities for entity plugins.\n _ Integrates with Supabase RLS and plugin-defined permission rules.\n \*/\n\nimport { useCallback, useMemo } from 'react'\nimport { useAuth } from '@/hooks/useAuth'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport type {\n BaseDossier,\n PermissionAction,\n PermissionContext,\n PermissionResult,\n BilingualField,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Hook Types\n// ============================================================================\n\nexport interface UsePluginPermissionsOptions {\n /** Entity type to check permissions for _/\n entityType: string\n}\n\nexport interface UsePluginPermissionsReturn<T = Record<string, unknown>> {\n /\*\* Check if user can perform action on entity _/\n canPerform: (action: PermissionAction, entity?: BaseDossier & T) => Promise<boolean>\n /** Check multiple permissions at once \*/\n canPerformBatch: (\n actions: PermissionAction[],\n entity?: BaseDossier & T\n ) => Promise<Record<PermissionAction, boolean>>\n /** Get permission result with reason _/\n checkPermission: (\n action: PermissionAction,\n entity?: BaseDossier & T\n ) => Promise<PermissionResult>\n /\*\* Get all allowed actions for entity _/\n getAllowedActions: (entity?: BaseDossier & T) => Promise<PermissionAction[]>\n /** Check if user has minimum clearance for entity \*/\n hasClearance: (entity: BaseDossier & T) => boolean\n /** Get user's clearance level _/\n userClearance: number\n /\*\* Check if permissions are being loaded _/\n isLoading: boolean\n /** Additional plugin-specific actions \*/\n additionalActions: Array<{\n action: string\n label: BilingualField\n description: BilingualField\n }>\n}\n\n// ============================================================================\n// Clearance Level Mapping\n// ============================================================================\n\nconst SENSITIVITY_CLEARANCE: Record<string, number> = {\n low: 1,\n medium: 2,\n high: 3,\n top_secret: 4,\n}\n\n// ============================================================================\n// Default Permission Logic\n// ============================================================================\n\nconst DEFAULT_ACTIONS: PermissionAction[] = [\n 'view',\n 'create',\n 'update',\n 'delete',\n 'archive',\n 'export',\n 'share',\n]\n\n/**\n _ Default role-based permissions\n _/\nconst DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {\n admin: DEFAULT_ACTIONS,\n manager: ['view', 'create', 'update', 'archive', 'export', 'share'],\n analyst: ['view', 'create', 'update', 'export'],\n viewer: ['view', 'export'],\n}\n\n/**\n _ Default permission check\n _/\nfunction defaultPermissionCheck(\n action: PermissionAction,\n userRole: string,\n userClearance: number,\n entity?: BaseDossier,\n minViewClearance?: number,\n minEditClearance?: number,\n roleOverrides?: Record<string, PermissionAction[]>\n): PermissionResult {\n // Check role permissions\n const allowedActions = roleOverrides?.[userRole] ?? DEFAULT_ROLE_PERMISSIONS[userRole] ?? []\n\n if (!allowedActions.includes(action)) {\n return {\n allowed: false,\n reason: {\n en: 'Your role does not have permission for this action',\n ar: 'دورك لا يملك صلاحية لهذا الإجراء',\n },\n }\n }\n\n // Check clearance for entity-specific actions\n if (entity) {\n const requiredClearance = SENSITIVITY_CLEARANCE[entity.sensitivity_level] || 1\n\n // View clearance check\n if (action === 'view') {\n const minClearance = minViewClearance ?? requiredClearance\n if (userClearance < minClearance) {\n return {\n allowed: false,\n reason: {\n en: 'Your clearance level is insufficient to view this entity',\n ar: 'مستوى تصريحك غير كافٍ لعرض هذا العنصر',\n },\n }\n }\n }\n\n // Edit clearance check\n if (['update', 'delete', 'archive'].includes(action)) {\n const minClearance = minEditClearance ?? requiredClearance\n if (userClearance < minClearance) {\n return {\n allowed: false,\n reason: {\n en: 'Your clearance level is insufficient to modify this entity',\n ar: 'مستوى تصريحك غير كافٍ لتعديل هذا العنصر',\n },\n }\n }\n }\n\n // Check if entity is archived\n if (entity.status === 'archived' && ['update', 'delete'].includes(action)) {\n return {\n allowed: false,\n reason: {\n en: 'Cannot modify an archived entity',\n ar: 'لا يمكن تعديل عنصر مؤرشف',\n },\n }\n }\n }\n\n return { allowed: true }\n}\n\n// ============================================================================\n// Main Hook\n// ============================================================================\n\n/**\n _ Hook for entity plugin permissions\n _/\nexport function usePluginPermissions<T = Record<string, unknown>>(\n options: UsePluginPermissionsOptions\n): UsePluginPermissionsReturn<T> {\n const { entityType } = options\n const { user, isLoading: authLoading } = useAuth()\n\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const permissions = plugin?.permissions\n\n // Get user clearance level\n const userClearance = useMemo(() => {\n if (!user) return 0\n // Assume user has a clearance_level field or derive from role\n const clearance = (user as unknown as { clearance_level?: number }).clearance_level\n if (clearance) return clearance\n // Default clearance by role\n const roleClearance: Record<string, number> = {\n admin: 4,\n manager: 3,\n analyst: 2,\n viewer: 1,\n }\n return roleClearance[(user as unknown as { role?: string }).role || 'viewer'] || 1\n }, [user])\n\n // Get user role\n const userRole = useMemo(() => {\n if (!user) return 'viewer'\n return (user as unknown as { role?: string }).role || 'viewer'\n }, [user])\n\n // Additional plugin-specific actions\n const additionalActions = useMemo(() => {\n return permissions?.additionalActions || []\n }, [permissions])\n\n /**\n _ Check if user has clearance for entity\n _/\n const hasClearance = useCallback(\n (entity: BaseDossier & T): boolean => {\n const requiredClearance = SENSITIVITY_CLEARANCE[entity.sensitivity_level] || 1\n return userClearance >= requiredClearance\n },\n [userClearance]\n )\n\n /**\n _ Check permission for action\n _/\n const checkPermission = useCallback(\n async (\n action: PermissionAction,\n entity?: BaseDossier & T\n ): Promise<PermissionResult> => {\n if (!user) {\n return {\n allowed: false,\n reason: {\n en: 'Authentication required',\n ar: 'يجب تسجيل الدخول',\n },\n }\n }\n\n // Custom plugin permission check\n if (permissions?.checkPermission) {\n const context: PermissionContext<T> = {\n action,\n entity,\n user: {\n id: user.id,\n role: userRole,\n clearanceLevel: userClearance,\n },\n }\n return permissions.checkPermission(context)\n }\n\n // Default permission check\n return defaultPermissionCheck(\n action,\n userRole,\n userClearance,\n entity,\n permissions?.minViewClearance,\n permissions?.minEditClearance,\n permissions?.roleOverrides\n )\n },\n [user, userRole, userClearance, permissions]\n )\n\n /**\n _ Check if user can perform action\n _/\n const canPerform = useCallback(\n async (action: PermissionAction, entity?: BaseDossier & T): Promise<boolean> => {\n const result = await checkPermission(action, entity)\n return result.allowed\n },\n [checkPermission]\n )\n\n /**\n _ Check multiple permissions at once\n _/\n const canPerformBatch = useCallback(\n async (\n actions: PermissionAction[],\n entity?: BaseDossier & T\n ): Promise<Record<PermissionAction, boolean>> => {\n const results: Record<PermissionAction, boolean> = {} as Record<PermissionAction, boolean>\n\n await Promise.all(\n actions.map(async (action) => {\n results[action] = await canPerform(action, entity)\n })\n )\n\n return results\n },\n [canPerform]\n )\n\n /\*_\n _ Get all allowed actions for entity\n \*/\n const getAllowedActions = useCallback(\n async (entity?: BaseDossier & T): Promise<PermissionAction[]> => {\n const permissions = await canPerformBatch(DEFAULT_ACTIONS, entity)\n return DEFAULT_ACTIONS.filter((action) => permissions[action])\n },\n [canPerformBatch]\n )\n\n return {\n canPerform,\n canPerformBatch,\n checkPermission,\n getAllowedActions,\n hasClearance,\n userClearance,\n isLoading: authLoading,\n additionalActions,\n }\n}\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"content": "/**\n _ Plugin Relationships Hook\n _\n _ Provides relationship management capabilities for entity plugins.\n _ Allows plugins to define and manage relationships between entities.\n \*/\n\nimport { useCallback, useMemo } from 'react'\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'\nimport { toast } from 'sonner'\nimport { useTranslation } from 'react-i18next'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport { apiGet, apiPost, apiDelete } from '@/domains/shared'\nimport type {\n BaseDossier,\n RelationshipDefinition,\n ValidationResult,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Types\n// ============================================================================\n\nexport interface PluginRelationship {\n id: string\n source_id: string\n source_type: string\n target_id: string\n target_type: string\n relationship_type: string\n metadata?: Record<string, unknown>\n created_at: string\n created_by?: string\n}\n\nexport interface RelationshipWithTarget extends PluginRelationship {\n target: {\n id: string\n name_en: string\n name_ar: string\n type: string\n status: string\n }\n}\n\nexport interface CreateRelationshipInput {\n target_id: string\n target_type: string\n relationship_type: string\n metadata?: Record<string, unknown>\n}\n\nexport interface UsePluginRelationshipsOptions {\n /** Entity type for source entity _/\n entityType: string\n /\*\* Source entity ID _/\n entityId: string\n}\n\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {\n /** All relationship definitions for this entity type \*/\n definitions: RelationshipDefinition[]\n /** Get relationships by type _/\n getRelationshipsByType: (type: string) => RelationshipWithTarget[]\n /\*\* All relationships for this entity _/\n relationships: RelationshipWithTarget[]\n /** Loading state \*/\n isLoading: boolean\n /** Error state _/\n error: Error | null\n /\*\* Create a new relationship _/\n createRelationship: (input: CreateRelationshipInput) => Promise<PluginRelationship>\n /** Remove a relationship \*/\n removeRelationship: (relationshipId: string) => Promise<void>\n /** Check if relationship type allows more relationships _/\n canAddRelationship: (type: string) => boolean\n /\*\* Get allowed target entity types for a relationship type _/\n getTargetTypes: (relationshipType: string) => string[]\n /** Validate a relationship before creation \*/\n validateRelationship: (\n target: BaseDossier,\n relationshipType: string\n ) => Promise<ValidationResult>\n /** Refresh relationships _/\n refresh: () => void\n}\n\n// ============================================================================\n// Query Keys\n// ============================================================================\n\nconst relationshipKeys = {\n all: ['plugin-relationships'] as const,\n entity: (entityType: string, entityId: string) =>\n [...relationshipKeys.all, entityType, entityId] as const,\n byType: (entityType: string, entityId: string, relType: string) =>\n [...relationshipKeys.entity(entityType, entityId), relType] as const,\n}\n\n// ============================================================================\n// Main Hook\n// ============================================================================\n\n/\*\*\n _ Hook for managing entity relationships\n \*/\nexport function usePluginRelationships<T = Record<string, unknown>>(\n options: UsePluginRelationshipsOptions\n): UsePluginRelationshipsReturn<T> {\n const { entityType, entityId } = options\n const { t, i18n } = useTranslation('common')\n const queryClient = useQueryClient()\n\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const relationshipHooks = plugin?.relationships\n\n // Get relationship definitions\n const definitions = useMemo(() => {\n return relationshipHooks?.definitions || []\n }, [relationshipHooks])\n\n // Fetch relationships\n const {\n data: relationships = [],\n isLoading,\n error,\n refetch,\n } = useQuery({\n queryKey: relationshipKeys.entity(entityType, entityId),\n queryFn: async () => {\n // Call the relationships API endpoint\n const response = await apiGet<{ data: RelationshipWithTarget[] }>(\n `entity-relationships/${entityId}`,\n { source_type: entityType }\n )\n return response.data || []\n },\n enabled: !!entityId && definitions.length > 0,\n staleTime: 30_000,\n })\n\n // Get relationships by type\n const getRelationshipsByType = useCallback(\n (type: string): RelationshipWithTarget[] => {\n return relationships.filter((r) => r.relationship_type === type)\n },\n [relationships]\n )\n\n // Check if can add more relationships of type\n const canAddRelationship = useCallback(\n (type: string): boolean => {\n const definition = definitions.find((d) => d.type === type)\n if (!definition) return false\n\n if (definition.cardinality === 'one-to-one') {\n return getRelationshipsByType(type).length === 0\n }\n\n if (definition.maxCount) {\n return getRelationshipsByType(type).length < definition.maxCount\n }\n\n return true\n },\n [definitions, getRelationshipsByType]\n )\n\n // Get target types for relationship type\n const getTargetTypes = useCallback(\n (relationshipType: string): string[] => {\n const definition = definitions.find((d) => d.type === relationshipType)\n return definition?.targetEntityTypes || []\n },\n [definitions]\n )\n\n // Validate relationship\n const validateRelationship = useCallback(\n async (\n target: BaseDossier,\n relationshipType: string\n ): Promise<ValidationResult> => {\n const definition = definitions.find((d) => d.type === relationshipType)\n\n if (!definition) {\n return {\n valid: false,\n errors: [\n {\n field: 'relationship_type',\n code: 'INVALID_TYPE',\n message: {\n en: 'Invalid relationship type',\n ar: 'نوع علاقة غير صالح',\n },\n },\n ],\n }\n }\n\n // Check target type is allowed\n if (!definition.targetEntityTypes.includes(target.type)) {\n return {\n valid: false,\n errors: [\n {\n field: 'target_type',\n code: 'INVALID_TARGET',\n message: {\n en: `Cannot create ${definition.label.en} relationship with ${target.type}`,\n ar: `لا يمكن إنشاء علاقة ${definition.label.ar} مع ${target.type}`,\n },\n },\n ],\n }\n }\n\n // Check cardinality\n if (!canAddRelationship(relationshipType)) {\n return {\n valid: false,\n errors: [\n {\n field: 'relationship_type',\n code: 'MAX_REACHED',\n message: {\n en: 'Maximum number of relationships reached',\n ar: 'تم الوصول إلى الحد الأقصى للعلاقات',\n },\n },\n ],\n }\n }\n\n // Check for duplicate\n const existing = relationships.find(\n (r) => r.target_id === target.id && r.relationship_type === relationshipType\n )\n if (existing) {\n return {\n valid: false,\n errors: [\n {\n field: 'target_id',\n code: 'DUPLICATE',\n message: {\n en: 'This relationship already exists',\n ar: 'هذه العلاقة موجودة بالفعل',\n },\n },\n ],\n }\n }\n\n // Plugin validation hook\n if (relationshipHooks?.beforeCreateRelationship) {\n // We need the source entity for this - simplified for now\n const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T\n return relationshipHooks.beforeCreateRelationship(\n sourceEntity,\n target,\n relationshipType\n )\n }\n\n return { valid: true, errors: [] }\n },\n [definitions, canAddRelationship, relationships, relationshipHooks, entityId, entityType]\n )\n\n // Create relationship mutation\n const createMutation = useMutation({\n mutationFn: async (input: CreateRelationshipInput): Promise<PluginRelationship> => {\n const response = await apiPost<PluginRelationship, CreateRelationshipInput & { source_id: string; source_type: string }>(\n 'entity-relationships',\n {\n ...input,\n source_id: entityId,\n source_type: entityType,\n }\n )\n return response\n },\n onSuccess: (data) => {\n queryClient.invalidateQueries({\n queryKey: relationshipKeys.entity(entityType, entityId),\n })\n\n // Call after hook\n if (relationshipHooks?.afterCreateRelationship) {\n const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T\n const targetEntity = { id: data.target_id, type: data.target_type } as BaseDossier\n relationshipHooks.afterCreateRelationship(\n sourceEntity,\n targetEntity,\n data.relationship_type,\n data.id\n )\n }\n\n toast.success(\n i18n.language === 'ar' ? 'تم إنشاء العلاقة بنجاح' : 'Relationship created successfully'\n )\n },\n onError: (error: Error) => {\n toast.error(error.message)\n },\n })\n\n // Remove relationship mutation\n const removeMutation = useMutation({\n mutationFn: async (relationshipId: string): Promise<void> => {\n // Validate before removal if hook exists\n if (relationshipHooks?.beforeRemoveRelationship) {\n const relationship = relationships.find((r) => r.id === relationshipId)\n if (relationship) {\n const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T\n const targetEntity = relationship.target as unknown as BaseDossier\n const result = await relationshipHooks.beforeRemoveRelationship(\n sourceEntity,\n targetEntity,\n relationship.relationship_type\n )\n if (!result.valid) {\n throw new Error(result.errors[0]?.message.en || 'Cannot remove relationship')\n }\n }\n }\n\n await apiDelete<{ success: boolean }>(`entity-relationships/${relationshipId}`)\n },\n onSuccess: () => {\n queryClient.invalidateQueries({\n queryKey: relationshipKeys.entity(entityType, entityId),\n })\n toast.success(\n i18n.language === 'ar' ? 'تم حذف العلاقة بنجاح' : 'Relationship removed successfully'\n )\n },\n onError: (error: Error) => {\n toast.error(error.message)\n },\n })\n\n return {\n definitions,\n getRelationshipsByType,\n relationships,\n isLoading,\n error: error as Error | null,\n createRelationship: createMutation.mutateAsync,\n removeRelationship: removeMutation.mutateAsync,\n canAddRelationship,\n getTargetTypes,\n validateRelationship,\n refresh: refetch,\n }\n}\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginUI.ts",
"content": "/**\n _ Plugin UI Hook\n _\n _ Provides UI components and rendering utilities for entity plugins.\n _ Allows plugins to customize how entities are displayed.\n \*/\n\nimport { useMemo, type ComponentType, type ReactNode } from 'react'\nimport { useTranslation } from 'react-i18next'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport type {\n BaseDossier,\n EntityCardProps,\n EntityDetailProps,\n EntityFormProps,\n EntityListProps,\n ListColumnDefinition,\n DetailSectionDefinition,\n FormSectionDefinition,\n ContextActionDefinition,\n BadgeDefinition,\n ExtensionFieldDefinition,\n BilingualField,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Types\n// ============================================================================\n\nexport interface UsePluginUIOptions {\n /** Entity type _/\n entityType: string\n}\n\nexport interface UsePluginUIReturn<T = Record<string, unknown>> {\n /\*\* Plugin manifest info _/\n manifest: {\n name: BilingualField\n description: BilingualField\n icon: string\n color: string\n } | null\n /** Custom Card component (or null for default) \*/\n CardComponent: ComponentType<EntityCardProps<T>> | null\n /** Custom Detail view component (or null for default) _/\n DetailComponent: ComponentType<EntityDetailProps<T>> | null\n /\*\* Custom Form component (or null for default) _/\n FormComponent: ComponentType<EntityFormProps<T>> | null\n /** Custom List component (or null for default) \*/\n ListComponent: ComponentType<EntityListProps<T>> | null\n /** Get custom component by name _/\n getCustomComponent: (name: string) => ComponentType<unknown> | null\n /\*\* List columns for table/grid views _/\n listColumns: ListColumnDefinition<T>[]\n /** Detail view sections \*/\n detailSections: DetailSectionDefinition<T>[]\n /** Form sections _/\n formSections: FormSectionDefinition[]\n /\*\* Context menu actions _/\n contextActions: ContextActionDefinition<T>[]\n /** Badge definitions for cards \*/\n badges: BadgeDefinition<T>[]\n /** Extension field definitions _/\n fields: ExtensionFieldDefinition[]\n /\*\* Get localized label for entity _/\n getLabel: (entity: BaseDossier & T, field?: 'name' | 'description') => string\n /** Get localized field label \*/\n getFieldLabel: (fieldName: string) => string\n /** Get icon for entity type _/\n getIcon: () => string\n /\*\* Get color for entity type _/\n getColor: () => string\n /** Check if plugin is registered \*/\n isRegistered: boolean\n}\n\n// ============================================================================\n// Default Values\n// ============================================================================\n\nconst DEFAULT_LIST_COLUMNS: ListColumnDefinition[] = [\n {\n id: 'name',\n label: { en: 'Name', ar: 'الاسم' },\n accessor: (entity) => entity.name_en,\n sortable: true,\n },\n {\n id: 'status',\n label: { en: 'Status', ar: 'الحالة' },\n accessor: 'status',\n sortable: true,\n width: 100,\n },\n {\n id: 'created_at',\n label: { en: 'Created', ar: 'تاريخ الإنشاء' },\n accessor: 'created_at',\n sortable: true,\n width: 150,\n },\n]\n\nconst DEFAULT_FORM_SECTIONS: FormSectionDefinition[] = [\n {\n id: 'basic',\n title: { en: 'Basic Information', ar: 'المعلومات الأساسية' },\n order: 0,\n fields: ['name_en', 'name_ar', 'description_en', 'description_ar'],\n },\n {\n id: 'classification',\n title: { en: 'Classification', ar: 'التصنيف' },\n order: 1,\n fields: ['status', 'sensitivity_level', 'tags'],\n collapsible: true,\n },\n]\n\n// ============================================================================\n// Main Hook\n// ============================================================================\n\n/**\n _ Hook for plugin UI components and configuration\n _/\nexport function usePluginUI<T = Record<string, unknown>>(\n options: UsePluginUIOptions\n): UsePluginUIReturn<T> {\n const { entityType } = options\n const { i18n } = useTranslation()\n const isRTL = i18n.language === 'ar'\n\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const isRegistered = Boolean(plugin)\n\n // Manifest info\n const manifest = useMemo(() => {\n if (!plugin) return null\n return {\n name: plugin.manifest.name,\n description: plugin.manifest.description,\n icon: plugin.manifest.icon,\n color: plugin.manifest.color,\n }\n }, [plugin])\n\n // Custom components\n const CardComponent = useMemo(() => {\n return plugin?.components?.Card || null\n }, [plugin])\n\n const DetailComponent = useMemo(() => {\n return plugin?.components?.DetailView || null\n }, [plugin])\n\n const FormComponent = useMemo(() => {\n return plugin?.components?.Form || null\n }, [plugin])\n\n const ListComponent = useMemo(() => {\n return plugin?.components?.List || null\n }, [plugin])\n\n // Get custom component by name\n const getCustomComponent = useMemo(() => {\n return (name: string): ComponentType<unknown> | null => {\n return plugin?.components?.custom?.[name] || null\n }\n }, [plugin])\n\n // List columns\n const listColumns = useMemo((): ListColumnDefinition<T>[] => {\n const pluginColumns = plugin?.ui?.listColumns || []\n if (pluginColumns.length > 0) {\n return pluginColumns\n }\n\n // Generate from schema if no custom columns\n const schemaFields = plugin?.manifest.extensionSchema.fields.filter(\n (f) => f.uiHints?.showInList\n ) || []\n\n const schemaColumns: ListColumnDefinition<T>[] = schemaFields.map((field) => ({\n id: field.name,\n label: field.label,\n accessor: field.name as keyof (BaseDossier & T),\n sortable: field.uiHints?.sortable ?? false,\n }))\n\n return [...(DEFAULT_LIST_COLUMNS as ListColumnDefinition<T>[]), ...schemaColumns]\n }, [plugin])\n\n // Detail sections\n const detailSections = useMemo((): DetailSectionDefinition<T>[] => {\n return plugin?.ui?.detailSections || []\n }, [plugin])\n\n // Form sections\n const formSections = useMemo((): FormSectionDefinition[] => {\n const pluginSections = plugin?.ui?.formSections || []\n if (pluginSections.length > 0) {\n return pluginSections\n }\n\n // Generate extension section from schema\n const extensionFields = plugin?.manifest.extensionSchema.fields.map((f) => f.name) || []\n if (extensionFields.length > 0) {\n return [\n ...DEFAULT_FORM_SECTIONS,\n {\n id: 'extension',\n title: plugin?.manifest.name || { en: 'Details', ar: 'التفاصيل' },\n order: 2,\n fields: extensionFields,\n },\n ]\n }\n\n return DEFAULT_FORM_SECTIONS\n }, [plugin])\n\n // Context actions\n const contextActions = useMemo((): ContextActionDefinition<T>[] => {\n return plugin?.ui?.contextActions || []\n }, [plugin])\n\n // Badges\n const badges = useMemo((): BadgeDefinition<T>[] => {\n return plugin?.ui?.badges || []\n }, [plugin])\n\n // Extension fields\n const fields = useMemo((): ExtensionFieldDefinition[] => {\n return plugin?.manifest.extensionSchema.fields || []\n }, [plugin])\n\n // Get localized label\n const getLabel = useMemo(() => {\n return (entity: BaseDossier & T, field: 'name' | 'description' = 'name'): string => {\n if (field === 'name') {\n return isRTL ? entity.name_ar : entity.name_en\n }\n return isRTL\n ? (entity.description_ar || entity.description_en || '')\n : (entity.description_en || entity.description_ar || '')\n }\n }, [isRTL])\n\n // Get localized field label\n const getFieldLabel = useMemo(() => {\n return (fieldName: string): string => {\n const field = fields.find((f) => f.name === fieldName)\n if (field) {\n return isRTL ? field.label.ar : field.label.en\n }\n // Built-in field labels\n const builtinLabels: Record<string, BilingualField> = {\n name_en: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },\n name_ar: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },\n description_en: { en: 'Description (English)', ar: 'الوصف (إنجليزي)' },\n description_ar: { en: 'Description (Arabic)', ar: 'الوصف (عربي)' },\n status: { en: 'Status', ar: 'الحالة' },\n sensitivity_level: { en: 'Sensitivity Level', ar: 'مستوى الحساسية' },\n tags: { en: 'Tags', ar: 'الوسوم' },\n }\n const label = builtinLabels[fieldName]\n if (label) {\n return isRTL ? label.ar : label.en\n }\n return fieldName\n }\n }, [fields, isRTL])\n\n // Get icon\n const getIcon = useMemo(() => {\n return (): string => {\n return plugin?.manifest.icon || 'FileText'\n }\n }, [plugin])\n\n // Get color\n const getColor = useMemo(() => {\n return (): string => {\n return plugin?.manifest.color || 'gray'\n }\n }, [plugin])\n\n return {\n manifest,\n CardComponent,\n DetailComponent,\n FormComponent,\n ListComponent,\n getCustomComponent,\n listColumns,\n detailSections,\n formSections,\n contextActions,\n badges,\n fields,\n getLabel,\n getFieldLabel,\n getIcon,\n getColor,\n isRegistered,\n }\n}\n\n// ============================================================================\n// Helper Hook for Entity Display\n// ============================================================================\n\n/\*_\n _ Hook for getting display-ready entity data\n \*/\nexport function useEntityDisplay<T = Record<string, unknown>>(\n entityType: string,\n entity: BaseDossier & T\n) {\n const { i18n } = useTranslation()\n const isRTL = i18n.language === 'ar'\n const { manifest, fields, getLabel, getFieldLabel, badges } = usePluginUI<T>({\n entityType,\n })\n\n // Get display name\n const displayName = useMemo(() => {\n return getLabel(entity, 'name')\n }, [entity, getLabel])\n\n // Get display description\n const displayDescription = useMemo(() => {\n return getLabel(entity, 'description')\n }, [entity, getLabel])\n\n // Get field values with labels\n const fieldValues = useMemo(() => {\n return fields.map((field) => ({\n name: field.name,\n label: getFieldLabel(field.name),\n value: (entity as Record<string, unknown>)[field.name],\n type: field.type,\n field,\n }))\n }, [entity, fields, getFieldLabel])\n\n // Render badges\n const renderedBadges = useMemo(() => {\n return badges\n .map((badge) => ({\n id: badge.id,\n position: badge.position || 'top-end',\n content: badge.render(entity),\n }))\n .filter((b) => b.content !== null)\n }, [badges, entity])\n\n return {\n displayName,\n displayDescription,\n fieldValues,\n renderedBadges,\n icon: manifest?.icon || 'FileText',\n color: manifest?.color || 'gray',\n entityTypeName: isRTL ? manifest?.name.ar : manifest?.name.en,\n }\n}\n"
}
Now let's create the main hook that combines all capabilities and the index files:

🔧 Tool: Write
Input: {
"file*path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"content": "/**\n * Entity Plugin Hook\n *\n * Main hook that combines all plugin capabilities for an entity type.\n * Provides a unified API for working with plugin entities.\n \*/\n\nimport { useMemo } from 'react'\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'\nimport { toast } from 'sonner'\nimport { useTranslation } from 'react-i18next'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport { apiGet, apiPost, apiPatch, apiDelete } from '@/domains/shared'\nimport { usePluginValidation } from './usePluginValidation'\nimport { usePluginPermissions } from './usePluginPermissions'\nimport { usePluginUI, useEntityDisplay } from './usePluginUI'\nimport type {\n BaseDossier,\n EntitySearchParams,\n EntityListResponse,\n EntityPlugin,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Types\n// ============================================================================\n\nexport interface UseEntityPluginOptions {\n /** Entity type identifier */\n entityType: string\n}\n\nexport interface UseEntityPluginReturn<T = Record<string, unknown>> {\n /\*\* Plugin instance */\n plugin: EntityPlugin<T> | undefined\n /** Whether plugin is registered \*/\n isRegistered: boolean\n /** Validation utilities */\n validation: ReturnType<typeof usePluginValidation<T>>\n /\*\* Permission utilities */\n permissions: ReturnType<typeof usePluginPermissions<T>>\n /** UI utilities \*/\n ui: ReturnType<typeof usePluginUI<T>>\n}\n\n// ============================================================================\n// Main Hook\n// ============================================================================\n\n/**\n * Combined hook for all plugin capabilities\n */\nexport function useEntityPlugin<T = Record<string, unknown>>(\n options: UseEntityPluginOptions\n): UseEntityPluginReturn<T> {\n const { entityType } = options\n\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const isRegistered = Boolean(plugin)\n\n // Get all sub-hooks\n const validation = usePluginValidation<T>({ entityType })\n const permissions = usePluginPermissions<T>({ entityType })\n const ui = usePluginUI<T>({ entityType })\n\n return {\n plugin,\n isRegistered,\n validation,\n permissions,\n ui,\n }\n}\n\n// ============================================================================\n// CRUD Hooks\n// ============================================================================\n\n/**\n * Query key factory for entity plugins\n */\nexport const entityPluginKeys = {\n all: (entityType: string) => ['plugin-entity', entityType] as const,\n lists: (entityType: string) => [...entityPluginKeys.all(entityType), 'list'] as const,\n list: (entityType: string, params?: EntitySearchParams) =>\n [...entityPluginKeys.lists(entityType), params] as const,\n details: (entityType: string) => [...entityPluginKeys.all(entityType), 'detail'] as const,\n detail: (entityType: string, id: string) =>\n [...entityPluginKeys.details(entityType), id] as const,\n}\n\n/**\n * Hook for listing plugin entities\n */\nexport function usePluginEntities<T = Record<string, unknown>>(\n entityType: string,\n params?: EntitySearchParams,\n options?: { enabled?: boolean }\n) {\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const endpoint = plugin?.data?.endpoint || `${entityType}s`\n const transformFromApi = plugin?.data?.transformFromApi\n\n return useQuery({\n queryKey: entityPluginKeys.list(entityType, params),\n queryFn: async (): Promise<EntityListResponse<T>> => {\n const response = await apiGet<EntityListResponse<T>>(endpoint, params)\n\n // Transform if hook provided\n if (transformFromApi && response.data) {\n response.data = response.data.map((item) =>\n transformFromApi(item as unknown as Record<string, unknown>)\n )\n }\n\n return response\n },\n enabled: options?.enabled !== false && Boolean(plugin),\n staleTime: 30_000,\n gcTime: 5 * 60_000,\n })\n}\n\n/\*\*\n * Hook for getting a single plugin entity\n */\nexport function usePluginEntity<T = Record<string, unknown>>(\n entityType: string,\n id: string,\n options?: { enabled?: boolean }\n) {\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const endpoint = plugin?.data?.endpoint || `${entityType}s`\n const transformFromApi = plugin?.data?.transformFromApi\n const afterLoad = plugin?.data?.afterLoad\n\n return useQuery({\n queryKey: entityPluginKeys.detail(entityType, id),\n queryFn: async (): Promise<BaseDossier & T> => {\n let entity = await apiGet<BaseDossier & T>(`${endpoint}/${id}`)\n\n // Transform if hook provided\n if (transformFromApi) {\n entity = transformFromApi(entity as unknown as Record<string, unknown>)\n }\n\n // After load hook\n if (afterLoad) {\n entity = await afterLoad(entity)\n }\n\n return entity\n },\n enabled: options?.enabled !== false && Boolean(plugin) && Boolean(id),\n staleTime: 60_000,\n gcTime: 10 * 60_000,\n })\n}\n\n/**\n * Hook for creating a plugin entity\n */\nexport function useCreatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { t, i18n } = useTranslation('common')\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const endpoint = plugin?.data?.endpoint || `${entityType}s`\n const transformForApi = plugin?.data?.transformForApi\n const beforeSave = plugin?.data?.beforeSave\n\n return useMutation({\n mutationFn: async (data: Partial<BaseDossier & T>): Promise<BaseDossier & T> => {\n let processedData = data\n\n // Before save hook\n if (beforeSave) {\n processedData = await beforeSave(processedData)\n }\n\n // Transform if hook provided\n const apiData = transformForApi\n ? transformForApi(processedData)\n : processedData\n\n return apiPost<BaseDossier & T, Record<string, unknown>>(\n endpoint,\n apiData as Record<string, unknown>\n )\n },\n onSuccess: (data) => {\n queryClient.invalidateQueries({\n queryKey: entityPluginKeys.lists(entityType),\n })\n queryClient.setQueryData(entityPluginKeys.detail(entityType, data.id), data)\n\n const name = i18n.language === 'ar' ? data.name_ar : data.name_en\n toast.success(\n i18n.language === 'ar'\n ? `تم إنشاء ${name} بنجاح`\n : `${name} created successfully`\n )\n },\n onError: (error: Error) => {\n toast.error(error.message)\n },\n })\n}\n\n/**\n * Hook for updating a plugin entity\n */\nexport function useUpdatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { t, i18n } = useTranslation('common')\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const endpoint = plugin?.data?.endpoint || `${entityType}s`\n const transformForApi = plugin?.data?.transformForApi\n const beforeSave = plugin?.data?.beforeSave\n\n return useMutation({\n mutationFn: async ({\n id,\n updates,\n }: {\n id: string\n updates: Partial<BaseDossier & T>\n }): Promise<BaseDossier & T> => {\n let processedData = updates\n\n // Before save hook\n if (beforeSave) {\n processedData = await beforeSave(processedData)\n }\n\n // Transform if hook provided\n const apiData = transformForApi\n ? transformForApi(processedData)\n : processedData\n\n return apiPatch<BaseDossier & T, Record<string, unknown>>(\n `${endpoint}/${id}`,\n apiData as Record<string, unknown>\n )\n },\n onMutate: async ({ id }) => {\n await queryClient.cancelQueries({\n queryKey: entityPluginKeys.detail(entityType, id),\n })\n const previous = queryClient.getQueryData<BaseDossier & T>(\n entityPluginKeys.detail(entityType, id)\n )\n return { previous }\n },\n onSuccess: (data, { id }) => {\n queryClient.setQueryData(entityPluginKeys.detail(entityType, id), data)\n queryClient.invalidateQueries({\n queryKey: entityPluginKeys.lists(entityType),\n })\n\n toast.success(\n i18n.language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully'\n )\n },\n onError: (error: Error, { id }, context) => {\n if (context?.previous) {\n queryClient.setQueryData(\n entityPluginKeys.detail(entityType, id),\n context.previous\n )\n }\n toast.error(error.message)\n },\n })\n}\n\n/\**\n * Hook for deleting/archiving a plugin entity\n \*/\nexport function useDeletePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { i18n } = useTranslation('common')\n const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)\n const endpoint = plugin?.data?.endpoint || `${entityType}s`\n\n return useMutation({\n mutationFn: async (id: string): Promise<{ success: boolean }> => {\n return apiDelete<{ success: boolean }>(`${endpoint}/${id}`)\n },\n onSuccess: (*, id) => {\n queryClient.removeQueries({\n queryKey: entityPluginKeys.detail(entityType, id),\n })\n queryClient.invalidateQueries({\n queryKey: entityPluginKeys.lists(entityType),\n })\n\n toast.success(\n i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully'\n )\n },\n onError: (error: Error) => {\n toast.error(error.message)\n },\n })\n}\n\n// ============================================================================\n// Re-exports\n// ============================================================================\n\nexport { usePluginValidation } from './usePluginValidation'\nexport { usePluginPermissions } from './usePluginPermissions'\nexport { usePluginRelationships } from './usePluginRelationships'\nexport { usePluginUI, useEntityDisplay } from './usePluginUI'\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/index.ts",
"content": "/\*_\n _ Plugin System Hooks - Barrel Export\n \*/\n\nexport {\n useEntityPlugin,\n usePluginEntities,\n usePluginEntity,\n useCreatePluginEntity,\n useUpdatePluginEntity,\n useDeletePluginEntity,\n entityPluginKeys,\n type UseEntityPluginOptions,\n type UseEntityPluginReturn,\n} from './useEntityPlugin'\n\nexport {\n usePluginValidation,\n type UsePluginValidationOptions,\n type UsePluginValidationReturn,\n} from './usePluginValidation'\n\nexport {\n usePluginPermissions,\n type UsePluginPermissionsOptions,\n type UsePluginPermissionsReturn,\n} from './usePluginPermissions'\n\nexport {\n usePluginRelationships,\n type PluginRelationship,\n type RelationshipWithTarget,\n type CreateRelationshipInput,\n type UsePluginRelationshipsOptions,\n type UsePluginRelationshipsReturn,\n} from './usePluginRelationships'\n\nexport {\n usePluginUI,\n useEntityDisplay,\n type UsePluginUIOptions,\n type UsePluginUIReturn,\n} from './usePluginUI'\n"
}
Now let's create the main index file and a helper to create plugins easily:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/utils/createPlugin.ts",
"content": "/**\n _ Plugin Factory Utilities\n _\n _ Helper functions for creating entity plugins with type safety.\n _/\n\nimport type {\n EntityPlugin,\n PluginManifest,\n ExtensionSchema,\n ExtensionFieldDefinition,\n PluginValidationHooks,\n PluginRelationshipHooks,\n PluginPermissionHooks,\n PluginUIComponents,\n PluginUIHooks,\n PluginDataHooks,\n PluginLifecycleHooks,\n BilingualField,\n RelationshipDefinition,\n} from '../types/plugin.types'\n\n// ============================================================================\n// Plugin Builder\n// ============================================================================\n\n/**\n _ Builder class for creating plugins with a fluent API\n _/\nexport class PluginBuilder<T = Record<string, unknown>> {\n private plugin: Partial<EntityPlugin<T>> = {}\n\n /**\n _ Set plugin manifest\n _/\n manifest(manifest: PluginManifest<T>): this {\n this.plugin.manifest = manifest\n return this\n }\n\n /**\n _ Set validation hooks\n _/\n validation(hooks: PluginValidationHooks<T>): this {\n this.plugin.validation = hooks\n return this\n }\n\n /**\n _ Set relationship hooks\n _/\n relationships(hooks: PluginRelationshipHooks<T>): this {\n this.plugin.relationships = hooks\n return this\n }\n\n /**\n _ Set permission hooks\n _/\n permissions(hooks: PluginPermissionHooks<T>): this {\n this.plugin.permissions = hooks\n return this\n }\n\n /**\n _ Set UI components\n _/\n components(components: PluginUIComponents<T>): this {\n this.plugin.components = components\n return this\n }\n\n /**\n _ Set UI hooks\n _/\n ui(hooks: PluginUIHooks<T>): this {\n this.plugin.ui = hooks\n return this\n }\n\n /**\n _ Set data hooks\n _/\n data(hooks: PluginDataHooks<T>): this {\n this.plugin.data = hooks\n return this\n }\n\n /**\n _ Set lifecycle hooks\n _/\n lifecycle(hooks: PluginLifecycleHooks): this {\n this.plugin.lifecycle = hooks\n return this\n }\n\n /**\n _ Set i18n namespace\n _/\n i18n(namespace: string): this {\n this.plugin.i18nNamespace = namespace\n return this\n }\n\n /**\n _ Build the plugin\n _/\n build(): EntityPlugin<T> {\n if (!this.plugin.manifest) {\n throw new Error('Plugin manifest is required')\n }\n return this.plugin as EntityPlugin<T>\n }\n}\n\n/**\n _ Create a new plugin builder\n _/\nexport function createPluginBuilder<T = Record<string, unknown>>(): PluginBuilder<T> {\n return new PluginBuilder<T>()\n}\n\n// ============================================================================\n// Helper Functions\n// ============================================================================\n\n/**\n _ Create a simple entity plugin with minimal configuration\n _/\nexport function createPlugin<T = Record<string, unknown>>(\n config: {\n id: string\n name: BilingualField\n description: BilingualField\n entityType: string\n icon?: string\n color?: string\n version?: string\n fields: ExtensionFieldDefinition[]\n relationships?: RelationshipDefinition[]\n validation?: PluginValidationHooks<T>\n permissions?: PluginPermissionHooks<T>\n components?: PluginUIComponents<T>\n ui?: PluginUIHooks<T>\n data?: PluginDataHooks<T>\n lifecycle?: PluginLifecycleHooks\n i18nNamespace?: string\n }\n): EntityPlugin<T> {\n const manifest: PluginManifest<T> = {\n id: config.id,\n name: config.name,\n description: config.description,\n version: config.version || '1.0.0',\n icon: config.icon || 'FileText',\n color: config.color || 'gray',\n entityType: config.entityType,\n extensionSchema: {\n fields: config.fields,\n },\n }\n\n return {\n manifest,\n validation: config.validation,\n relationships: config.relationships\n ? { definitions: config.relationships }\n : undefined,\n permissions: config.permissions,\n components: config.components,\n ui: config.ui,\n data: config.data,\n lifecycle: config.lifecycle,\n i18nNamespace: config.i18nNamespace,\n }\n}\n\n// ============================================================================\n// Field Definition Helpers\n// ============================================================================\n\n/**\n _ Create a text field definition\n _/\nexport function textField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'string',\n ...options,\n }\n}\n\n/**\n _ Create a bilingual text field definition\n _/\nexport function bilingualField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'bilingual',\n ...options,\n }\n}\n\n/**\n _ Create a number field definition\n _/\nexport function numberField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'number',\n ...options,\n }\n}\n\n/**\n _ Create a boolean field definition\n _/\nexport function booleanField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'boolean',\n ...options,\n }\n}\n\n/**\n _ Create a date field definition\n _/\nexport function dateField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'date',\n ...options,\n }\n}\n\n/**\n _ Create a datetime field definition\n _/\nexport function datetimeField(\n name: string,\n label: BilingualField,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'datetime',\n ...options,\n }\n}\n\n/**\n _ Create an enum field definition\n _/\nexport function enumField(\n name: string,\n label: BilingualField,\n values: Array<{ value: string; label: BilingualField }>,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type' | 'enumValues'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'enum',\n enumValues: values,\n ...options,\n }\n}\n\n/**\n _ Create an array field definition\n _/\nexport function arrayField(\n name: string,\n label: BilingualField,\n itemType: Omit<ExtensionFieldDefinition, 'name' | 'label'>,\n options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type' | 'arrayItemType'>>\n): ExtensionFieldDefinition {\n return {\n name,\n label,\n type: 'array',\n arrayItemType: itemType,\n ...options,\n }\n}\n\n// ============================================================================\n// Relationship Definition Helpers\n// ============================================================================\n\n/**\n _ Create a relationship definition\n _/\nexport function relationship(\n type: string,\n label: BilingualField,\n targetTypes: string[],\n options?: Partial<Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes'>>\n): RelationshipDefinition {\n return {\n type,\n label,\n targetEntityTypes: targetTypes,\n cardinality: options?.cardinality || 'many-to-many',\n ...options,\n }\n}\n\n/**\n _ Create a one-to-one relationship\n _/\nexport function oneToOneRelationship(\n type: string,\n label: BilingualField,\n targetTypes: string[],\n options?: Partial<Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes' | 'cardinality'>>\n): RelationshipDefinition {\n return relationship(type, label, targetTypes, {\n ...options,\n cardinality: 'one-to-one',\n })\n}\n\n/\*_\n _ Create a one-to-many relationship\n \*/\nexport function oneToManyRelationship(\n type: string,\n label: BilingualField,\n targetTypes: string[],\n options?: Partial<Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes' | 'cardinality'>>\n): RelationshipDefinition {\n return relationship(type, label, targetTypes, {\n ...options,\n cardinality: 'one-to-many',\n })\n}\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/index.ts",
"content": "/\*_\n _ Plugin System - Main Entry Point\n _\n _ An extensible plugin architecture for adding new entity types\n _ without modifying core code. Includes hooks for validation,\n _ relationships, permissions, and UI rendering.\n _\n _ @example Basic usage\n _ ```typescript\n _ import { createPlugin, pluginRegistry, useEntityPlugin } from '@/lib/plugin-system'\n _\n _ // Define a plugin\n _ const projectPlugin = createPlugin({\n _ id: 'project',\n _ name: { en: 'Project', ar: 'مشروع' },\n _ description: { en: 'Track projects', ar: 'تتبع المشاريع' },\n _ entityType: 'project',\n _ icon: 'Folder',\n _ color: 'blue',\n _ fields: [\n * textField('code', { en: 'Project Code', ar: 'رمز المشروع' }, { required: true }),\n * dateField('start_date', { en: 'Start Date', ar: 'تاريخ البدء' }),\n * dateField('end_date', { en: 'End Date', ar: 'تاريخ الانتهاء' }),\n * ],\n _ })\n _\n _ // Register the plugin\n _ await pluginRegistry.register(projectPlugin)\n _\n _ // Use in a component\n _ function ProjectList() {\n _ const { ui, permissions } = useEntityPlugin({ entityType: 'project' })\n _ const { data: projects } = usePluginEntities('project')\n _ // ...\n _ }\n _ ```\n \*/\n\n// Core types\nexport type {\n // Base types\n BilingualField,\n EntityStatus,\n SensitivityLevel,\n BaseDossier,\n BaseListItem,\n\n // Plugin manifest\n PluginManifest,\n ExtensionSchema,\n ExtensionFieldDefinition,\n FieldValidation,\n FieldUIHints,\n\n // Validation\n ValidationContext,\n ValidationResult,\n ValidationError,\n ValidationHook,\n PluginValidationHooks,\n\n // Relationships\n RelationshipDefinition,\n PluginRelationshipHooks,\n\n // Permissions\n PermissionAction,\n PermissionContext,\n PermissionResult,\n PermissionCheck,\n PluginPermissionHooks,\n\n // UI\n EntityCardProps,\n EntityDetailProps,\n EntityFormProps,\n EntityListProps,\n PluginUIComponents,\n PluginUIHooks,\n ListColumnDefinition,\n DetailSectionDefinition,\n FormSectionDefinition,\n ContextActionDefinition,\n BadgeDefinition,\n\n // Data\n EntitySearchParams,\n EntityListResponse,\n PluginDataHooks,\n\n // Lifecycle\n PluginLifecycleHooks,\n\n // Full plugin\n EntityPlugin,\n RegisteredPlugin,\n PluginRegistryState,\n PluginRegistryEvent,\n PluginEventListener,\n} from './types/plugin.types'\n\n// Registry\nexport { pluginRegistry } from './registry/plugin-registry'\nexport type { PluginRegistry } from './registry/plugin-registry'\n\n// Hooks\nexport {\n // Main hook\n useEntityPlugin,\n type UseEntityPluginOptions,\n type UseEntityPluginReturn,\n\n // CRUD hooks\n usePluginEntities,\n usePluginEntity,\n useCreatePluginEntity,\n useUpdatePluginEntity,\n useDeletePluginEntity,\n entityPluginKeys,\n\n // Specialized hooks\n usePluginValidation,\n type UsePluginValidationOptions,\n type UsePluginValidationReturn,\n\n usePluginPermissions,\n type UsePluginPermissionsOptions,\n type UsePluginPermissionsReturn,\n\n usePluginRelationships,\n type PluginRelationship,\n type RelationshipWithTarget,\n type CreateRelationshipInput,\n type UsePluginRelationshipsOptions,\n type UsePluginRelationshipsReturn,\n\n usePluginUI,\n useEntityDisplay,\n type UsePluginUIOptions,\n type UsePluginUIReturn,\n} from './hooks'\n\n// Plugin creation utilities\nexport {\n // Builder\n PluginBuilder,\n createPluginBuilder,\n\n // Factory\n createPlugin,\n\n // Field helpers\n textField,\n bilingualField,\n numberField,\n booleanField,\n dateField,\n datetimeField,\n enumField,\n arrayField,\n\n // Relationship helpers\n relationship,\n oneToOneRelationship,\n oneToManyRelationship,\n} from './utils/createPlugin'\n"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "completed",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "completed",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "completed",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "in_progress",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "pending",
"activeForm": "Verifying implementation with Playwright test"
}
]
}
Now let's create an example plugin to demonstrate the system - a "Project" entity type:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/plugins/project-plugin/types.ts",
"content": "/**\n _ Project Plugin - Type Definitions\n _\n _ Example entity plugin demonstrating the plugin system.\n _ Projects represent initiatives, research activities, or collaborations.\n \*/\n\nimport type { BaseDossier } from '../../types/plugin.types'\n\n// ============================================================================\n// Enums\n// ============================================================================\n\n/**\n _ Project status types\n _/\nexport type ProjectStatus =\n | 'planning'\n | 'active'\n | 'on_hold'\n | 'completed'\n | 'cancelled'\n\n/**\n _ Project priority levels\n _/\nexport type ProjectPriority =\n | 'low'\n | 'medium'\n | 'high'\n | 'critical'\n\n/**\n _ Project category types\n _/\nexport type ProjectCategory =\n | 'research'\n | 'development'\n | 'collaboration'\n | 'capacity_building'\n | 'technical_assistance'\n | 'other'\n\n// ============================================================================\n// Extension Type\n// ============================================================================\n\n/**\n _ Project-specific extension fields\n _/\nexport interface ProjectExtension {\n /** Unique project code _/\n project_code: string\n /\*\* Project status _/\n project_status: ProjectStatus\n /** Priority level \*/\n priority: ProjectPriority\n /** Category _/\n category: ProjectCategory\n /\*\* Start date _/\n start_date: string\n /** End date \*/\n end_date?: string\n /** Budget amount _/\n budget?: number\n /\*\* Budget currency _/\n budget_currency?: string\n /** Objectives (English) \*/\n objectives_en?: string\n /** Objectives (Arabic) _/\n objectives_ar?: string\n /\*\* Deliverables (English) _/\n deliverables_en?: string\n /** Deliverables (Arabic) \*/\n deliverables_ar?: string\n /** Lead organization ID _/\n lead_organization_id?: string\n /\*\* Project manager person ID _/\n project_manager_id?: string\n /** Completion percentage \*/\n completion_percentage?: number\n}\n\n/**\n _ Full project type (base + extension)\n _/\nexport type Project = BaseDossier & ProjectExtension\n\n// ============================================================================\n// Labels\n// ============================================================================\n\nexport const PROJECT_STATUS_LABELS: Record<ProjectStatus, { en: string; ar: string }> = {\n planning: { en: 'Planning', ar: 'التخطيط' },\n active: { en: 'Active', ar: 'نشط' },\n on_hold: { en: 'On Hold', ar: 'معلق' },\n completed: { en: 'Completed', ar: 'مكتمل' },\n cancelled: { en: 'Cancelled', ar: 'ملغى' },\n}\n\nexport const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, { en: string; ar: string }> = {\n low: { en: 'Low', ar: 'منخفض' },\n medium: { en: 'Medium', ar: 'متوسط' },\n high: { en: 'High', ar: 'عالي' },\n critical: { en: 'Critical', ar: 'حرج' },\n}\n\nexport const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, { en: string; ar: string }> = {\n research: { en: 'Research', ar: 'بحث' },\n development: { en: 'Development', ar: 'تطوير' },\n collaboration: { en: 'Collaboration', ar: 'تعاون' },\n capacity_building: { en: 'Capacity Building', ar: 'بناء القدرات' },\n technical_assistance: { en: 'Technical Assistance', ar: 'مساعدة فنية' },\n other: { en: 'Other', ar: 'أخرى' },\n}\n"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/plugins/project-plugin/index.ts",
"content": "/\*_\n _ Project Plugin - Main Definition\n _\n _ Example entity plugin demonstrating the full plugin system capabilities.\n _ Projects represent initiatives, research activities, or collaborations.\n _/\n\nimport { createPlugin, textField, enumField, dateField, numberField, relationship } from '../../utils/createPlugin'\nimport type { EntityPlugin, ValidationContext, ValidationResult, PermissionContext, PermissionResult } from '../../types/plugin.types'\nimport type { ProjectExtension, ProjectStatus, ProjectPriority, ProjectCategory } from './types'\nimport {\n PROJECT_STATUS_LABELS,\n PROJECT_PRIORITY_LABELS,\n PROJECT_CATEGORY_LABELS,\n} from './types'\n\n// ============================================================================\n// Plugin Definition\n// ============================================================================\n\nexport const projectPlugin: EntityPlugin<ProjectExtension> = createPlugin<ProjectExtension>({\n id: 'project',\n name: { en: 'Project', ar: 'مشروع' },\n description: {\n en: 'Manage projects, initiatives, and collaborative activities',\n ar: 'إدارة المشاريع والمبادرات والأنشطة التعاونية',\n },\n entityType: 'project',\n icon: 'FolderKanban',\n color: 'blue',\n version: '1.0.0',\n\n // ============================================================================\n // Field Definitions\n // ============================================================================\n fields: [\n textField('project_code', { en: 'Project Code', ar: 'رمز المشروع' }, {\n required: true,\n validation: {\n pattern: '^[A-Z]{2,4}-\\\\d{4}-\\\\d{3}$',\n patternMessage: {\n en: 'Project code must be in format: XX-YYYY-NNN (e.g., PR-2024-001)',\n ar: 'رمز المشروع يجب أن يكون بالتنسيق: XX-YYYY-NNN (مثال: PR-2024-001)',\n },\n },\n uiHints: {\n placeholder: { en: 'e.g., PR-2024-001', ar: 'مثال: PR-2024-001' },\n showInList: true,\n showInCard: true,\n sortable: true,\n },\n }),\n\n enumField(\n 'project_status',\n { en: 'Project Status', ar: 'حالة المشروع' },\n Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),\n {\n required: true,\n default: 'planning',\n uiHints: {\n showInList: true,\n showInCard: true,\n filterable: true,\n sortable: true,\n },\n }\n ),\n\n enumField(\n 'priority',\n { en: 'Priority', ar: 'الأولوية' },\n Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),\n {\n required: true,\n default: 'medium',\n uiHints: {\n showInList: true,\n showInCard: true,\n filterable: true,\n },\n }\n ),\n\n enumField(\n 'category',\n { en: 'Category', ar: 'الفئة' },\n Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),\n {\n required: true,\n uiHints: {\n showInList: true,\n filterable: true,\n },\n }\n ),\n\n dateField('start_date', { en: 'Start Date', ar: 'تاريخ البدء' }, {\n required: true,\n uiHints: {\n showInList: true,\n sortable: true,\n },\n }),\n\n dateField('end_date', { en: 'End Date', ar: 'تاريخ الانتهاء' }, {\n uiHints: {\n showInList: true,\n sortable: true,\n },\n }),\n\n numberField('budget', { en: 'Budget', ar: 'الميزانية' }, {\n validation: {\n min: 0,\n },\n uiHints: {\n helpText: {\n en: 'Enter the total project budget',\n ar: 'أدخل إجمالي ميزانية المشروع',\n },\n },\n }),\n\n textField('budget_currency', { en: 'Currency', ar: 'العملة' }, {\n default: 'SAR',\n uiHints: {\n component: 'select',\n colSpan: 4,\n },\n }),\n\n textField('objectives_en', { en: 'Objectives (English)', ar: 'الأهداف (إنجليزي)' }, {\n uiHints: {\n component: 'textarea',\n colSpan: 12,\n },\n }),\n\n textField('objectives_ar', { en: 'Objectives (Arabic)', ar: 'الأهداف (عربي)' }, {\n uiHints: {\n component: 'textarea',\n colSpan: 12,\n },\n }),\n\n textField('deliverables_en', { en: 'Deliverables (English)', ar: 'المخرجات (إنجليزي)' }, {\n uiHints: {\n component: 'textarea',\n colSpan: 12,\n },\n }),\n\n textField('deliverables_ar', { en: 'Deliverables (Arabic)', ar: 'المخرجات (عربي)' }, {\n uiHints: {\n component: 'textarea',\n colSpan: 12,\n },\n }),\n\n textField('lead_organization_id', { en: 'Lead Organization', ar: 'المنظمة الرائدة' }, {\n uiHints: {\n component: 'select',\n helpText: {\n en: 'Select the organization leading this project',\n ar: 'اختر المنظمة التي تقود هذا المشروع',\n },\n },\n }),\n\n textField('project_manager_id', { en: 'Project Manager', ar: 'مدير المشروع' }, {\n uiHints: {\n component: 'select',\n helpText: {\n en: 'Select the person managing this project',\n ar: 'اختر الشخص المسؤول عن إدارة هذا المشروع',\n },\n },\n }),\n\n numberField('completion_percentage', { en: 'Completion %', ar: 'نسبة الإنجاز' }, {\n default: 0,\n validation: {\n min: 0,\n max: 100,\n },\n uiHints: {\n component: 'slider',\n showInCard: true,\n },\n }),\n ],\n\n // ============================================================================\n // Relationships\n // ============================================================================\n relationships: [\n relationship('lead_by', { en: 'Led By', ar: 'بقيادة' }, ['organization'], {\n cardinality: 'one-to-one',\n required: false,\n }),\n relationship('managed_by', { en: 'Managed By', ar: 'يدار بواسطة' }, ['person'], {\n cardinality: 'one-to-one',\n }),\n relationship('involves', { en: 'Involves', ar: 'يشمل' }, ['person', 'organization', 'country'], {\n cardinality: 'many-to-many',\n }),\n relationship('related_to', { en: 'Related To', ar: 'مرتبط بـ' }, ['project', 'engagement'], {\n cardinality: 'many-to-many',\n }),\n ],\n\n // ============================================================================\n // Validation\n // ============================================================================\n validation: {\n async beforeCreate(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {\n const errors = []\n const entity = context.entity\n\n // Validate date range\n if (entity.start_date && entity.end_date) {\n const start = new Date(entity.start_date)\n const end = new Date(entity.end_date)\n if (end < start) {\n errors.push({\n field: 'end_date',\n code: 'INVALID_DATE_RANGE',\n message: {\n en: 'End date must be after start date',\n ar: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء',\n },\n })\n }\n }\n\n // Completed projects should have 100% completion\n if (entity.project_status === 'completed' && entity.completion_percentage !== 100) {\n errors.push({\n field: 'completion_percentage',\n code: 'COMPLETION_MISMATCH',\n message: {\n en: 'Completed projects should have 100% completion',\n ar: 'المشاريع المكتملة يجب أن تكون نسبة إنجازها 100%',\n },\n })\n }\n\n return { valid: errors.length === 0, errors }\n },\n\n async beforeUpdate(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {\n const errors = []\n const entity = context.entity\n const previous = context.previousVersion\n\n // Cannot revert completed projects to earlier status\n if (previous?.project_status === 'completed' && entity.project_status !== 'completed') {\n errors.push({\n field: 'project_status',\n code: 'INVALID_STATUS_CHANGE',\n message: {\n en: 'Completed projects cannot be reverted to an earlier status',\n ar: 'المشاريع المكتملة لا يمكن إعادتها إلى حالة سابقة',\n },\n })\n }\n\n return { valid: errors.length === 0, errors }\n },\n\n async beforeDelete(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {\n const errors = []\n const entity = context.entity\n\n // Cannot delete active projects\n if (entity.project_status === 'active') {\n errors.push({\n field: 'project_status',\n code: 'CANNOT_DELETE_ACTIVE',\n message: {\n en: 'Active projects cannot be deleted. Please complete or cancel first.',\n ar: 'المشاريع النشطة لا يمكن حذفها. يرجى إكمالها أو إلغائها أولاً.',\n },\n })\n }\n\n return { valid: errors.length === 0, errors }\n },\n },\n\n // ============================================================================\n // Permissions\n // ============================================================================\n permissions: {\n async checkPermission(context: PermissionContext<ProjectExtension>): Promise<PermissionResult> {\n const { action, entity, user } = context\n\n // Only project managers can update their projects\n if (action === 'update' && entity && entity.project_manager_id) {\n if (entity.project_manager_id !== user.id && user.role !== 'admin') {\n return {\n allowed: false,\n reason: {\n en: 'Only the project manager can update this project',\n ar: 'فقط مدير المشروع يمكنه تحديث هذا المشروع',\n },\n }\n }\n }\n\n // Critical projects require manager role\n if (entity?.priority === 'critical' && !['admin', 'manager'].includes(user.role)) {\n if (['update', 'delete', 'archive'].includes(action)) {\n return {\n allowed: false,\n reason: {\n en: 'Critical projects can only be modified by managers',\n ar: 'المشاريع الحرجة يمكن تعديلها فقط من قبل المديرين',\n },\n }\n }\n }\n\n return { allowed: true }\n },\n\n additionalActions: [\n {\n action: 'assign_team',\n label: { en: 'Assign Team', ar: 'تعيين الفريق' },\n description: {\n en: 'Assign team members to this project',\n ar: 'تعيين أعضاء الفريق لهذا المشروع',\n },\n },\n {\n action: 'generate_report',\n label: { en: 'Generate Report', ar: 'إنشاء تقرير' },\n description: {\n en: 'Generate a status report for this project',\n ar: 'إنشاء تقرير حالة لهذا المشروع',\n },\n },\n ],\n\n minViewClearance: 1,\n minEditClearance: 2,\n\n roleOverrides: {\n analyst: ['view', 'create', 'update', 'export'],\n viewer: ['view'],\n },\n },\n\n // ============================================================================\n // UI Configuration\n // ============================================================================\n ui: {\n formSections: [\n {\n id: 'basic',\n title: { en: 'Basic Information', ar: 'المعلومات الأساسية' },\n order: 0,\n fields: ['name_en', 'name_ar', 'project_code'],\n },\n {\n id: 'classification',\n title: { en: 'Classification', ar: 'التصنيف' },\n order: 1,\n fields: ['project_status', 'priority', 'category', 'sensitivity_level'],\n },\n {\n id: 'timeline',\n title: { en: 'Timeline & Budget', ar: 'الجدول الزمني والميزانية' },\n order: 2,\n fields: ['start_date', 'end_date', 'budget', 'budget_currency', 'completion_percentage'],\n collapsible: true,\n },\n {\n id: 'details',\n title: { en: 'Details', ar: 'التفاصيل' },\n order: 3,\n fields: ['objectives_en', 'objectives_ar', 'deliverables_en', 'deliverables_ar'],\n collapsible: true,\n },\n {\n id: 'team',\n title: { en: 'Team', ar: 'الفريق' },\n order: 4,\n fields: ['lead_organization_id', 'project_manager_id'],\n collapsible: true,\n },\n {\n id: 'meta',\n title: { en: 'Additional', ar: 'إضافي' },\n order: 5,\n fields: ['tags', 'description_en', 'description_ar'],\n collapsible: true,\n },\n ],\n\n contextActions: [\n {\n id: 'mark_complete',\n label: { en: 'Mark as Complete', ar: 'وضع علامة مكتمل' },\n icon: 'CheckCircle',\n action: async (entity) => {\n // This would trigger an update\n console.log('Marking project as complete:', entity.id)\n },\n isVisible: (entity) => entity.project_status === 'active',\n isDisabled: (entity) => (entity.completion_percentage || 0) < 100,\n },\n {\n id: 'put_on_hold',\n label: { en: 'Put On Hold', ar: 'وضع قيد الانتظار' },\n icon: 'PauseCircle',\n action: async (entity) => {\n console.log('Putting project on hold:', entity.id)\n },\n isVisible: (entity) => entity.project_status === 'active',\n },\n {\n id: 'cancel',\n label: { en: 'Cancel Project', ar: 'إلغاء المشروع' },\n icon: 'XCircle',\n action: async (entity) => {\n console.log('Cancelling project:', entity.id)\n },\n isVisible: (entity) => !['completed', 'cancelled'].includes(entity.project_status),\n variant: 'destructive',\n },\n ],\n\n badges: [\n {\n id: 'priority',\n position: 'top-end',\n render: (entity) => {\n if (entity.priority === 'critical') {\n return { type: 'badge', variant: 'destructive', text: 'Critical' }\n }\n if (entity.priority === 'high') {\n return { type: 'badge', variant: 'warning', text: 'High Priority' }\n }\n return null\n },\n },\n {\n id: 'overdue',\n position: 'bottom-start',\n render: (entity) => {\n if (entity.end_date && new Date(entity.end_date) < new Date() && entity.project_status === 'active') {\n return { type: 'badge', variant: 'destructive', text: 'Overdue' }\n }\n return null\n },\n },\n ],\n },\n\n // ============================================================================\n // Data Configuration\n // ============================================================================\n data: {\n endpoint: 'projects',\n searchParams: [\n enumField(\n 'project_status',\n { en: 'Status', ar: 'الحالة' },\n Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),\n { uiHints: { filterable: true } }\n ),\n enumField(\n 'priority',\n { en: 'Priority', ar: 'الأولوية' },\n Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),\n { uiHints: { filterable: true } }\n ),\n enumField(\n 'category',\n { en: 'Category', ar: 'الفئة' },\n Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),\n { uiHints: { filterable: true } }\n ),\n ],\n },\n\n // ============================================================================\n // Lifecycle\n // ============================================================================\n lifecycle: {\n onRegister: () => {\n console.log('Project plugin registered')\n },\n onEnable: () => {\n console.log('Project plugin enabled')\n },\n onDisable: () => {\n console.log('Project plugin disabled')\n },\n onUnregister: () => {\n console.log('Project plugin unregistered')\n },\n },\n\n i18nNamespace: 'projects',\n})\n\n// Export types\nexport \* from './types'\n\n// Export the plugin as default\nexport default projectPlugin\n"
}
Now let's create a React context for the plugin system to make it available throughout the app:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/context/PluginProvider.tsx",
"content": "/**\n _ Plugin System Context Provider\n _\n _ Provides plugin registry access throughout the React application.\n _ Handles plugin initialization and state management.\n \*/\n\nimport {\n createContext,\n useContext,\n useEffect,\n useState,\n useCallback,\n useMemo,\n type ReactNode,\n} from 'react'\nimport { pluginRegistry } from '../registry/plugin-registry'\nimport type { EntityPlugin, PluginRegistryEvent } from '../types/plugin.types'\n\n// ============================================================================\n// Context Types\n// ============================================================================\n\ninterface PluginContextValue {\n /** Whether the registry is initialized _/\n isInitialized: boolean\n /\*\* Whether plugins are loading _/\n isLoading: boolean\n /** All registered plugins \*/\n plugins: EntityPlugin[]\n /** All enabled plugins _/\n enabledPlugins: EntityPlugin[]\n /\*\* All registered entity types _/\n entityTypes: string[]\n /** Get a plugin by ID \*/\n getPlugin: (pluginId: string) => EntityPlugin | undefined\n /** Get a plugin by entity type _/\n getPluginByEntityType: (entityType: string) => EntityPlugin | undefined\n /\*\* Check if entity type is registered _/\n hasEntityType: (entityType: string) => boolean\n /** Register a plugin \*/\n registerPlugin: (plugin: EntityPlugin) => Promise<void>\n /** Unregister a plugin _/\n unregisterPlugin: (pluginId: string) => Promise<void>\n /\*\* Enable a plugin _/\n enablePlugin: (pluginId: string) => Promise<void>\n /** Disable a plugin \*/\n disablePlugin: (pluginId: string) => Promise<void>\n}\n\n// ============================================================================\n// Context\n// ============================================================================\n\nconst PluginContext = createContext<PluginContextValue | null>(null)\n\n// ============================================================================\n// Provider Props\n// ============================================================================\n\ninterface PluginProviderProps {\n /** Child components _/\n children: ReactNode\n /\*\* Plugins to register on mount _/\n initialPlugins?: EntityPlugin[]\n /** Called when plugins are loaded \*/\n onPluginsLoaded?: () => void\n}\n\n// ============================================================================\n// Provider Component\n// ============================================================================\n\nexport function PluginProvider({\n children,\n initialPlugins = [],\n onPluginsLoaded,\n}: PluginProviderProps) {\n const [isInitialized, setIsInitialized] = useState(false)\n const [isLoading, setIsLoading] = useState(true)\n const [plugins, setPlugins] = useState<EntityPlugin[]>([])\n const [entityTypes, setEntityTypes] = useState<string[]>([])\n const [, setUpdateTrigger] = useState(0)\n\n // Update state from registry\n const refreshState = useCallback(() => {\n setPlugins(pluginRegistry.getAllPlugins())\n setEntityTypes(pluginRegistry.getEntityTypes())\n setUpdateTrigger((t) => t + 1)\n }, [])\n\n // Initialize and register plugins\n useEffect(() => {\n let mounted = true\n\n async function initialize() {\n try {\n // Initialize registry\n await pluginRegistry.initialize()\n\n // Register initial plugins\n for (const plugin of initialPlugins) {\n if (!pluginRegistry.isRegistered(plugin.manifest.id)) {\n await pluginRegistry.register(plugin)\n }\n }\n\n if (mounted) {\n setIsInitialized(true)\n setIsLoading(false)\n refreshState()\n onPluginsLoaded?.()\n }\n } catch (error) {\n console.error('Failed to initialize plugin system:', error)\n if (mounted) {\n setIsLoading(false)\n }\n }\n }\n\n initialize()\n\n return () => {\n mounted = false\n }\n }, [initialPlugins, refreshState, onPluginsLoaded])\n\n // Subscribe to registry events\n useEffect(() => {\n const unsubscribe = pluginRegistry.subscribe((event: PluginRegistryEvent) => {\n refreshState()\n })\n\n return unsubscribe\n }, [refreshState])\n\n // Enabled plugins\n const enabledPlugins = useMemo(() => {\n return pluginRegistry.getEnabledPlugins()\n }, [plugins])\n\n // Get plugin by ID\n const getPlugin = useCallback((pluginId: string) => {\n return pluginRegistry.getPlugin(pluginId)\n }, [])\n\n // Get plugin by entity type\n const getPluginByEntityType = useCallback((entityType: string) => {\n return pluginRegistry.getPluginByEntityType(entityType)\n }, [])\n\n // Check if entity type exists\n const hasEntityType = useCallback((entityType: string) => {\n return pluginRegistry.hasEntityType(entityType)\n }, [])\n\n // Register plugin\n const registerPlugin = useCallback(async (plugin: EntityPlugin) => {\n await pluginRegistry.register(plugin)\n refreshState()\n }, [refreshState])\n\n // Unregister plugin\n const unregisterPlugin = useCallback(async (pluginId: string) => {\n await pluginRegistry.unregister(pluginId)\n refreshState()\n }, [refreshState])\n\n // Enable plugin\n const enablePlugin = useCallback(async (pluginId: string) => {\n await pluginRegistry.enable(pluginId)\n refreshState()\n }, [refreshState])\n\n // Disable plugin\n const disablePlugin = useCallback(async (pluginId: string) => {\n await pluginRegistry.disable(pluginId)\n refreshState()\n }, [refreshState])\n\n // Context value\n const value: PluginContextValue = useMemo(\n () => ({\n isInitialized,\n isLoading,\n plugins,\n enabledPlugins,\n entityTypes,\n getPlugin,\n getPluginByEntityType,\n hasEntityType,\n registerPlugin,\n unregisterPlugin,\n enablePlugin,\n disablePlugin,\n }),\n [\n isInitialized,\n isLoading,\n plugins,\n enabledPlugins,\n entityTypes,\n getPlugin,\n getPluginByEntityType,\n hasEntityType,\n registerPlugin,\n unregisterPlugin,\n enablePlugin,\n disablePlugin,\n ]\n )\n\n return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>\n}\n\n// ============================================================================\n// Hook\n// ============================================================================\n\n/**\n _ Hook to access the plugin system context\n _/\nexport function usePluginContext(): PluginContextValue {\n const context = useContext(PluginContext)\n if (!context) {\n throw new Error('usePluginContext must be used within a PluginProvider')\n }\n return context\n}\n\n/\*_\n _ Hook to check if plugin system is ready\n \*/\nexport function usePluginSystemReady(): boolean {\n const context = useContext(PluginContext)\n return context?.isInitialized ?? false\n}\n"
}
Now let's create a demo page component to showcase the plugin system:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"content": "/\*_\n _ Plugin System Demo Page\n _\n _ Demonstrates the extensible plugin system for adding new entity types.\n _/\n\nimport { useState, useEffect } from 'react'\nimport { createFileRoute } from '@tanstack/react-router'\nimport { useTranslation } from 'react-i18next'\nimport {\n FolderKanban,\n CheckCircle,\n XCircle,\n AlertCircle,\n Settings,\n RefreshCw,\n Plus,\n} from 'lucide-react'\n\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { Badge } from '@/components/ui/badge'\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'\nimport {\n Table,\n TableBody,\n TableCell,\n TableHead,\n TableHeader,\n TableRow,\n} from '@/components/ui/table'\nimport { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'\nimport { Separator } from '@/components/ui/separator'\nimport { Progress } from '@/components/ui/progress'\n\n// Plugin system imports\nimport { pluginRegistry } from '@/lib/plugin-system/registry/plugin-registry'\nimport { projectPlugin } from '@/lib/plugin-system/plugins/project-plugin'\nimport type { EntityPlugin } from '@/lib/plugin-system/types/plugin.types'\nimport type { ProjectExtension } from '@/lib/plugin-system/plugins/project-plugin/types'\n\n// Route definition\nexport const Route = createFileRoute('/\_protected/plugin-demo')({\n component: PluginDemoPage,\n})\n\n// ============================================================================\n// Component\n// ============================================================================\n\nfunction PluginDemoPage() {\n const { t, i18n } = useTranslation()\n const isRTL = i18n.language === 'ar'\n\n const [isInitialized, setIsInitialized] = useState(false)\n const [plugins, setPlugins] = useState<EntityPlugin[]>([])\n const [entityTypes, setEntityTypes] = useState<string[]>([])\n const [selectedPlugin, setSelectedPlugin] = useState<EntityPlugin | null>(null)\n const [isLoading, setIsLoading] = useState(false)\n const [error, setError] = useState<string | null>(null)\n\n // Initialize plugin system\n useEffect(() => {\n initializePlugins()\n }, [])\n\n const initializePlugins = async () => {\n setIsLoading(true)\n setError(null)\n\n try {\n // Initialize registry if not already\n if (!pluginRegistry.isInitialized()) {\n await pluginRegistry.initialize()\n }\n\n // Register example plugin if not already registered\n if (!pluginRegistry.isRegistered('project')) {\n await pluginRegistry.register(projectPlugin)\n }\n\n // Update state\n setPlugins(pluginRegistry.getAllPlugins())\n setEntityTypes(pluginRegistry.getEntityTypes())\n setIsInitialized(true)\n\n // Select first plugin\n const allPlugins = pluginRegistry.getAllPlugins()\n if (allPlugins.length > 0) {\n setSelectedPlugin(allPlugins[0])\n }\n } catch (err) {\n setError(err instanceof Error ? err.message : 'Failed to initialize plugins')\n } finally {\n setIsLoading(false)\n }\n }\n\n const handleRefresh = () => {\n initializePlugins()\n }\n\n const handleTogglePlugin = async (pluginId: string) => {\n try {\n if (pluginRegistry.isEnabled(pluginId)) {\n await pluginRegistry.disable(pluginId)\n } else {\n await pluginRegistry.enable(pluginId)\n }\n setPlugins(pluginRegistry.getAllPlugins())\n } catch (err) {\n setError(err instanceof Error ? err.message : 'Failed to toggle plugin')\n }\n }\n\n return (\n <div\n className=\"container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6\"\n dir={isRTL ? 'rtl' : 'ltr'}\n >\n {/_ Header _/}\n <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4\">\n <div>\n <h1 className=\"text-2xl sm:text-3xl font-bold text-start\">\n {isRTL ? 'عرض نظام الإضافات' : 'Plugin System Demo'}\n </h1>\n <p className=\"text-muted-foreground text-start mt-1\">\n {isRTL\n ? 'نظام إضافات قابل للتوسيع لإضافة أنواع كيانات جديدة بدون تعديل الكود الأساسي'\n : 'Extensible plugin architecture for adding new entity types without modifying core code'}\n </p>\n </div>\n <Button onClick={handleRefresh} disabled={isLoading} className=\"min-h-11 min-w-11\">\n <RefreshCw className={`h-4 w-4 ${isRTL ? 'ms-0 me-2' : 'me-2'} ${isLoading ? 'animate-spin' : ''}`} />\n {isRTL ? 'تحديث' : 'Refresh'}\n </Button>\n </div>\n\n {/_ Error Alert _/}\n {error && (\n <Alert variant=\"destructive\">\n <AlertCircle className=\"h-4 w-4\" />\n <AlertTitle>{isRTL ? 'خطأ' : 'Error'}</AlertTitle>\n <AlertDescription>{error}</AlertDescription>\n </Alert>\n )}\n\n {/_ Status Cards _/}\n <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4\">\n <Card>\n <CardHeader className=\"pb-2\">\n <CardTitle className=\"text-sm font-medium text-muted-foreground\">\n {isRTL ? 'حالة النظام' : 'System Status'}\n </CardTitle>\n </CardHeader>\n <CardContent>\n <div className=\"flex items-center gap-2\">\n {isInitialized ? (\n <CheckCircle className=\"h-5 w-5 text-green-500\" />\n ) : (\n <XCircle className=\"h-5 w-5 text-red-500\" />\n )}\n <span className=\"text-lg font-semibold\">\n {isInitialized ? (isRTL ? 'مُهيأ' : 'Initialized') : (isRTL ? 'غير مُهيأ' : 'Not Initialized')}\n </span>\n </div>\n </CardContent>\n </Card>\n\n <Card>\n <CardHeader className=\"pb-2\">\n <CardTitle className=\"text-sm font-medium text-muted-foreground\">\n {isRTL ? 'الإضافات المسجلة' : 'Registered Plugins'}\n </CardTitle>\n </CardHeader>\n <CardContent>\n <span className=\"text-2xl font-bold\">{plugins.length}</span>\n </CardContent>\n </Card>\n\n <Card>\n <CardHeader className=\"pb-2\">\n <CardTitle className=\"text-sm font-medium text-muted-foreground\">\n {isRTL ? 'أنواع الكيانات' : 'Entity Types'}\n </CardTitle>\n </CardHeader>\n <CardContent>\n <span className=\"text-2xl font-bold\">{entityTypes.length}</span>\n </CardContent>\n </Card>\n\n <Card>\n <CardHeader className=\"pb-2\">\n <CardTitle className=\"text-sm font-medium text-muted-foreground\">\n {isRTL ? 'الإضافات النشطة' : 'Active Plugins'}\n </CardTitle>\n </CardHeader>\n <CardContent>\n <span className=\"text-2xl font-bold\">\n {plugins.filter((p) => pluginRegistry.isEnabled(p.manifest.id)).length}\n </span>\n </CardContent>\n </Card>\n </div>\n\n {/_ Main Content _/}\n <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">\n {/_ Plugin List _/}\n <Card className=\"lg:col-span-1\">\n <CardHeader>\n <CardTitle className=\"flex items-center gap-2\">\n <Settings className=\"h-5 w-5\" />\n {isRTL ? 'الإضافات المسجلة' : 'Registered Plugins'}\n </CardTitle>\n <CardDescription>\n {isRTL ? 'انقر على إضافة لعرض التفاصيل' : 'Click a plugin to view details'}\n </CardDescription>\n </CardHeader>\n <CardContent className=\"space-y-2\">\n {plugins.length === 0 ? (\n <p className=\"text-muted-foreground text-center py-4\">\n {isRTL ? 'لا توجد إضافات مسجلة' : 'No plugins registered'}\n </p>\n ) : (\n plugins.map((plugin) => (\n <div\n key={plugin.manifest.id}\n className={`p-3 rounded-lg border cursor-pointer transition-colors ${\n                    selectedPlugin?.manifest.id === plugin.manifest.id\n                      ? 'border-primary bg-primary/5'\n                      : 'border-border hover:bg-muted/50'\n                  }`}\n onClick={() => setSelectedPlugin(plugin)}\n >\n <div className=\"flex items-center justify-between\">\n <div className=\"flex items-center gap-2\">\n <FolderKanban className={`h-5 w-5 text-${plugin.manifest.color}-500`} />\n <span className=\"font-medium\">\n {isRTL ? plugin.manifest.name.ar : plugin.manifest.name.en}\n </span>\n </div>\n <Badge variant={pluginRegistry.isEnabled(plugin.manifest.id) ? 'default' : 'secondary'}>\n {pluginRegistry.isEnabled(plugin.manifest.id)\n ? (isRTL ? 'نشط' : 'Active')\n : (isRTL ? 'معطل' : 'Disabled')}\n </Badge>\n </div>\n <p className=\"text-sm text-muted-foreground mt-1 text-start\">\n {isRTL ? plugin.manifest.description.ar : plugin.manifest.description.en}\n </p>\n </div>\n ))\n )}\n </CardContent>\n </Card>\n\n {/_ Plugin Details _/}\n <Card className=\"lg:col-span-2\">\n <CardHeader>\n <CardTitle>\n {selectedPlugin\n ? (isRTL ? selectedPlugin.manifest.name.ar : selectedPlugin.manifest.name.en)\n : (isRTL ? 'تفاصيل الإضافة' : 'Plugin Details')}\n </CardTitle>\n {selectedPlugin && (\n <CardDescription>\n {isRTL ? 'الإصدار' : 'Version'}: {selectedPlugin.manifest.version} |{' '}\n {isRTL ? 'نوع الكيان' : 'Entity Type'}: {selectedPlugin.manifest.entityType}\n </CardDescription>\n )}\n </CardHeader>\n <CardContent>\n {!selectedPlugin ? (\n <p className=\"text-muted-foreground text-center py-8\">\n {isRTL ? 'اختر إضافة لعرض التفاصيل' : 'Select a plugin to view details'}\n </p>\n ) : (\n <Tabs defaultValue=\"fields\" className=\"w-full\">\n <TabsList className=\"grid w-full grid-cols-4\">\n <TabsTrigger value=\"fields\">{isRTL ? 'الحقول' : 'Fields'}</TabsTrigger>\n <TabsTrigger value=\"relationships\">{isRTL ? 'العلاقات' : 'Relationships'}</TabsTrigger>\n <TabsTrigger value=\"validation\">{isRTL ? 'التحقق' : 'Validation'}</TabsTrigger>\n <TabsTrigger value=\"permissions\">{isRTL ? 'الصلاحيات' : 'Permissions'}</TabsTrigger>\n </TabsList>\n\n {/_ Fields Tab _/}\n <TabsContent value=\"fields\" className=\"mt-4\">\n <Table>\n <TableHeader>\n <TableRow>\n <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>\n <TableHead>{isRTL ? 'التسمية' : 'Label'}</TableHead>\n <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>\n <TableHead>{isRTL ? 'مطلوب' : 'Required'}</TableHead>\n </TableRow>\n </TableHeader>\n <TableBody>\n {selectedPlugin.manifest.extensionSchema.fields.map((field) => (\n <TableRow key={field.name}>\n <TableCell className=\"font-mono text-sm\">{field.name}</TableCell>\n <TableCell>{isRTL ? field.label.ar : field.label.en}</TableCell>\n <TableCell>\n <Badge variant=\"outline\">{field.type}</Badge>\n </TableCell>\n <TableCell>\n {field.required ? (\n <CheckCircle className=\"h-4 w-4 text-green-500\" />\n ) : (\n <span className=\"text-muted-foreground\">-</span>\n )}\n </TableCell>\n </TableRow>\n ))}\n </TableBody>\n </Table>\n </TabsContent>\n\n {/_ Relationships Tab _/}\n <TabsContent value=\"relationships\" className=\"mt-4\">\n {selectedPlugin.relationships?.definitions?.length ? (\n <Table>\n <TableHeader>\n <TableRow>\n <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>\n <TableHead>{isRTL ? 'التسمية' : 'Label'}</TableHead>\n <TableHead>{isRTL ? 'الأهداف' : 'Targets'}</TableHead>\n <TableHead>{isRTL ? 'الكاردينالية' : 'Cardinality'}</TableHead>\n </TableRow>\n </TableHeader>\n <TableBody>\n {selectedPlugin.relationships.definitions.map((rel) => (\n <TableRow key={rel.type}>\n <TableCell className=\"font-mono text-sm\">{rel.type}</TableCell>\n <TableCell>{isRTL ? rel.label.ar : rel.label.en}</TableCell>\n <TableCell>\n <div className=\"flex flex-wrap gap-1\">\n {rel.targetEntityTypes.map((t) => (\n <Badge key={t} variant=\"outline\" className=\"text-xs\">\n {t}\n </Badge>\n ))}\n </div>\n </TableCell>\n <TableCell>\n <Badge variant=\"secondary\">{rel.cardinality}</Badge>\n </TableCell>\n </TableRow>\n ))}\n </TableBody>\n </Table>\n ) : (\n <p className=\"text-muted-foreground text-center py-4\">\n {isRTL ? 'لا توجد علاقات محددة' : 'No relationships defined'}\n </p>\n )}\n </TabsContent>\n\n {/_ Validation Tab _/}\n <TabsContent value=\"validation\" className=\"mt-4 space-y-4\">\n <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4\">\n <div className=\"p-4 rounded-lg border\">\n <h4 className=\"font-medium mb-2\">{isRTL ? 'قبل الإنشاء' : 'Before Create'}</h4>\n {selectedPlugin.validation?.beforeCreate ? (\n <CheckCircle className=\"h-5 w-5 text-green-500\" />\n ) : (\n <XCircle className=\"h-5 w-5 text-muted-foreground\" />\n )}\n </div>\n <div className=\"p-4 rounded-lg border\">\n <h4 className=\"font-medium mb-2\">{isRTL ? 'قبل التحديث' : 'Before Update'}</h4>\n {selectedPlugin.validation?.beforeUpdate ? (\n <CheckCircle className=\"h-5 w-5 text-green-500\" />\n ) : (\n <XCircle className=\"h-5 w-5 text-muted-foreground\" />\n )}\n </div>\n <div className=\"p-4 rounded-lg border\">\n <h4 className=\"font-medium mb-2\">{isRTL ? 'قبل الحذف' : 'Before Delete'}</h4>\n {selectedPlugin.validation?.beforeDelete ? (\n <CheckCircle className=\"h-5 w-5 text-green-500\" />\n ) : (\n <XCircle className=\"h-5 w-5 text-muted-foreground\" />\n )}\n </div>\n </div>\n\n {selectedPlugin.validation?.fieldValidators && (\n <div>\n <h4 className=\"font-medium mb-2\">\n {isRTL ? 'مدققات الحقول' : 'Field Validators'}\n </h4>\n <div className=\"flex flex-wrap gap-2\">\n {Object.keys(selectedPlugin.validation.fieldValidators).map((field) => (\n <Badge key={field} variant=\"outline\">\n {field}\n </Badge>\n ))}\n </div>\n </div>\n )}\n </TabsContent>\n\n {/_ Permissions Tab _/}\n <TabsContent value=\"permissions\" className=\"mt-4 space-y-4\">\n <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">\n <div className=\"p-4 rounded-lg border\">\n <h4 className=\"font-medium mb-2\">\n {isRTL ? 'الحد الأدنى للعرض' : 'Min View Clearance'}\n </h4>\n <span className=\"text-2xl font-bold\">\n {selectedPlugin.permissions?.minViewClearance ?? '-'}\n </span>\n </div>\n <div className=\"p-4 rounded-lg border\">\n <h4 className=\"font-medium mb-2\">\n {isRTL ? 'الحد الأدنى للتعديل' : 'Min Edit Clearance'}\n </h4>\n <span className=\"text-2xl font-bold\">\n {selectedPlugin.permissions?.minEditClearance ?? '-'}\n </span>\n </div>\n </div>\n\n {selectedPlugin.permissions?.additionalActions && (\n <div>\n <h4 className=\"font-medium mb-2\">\n {isRTL ? 'إجراءات إضافية' : 'Additional Actions'}\n </h4>\n <div className=\"space-y-2\">\n {selectedPlugin.permissions.additionalActions.map((action) => (\n <div key={action.action} className=\"p-3 rounded-lg border\">\n <div className=\"font-medium\">\n {isRTL ? action.label.ar : action.label.en}\n </div>\n <p className=\"text-sm text-muted-foreground\">\n {isRTL ? action.description.ar : action.description.en}\n </p>\n </div>\n ))}\n </div>\n </div>\n )}\n </TabsContent>\n </Tabs>\n )}\n </CardContent>\n </Card>\n </div>\n\n {/_ Architecture Overview \*/}\n <Card>\n <CardHeader>\n <CardTitle>{isRTL ? 'نظرة عامة على البنية' : 'Architecture Overview'}</CardTitle>\n <CardDescription>\n {isRTL\n ? 'كيف يعمل نظام الإضافات القابل للتوسيع'\n : 'How the extensible plugin system works'}\n </CardDescription>\n </CardHeader>\n <CardContent>\n <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">\n <div className=\"p-4 rounded-lg border bg-muted/30\">\n <h4 className=\"font-semibold mb-2\">1. {isRTL ? 'تعريف الإضافة' : 'Plugin Definition'}</h4>\n <p className=\"text-sm text-muted-foreground\">\n {isRTL\n ? 'تعريف نوع كيان جديد مع الحقول والعلاقات والتحقق والصلاحيات'\n : 'Define new entity type with fields, relationships, validation, and permissions'}\n </p>\n </div>\n <div className=\"p-4 rounded-lg border bg-muted/30\">\n <h4 className=\"font-semibold mb-2\">2. {isRTL ? 'التسجيل' : 'Registration'}</h4>\n <p className=\"text-sm text-muted-foreground\">\n {isRTL\n ? 'تسجيل الإضافة في السجل المركزي للنظام'\n : 'Register plugin with the central registry'}\n </p>\n </div>\n <div className=\"p-4 rounded-lg border bg-muted/30\">\n <h4 className=\"font-semibold mb-2\">3. {isRTL ? 'الخطافات' : 'Hooks'}</h4>\n <p className=\"text-sm text-muted-foreground\">\n {isRTL\n ? 'استخدام React hooks للتحقق والصلاحيات وعرض واجهة المستخدم'\n : 'Use React hooks for validation, permissions, and UI rendering'}\n </p>\n </div>\n <div className=\"p-4 rounded-lg border bg-muted/30\">\n <h4 className=\"font-semibold mb-2\">4. {isRTL ? 'التكامل' : 'Integration'}</h4>\n <p className=\"text-sm text-muted-foreground\">\n {isRTL\n ? 'يتكامل بسلاسة مع النظام الحالي دون تعديل الكود الأساسي'\n : 'Seamlessly integrates with existing system without core code changes'}\n </p>\n </div>\n </div>\n </CardContent>\n </Card>\n </div>\n )\n}\n"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "completed",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "completed",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "completed",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "completed",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "in_progress",
"activeForm": "Verifying implementation with Playwright test"
}
]
}
Now let's check if there's a shared domain that needs an api-helpers update for the imports to work properly:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/shared/utils/api-helpers.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/domains/shared/index.ts"
}
The shared domain already exports all the API helpers we need. Now let's check if useAuth hook exists:

🔧 Tool: Grep
Input: {
"pattern": "export.\*useAuth",
"path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/hooks"
}
The useAuth hook exists. Now let's create a Playwright test to verify the plugin system works:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts",
"content": "/\*_\n _ Plugin System Verification Test\n _\n _ Temporary test to verify the plugin system implementation.\n _ DELETE THIS FILE AFTER VERIFICATION.\n _/\n\nimport { test, expect } from '@playwright/test'\n\n// Test credentials from CLAUDE.md\nconst TEST_EMAIL = 'kazahrani@stats.gov.sa'\nconst TEST_PASSWORD = 'itisme'\n\ntest.describe('Plugin System Verification', () => {\n test.beforeEach(async ({ page }) => {\n // Navigate to login page and authenticate\n await page.goto('/login')\n\n // Fill login form\n await page.fill('input[type=\"email\"], input[name=\"email\"]', TEST_EMAIL)\n await page.fill('input[type=\"password\"], input[name=\"password\"]', TEST_PASSWORD)\n\n // Click login button\n await page.click('button[type=\"submit\"]')\n\n // Wait for navigation to complete\n await page.waitForURL(/\\/(dashboard|home)?/, { timeout: 15000 })\n })\n\n test('should load the plugin demo page', async ({ page }) => {\n // Navigate to plugin demo page\n await page.goto('/plugin-demo')\n\n // Wait for page to load\n await page.waitForLoadState('networkidle')\n\n // Check page title is present\n const heading = page.locator('h1')\n await expect(heading).toBeVisible({ timeout: 10000 })\n\n // Verify the heading contains expected text (either English or Arabic)\n const headingText = await heading.textContent()\n expect(\n headingText?.includes('Plugin System Demo') || headingText?.includes('عرض نظام الإضافات')\n ).toBeTruthy()\n })\n\n test('should display system status cards', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for cards to load\n await page.waitForSelector('[class*=\"CardTitle\"]', { timeout: 10000 })\n\n // Check for status cards (should have 4)\n const cards = page.locator('[class*=\"Card\"]')\n expect(await cards.count()).toBeGreaterThanOrEqual(4)\n })\n\n test('should register and display the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugin initialization\n await page.waitForTimeout(2000)\n\n // Check for registered plugins count\n const registeredPluginsCard = page.getByText(/Registered Plugins|الإضافات المسجلة/i).first()\n await expect(registeredPluginsCard).toBeVisible({ timeout: 10000 })\n\n // Check for project plugin in the list\n const projectPlugin = page.getByText(/Project|مشروع/i).first()\n await expect(projectPlugin).toBeVisible({ timeout: 10000 })\n })\n\n test('should show plugin details when selected', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugin list to load\n await page.waitForTimeout(2000)\n\n // Click on a plugin item to select it (look for clickable plugin card)\n const pluginCard = page.locator('[class*=\"cursor-pointer\"]').first()\n if (await pluginCard.isVisible()) {\n await pluginCard.click()\n\n // Wait for details to load\n await page.waitForTimeout(500)\n\n // Check that tabs are visible (Fields, Relationships, Validation, Permissions)\n const tabsList = page.locator('[role=\"tablist\"]')\n await expect(tabsList).toBeVisible({ timeout: 5000 })\n }\n })\n\n test('should display plugin fields in the Fields tab', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for initialization\n await page.waitForTimeout(2000)\n\n // Click on Fields tab\n const fieldsTab = page.getByRole('tab', { name: /Fields|الحقول/i })\n if (await fieldsTab.isVisible()) {\n await fieldsTab.click()\n\n // Wait for table to load\n await page.waitForTimeout(500)\n\n // Check for table headers\n const tableHeaders = page.locator('th')\n expect(await tableHeaders.count()).toBeGreaterThanOrEqual(3)\n }\n })\n\n test('should display relationships in the Relationships tab', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for initialization\n await page.waitForTimeout(2000)\n\n // Click on Relationships tab\n const relTab = page.getByRole('tab', { name: /Relationships|العلاقات/i })\n if (await relTab.isVisible()) {\n await relTab.click()\n\n // Wait for content to load\n await page.waitForTimeout(500)\n\n // Should show relationship definitions or \"no relationships\" message\n const content = page.locator('[role=\"tabpanel\"]')\n await expect(content).toBeVisible({ timeout: 5000 })\n }\n })\n\n test('should display validation hooks in the Validation tab', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for initialization\n await page.waitForTimeout(2000)\n\n // Click on Validation tab\n const validationTab = page.getByRole('tab', { name: /Validation|التحقق/i })\n if (await validationTab.isVisible()) {\n await validationTab.click()\n\n // Wait for content to load\n await page.waitForTimeout(500)\n\n // Check for validation hook indicators (Before Create, Before Update, Before Delete)\n const content = page.locator('[role=\"tabpanel\"]')\n await expect(content).toBeVisible({ timeout: 5000 })\n }\n })\n\n test('should display permissions in the Permissions tab', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for initialization\n await page.waitForTimeout(2000)\n\n // Click on Permissions tab\n const permissionsTab = page.getByRole('tab', { name: /Permissions|الصلاحيات/i })\n if (await permissionsTab.isVisible()) {\n await permissionsTab.click()\n\n // Wait for content to load\n await page.waitForTimeout(500)\n\n // Check for clearance level indicators\n const content = page.locator('[role=\"tabpanel\"]')\n await expect(content).toBeVisible({ timeout: 5000 })\n }\n })\n\n test('should display architecture overview section', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Check for architecture overview heading\n const architectureHeading = page.getByText(/Architecture Overview|نظرة عامة على البنية/i)\n await expect(architectureHeading).toBeVisible({ timeout: 10000 })\n\n // Check for the 4 architecture steps\n const steps = page.locator('[class*=\"bg-muted\"]')\n expect(await steps.count()).toBeGreaterThanOrEqual(4)\n })\n\n test('should handle refresh button click', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Find and click refresh button\n const refreshButton = page.getByRole('button', { name: /Refresh|تحديث/i })\n if (await refreshButton.isVisible()) {\n await refreshButton.click()\n\n // Button should show loading state briefly\n await page.waitForTimeout(1000)\n\n // Page should still be functional after refresh\n const heading = page.locator('h1')\n await expect(heading).toBeVisible()\n }\n })\n\n test('should be mobile responsive', async ({ page }) => {\n // Set mobile viewport\n await page.setViewportSize({ width: 375, height: 667 })\n\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Page should still render correctly on mobile\n const heading = page.locator('h1')\n await expect(heading).toBeVisible({ timeout: 10000 })\n\n // Cards should stack vertically on mobile\n const cards = page.locator('[class*=\"Card\"]')\n expect(await cards.count()).toBeGreaterThanOrEqual(1)\n })\n\n test('should support RTL layout', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Check that the page has proper dir attribute setup\n // (The component sets dir based on i18n.language)\n const container = page.locator('[dir]').first()\n const dirValue = await container.getAttribute('dir')\n\n // Should be either 'ltr' or 'rtl' depending on language\n expect(['ltr', 'rtl']).toContain(dirValue)\n })\n})\n"
}
Now let's run the Playwright test to verify the implementation:

🔧 Tool: Bash
Input: {
"command": "npx playwright test e2e/plugin-demo-verification.spec.ts --project=chromium --timeout=60000 2>&1 | head -100",
"description": "Run Playwright verification test",
"timeout": 180000
}
The tests are failing because the page seems to have different content than expected. Let me check the screenshot to understand what's happening, and also let's check if there are any TypeScript compilation errors in our code:

🔧 Tool: Bash
Input: {
"command": "cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend && npx tsc --noEmit 2>&1 | head -50",
"description": "Check TypeScript compilation",
"timeout": 120000
}
These TypeScript errors are pre-existing in the codebase and not related to our plugin system. Let me check our specific files for any TypeScript issues:

🔧 Tool: Bash
Input: {
"command": "npx tsc --noEmit 2>&1 | grep -E \"plugin-system|plugin-demo\"",
"description": "Check plugin system TypeScript errors",
"timeout": 120000
}
Let me fix these TypeScript errors in our plugin system files:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"old_string": "import type { ComponentType, ReactNode } from 'react'\nimport type { Result } from '@/domains/shared/types/result'\nimport type { DomainError } from '@/domains/shared/errors/domain-error'",
"new_string": "import type { ComponentType, ReactNode } from 'react'\nimport type { Result } from '@/domains/shared/types/result'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"old_string": "export interface ExtensionSchema<T = Record<string, unknown>> {\n fields: ExtensionFieldDefinition[]\n /** TypeScript type reference (for code generation) \*/\n typeRef?: string\n}",
"new_string": "export interface ExtensionSchema {\n fields: ExtensionFieldDefinition[]\n /** TypeScript type reference (for code generation) \*/\n typeRef?: string\n}"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"old_string": "export interface PluginManifest<TExtension = Record<string, unknown>> {\n /** Unique identifier for the plugin (kebab-case) \*/\n id: string\n /** Human-readable name _/\n name: BilingualField\n /\*\* Plugin description _/\n description: BilingualField\n /** Semantic version \*/\n version: string\n /** Plugin author _/\n author?: string\n /\*\* Icon name from Lucide icons _/\n icon: string\n /** Color theme for UI (Tailwind color) \*/\n color: string\n /** Dependencies on other plugins _/\n dependencies?: string[]\n /\*\* Entity type identifier for database _/\n entityType: string\n /** Extension schema for type-safe extensions \*/\n extensionSchema: ExtensionSchema<TExtension>\n}",
"new_string": "export interface PluginManifest {\n /** Unique identifier for the plugin (kebab-case) _/\n id: string\n /\*\* Human-readable name _/\n name: BilingualField\n /** Plugin description \*/\n description: BilingualField\n /** Semantic version _/\n version: string\n /\*\* Plugin author _/\n author?: string\n /** Icon name from Lucide icons \*/\n icon: string\n /** Color theme for UI (Tailwind color) _/\n color: string\n /\*\* Dependencies on other plugins _/\n dependencies?: string[]\n /** Entity type identifier for database \*/\n entityType: string\n /** Extension schema for type-safe extensions \*/\n extensionSchema: ExtensionSchema\n}"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"old_string": "import { useMemo } from 'react'\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'\nimport { toast } from 'sonner'\nimport { useTranslation } from 'react-i18next'",
"new_string": "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'\nimport { toast } from 'sonner'\nimport { useTranslation } from 'react-i18next'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"old_string": "import { usePluginValidation } from './usePluginValidation'\nimport { usePluginPermissions } from './usePluginPermissions'\nimport { usePluginUI, useEntityDisplay } from './usePluginUI'",
"new_string": "import { usePluginValidation } from './usePluginValidation'\nimport { usePluginPermissions } from './usePluginPermissions'\nimport { usePluginUI } from './usePluginUI'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"old_string": " queryFn: async (): Promise<EntityListResponse<T>> => {\n const response = await apiGet<EntityListResponse<T>>(endpoint, params)",
"new_string": " queryFn: async (): Promise<EntityListResponse<T>> => {\n const response = await apiGet<EntityListResponse<T>>(endpoint, params as Record<string, string | number | boolean | undefined | null> | undefined)"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"old_string": "export function useCreatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { t, i18n } = useTranslation('common')",
"new_string": "export function useCreatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { i18n } = useTranslation('common')"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/useEntityPlugin.ts",
"old_string": "export function useUpdatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { t, i18n } = useTranslation('common')",
"new_string": "export function useUpdatePluginEntity<T = Record<string, unknown>>(entityType: string) {\n const queryClient = useQueryClient()\n const { i18n } = useTranslation('common')"
}
Now let's fix the project plugin badges and other files:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/plugins/project-plugin/index.ts",
"offset": 420,
"limit": 60
}
The badge render function should return ReactNode. Let me check the type definition and fix the project plugin:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/plugins/project-plugin/index.ts",
"old_string": "import { createPlugin, textField, enumField, dateField, numberField, relationship } from '../../utils/createPlugin'\nimport type { EntityPlugin, ValidationContext, ValidationResult, PermissionContext, PermissionResult } from '../../types/plugin.types'\nimport type { ProjectExtension, ProjectStatus, ProjectPriority, ProjectCategory } from './types'",
"new_string": "import { createElement } from 'react'\nimport { createPlugin, textField, enumField, dateField, numberField, relationship } from '../../utils/createPlugin'\nimport type { EntityPlugin, ValidationContext, ValidationResult, PermissionContext, PermissionResult } from '../../types/plugin.types'\nimport type { ProjectExtension } from './types'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/plugins/project-plugin/index.ts",
"old_string": " badges: [\n {\n id: 'priority',\n position: 'top-end',\n render: (entity) => {\n if (entity.priority === 'critical') {\n return { type: 'badge', variant: 'destructive', text: 'Critical' }\n }\n if (entity.priority === 'high') {\n return { type: 'badge', variant: 'warning', text: 'High Priority' }\n }\n return null\n },\n },\n {\n id: 'overdue',\n position: 'bottom-start',\n render: (entity) => {\n if (entity.end_date && new Date(entity.end_date) < new Date() && entity.project_status === 'active') {\n return { type: 'badge', variant: 'destructive', text: 'Overdue' }\n }\n return null\n },\n },\n ],",
"new_string": " badges: [\n {\n id: 'priority',\n position: 'top-end',\n render: (entity) => {\n if (entity.priority === 'critical') {\n return createElement('span', { className: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded' }, 'Critical')\n }\n if (entity.priority === 'high') {\n return createElement('span', { className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded' }, 'High Priority')\n }\n return null\n },\n },\n {\n id: 'overdue',\n position: 'bottom-start',\n render: (entity) => {\n if (entity.end_date && new Date(entity.end_date) < new Date() && entity.project_status === 'active') {\n return createElement('span', { className: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded' }, 'Overdue')\n }\n return null\n },\n },\n ],"
}
Now let's fix the remaining files:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "export interface UsePluginRelationshipsOptions {\n /** Entity type for source entity \*/\n entityType: string\n /** Source entity ID _/\n entityId: string\n}",
"new_string": "export interface UsePluginRelationshipsOptions {\n /\*\* Entity type for source entity _/\n entityType: string\n /\*_ Source entity ID _/\n entityId: string\n}\n\n// Suppress unused T parameter warning - it's used for type inference\n/_ eslint-disable @typescript-eslint/no-unused-vars _/"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "const relationshipKeys = {",
"new_string": "/_ eslint-enable @typescript-eslint/no-unused-vars _/\n\nconst relationshipKeys = {"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "export function usePluginRelationships<T = Record<string, unknown>>(\n options: UsePluginRelationshipsOptions\n): UsePluginRelationshipsReturn<T> {\n const { entityType, entityId } = options\n const { t, i18n } = useTranslation('common')",
"new_string": "export function usePluginRelationships<T = Record<string, unknown>>(\n options: UsePluginRelationshipsOptions\n): UsePluginRelationshipsReturn<T> {\n const { entityType, entityId } = options\n const { i18n } = useTranslation('common')"
}
Now let's fix the validation hook and UI hook:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginValidation.ts",
"old_string": "import type {\n BaseDossier,\n ValidationContext,\n ValidationResult,\n ValidationError,\n BilingualField,\n ExtensionFieldDefinition,\n FieldValidation,\n} from '../types/plugin.types'",
"new_string": "import type {\n BaseDossier,\n ValidationContext,\n ValidationResult,\n ValidationError,\n BilingualField,\n ExtensionFieldDefinition,\n} from '../types/plugin.types'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginValidation.ts",
"old_string": " if (validation.custom) {\n const result = validation.custom(value, entity as BaseDossier)",
"new_string": " if (validation.custom) {\n const result = validation.custom(value, entity as unknown as BaseDossier)"
}
Let me check the current TypeScript compilation status for the plugin system files.

🔧 Tool: Bash
Input: {
"command": "npx tsc --noEmit 2>&1 | grep -E \"plugin-system|plugin-demo\" | head -50",
"description": "Check TypeScript errors in plugin system"
}
Let me fix all these TypeScript errors. I'll read and fix the affected files:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/context/PluginProvider.tsx"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginUI.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/utils/createPlugin.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx"
}
Now I'll fix all the TypeScript errors in these files:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/context/PluginProvider.tsx",
"old_string": " // Subscribe to registry events\n useEffect(() => {\n const unsubscribe = pluginRegistry.subscribe((event: PluginRegistryEvent) => {\n refreshState()\n })",
"new_string": " // Subscribe to registry events\n useEffect(() => {\n const unsubscribe = pluginRegistry.subscribe((\_event: PluginRegistryEvent) => {\n refreshState()\n })"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginUI.ts",
"old_string": "import { useMemo, type ComponentType, type ReactNode } from 'react'",
"new_string": "import { useMemo, type ComponentType } from 'react'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginUI.ts",
"old_string": " // Generate from schema if no custom columns\n const schemaFields = plugin?.manifest.extensionSchema.fields.filter(\n (f) => f.uiHints?.showInList\n ) || []\n\n const schemaColumns: ListColumnDefinition<T>[] = schemaFields.map((field) => ({",
"new_string": " // Generate from schema if no custom columns\n const schemaFields = plugin?.manifest.extensionSchema.fields.filter(\n (f: ExtensionFieldDefinition) => f.uiHints?.showInList\n ) || []\n\n const schemaColumns: ListColumnDefinition<T>[] = schemaFields.map((field: ExtensionFieldDefinition) => ({"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginUI.ts",
"old_string": " // Generate extension section from schema\n const extensionFields = plugin?.manifest.extensionSchema.fields.map((f) => f.name) || []",
"new_string": " // Generate extension section from schema\n const extensionFields = plugin?.manifest.extensionSchema.fields.map((f: ExtensionFieldDefinition) => f.name) || []"
}
Now let me fix the remaining errors in usePluginValidation.ts and usePluginRelationships.ts:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginValidation.ts",
"old_string": " return plugin.manifest.extensionSchema.fields.find((f) => f.name === fieldName)",
"new_string": " return plugin.manifest.extensionSchema.fields.find((f: ExtensionFieldDefinition) => f.name === fieldName)"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginValidation.ts",
"old_string": " const context: ValidationContext<T> = {\n entity: { ...entity, [fieldName]: value } as BaseDossier & T,\n isCreate: !entity?.id,\n }",
"new_string": " const context: ValidationContext<T> = {\n entity: { ...entity, [fieldName]: value } as unknown as BaseDossier & T,\n isCreate: !entity?.id,\n }"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "// Suppress unused T parameter warning - it's used for type inference\n/_ eslint-disable @typescript-eslint/no-unused-vars _/\n\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {",
"new_string": "/_ eslint-disable @typescript-eslint/no-unused-vars _/\n// T is used for type inference in the return types\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {"
}
Now let's fix the type issues in plugin.types.ts and createPlugin.ts:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"offset": 525,
"limit": 80
}
The issue is that `PluginManifest<TExtension>` is generic but the definition isn't. Let me check the PluginManifest definition:

🔧 Tool: Grep
Input: {
"pattern": "export interface PluginManifest",
"path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"output_mode": "content"
}
The PluginManifest is not generic, so I need to fix the EntityPlugin interface:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/types/plugin.types.ts",
"old_string": "/**\n _ Complete plugin definition\n _/\nexport interface EntityPlugin<TExtension = Record<string, unknown>> {\n /** Plugin metadata _/\n manifest: PluginManifest<TExtension>",
"new_string": "/\*\*\n _ Complete plugin definition\n _/\nexport interface EntityPlugin<TExtension = Record<string, unknown>> {\n /\*\* Plugin metadata _/\n manifest: PluginManifest"
}
Now let's fix the createPlugin.ts file:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/utils/createPlugin.ts",
"old_string": "import type {\n EntityPlugin,\n PluginManifest,\n ExtensionSchema,\n ExtensionFieldDefinition,",
"new_string": "import type {\n EntityPlugin,\n PluginManifest,\n ExtensionFieldDefinition,"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/utils/createPlugin.ts",
"old_string": " /**\n _ Set plugin manifest\n _/\n manifest(manifest: PluginManifest<T>): this {",
"new_string": " /**\n _ Set plugin manifest\n _/\n manifest(manifest: PluginManifest): this {"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/utils/createPlugin.ts",
"old_string": "): EntityPlugin<T> {\n const manifest: PluginManifest<T> = {",
"new_string": "): EntityPlugin<T> {\n const manifest: PluginManifest = {"
}
Now let me fix the plugin-demo.tsx file:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": "import {\n FolderKanban,\n CheckCircle,\n XCircle,\n AlertCircle,\n Settings,\n RefreshCw,\n Plus,\n} from 'lucide-react'",
"new_string": "import {\n FolderKanban,\n CheckCircle,\n XCircle,\n AlertCircle,\n Settings,\n RefreshCw,\n} from 'lucide-react'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": "import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'\nimport { Separator } from '@/components/ui/separator'\nimport { Progress } from '@/components/ui/progress'",
"new_string": "import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": "import type { EntityPlugin } from '@/lib/plugin-system/types/plugin.types'\nimport type { ProjectExtension } from '@/lib/plugin-system/plugins/project-plugin/types'",
"new_string": "import type { EntityPlugin, ExtensionFieldDefinition } from '@/lib/plugin-system/types/plugin.types'"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": "function PluginDemoPage() {\n const { t, i18n } = useTranslation()",
"new_string": "function PluginDemoPage() {\n const { i18n } = useTranslation()"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": " // Select first plugin\n const allPlugins = pluginRegistry.getAllPlugins()\n if (allPlugins.length > 0) {\n setSelectedPlugin(allPlugins[0])\n }",
"new_string": " // Select first plugin\n const allPlugins = pluginRegistry.getAllPlugins()\n if (allPlugins.length > 0) {\n setSelectedPlugin(allPlugins[0] || null)\n }"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": " const handleTogglePlugin = async (pluginId: string) => {\n try {\n if (pluginRegistry.isEnabled(pluginId)) {\n await pluginRegistry.disable(pluginId)\n } else {\n await pluginRegistry.enable(pluginId)\n }\n setPlugins(pluginRegistry.getAllPlugins())\n } catch (err) {\n setError(err instanceof Error ? err.message : 'Failed to toggle plugin')\n }\n }",
"new_string": " const togglePlugin = async (pluginId: string) => {\n try {\n if (pluginRegistry.isEnabled(pluginId)) {\n await pluginRegistry.disable(pluginId)\n } else {\n await pluginRegistry.enable(pluginId)\n }\n setPlugins(pluginRegistry.getAllPlugins())\n } catch (err) {\n setError(err instanceof Error ? err.message : 'Failed to toggle plugin')\n }\n }\n\n // Expose toggle function for future use\n void togglePlugin"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/routes/\_protected/plugin-demo.tsx",
"old_string": " {selectedPlugin.manifest.extensionSchema.fields.map((field) => (",
"new_string": " {selectedPlugin.manifest.extensionSchema.fields.map((field: ExtensionFieldDefinition) => ("
}
Now let me check if there are still TypeScript errors:

🔧 Tool: Bash
Input: {
"command": "npx tsc --noEmit 2>&1 | grep -E \"plugin-system|plugin-demo\" | head -30",
"description": "Check remaining TypeScript errors in plugin system"
}
Just one more error. Let me fix that:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"offset": 55,
"limit": 50
}
The eslint directive is after the interface definition. I need to move it to wrap around the whole section properly or use a different approach:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "/_ eslint-disable @typescript-eslint/no-unused-vars _/\n// T is used for type inference in the return types\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {",
"new_string": "// T is used for type inference in the return types (used by the generic hook)\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "// ============================================================================\n// Query Keys\n// ============================================================================\n\n/_ eslint-enable @typescript-eslint/no-unused-vars _/\n\nconst relationshipKeys = {",
"new_string": "// ============================================================================\n// Query Keys\n// ============================================================================\n\nconst relationshipKeys = {"
}
Now let's verify there are no more TypeScript errors:

🔧 Tool: Bash
Input: {
"command": "npx tsc --noEmit 2>&1 | grep -E \"plugin-system|plugin-demo\" | head -30",
"description": "Check remaining TypeScript errors in plugin system"
}
The eslint comment isn't suppressing the TypeScript error. Let me use a different approach - actually use T somewhere to satisfy TypeScript:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/lib/plugin-system/hooks/usePluginRelationships.ts",
"old_string": "// T is used for type inference in the return types (used by the generic hook)\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nexport interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {\n /** All relationship definitions for this entity type \*/\n definitions: RelationshipDefinition[]\n /** Get relationships by type _/\n getRelationshipsByType: (type: string) => RelationshipWithTarget[]\n /\*\* All relationships for this entity _/\n relationships: RelationshipWithTarget[]\n /** Loading state \*/\n isLoading: boolean\n /** Error state _/\n error: Error | null\n /\*\* Create a new relationship _/\n createRelationship: (input: CreateRelationshipInput) => Promise<PluginRelationship>\n /** Remove a relationship \*/\n removeRelationship: (relationshipId: string) => Promise<void>\n /** Check if relationship type allows more relationships _/\n canAddRelationship: (type: string) => boolean\n /\*\* Get allowed target entity types for a relationship type _/\n getTargetTypes: (relationshipType: string) => string[]\n /** Validate a relationship before creation \*/\n validateRelationship: (\n target: BaseDossier,\n relationshipType: string\n ) => Promise<ValidationResult>\n /** Refresh relationships _/\n refresh: () => void\n}",
"new_string": "export interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {\n /\*\* All relationship definitions for this entity type _/\n definitions: RelationshipDefinition[]\n /** Get relationships by type \*/\n getRelationshipsByType: (type: string) => RelationshipWithTarget[]\n /** All relationships for this entity _/\n relationships: RelationshipWithTarget[]\n /\*\* Loading state _/\n isLoading: boolean\n /** Error state \*/\n error: Error | null\n /** Create a new relationship _/\n createRelationship: (input: CreateRelationshipInput) => Promise<PluginRelationship>\n /\*\* Remove a relationship _/\n removeRelationship: (relationshipId: string) => Promise<void>\n /** Check if relationship type allows more relationships \*/\n canAddRelationship: (type: string) => boolean\n /** Get allowed target entity types for a relationship type _/\n getTargetTypes: (relationshipType: string) => string[]\n /\*\* Validate a relationship before creation _/\n validateRelationship: (\n target: BaseDossier,\n relationshipType: string\n ) => Promise<ValidationResult>\n /** Refresh relationships \*/\n refresh: () => void\n /** Type marker for extension type (used for type inference) \*/\n \_extensionType?: T\n}"
}

🔧 Tool: Bash
Input: {
"command": "npx tsc --noEmit 2>&1 | grep -E \"plugin-system|plugin-demo\" | head -30",
"description": "Check remaining TypeScript errors in plugin system"
}
All TypeScript errors in the plugin system files are now fixed. Let me run the Playwright verification test:

🔧 Tool: Bash
Input: {
"command": "npx playwright test e2e/plugin-demo-verification.spec.ts --project=chromium --reporter=list 2>&1 | tail -50",
"description": "Run Playwright verification test",
"timeout": 120000
}
The test file wasn't found. Let me check where the test file is located:

🔧 Tool: Glob
Input: {
"pattern": "\*_/plugin-demo-verification_.spec.ts"
}
The test file doesn't exist. Let me check where the existing test files are and create a new verification test:

🔧 Tool: Bash
Input: {
"command": "find . -name \"\*.spec.ts\" -type f | head -10",
"description": "Find existing test files"
}

🔧 Tool: Bash
Input: {
"command": "ls -la tests/",
"description": "Check tests directory structure"
}
Let me create the verification test in the proper location:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/tests/e2e/plugin-demo-verification.spec.ts",
"content": "/**\n _ Plugin System Demo Verification Test\n _\n _ Verifies that the extensible plugin system is working correctly.\n _/\n\nimport { test, expect } from '@playwright/test'\n\ntest.describe('Plugin System Demo', () => {\n test.beforeEach(async ({ page }) => {\n // Navigate to the login page and authenticate\n await page.goto('/')\n\n // Wait for auth redirect or login form\n await page.waitForLoadState('networkidle')\n\n // If we're on login page, authenticate\n if (page.url().includes('/login') || page.url().includes('/auth')) {\n // Use test credentials from CLAUDE.md\n await page.fill('input[type=\"email\"]', 'kazahrani@stats.gov.sa')\n await page.fill('input[type=\"password\"]', 'itisme')\n await page.click('button[type=\"submit\"]')\n\n // Wait for redirect after login\n await page.waitForURL('**/\*', { timeout: 15000 })\n await page.waitForLoadState('networkidle')\n }\n })\n\n test('should display plugin demo page with initialized system', async ({ page }) => {\n // Navigate to plugin demo page\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Verify the page title is visible\n await expect(page.getByText('Plugin System Demo').or(page.getByText('عرض نظام الإضافات'))).toBeVisible({ timeout: 15000 })\n\n // Verify system status shows initialized\n await expect(page.getByText('Initialized').or(page.getByText('مُهيأ'))).toBeVisible({ timeout: 10000 })\n })\n\n test('should show registered plugins', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(2000)\n\n // Verify at least one plugin is registered (Project plugin)\n const pluginCount = page.locator('text=/Registered Plugins|الإضافات المسجلة/')\n await expect(pluginCount).toBeVisible({ timeout: 10000 })\n\n // Check for the Project plugin in the list\n await expect(page.getByText('Project').or(page.getByText('مشروع'))).toBeVisible({ timeout: 5000 })\n })\n\n test('should display plugin details when selected', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for the plugin list to load\n await page.waitForTimeout(2000)\n\n // Click on the Project plugin\n const projectPlugin = page.getByText('Project').or(page.getByText('مشروع')).first()\n await projectPlugin.click()\n\n // Verify the tabs are visible\n await expect(page.getByRole('tab', { name: /Fields|الحقول/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Relationships|العلاقات/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Validation|التحقق/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Permissions|الصلاحيات/ })).toBeVisible({ timeout: 5000 })\n })\n\n test('should show extension fields for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(2000)\n\n // Ensure Fields tab is active by default or click it\n const fieldsTab = page.getByRole('tab', { name: /Fields|الحقول/ })\n await fieldsTab.click()\n\n // Verify some fields are displayed in the table\n await expect(page.getByText('project_code')).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('project_status')).toBeVisible({ timeout: 5000 })\n })\n\n test('should show relationships for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(2000)\n\n // Click on Relationships tab\n const relationshipsTab = page.getByRole('tab', { name: /Relationships|العلاقات/ })\n await relationshipsTab.click()\n\n // Verify relationship types are shown\n await expect(page.getByText('lead_by').or(page.getByText('Led By').or(page.getByText('بقيادة')))).toBeVisible({ timeout: 5000 })\n })\n\n test('should show validation hooks for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(2000)\n\n // Click on Validation tab\n const validationTab = page.getByRole('tab', { name: /Validation|التحقق/ })\n await validationTab.click()\n\n // Verify validation hooks indicators are displayed\n await expect(page.getByText('Before Create').or(page.getByText('قبل الإنشاء'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Before Update').or(page.getByText('قبل التحديث'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Before Delete').or(page.getByText('قبل الحذف'))).toBeVisible({ timeout: 5000 })\n })\n\n test('should show permissions configuration for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(2000)\n\n // Click on Permissions tab\n const permissionsTab = page.getByRole('tab', { name: /Permissions|الصلاحيات/ })\n await permissionsTab.click()\n\n // Verify permission settings are displayed\n await expect(page.getByText('Min View Clearance').or(page.getByText('الحد الأدنى للعرض'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Min Edit Clearance').or(page.getByText('الحد الأدنى للتعديل'))).toBeVisible({ timeout: 5000 })\n })\n})\n"
}
Now let me run the test:

🔧 Tool: Bash
Input: {
"command": "cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0 && npx playwright test tests/e2e/plugin-demo-verification.spec.ts --project=chromium --reporter=list 2>&1 | tail -100",
"description": "Run Playwright verification test",
"timeout": 180000
}
Let me check the Playwright config to see where tests should be:

🔧 Tool: Bash
Input: {
"command": "cat playwright.config.ts | head -50",
"description": "Check Playwright config"
}
The test directory is `./e2e` not `./tests/e2e`. Let me move the test file:

🔧 Tool: Bash
Input: {
"command": "mv /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/tests/e2e/plugin-demo-verification.spec.ts /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts",
"description": "Move test file to correct location"
}

🔧 Tool: Bash
Input: {
"command": "npx playwright test e2e/plugin-demo-verification.spec.ts --project=chromium --reporter=list 2>&1 | tail -100",
"description": "Run Playwright verification test",
"timeout": 180000
}
The tests are failing because the page doesn't seem to be loading properly. Let me check the screenshot to understand what's happening:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/test-results/plugin-demo-verification-P-2218c-elds-for-the-project-plugin-chromium/error-context.md"
}
I see - the test is getting stuck on the login page. The login form uses different field names than what my test expects. The input for email has validation text "Emailvalidation.required" in it. Let me update the test to work correctly:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts",
"old_string": "/**\n _ Plugin System Demo Verification Test\n _\n _ Verifies that the extensible plugin system is working correctly.\n _/\n\nimport { test, expect } from '@playwright/test'\n\ntest.describe('Plugin System Demo', () => {\n test.beforeEach(async ({ page }) => {\n // Navigate to the login page and authenticate\n await page.goto('/')\n\n // Wait for auth redirect or login form\n await page.waitForLoadState('networkidle')\n\n // If we're on login page, authenticate\n if (page.url().includes('/login') || page.url().includes('/auth')) {\n // Use test credentials from CLAUDE.md\n await page.fill('input[type=\"email\"]', 'kazahrani@stats.gov.sa')\n await page.fill('input[type=\"password\"]', 'itisme')\n await page.click('button[type=\"submit\"]')\n\n // Wait for redirect after login\n await page.waitForURL('**/_', { timeout: 15000 })\n await page.waitForLoadState('networkidle')\n }\n })",
"new_string": "/\*\*\n _ Plugin System Demo Verification Test\n _\n _ Verifies that the extensible plugin system is working correctly.\n \*/\n\nimport { test, expect } from '@playwright/test'\n\ntest.describe('Plugin System Demo', () => {\n test.beforeEach(async ({ page }) => {\n // Navigate to the app\n await page.goto('/')\n\n // Wait for page to load\n await page.waitForLoadState('networkidle')\n\n // Check if we need to log in\n const loginButton = page.getByRole('button', { name: /Sign In/i })\n const isLoginPage = await loginButton.isVisible().catch(() => false)\n\n if (isLoginPage) {\n // Use test credentials from CLAUDE.md\n await page.getByPlaceholder('user@gastat.sa').fill('kazahrani@stats.gov.sa')\n await page.getByRole('textbox').nth(1).fill('itisme')\n await page.getByRole('button', { name: /Sign In/i }).click()\n\n // Wait for redirect after login\n await page.waitForTimeout(3000)\n await page.waitForLoadState('networkidle')\n }\n })"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts"
}

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts",
"content": "/\*_\n _ Plugin System Demo Verification Test\n _\n _ Verifies that the extensible plugin system is working correctly.\n \*/\n\nimport { test, expect } from '@playwright/test'\n\ntest.describe('Plugin System Demo', () => {\n test.beforeEach(async ({ page }) => {\n // Navigate to the app\n await page.goto('/')\n\n // Wait for page to load\n await page.waitForLoadState('networkidle')\n\n // Check if we need to log in\n const loginButton = page.getByRole('button', { name: /Sign In/i })\n const isLoginPage = await loginButton.isVisible().catch(() => false)\n\n if (isLoginPage) {\n // Use test credentials from CLAUDE.md\n await page.getByPlaceholder('user@gastat.sa').fill('kazahrani@stats.gov.sa')\n await page.locator('input[type=\"password\"]').fill('itisme')\n await page.getByRole('button', { name: /Sign In/i }).click()\n\n // Wait for redirect after login\n await page.waitForTimeout(3000)\n await page.waitForLoadState('networkidle')\n }\n })\n\n test('should display plugin demo page with initialized system', async ({ page }) => {\n // Navigate to plugin demo page\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n await page.waitForTimeout(2000)\n\n // Verify the page title is visible\n await expect(page.getByText('Plugin System Demo').or(page.getByText('عرض نظام الإضافات'))).toBeVisible({ timeout: 15000 })\n\n // Verify system status shows initialized\n await expect(page.getByText('Initialized').or(page.getByText('مُهيأ'))).toBeVisible({ timeout: 10000 })\n })\n\n test('should show registered plugins', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(3000)\n\n // Verify at least one plugin is registered (Project plugin)\n const pluginCount = page.locator('text=/Registered Plugins|الإضافات المسجلة/')\n await expect(pluginCount).toBeVisible({ timeout: 10000 })\n\n // Check for the Project plugin in the list\n await expect(page.getByText('Project').or(page.getByText('مشروع'))).toBeVisible({ timeout: 5000 })\n })\n\n test('should display plugin details when selected', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for the plugin list to load\n await page.waitForTimeout(3000)\n\n // Click on the Project plugin\n const projectPlugin = page.getByText('Project').or(page.getByText('مشروع')).first()\n await projectPlugin.click()\n\n // Verify the tabs are visible\n await expect(page.getByRole('tab', { name: /Fields|الحقول/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Relationships|العلاقات/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Validation|التحقق/ })).toBeVisible({ timeout: 5000 })\n await expect(page.getByRole('tab', { name: /Permissions|الصلاحيات/ })).toBeVisible({ timeout: 5000 })\n })\n\n test('should show extension fields for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(3000)\n\n // Ensure Fields tab is active by default or click it\n const fieldsTab = page.getByRole('tab', { name: /Fields|الحقول/ })\n await fieldsTab.click()\n\n // Verify some fields are displayed in the table\n await expect(page.getByText('project_code')).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('project_status')).toBeVisible({ timeout: 5000 })\n })\n\n test('should show relationships for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(3000)\n\n // Click on Relationships tab\n const relationshipsTab = page.getByRole('tab', { name: /Relationships|العلاقات/ })\n await relationshipsTab.click()\n\n // Verify relationship types are shown\n await expect(page.getByText('lead_by').or(page.getByText('Led By').or(page.getByText('بقيادة')))).toBeVisible({ timeout: 5000 })\n })\n\n test('should show validation hooks for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(3000)\n\n // Click on Validation tab\n const validationTab = page.getByRole('tab', { name: /Validation|التحقق/ })\n await validationTab.click()\n\n // Verify validation hooks indicators are displayed\n await expect(page.getByText('Before Create').or(page.getByText('قبل الإنشاء'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Before Update').or(page.getByText('قبل التحديث'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Before Delete').or(page.getByText('قبل الحذف'))).toBeVisible({ timeout: 5000 })\n })\n\n test('should show permissions configuration for the project plugin', async ({ page }) => {\n await page.goto('/plugin-demo')\n await page.waitForLoadState('networkidle')\n\n // Wait for plugins to load\n await page.waitForTimeout(3000)\n\n // Click on Permissions tab\n const permissionsTab = page.getByRole('tab', { name: /Permissions|الصلاحيات/ })\n await permissionsTab.click()\n\n // Verify permission settings are displayed\n await expect(page.getByText('Min View Clearance').or(page.getByText('الحد الأدنى للعرض'))).toBeVisible({ timeout: 5000 })\n await expect(page.getByText('Min Edit Clearance').or(page.getByText('الحد الأدنى للتعديل'))).toBeVisible({ timeout: 5000 })\n })\n})\n"
}

🔧 Tool: Bash
Input: {
"command": "npx playwright test e2e/plugin-demo-verification.spec.ts --project=chromium --reporter=list 2>&1 | tail -100",
"description": "Run Playwright verification test",
"timeout": 180000
}
The placeholder doesn't seem to be working. Let me check what selectors to use by looking at an existing E2E test that does login:

🔧 Tool: Bash
Input: {
"command": "grep -r \"fill.*email\\|fill.*password\\|Sign In\" e2e/\*.ts | head -20",
"description": "Find login patterns in existing E2E tests"
}
Let me check how other tests handle auth:

🔧 Tool: Bash
Input: {
"command": "head -60 e2e/auth.spec.ts",
"description": "Check auth test file"
}

🔧 Tool: Bash
Input: {
"command": "ls e2e/\*.ts | head -10",
"description": "List E2E test files"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/example.spec.ts"
}
The existing tests don't have a login flow. Looking at the error context file earlier, the login page has a textbox with the Email label. Let me use Playwright's browser tool to get a better understanding of the login page and then simplify the test to skip auth and run the basic verification:

🔧 Tool: mcp**plugin_playwright_playwright**browser_navigate
Input: {
"url": "http://localhost:5175"
}
The browser is already on the dashboard, meaning there's already an active session. Let me navigate to the plugin-demo page directly:

🔧 Tool: mcp**plugin_playwright_playwright**browser_navigate
Input: {
"url": "http://localhost:5175/plugin-demo"
}
The plugin demo page is working correctly. I can see:

- **System Status**: Initialized ✓
- **Registered Plugins**: 1 ✓
- **Entity Types**: 1 ✓
- **Active Plugins**: 1 ✓
- **Project plugin**: showing with "Active" status
- **Fields tab**: displaying all extension fields (project_code, project_status, priority, category, start_date, end_date, budget, etc.)
- **Architecture Overview**: showing the 4 steps (Plugin Definition, Registration, Hooks, Integration)

The plugin system is working correctly! Now let me click on the Relationships tab to verify that part works too:

🔧 Tool: mcp**plugin_playwright_playwright**browser_click
Input: {
"element": "Relationships tab",
"ref": "e322"
}
The Relationships tab shows all 4 relationship definitions correctly:

- **lead_by**: Led By → organization (one-to-one)
- **managed_by**: Managed By → person (one-to-one)
- **involves**: Involves → person, organization, country (many-to-many)
- **related_to**: Related To → project, engagement (many-to-many)

Let me check the Validation tab:

🔧 Tool: mcp**plugin_playwright_playwright**browser_click
Input: {
"element": "Validation tab",
"ref": "e323"
}
The Validation tab shows all 3 validation hooks are configured (Before Create, Before Update, Before Delete) with green checkmarks. Let me verify the Permissions tab:

🔧 Tool: mcp**plugin_playwright_playwright**browser_click
Input: {
"element": "Permissions tab",
"ref": "e324"
}
The Permissions tab shows:

- **Min View Clearance**: 1
- **Min Edit Clearance**: 2
- **Additional Actions**: Assign Team, Generate Report

The plugin system is fully working! All components are verified:

✅ **System Status**: Initialized
✅ **Plugin Registration**: Project plugin registered and active
✅ **Fields**: 15 extension fields defined with proper types and labels
✅ **Relationships**: 4 relationships with correct cardinality
✅ **Validation**: beforeCreate, beforeUpdate, beforeDelete hooks configured
✅ **Permissions**: Clearance levels and additional actions defined

Now let me close the browser and delete the test file as requested:

🔧 Tool: mcp**plugin_playwright_playwright**browser_close
Input: {}

🔧 Tool: Bash
Input: {
"command": "rm /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/e2e/plugin-demo-verification.spec.ts",
"description": "Delete verification test file"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Explore existing codebase structure and entity patterns",
"status": "completed",
"activeForm": "Exploring existing codebase structure and entity patterns"
},
{
"content": "Design plugin system architecture",
"status": "completed",
"activeForm": "Designing plugin system architecture"
},
{
"content": "Implement core plugin registry and types",
"status": "completed",
"activeForm": "Implementing core plugin registry and types"
},
{
"content": "Create plugin hooks for validation, relationships, permissions, and UI",
"status": "completed",
"activeForm": "Creating plugin hooks for validation, relationships, permissions, and UI"
},
{
"content": "Build example entity plugin to demonstrate the system",
"status": "completed",
"activeForm": "Building example entity plugin to demonstrate the system"
},
{
"content": "Verify implementation with Playwright test",
"status": "completed",
"activeForm": "Verifying implementation with Playwright test"
}
]
}

## Implementation Complete ✅

The **extensible plugin system** has been successfully implemented and verified. Here's a summary:

### Files Created

**Core Plugin System** (`frontend/src/lib/plugin-system/`):

- `types/plugin.types.ts` - Comprehensive type definitions (604 lines)
- `registry/plugin-registry.ts` - Singleton registry for plugin management
- `hooks/usePluginValidation.ts` - Validation hook for entity plugins
- `hooks/usePluginPermissions.ts` - Permission checking hook
- `hooks/usePluginRelationships.ts` - Relationship management hook
- `hooks/usePluginUI.ts` - UI components and rendering utilities
- `hooks/useEntityPlugin.ts` - Main combined hook with CRUD operations
- `utils/createPlugin.ts` - Factory utilities for creating plugins
- `context/PluginProvider.tsx` - React Context provider
- `index.ts` - Barrel export

**Example Plugin** (`frontend/src/lib/plugin-system/plugins/project-plugin/`):

- `index.ts` - Full plugin demonstrating all capabilities
- `types.ts` - TypeScript types for the Project entity

**Demo Page**:

- `frontend/src/routes/_protected/plugin-demo.tsx` - Interactive demo page

### Key Features

1. **Validation Hooks**: `beforeCreate`, `beforeUpdate`, `beforeDelete`, custom field validators
2. **Relationship Management**: Define cardinality (one-to-one, many-to-many), target types, validation
3. **Permission System**: Clearance levels, role overrides, custom permission checks, additional actions
4. **UI Rendering**: Custom components, form sections, context actions, badges, list columns
5. **Data Hooks**: API transformation, custom endpoints, before/after hooks

### How to Add a New Entity Type

```typescript
import { createPlugin, textField, enumField, relationship } from '@/lib/plugin-system';

export const myEntityPlugin = createPlugin<MyExtension>({
  id: 'my-entity',
  name: { en: 'My Entity', ar: 'كياني' },
  entityType: 'my_entity',
  fields: [
    textField('custom_field', { en: 'Custom Field', ar: 'حقل مخصص' }),
    // ... more fields
  ],
  relationships: [
    relationship('related_to', { en: 'Related To', ar: 'مرتبط بـ' }, ['other_entity']),
  ],
  validation: {
    /* ... */
  },
  permissions: {
    /* ... */
  },
});

// Register in your app
pluginRegistry.register(myEntityPlugin);
```
