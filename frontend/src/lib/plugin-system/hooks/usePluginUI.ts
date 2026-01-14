/**
 * Plugin UI Hook
 *
 * Provides UI components and rendering utilities for entity plugins.
 * Allows plugins to customize how entities are displayed.
 */

import { useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { pluginRegistry } from '../registry/plugin-registry'
import type {
  BaseDossier,
  EntityCardProps,
  EntityDetailProps,
  EntityFormProps,
  EntityListProps,
  ListColumnDefinition,
  DetailSectionDefinition,
  FormSectionDefinition,
  ContextActionDefinition,
  BadgeDefinition,
  ExtensionFieldDefinition,
  BilingualField,
} from '../types/plugin.types'

// ============================================================================
// Types
// ============================================================================

export interface UsePluginUIOptions {
  /** Entity type */
  entityType: string
}

export interface UsePluginUIReturn<T = Record<string, unknown>> {
  /** Plugin manifest info */
  manifest: {
    name: BilingualField
    description: BilingualField
    icon: string
    color: string
  } | null
  /** Custom Card component (or null for default) */
  CardComponent: ComponentType<EntityCardProps<T>> | null
  /** Custom Detail view component (or null for default) */
  DetailComponent: ComponentType<EntityDetailProps<T>> | null
  /** Custom Form component (or null for default) */
  FormComponent: ComponentType<EntityFormProps<T>> | null
  /** Custom List component (or null for default) */
  ListComponent: ComponentType<EntityListProps<T>> | null
  /** Get custom component by name */
  getCustomComponent: (name: string) => ComponentType<unknown> | null
  /** List columns for table/grid views */
  listColumns: ListColumnDefinition<T>[]
  /** Detail view sections */
  detailSections: DetailSectionDefinition<T>[]
  /** Form sections */
  formSections: FormSectionDefinition[]
  /** Context menu actions */
  contextActions: ContextActionDefinition<T>[]
  /** Badge definitions for cards */
  badges: BadgeDefinition<T>[]
  /** Extension field definitions */
  fields: ExtensionFieldDefinition[]
  /** Get localized label for entity */
  getLabel: (entity: BaseDossier & T, field?: 'name' | 'description') => string
  /** Get localized field label */
  getFieldLabel: (fieldName: string) => string
  /** Get icon for entity type */
  getIcon: () => string
  /** Get color for entity type */
  getColor: () => string
  /** Check if plugin is registered */
  isRegistered: boolean
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_LIST_COLUMNS: ListColumnDefinition[] = [
  {
    id: 'name',
    label: { en: 'Name', ar: 'الاسم' },
    accessor: (entity) => entity.name_en,
    sortable: true,
  },
  {
    id: 'status',
    label: { en: 'Status', ar: 'الحالة' },
    accessor: 'status',
    sortable: true,
    width: 100,
  },
  {
    id: 'created_at',
    label: { en: 'Created', ar: 'تاريخ الإنشاء' },
    accessor: 'created_at',
    sortable: true,
    width: 150,
  },
]

const DEFAULT_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    id: 'basic',
    title: { en: 'Basic Information', ar: 'المعلومات الأساسية' },
    order: 0,
    fields: ['name_en', 'name_ar', 'description_en', 'description_ar'],
  },
  {
    id: 'classification',
    title: { en: 'Classification', ar: 'التصنيف' },
    order: 1,
    fields: ['status', 'sensitivity_level', 'tags'],
    collapsible: true,
  },
]

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for plugin UI components and configuration
 */
