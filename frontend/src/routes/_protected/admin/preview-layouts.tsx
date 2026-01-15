/**
 * Route: /admin/preview-layouts
 * Preview Card Layout Configuration
 * Feature: Custom Preview Card Layouts
 *
 * Allows administrators to define custom preview card layouts for each entity type,
 * controlling which fields, relationships, and metadata appear in hover previews,
 * search results, and embedded references.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Settings,
  LayoutGrid,
  Plus,
  Trash2,
  Edit,
  Star,
  StarOff,
  Save,
  RotateCcw,
  AlertTriangle,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Building2,
  Globe,
  Users,
  FileText,
  Briefcase,
  Handshake,
  Target,
  MessageSquare,
  Activity,
  Calendar,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useEntityLayouts,
  useLayoutDetails,
  useCreateLayout,
  useUpdateLayout,
  useDeleteLayout,
  useSetDefaultLayout,
  useAddLayoutField,
  useUpdateLayoutField,
  useDeleteLayoutField,
  useReorderLayoutFields,
  previewLayoutKeys,
} from '@/hooks/usePreviewLayouts'
import type {
  PreviewEntityType,
  PreviewContext,
  PreviewFieldType,
  PreviewLayoutConfig,
  PreviewLayoutFormValues,
  PreviewLayoutFieldFormValues,
  GetEntityLayoutsResponse,
  PreviewLayoutField,
} from '@/types/preview-layout.types'
import {
  PREVIEW_ENTITY_TYPES,
  PREVIEW_CONTEXTS,
  PREVIEW_FIELD_TYPES,
  DEFAULT_LAYOUT_CONFIG,
  ENTITY_TYPE_LABELS,
  CONTEXT_LABELS,
  FIELD_TYPE_LABELS,
} from '@/types/preview-layout.types'

export const Route = createFileRoute('/_protected/admin/preview-layouts')({
  component: PreviewLayoutsPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  },
})

// Entity type icons
const ENTITY_ICONS: Record<PreviewEntityType, React.ComponentType<{ className?: string }>> = {
  dossier: FileText,
  organization: Building2,
  country: Globe,
  forum: Users,
  position: Briefcase,
  mou: Handshake,
  engagement: Calendar,
  commitment: Target,
  assignment: Briefcase,
  intelligence_signal: Activity,
  working_group: Users,
  topic: MessageSquare,
}

function PreviewLayoutsPage() {
  const { t, i18n } = useTranslation('preview-layouts')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State
  const [selectedEntityType, setSelectedEntityType] = useState<PreviewEntityType | null>(null)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<PreviewLayoutField | null>(null)

  // Queries
  const { data: layouts, isLoading: layoutsLoading } = useEntityLayouts(selectedEntityType!, {
    enabled: !!selectedEntityType,
  })
  const { data: layoutDetails, isLoading: layoutDetailsLoading } = useLayoutDetails(
    selectedLayoutId,
    { enabled: !!selectedLayoutId },
  )

  // Mutations
  const createLayoutMutation = useCreateLayout()
  const updateLayoutMutation = useUpdateLayout()
  const deleteLayoutMutation = useDeleteLayout()
  const setDefaultMutation = useSetDefaultLayout()
  const addFieldMutation = useAddLayoutField()
  const updateFieldMutation = useUpdateLayoutField()
  const deleteFieldMutation = useDeleteLayoutField()
  const reorderFieldsMutation = useReorderLayoutFields()

  // Layout form state
  const [layoutFormValues, setLayoutFormValues] = useState<PreviewLayoutFormValues>({
    entity_type: 'dossier',
    context: 'hover',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    is_default: false,
    layout_config: DEFAULT_LAYOUT_CONFIG,
  })

  // Field form state
  const [fieldFormValues, setFieldFormValues] = useState<PreviewLayoutFieldFormValues>({
    field_key: '',
    field_type: 'text',
    label_en: '',
    label_ar: '',
    source_config: {},
    display_config: {},
    sort_order: 0,
    is_visible: true,
    is_required: false,
  })

  // Handlers
  const handleSelectEntityType = (type: PreviewEntityType) => {
    setSelectedEntityType(type)
    setSelectedLayoutId(null)
  }

  const handleSelectLayout = (layoutId: string) => {
    setSelectedLayoutId(layoutId)
  }

  const handleCreateLayout = async () => {
    if (!selectedEntityType) return

    try {
      await createLayoutMutation.mutateAsync({
        ...layoutFormValues,
        entity_type: selectedEntityType,
      })
      toast({
        title: t('messages.layoutCreated'),
      })
      setIsCreateDialogOpen(false)
      resetLayoutForm()
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleUpdateLayout = async () => {
    if (!selectedLayoutId) return

    try {
      await updateLayoutMutation.mutateAsync({
        id: selectedLayoutId,
        values: layoutFormValues,
      })
      toast({
        title: t('messages.layoutUpdated'),
      })
      setIsEditDialogOpen(false)
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleDeleteLayout = async (layoutId: string) => {
    if (!selectedEntityType) return

    try {
      await deleteLayoutMutation.mutateAsync({
        id: layoutId,
        entityType: selectedEntityType,
      })
      toast({
        title: t('messages.layoutDeleted'),
      })
      if (selectedLayoutId === layoutId) {
        setSelectedLayoutId(null)
      }
    } catch (error) {
      toast({
        title: t('errors.deleteFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (layoutId: string) => {
    if (!selectedEntityType) return

    try {
      await setDefaultMutation.mutateAsync({
        layoutId,
        entityType: selectedEntityType,
      })
      toast({
        title: t('messages.layoutSetDefault'),
      })
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleAddField = async () => {
    if (!selectedLayoutId) return

    try {
      await addFieldMutation.mutateAsync({
        layoutId: selectedLayoutId,
        values: fieldFormValues,
      })
      toast({
        title: t('messages.fieldAdded'),
      })
      setIsFieldDialogOpen(false)
      resetFieldForm()
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleUpdateField = async () => {
    if (!selectedLayoutId || !editingField) return

    try {
      await updateFieldMutation.mutateAsync({
        id: editingField.id,
        layoutId: selectedLayoutId,
        values: fieldFormValues,
      })
      toast({
        title: t('messages.fieldUpdated'),
      })
      setIsFieldDialogOpen(false)
      setEditingField(null)
      resetFieldForm()
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!selectedLayoutId) return

    try {
      await deleteFieldMutation.mutateAsync({
        id: fieldId,
        layoutId: selectedLayoutId,
      })
      toast({
        title: t('messages.fieldDeleted'),
      })
    } catch (error) {
      toast({
        title: t('errors.deleteFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleMoveField = async (fieldId: string, direction: 'up' | 'down') => {
    if (!layoutDetails?.fields) return

    const fields = [...layoutDetails.fields]
    const index = fields.findIndex((f) => f.id === fieldId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return // Swap
    ;[fields[index], fields[newIndex]] = [fields[newIndex], fields[index]]

    // Update sort orders
    const fieldOrders = fields.map((f, i) => ({
      id: f.id,
      sort_order: i,
    }))

    try {
      await reorderFieldsMutation.mutateAsync({
        layoutId: selectedLayoutId!,
        fieldOrders,
      })
      toast({
        title: t('messages.fieldsReordered'),
      })
    } catch (error) {
      toast({
        title: t('errors.saveFailed'),
        variant: 'destructive',
      })
    }
  }

  const resetLayoutForm = () => {
    setLayoutFormValues({
      entity_type: selectedEntityType || 'dossier',
      context: 'hover',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      is_default: false,
      layout_config: DEFAULT_LAYOUT_CONFIG,
    })
  }

  const resetFieldForm = () => {
    setFieldFormValues({
      field_key: '',
      field_type: 'text',
      label_en: '',
      label_ar: '',
      source_config: {},
      display_config: {},
      sort_order: layoutDetails?.fields?.length || 0,
      is_visible: true,
      is_required: false,
    })
  }

  const openEditDialog = () => {
    if (!layoutDetails) return
    setLayoutFormValues({
      entity_type: layoutDetails.entity_type,
      context: layoutDetails.context,
      name_en: layoutDetails.name_en,
      name_ar: layoutDetails.name_ar,
      description_en: layoutDetails.description_en || '',
      description_ar: layoutDetails.description_ar || '',
      is_default: layoutDetails.is_default,
      layout_config: layoutDetails.layout_config,
    })
    setIsEditDialogOpen(true)
  }

  const openFieldDialog = (field?: PreviewLayoutField) => {
    if (field) {
      setEditingField(field)
      setFieldFormValues({
        field_key: field.field_key,
        field_type: field.field_type,
        label_en: field.label_en,
        label_ar: field.label_ar,
        source_config: field.source_config,
        display_config: field.display_config,
        sort_order: field.sort_order,
        is_visible: field.is_visible,
        is_required: field.is_required,
      })
    } else {
      setEditingField(null)
      resetFieldForm()
    }
    setIsFieldDialogOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-primary" />
            {t('pageTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pageDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entity Type Selection */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">{t('selectEntity')}</CardTitle>
            <CardDescription>{t('selectEntityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PREVIEW_ENTITY_TYPES.map((type) => {
              const Icon = ENTITY_ICONS[type]
              const isSelected = selectedEntityType === type
              return (
                <button
                  key={type}
                  onClick={() => handleSelectEntityType(type)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    'min-h-11 text-start',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent hover:border-border hover:bg-muted/50',
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">
                    {isRTL ? ENTITY_TYPE_LABELS[type].ar : ENTITY_TYPE_LABELS[type].en}
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Layouts List */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('layouts.title')}</CardTitle>
                <CardDescription>
                  {selectedEntityType
                    ? isRTL
                      ? ENTITY_TYPE_LABELS[selectedEntityType].ar
                      : ENTITY_TYPE_LABELS[selectedEntityType].en
                    : t('selectEntity')}
                </CardDescription>
              </div>
              {selectedEntityType && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetLayoutForm}>
                      <Plus className="h-4 w-4 me-2" />
                      {t('layouts.createLayout')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('layouts.createLayout')}</DialogTitle>
                    </DialogHeader>
                    <LayoutForm
                      values={layoutFormValues}
                      onChange={setLayoutFormValues}
                      isRTL={isRTL}
                      t={t}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        {t('actions.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateLayout}
                        disabled={createLayoutMutation.isPending}
                      >
                        {t('actions.save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedEntityType ? (
              <div className="text-center py-8 text-muted-foreground">{t('selectEntityDesc')}</div>
            ) : layoutsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : layouts && layouts.length > 0 ? (
              <div className="space-y-2">
                {layouts.map((layout) => (
                  <LayoutCard
                    key={layout.layout_id}
                    layout={layout}
                    isSelected={selectedLayoutId === layout.layout_id}
                    onSelect={() => handleSelectLayout(layout.layout_id)}
                    onSetDefault={() => handleSetDefault(layout.layout_id)}
                    onDelete={() => handleDeleteLayout(layout.layout_id)}
                    isRTL={isRTL}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('layouts.noLayouts')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('layouts.noLayoutsDesc')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Layout Details */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {layoutDetails
                    ? isRTL
                      ? layoutDetails.name_ar
                      : layoutDetails.name_en
                    : t('tabs.settings')}
                </CardTitle>
                {layoutDetails && (
                  <CardDescription>
                    {isRTL
                      ? CONTEXT_LABELS[layoutDetails.context].ar
                      : CONTEXT_LABELS[layoutDetails.context].en}
                  </CardDescription>
                )}
              </div>
              {layoutDetails && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={openEditDialog}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedLayoutId ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('layouts.noLayoutsDesc')}
              </div>
            ) : layoutDetailsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : layoutDetails ? (
              <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
                  <TabsTrigger value="fields">{t('tabs.fields')}</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <LayoutConfigDisplay config={layoutDetails.layout_config} isRTL={isRTL} t={t} />
                </TabsContent>

                <TabsContent value="fields" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{t('fields.title')}</h3>
                    <Button size="sm" onClick={() => openFieldDialog()}>
                      <Plus className="h-4 w-4 me-2" />
                      {t('fields.addField')}
                    </Button>
                  </div>

                  {layoutDetails.fields.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <p className="text-muted-foreground">{t('fields.noFields')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('fields.noFieldsDesc')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {layoutDetails.fields.map((field, index) => (
                        <FieldCard
                          key={field.id}
                          field={field}
                          index={index}
                          totalFields={layoutDetails.fields.length}
                          onEdit={() => openFieldDialog(field)}
                          onDelete={() => handleDeleteField(field.id)}
                          onMoveUp={() => handleMoveField(field.id, 'up')}
                          onMoveDown={() => handleMoveField(field.id, 'down')}
                          isRTL={isRTL}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Edit Layout Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('layouts.editLayout')}</DialogTitle>
          </DialogHeader>
          <LayoutForm
            values={layoutFormValues}
            onChange={setLayoutFormValues}
            isRTL={isRTL}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleUpdateLayout} disabled={updateLayoutMutation.isPending}>
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? t('fields.editField') : t('fields.addField')}</DialogTitle>
          </DialogHeader>
          <FieldForm values={fieldFormValues} onChange={setFieldFormValues} isRTL={isRTL} t={t} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFieldDialogOpen(false)
                setEditingField(null)
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={editingField ? handleUpdateField : handleAddField}
              disabled={editingField ? updateFieldMutation.isPending : addFieldMutation.isPending}
            >
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface LayoutCardProps {
  layout: GetEntityLayoutsResponse
  isSelected: boolean
  onSelect: () => void
  onSetDefault: () => void
  onDelete: () => void
  isRTL: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

function LayoutCard({
  layout,
  isSelected,
  onSelect,
  onSetDefault,
  onDelete,
  isRTL,
  t,
}: LayoutCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{isRTL ? layout.name_ar : layout.name_en}</span>
          {layout.is_default && (
            <Badge variant="secondary" className="text-xs">
              {t('layouts.isDefault')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>
            {isRTL ? CONTEXT_LABELS[layout.context].ar : CONTEXT_LABELS[layout.context].en}
          </span>
          <span>·</span>
          <span>{t('layouts.fieldCount', { count: layout.field_count })}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onSetDefault()
          }}
          className="h-8 w-8"
        >
          {layout.is_default ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="h-8 w-8 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface LayoutFormProps {
  values: PreviewLayoutFormValues
  onChange: (values: PreviewLayoutFormValues) => void
  isRTL: boolean
  t: (key: string) => string
}

function LayoutForm({ values, onChange, isRTL, t }: LayoutFormProps) {
  const updateValue = <K extends keyof PreviewLayoutFormValues>(
    key: K,
    value: PreviewLayoutFormValues[K],
  ) => {
    onChange({ ...values, [key]: value })
  }

  const updateConfig = <K extends keyof PreviewLayoutConfig>(
    key: K,
    value: PreviewLayoutConfig[K],
  ) => {
    onChange({
      ...values,
      layout_config: { ...values.layout_config, [key]: value },
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('layouts.nameEn')}</Label>
          <Input
            value={values.name_en}
            onChange={(e) => updateValue('name_en', e.target.value)}
            placeholder="Default Preview"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('layouts.nameAr')}</Label>
          <Input
            value={values.name_ar}
            onChange={(e) => updateValue('name_ar', e.target.value)}
            placeholder="المعاينة الافتراضية"
            dir="rtl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('layouts.context')}</Label>
        <Select
          value={values.context}
          onValueChange={(v) => updateValue('context', v as PreviewContext)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_CONTEXTS.map((ctx) => (
              <SelectItem key={ctx} value={ctx}>
                {isRTL ? CONTEXT_LABELS[ctx].ar : CONTEXT_LABELS[ctx].en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium">{t('layoutConfig.title')}</h4>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('layoutConfig.showAvatar')}</p>
            <p className="text-xs text-muted-foreground">{t('layoutConfig.showAvatarDesc')}</p>
          </div>
          <Switch
            checked={values.layout_config.showAvatar}
            onCheckedChange={(v) => updateConfig('showAvatar', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('layoutConfig.showStatus')}</p>
            <p className="text-xs text-muted-foreground">{t('layoutConfig.showStatusDesc')}</p>
          </div>
          <Switch
            checked={values.layout_config.showStatus}
            onCheckedChange={(v) => updateConfig('showStatus', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('layoutConfig.showEntityType')}</p>
            <p className="text-xs text-muted-foreground">{t('layoutConfig.showEntityTypeDesc')}</p>
          </div>
          <Switch
            checked={values.layout_config.showEntityType}
            onCheckedChange={(v) => updateConfig('showEntityType', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('layoutConfig.showLastUpdated')}</p>
            <p className="text-xs text-muted-foreground">{t('layoutConfig.showLastUpdatedDesc')}</p>
          </div>
          <Switch
            checked={values.layout_config.showLastUpdated}
            onCheckedChange={(v) => updateConfig('showLastUpdated', v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('layoutConfig.maxKeyDetails')}</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={values.layout_config.maxKeyDetails}
              onChange={(e) => updateConfig('maxKeyDetails', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('layoutConfig.maxTags')}</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={values.layout_config.maxTags}
              onChange={(e) => updateConfig('maxTags', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface LayoutConfigDisplayProps {
  config: PreviewLayoutConfig
  isRTL: boolean
  t: (key: string) => string
}

function LayoutConfigDisplay({ config, isRTL, t }: LayoutConfigDisplayProps) {
  const configItems = [
    { key: 'showAvatar', value: config.showAvatar },
    { key: 'showStatus', value: config.showStatus },
    { key: 'showEntityType', value: config.showEntityType },
    { key: 'showLastUpdated', value: config.showLastUpdated },
    { key: 'showRecentActivity', value: config.showRecentActivity },
    { key: 'showMatchScore', value: config.showMatchScore },
  ]

  return (
    <div className="space-y-3">
      {configItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-2">
          <span className="text-sm">{t(`layoutConfig.${item.key}`)}</span>
          <Badge variant={item.value ? 'default' : 'secondary'}>
            {item.value ? <Eye className="h-3 w-3 me-1" /> : <EyeOff className="h-3 w-3 me-1" />}
            {item.value ? 'Visible' : 'Hidden'}
          </Badge>
        </div>
      ))}
      <Separator />
      <div className="flex items-center justify-between py-2">
        <span className="text-sm">{t('layoutConfig.maxKeyDetails')}</span>
        <Badge variant="outline">{config.maxKeyDetails}</Badge>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-sm">{t('layoutConfig.maxTags')}</span>
        <Badge variant="outline">{config.maxTags}</Badge>
      </div>
    </div>
  )
}

interface FieldCardProps {
  field: PreviewLayoutField
  index: number
  totalFields: number
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isRTL: boolean
  t: (key: string) => string
}

function FieldCard({
  field,
  index,
  totalFields,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isRTL,
  t,
}: FieldCardProps) {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <div className="flex flex-col gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={index === totalFields - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{isRTL ? field.label_ar : field.label_en}</span>
          <Badge variant="outline" className="text-xs">
            {isRTL
              ? FIELD_TYPE_LABELS[field.field_type].ar
              : FIELD_TYPE_LABELS[field.field_type].en}
          </Badge>
          {field.is_required && (
            <Badge variant="secondary" className="text-xs">
              {t('fields.isRequired')}
            </Badge>
          )}
          {!field.is_visible && (
            <Badge variant="secondary" className="text-xs">
              <EyeOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{field.field_key}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={onDelete}
          disabled={field.is_required}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface FieldFormProps {
  values: PreviewLayoutFieldFormValues
  onChange: (values: PreviewLayoutFieldFormValues) => void
  isRTL: boolean
  t: (key: string) => string
}

function FieldForm({ values, onChange, isRTL, t }: FieldFormProps) {
  const updateValue = <K extends keyof PreviewLayoutFieldFormValues>(
    key: K,
    value: PreviewLayoutFieldFormValues[K],
  ) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('fields.fieldKey')}</Label>
          <Input
            value={values.field_key}
            onChange={(e) => updateValue('field_key', e.target.value)}
            placeholder="field_name"
          />
          <p className="text-xs text-muted-foreground">{t('fields.fieldKeyDesc')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('fields.fieldType')}</Label>
          <Select
            value={values.field_type}
            onValueChange={(v) => updateValue('field_type', v as PreviewFieldType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREVIEW_FIELD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {isRTL ? FIELD_TYPE_LABELS[type].ar : FIELD_TYPE_LABELS[type].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('fields.labelEn')}</Label>
          <Input
            value={values.label_en}
            onChange={(e) => updateValue('label_en', e.target.value)}
            placeholder="Field Label"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('fields.labelAr')}</Label>
          <Input
            value={values.label_ar}
            onChange={(e) => updateValue('label_ar', e.target.value)}
            placeholder="تسمية الحقل"
            dir="rtl"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t('fields.sourceColumn')}</Label>
        <Input
          value={values.source_config.column || ''}
          onChange={(e) =>
            updateValue('source_config', { ...values.source_config, column: e.target.value })
          }
          placeholder="database_column_name"
        />
      </div>

      <div className="space-y-2">
        <Label>{t('fields.sourcePath')}</Label>
        <Input
          value={values.source_config.path || ''}
          onChange={(e) =>
            updateValue('source_config', { ...values.source_config, path: e.target.value })
          }
          placeholder="relationship.field_name"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label>{t('fields.isVisible')}</Label>
          <Switch
            checked={values.is_visible}
            onCheckedChange={(v) => updateValue('is_visible', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>{t('fields.isRequired')}</Label>
          <Switch
            checked={values.is_required}
            onCheckedChange={(v) => updateValue('is_required', v)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('fields.sortOrder')}</Label>
        <Input
          type="number"
          min={0}
          value={values.sort_order}
          onChange={(e) => updateValue('sort_order', parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  )
}

export default PreviewLayoutsPage
