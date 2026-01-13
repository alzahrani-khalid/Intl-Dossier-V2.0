/**
 * Webhooks Page
 * Feature: webhook-integration
 *
 * Comprehensive webhook management interface including:
 * - List of configured webhooks
 * - Create/edit webhook dialog
 * - Test webhook connectivity
 * - View delivery history
 * - Integration templates
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Settings,
  Trash2,
  Play,
  Pause,
  History,
  TestTube,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

import {
  useWebhooks,
  useWebhook,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useToggleWebhookActive,
  useTestWebhook,
  useWebhookDeliveries,
  useWebhookStats,
  useWebhookTemplates,
} from '@/hooks/useWebhooks'

import type {
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookEventType,
  WebhookAuthType,
  WebhookHttpMethod,
  WebhookDeliveryStatus,
  WebhookTemplate,
} from '@/types/webhook.types'
import { WEBHOOK_EVENT_CATEGORIES } from '@/types/webhook.types'

// ============================================================================
// Main Component
// ============================================================================

interface WebhooksPageProps {
  initialTab?: 'list' | 'templates'
  initialSearch?: string
}

export function WebhooksPage({ initialTab = 'list', initialSearch = '' }: WebhooksPageProps) {
  const { t, i18n } = useTranslation('webhooks')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState(initialSearch)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

  // Query params
  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    }),
    [search, activeFilter],
  )

  // Queries
  const { data: webhooksData, isLoading, refetch } = useWebhooks(queryParams)
  const { data: templates } = useWebhookTemplates()

  // Mutations
  const toggleActive = useToggleWebhookActive()
  const deleteWebhook = useDeleteWebhook()
  const testWebhook = useTestWebhook()

  // Handlers
  const handleToggleActive = (webhook: Webhook) => {
    toggleActive.mutate({ id: webhook.id, is_active: !webhook.is_active })
  }

  const handleDelete = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedWebhook) {
      deleteWebhook.mutate(selectedWebhook.id)
    }
    setDeleteDialogOpen(false)
    setSelectedWebhook(null)
  }

  const handleTest = (webhook: Webhook) => {
    testWebhook.mutate({ webhook_id: webhook.id })
  }

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setEditDialogOpen(true)
  }

  const handleViewDetails = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDetailsDialogOpen(true)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success(t('messages.urlCopied'))
  }

  const handleUseTemplate = (template: WebhookTemplate) => {
    setSelectedWebhook({
      payload_template: template.default_payload_template,
      custom_headers: template.default_headers,
    } as Webhook)
    setCreateDialogOpen(true)
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="min-h-11 min-w-11">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('actions.create')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'templates')}>
        <TabsList className="mb-6">
          <TabsTrigger value="list">{t('headings.list')}</TabsTrigger>
          <TabsTrigger value="templates">{t('headings.templates')}</TabsTrigger>
        </TabsList>

        {/* Webhooks List Tab */}
        <TabsContent value="list">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
              />
              <Input
                placeholder={t('placeholders.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${isRTL ? 'pe-10' : 'ps-10'} min-h-11`}
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(v: 'all' | 'active' | 'inactive') => setActiveFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-48 min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                <SelectItem value="active">{t('filters.active')}</SelectItem>
                <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()} className="min-h-11">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Webhooks Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : webhooksData?.data && webhooksData.data.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {webhooksData.data.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  isRTL={isRTL}
                  onToggleActive={() => handleToggleActive(webhook)}
                  onEdit={() => handleEdit(webhook)}
                  onDelete={() => handleDelete(webhook)}
                  onTest={() => handleTest(webhook)}
                  onViewDetails={() => handleViewDetails(webhook)}
                  onCopyUrl={() => handleCopyUrl(webhook.url)}
                  isTestLoading={testWebhook.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isRTL={isRTL}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <WebhookFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialData={selectedWebhook as Partial<Webhook> | undefined}
        mode="create"
      />

      {/* Edit Dialog */}
      {selectedWebhook && (
        <WebhookFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          initialData={selectedWebhook}
          mode="edit"
        />
      )}

      {/* Details Dialog */}
      {selectedWebhook && (
        <WebhookDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          webhookId={selectedWebhook.id}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('messages.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================================
// Webhook Card Component
// ============================================================================

interface WebhookCardProps {
  webhook: Webhook
  isRTL: boolean
  onToggleActive: () => void
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
  onViewDetails: () => void
  onCopyUrl: () => void
  isTestLoading: boolean
}

function WebhookCard({
  webhook,
  isRTL,
  onToggleActive,
  onEdit,
  onDelete,
  onTest,
  onViewDetails,
  onCopyUrl,
  isTestLoading,
}: WebhookCardProps) {
  const { t, i18n } = useTranslation('webhooks')

  const name = i18n.language === 'ar' ? webhook.name_ar : webhook.name_en
  const description = i18n.language === 'ar' ? webhook.description_ar : webhook.description_en

  const statusColor = webhook.is_active
    ? webhook.auto_disabled_at
      ? 'bg-yellow-500'
      : 'bg-green-500'
    : 'bg-gray-400'

  const statusText = webhook.is_active
    ? webhook.auto_disabled_at
      ? t('labels.autoDisabled')
      : t('labels.active')
    : t('labels.inactive')

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span className="text-xs text-muted-foreground">{statusText}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* URL */}
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">{webhook.url}</code>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopyUrl}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Events */}
        <div className="flex flex-wrap gap-1 mb-3">
          {webhook.subscribed_events.slice(0, 3).map((event) => (
            <Badge key={event} variant="secondary" className="text-xs">
              {t(`events.${event}`)}
            </Badge>
          ))}
          {webhook.subscribed_events.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{webhook.subscribed_events.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span>{webhook.success_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span>{webhook.failure_count}</span>
          </div>
          {webhook.last_triggered_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(webhook.last_triggered_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Auto-disabled warning */}
        {webhook.auto_disabled_at && (
          <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 px-2 py-1.5 rounded mb-4">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{t('messages.autoDisabledWarning')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={webhook.is_active} onCheckedChange={onToggleActive} />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onTest}
              disabled={isTestLoading}
            >
              {isTestLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewDetails}>
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: WebhookTemplate
  isRTL: boolean
  onUse: () => void
}

function TemplateCard({ template, isRTL, onUse }: TemplateCardProps) {
  const { t, i18n } = useTranslation('webhooks')
  const name = i18n.language === 'ar' ? template.name_ar : template.name_en
  const description = i18n.language === 'ar' ? template.description_ar : template.description_en

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onUse}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {template.icon_url && (
            <img src={template.icon_url} alt={name} className="h-8 w-8 object-contain" />
          )}
          <CardTitle className="text-base">{name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {template.documentation_url && (
          <a
            href={template.documentation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {t('templates.useTemplate')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation('webhooks')

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{t('empty.title')}</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">{t('empty.description')}</p>
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4 me-2" />
        {t('empty.action')}
      </Button>
    </div>
  )
}

// ============================================================================
// Webhook Form Dialog
// ============================================================================

interface WebhookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<Webhook>
  mode: 'create' | 'edit'
}

function WebhookFormDialog({ open, onOpenChange, initialData, mode }: WebhookFormDialogProps) {
  const { t, i18n } = useTranslation('webhooks')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [formData, setFormData] = useState<Partial<WebhookCreate>>({
    name_en: initialData?.name_en || '',
    name_ar: initialData?.name_ar || '',
    description_en: initialData?.description_en || '',
    description_ar: initialData?.description_ar || '',
    url: initialData?.url || '',
    http_method: initialData?.http_method || 'POST',
    auth_type: initialData?.auth_type || 'hmac_sha256',
    auth_secret: '',
    subscribed_events: initialData?.subscribed_events || [],
    max_retries: initialData?.max_retries ?? 3,
    retry_delay_seconds: initialData?.retry_delay_seconds ?? 60,
    timeout_seconds: initialData?.timeout_seconds ?? 30,
    include_full_payload: initialData?.include_full_payload ?? true,
    is_active: initialData?.is_active ?? true,
    payload_template: initialData?.payload_template || undefined,
    custom_headers: initialData?.custom_headers || {},
  })

  // Mutations
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()

  const handleSubmit = () => {
    if (mode === 'create') {
      createWebhook.mutate(formData as WebhookCreate, {
        onSuccess: () => onOpenChange(false),
      })
    } else if (initialData?.id) {
      updateWebhook.mutate({ ...formData, id: initialData.id } as WebhookUpdate, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  const handleEventToggle = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      subscribed_events: prev.subscribed_events?.includes(event)
        ? prev.subscribed_events.filter((e) => e !== event)
        : [...(prev.subscribed_events || []), event],
    }))
  }

  const handleCategoryToggle = (events: WebhookEventType[]) => {
    const allSelected = events.every((e) => formData.subscribed_events?.includes(e))
    setFormData((prev) => ({
      ...prev,
      subscribed_events: allSelected
        ? prev.subscribed_events?.filter((e) => !events.includes(e))
        : [...new Set([...(prev.subscribed_events || []), ...events])],
    }))
  }

  const isSubmitting = createWebhook.isPending || updateWebhook.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('headings.create') : t('headings.edit')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pe-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('labels.nameEn')}</Label>
                <Input
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                  placeholder={t('placeholders.name')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('labels.nameAr')}</Label>
                <Input
                  value={formData.name_ar || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                  placeholder={t('placeholders.name')}
                  dir="rtl"
                />
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label>{t('labels.url')}</Label>
              <Input
                type="url"
                value={formData.url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder={t('placeholders.url')}
              />
            </div>

            {/* HTTP Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('labels.httpMethod')}</Label>
                <Select
                  value={formData.http_method}
                  onValueChange={(v: WebhookHttpMethod) =>
                    setFormData((prev) => ({ ...prev, http_method: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('labels.authType')}</Label>
                <Select
                  value={formData.auth_type}
                  onValueChange={(v: WebhookAuthType) =>
                    setFormData((prev) => ({ ...prev, auth_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('authTypes.none')}</SelectItem>
                    <SelectItem value="hmac_sha256">{t('authTypes.hmac_sha256')}</SelectItem>
                    <SelectItem value="bearer_token">{t('authTypes.bearer_token')}</SelectItem>
                    <SelectItem value="basic_auth">{t('authTypes.basic_auth')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auth Secret */}
            {formData.auth_type !== 'none' && (
              <div className="space-y-2">
                <Label>
                  {formData.auth_type === 'basic_auth'
                    ? t('labels.authUsername')
                    : t('labels.authSecret')}
                </Label>
                <Input
                  type="password"
                  value={formData.auth_secret || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, auth_secret: e.target.value }))
                  }
                  placeholder={t('placeholders.secret')}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.auth_type === 'hmac_sha256' && t('help.hmacSignature')}
                  {formData.auth_type === 'bearer_token' && t('help.bearerToken')}
                  {formData.auth_type === 'basic_auth' && t('help.basicAuth')}
                </p>
              </div>
            )}

            <Separator />

            {/* Events */}
            <div className="space-y-3">
              <Label>{t('headings.events')}</Label>
              <Accordion type="multiple" className="w-full">
                {WEBHOOK_EVENT_CATEGORIES.map((category) => {
                  const selectedCount = category.events.filter((e) =>
                    formData.subscribed_events?.includes(e),
                  ).length

                  return (
                    <AccordionItem key={category.key} value={category.key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedCount === category.events.length}
                            onCheckedChange={() =>
                              handleCategoryToggle(category.events as WebhookEventType[])
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{t(`eventCategories.${category.key}`)}</span>
                          {selectedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount}/{category.events.length}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ps-6">
                          {category.events.map((event) => (
                            <div key={event} className="flex items-center gap-2">
                              <Checkbox
                                id={event}
                                checked={formData.subscribed_events?.includes(
                                  event as WebhookEventType,
                                )}
                                onCheckedChange={() => handleEventToggle(event as WebhookEventType)}
                              />
                              <Label htmlFor={event} className="text-sm font-normal cursor-pointer">
                                {t(`events.${event}`)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>

            <Separator />

            {/* Advanced Settings */}
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>{t('headings.advanced')}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('labels.maxRetries')}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={formData.max_retries}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              max_retries: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labels.retryDelay')}</Label>
                        <Input
                          type="number"
                          min={10}
                          max={3600}
                          value={formData.retry_delay_seconds}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              retry_delay_seconds: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labels.timeout')}</Label>
                        <Input
                          type="number"
                          min={5}
                          max={120}
                          value={formData.timeout_seconds}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              timeout_seconds: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('labels.includeFullPayload')}</Label>
                        <p className="text-xs text-muted-foreground">{t('help.payloadTemplate')}</p>
                      </div>
                      <Switch
                        checked={formData.include_full_payload}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, include_full_payload: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('labels.active')}</Label>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, is_active: checked }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Webhook Details Dialog
// ============================================================================

interface WebhookDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhookId: string
}

function WebhookDetailsDialog({ open, onOpenChange, webhookId }: WebhookDetailsDialogProps) {
  const { t, i18n } = useTranslation('webhooks')
  const isRTL = i18n.language === 'ar'

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<WebhookDeliveryStatus | 'all'>('all')

  const { data: webhook } = useWebhook(webhookId)
  const { data: stats } = useWebhookStats(webhookId)
  const { data: deliveries, isLoading } = useWebhookDeliveries({
    webhook_id: webhookId,
    page,
    limit: 10,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const name = i18n.language === 'ar' ? webhook?.name_ar : webhook?.name_en

  const getStatusIcon = (status: WebhookDeliveryStatus) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{t('headings.deliveries')}</DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_deliveries}</div>
              <div className="text-xs text-muted-foreground">{t('statistics.totalDeliveries')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successful_deliveries}</div>
              <div className="text-xs text-muted-foreground">
                {t('statistics.successfulDeliveries')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed_deliveries}</div>
              <div className="text-xs text-muted-foreground">
                {t('statistics.failedDeliveries')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.success_rate?.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{t('statistics.successRate')}</div>
            </div>
          </div>
        )}

        <Separator />

        {/* Filters */}
        <div className="flex items-center gap-4 py-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as WebhookDeliveryStatus | 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="delivered">{t('deliveryStatus.delivered')}</SelectItem>
              <SelectItem value="failed">{t('deliveryStatus.failed')}</SelectItem>
              <SelectItem value="retrying">{t('deliveryStatus.retrying')}</SelectItem>
              <SelectItem value="pending">{t('deliveryStatus.pending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deliveries List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : deliveries?.data && deliveries.data.length > 0 ? (
            <div className="space-y-3">
              {deliveries.data.map((delivery) => (
                <Card key={delivery.id} className="p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(delivery.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {t(`events.${delivery.event_type}`)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(delivery.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      {delivery.response_status_code && (
                        <Badge
                          variant={delivery.response_status_code < 400 ? 'default' : 'destructive'}
                        >
                          {delivery.response_status_code}
                        </Badge>
                      )}
                      {delivery.response_time_ms && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {delivery.response_time_ms}ms
                        </div>
                      )}
                    </div>
                  </div>
                  {delivery.error_message && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                      {delivery.error_message}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('messages.noDeliveries')}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {deliveries?.pagination && deliveries.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4 rotate-180" />
              )}
            </Button>
            <span className="text-sm">
              {page} / {deliveries.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(deliveries.pagination.totalPages, p + 1))}
              disabled={page === deliveries.pagination.totalPages}
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4 rotate-180" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default WebhooksPage