export function usePluginUI<T = Record<string, unknown>>(
  options: UsePluginUIOptions,
): UsePluginUIReturn<T> {
  const { entityType } = options
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const isRegistered = Boolean(plugin)

  // Manifest info
  const manifest = useMemo(() => {
    if (!plugin) return null
    return {
      name: plugin.manifest.name,
      description: plugin.manifest.description,
      icon: plugin.manifest.icon,
      color: plugin.manifest.color,
    }
  }, [plugin])

  // Custom components
  const CardComponent = useMemo(() => {
    return plugin?.components?.Card || null
  }, [plugin])

  const DetailComponent = useMemo(() => {
    return plugin?.components?.DetailView || null
  }, [plugin])

  const FormComponent = useMemo(() => {
    return plugin?.components?.Form || null
  }, [plugin])

  const ListComponent = useMemo(() => {
    return plugin?.components?.List || null
  }, [plugin])

  // Get custom component by name
  const getCustomComponent = useMemo(() => {
    return (name: string): ComponentType<unknown> | null => {
      return plugin?.components?.custom?.[name] || null
    }
  }, [plugin])

  // List columns
  const listColumns = useMemo((): ListColumnDefinition<T>[] => {
    const pluginColumns = plugin?.ui?.listColumns || []
    if (pluginColumns.length > 0) {
      return pluginColumns
    }

    // Generate from schema if no custom columns
    const schemaFields =
      plugin?.manifest.extensionSchema.fields.filter(
        (f: ExtensionFieldDefinition) => f.uiHints?.showInList,
      ) || []

    const schemaColumns: ListColumnDefinition<T>[] = schemaFields.map(
      (field: ExtensionFieldDefinition) => ({
        id: field.name,
        label: field.label,
        accessor: field.name as keyof (BaseDossier & T),
        sortable: field.uiHints?.sortable ?? false,
      }),
    )

    return [...(DEFAULT_LIST_COLUMNS as ListColumnDefinition<T>[]), ...schemaColumns]
  }, [plugin])

  // Detail sections
  const detailSections = useMemo((): DetailSectionDefinition<T>[] => {
    return plugin?.ui?.detailSections || []
  }, [plugin])

  // Form sections
  const formSections = useMemo((): FormSectionDefinition[] => {
    const pluginSections = plugin?.ui?.formSections || []
    if (pluginSections.length > 0) {
      return pluginSections
    }

    // Generate extension section from schema
    const extensionFields =
      plugin?.manifest.extensionSchema.fields.map((f: ExtensionFieldDefinition) => f.name) || []
    if (extensionFields.length > 0) {
      return [
        ...DEFAULT_FORM_SECTIONS,
        {
          id: 'extension',
          title: plugin?.manifest.name || { en: 'Details', ar: 'التفاصيل' },
          order: 2,
          fields: extensionFields,
        },
      ]
    }

    return DEFAULT_FORM_SECTIONS
  }, [plugin])

  // Context actions
  const contextActions = useMemo((): ContextActionDefinition<T>[] => {
    return plugin?.ui?.contextActions || []
  }, [plugin])

  // Badges
  const badges = useMemo((): BadgeDefinition<T>[] => {
    return plugin?.ui?.badges || []
  }, [plugin])

  // Extension fields
  const fields = useMemo((): ExtensionFieldDefinition[] => {
    return plugin?.manifest.extensionSchema.fields || []
  }, [plugin])

  // Get localized label
  const getLabel = useMemo(() => {
    return (entity: BaseDossier & T, field: 'name' | 'description' = 'name'): string => {
      if (field === 'name') {
        return isRTL ? entity.name_ar : entity.name_en
      }
      return isRTL
        ? entity.description_ar || entity.description_en || ''
        : entity.description_en || entity.description_ar || ''
    }
  }, [isRTL])

  // Get localized field label
  const getFieldLabel = useMemo(() => {
    return (fieldName: string): string => {
      const field = fields.find((f) => f.name === fieldName)
      if (field) {
        return isRTL ? field.label.ar : field.label.en
      }
      // Built-in field labels
      const builtinLabels: Record<string, BilingualField> = {
        name_en: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },
        name_ar: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },
        description_en: { en: 'Description (English)', ar: 'الوصف (إنجليزي)' },
        description_ar: { en: 'Description (Arabic)', ar: 'الوصف (عربي)' },
        status: { en: 'Status', ar: 'الحالة' },
        sensitivity_level: { en: 'Sensitivity Level', ar: 'مستوى الحساسية' },
        tags: { en: 'Tags', ar: 'الوسوم' },
      }
      const label = builtinLabels[fieldName]
      if (label) {
        return isRTL ? label.ar : label.en
      }
      return fieldName
    }
  }, [fields, isRTL])

  // Get icon
  const getIcon = useMemo(() => {
    return (): string => {
      return plugin?.manifest.icon || 'FileText'
    }
  }, [plugin])

  // Get color
  const getColor = useMemo(() => {
    return (): string => {
      return plugin?.manifest.color || 'gray'
    }
  }, [plugin])

  return {
    manifest,
    CardComponent,
    DetailComponent,
    FormComponent,
    ListComponent,
    getCustomComponent,
    listColumns,
    detailSections,
    formSections,
    contextActions,
    badges,
    fields,
    getLabel,
    getFieldLabel,
    getIcon,
    getColor,
    isRegistered,
  }
}

// ============================================================================
// Helper Hook for Entity Display
// ============================================================================

/**
 * Hook for getting display-ready entity data
 */
export function useEntityDisplay<T = Record<string, unknown>>(
  entityType: string,
  entity: BaseDossier & T,
) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { manifest, fields, getLabel, getFieldLabel, badges } = usePluginUI<T>({
    entityType,
  })

  // Get display name
  const displayName = useMemo(() => {
    return getLabel(entity, 'name')
  }, [entity, getLabel])

  // Get display description
  const displayDescription = useMemo(() => {
    return getLabel(entity, 'description')
  }, [entity, getLabel])

  // Get field values with labels
  const fieldValues = useMemo(() => {
    return fields.map((field) => ({
      name: field.name,
      label: getFieldLabel(field.name),
      value: (entity as Record<string, unknown>)[field.name],
      type: field.type,
      field,
    }))
  }, [entity, fields, getFieldLabel])

  // Render badges
  const renderedBadges = useMemo(() => {
    return badges
      .map((badge) => ({
        id: badge.id,
        position: badge.position || 'top-end',
        content: badge.render(entity),
      }))
      .filter((b) => b.content !== null)
  }, [badges, entity])

  return {
    displayName,
    displayDescription,
    fieldValues,
    renderedBadges,
    icon: manifest?.icon || 'FileText',
    color: manifest?.color || 'gray',
    entityTypeName: isRTL ? manifest?.name.ar : manifest?.name.en,
  }
}
