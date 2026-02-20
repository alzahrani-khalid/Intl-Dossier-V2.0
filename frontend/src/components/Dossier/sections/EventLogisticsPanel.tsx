/**
 * EventLogisticsPanel Component
 *
 * Manages logistics items for a side event with status tracking and cost summaries.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  User,
  DollarSign,
  Save,
  Loader2,
  X,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useEventLogistics,
  useCreateEventLogistics,
  useUpdateEventLogistics,
} from '@/hooks/useSideEvents'
import type {
  EventLogistics,
  CreateLogisticsRequest,
  UpdateLogisticsRequest,
  LogisticsType,
  LogisticsStatus,
} from '@/types/forum-extended.types'

interface EventLogisticsPanelProps {
  eventId: string
  eventTitle?: string
}

export function EventLogisticsPanel({ eventId, eventTitle }: EventLogisticsPanelProps) {
  const { t, i18n } = useTranslation('forum-management')
  const isRTL = i18n.language === 'ar'

  // Data fetching
  const { data: logistics, isLoading, error, refetch } = useEventLogistics(eventId)
  const createLogistics = useCreateEventLogistics()
  const updateLogistics = useUpdateEventLogistics()

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Logistics types
  const logisticsTypes: LogisticsType[] = [
    'catering',
    'av_equipment',
    'interpretation',
    'security',
    'transportation',
    'accommodation',
    'decoration',
    'photography',
    'printing',
    'registration',
    'signage',
    'gifts',
    'protocol',
    'other',
  ]

  // Calculate totals
  const totals = {
    estimated: logistics?.reduce((sum, l) => sum + (l.estimated_cost || 0), 0) || 0,
    actual: logistics?.reduce((sum, l) => sum + (l.actual_cost || 0), 0) || 0,
    pending: logistics?.filter((l) => ['pending', 'requested'].includes(l.status)).length || 0,
    confirmed: logistics?.filter((l) => ['confirmed', 'completed'].includes(l.status)).length || 0,
    total: logistics?.length || 0,
  }

  // Get type icon
  const getTypeIcon = (type: LogisticsType) => {
    const icons: Record<string, React.ReactNode> = {
      catering: '🍽️',
      av_equipment: '🎥',
      interpretation: '🗣️',
      security: '🛡️',
      transportation: '🚗',
      accommodation: '🏨',
      decoration: '🎨',
      photography: '📷',
      printing: '📄',
      registration: '📋',
      signage: '🪧',
      gifts: '🎁',
      protocol: '🎭',
      other: '📦',
    }
    return icons[type] || '📦'
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">
            {t('logistics.title', 'Event Logistics')}
          </h3>
          {eventTitle && <p className="text-sm text-muted-foreground text-start">{eventTitle}</p>}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-h-10 shrink-0"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          {t('logistics.create', 'Add Logistics')}
        </Button>
      </div>

      {/* Summary Cards */}
      {logistics && logistics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{totals.total}</p>
            <p className="text-xs text-muted-foreground">{t('logistics.items', 'Items')}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-600">{totals.pending}</p>
            <p className="text-xs text-muted-foreground">
              {t('logisticsStatus.pending', 'Pending')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{totals.confirmed}</p>
            <p className="text-xs text-muted-foreground">
              {t('logisticsStatus.confirmed', 'Confirmed')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat(i18n.language, {
                style: 'currency',
                currency: 'SAR',
                maximumFractionDigits: 0,
              }).format(totals.estimated)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('logistics.estimatedCost', 'Est. Cost')}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('logistics.loadError', 'Failed to load logistics')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Logistics List */}
      {!isLoading && !error && logistics && logistics.length > 0 && (
        <div className="space-y-3">
          {logistics.map((item) => (
            <LogisticsItem
              key={item.id}
              item={item}
              eventId={eventId}
              isRTL={isRTL}
              isEditing={editingId === item.id}
              onEdit={() => setEditingId(item.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={updateLogistics}
              t={t}
              i18n={i18n}
              getTypeIcon={getTypeIcon}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!logistics || logistics.length === 0) && !showAddForm && (
        <div className="text-center py-8">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">
            {t('logistics.empty', 'No Logistics Configured')}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t('logistics.emptyDescription', 'Add logistics requirements for this event')}
          </p>
          <Button variant="default" onClick={() => setShowAddForm(true)} className="gap-2 min-h-11">
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('logistics.create', 'Add Logistics')}
          </Button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <AddLogisticsForm
          eventId={eventId}
          isRTL={isRTL}
          onClose={() => setShowAddForm(false)}
          onCreate={createLogistics}
          logisticsTypes={logisticsTypes}
          t={t}
          getTypeIcon={getTypeIcon}
        />
      )}
    </div>
  )
}

// Logistics Item Component
interface LogisticsItemProps {
  item: EventLogistics
  eventId: string
  isRTL: boolean
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: ReturnType<typeof useUpdateEventLogistics>
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
  getTypeIcon: (type: LogisticsType) => React.ReactNode
}

function LogisticsItem({
  item,
  eventId,
  isRTL,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  t,
  i18n,
  getTypeIcon,
}: LogisticsItemProps) {
  const [editData, setEditData] = useState<UpdateLogisticsRequest>({
    status: item.status,
    actual_cost: item.actual_cost || undefined,
    notes: item.notes || undefined,
  })

  const statusConfig = getStatusConfig(item.status, t)
  const requirements = isRTL
    ? item.requirements_ar || item.requirements_en
    : item.requirements_en || item.requirements_ar

  const handleUpdate = async () => {
    await onUpdate.mutateAsync({
      id: item.id,
      eventId,
      data: editData,
    })
    onCancelEdit()
  }

  if (isEditing) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(item.logistics_type)}</span>
            <span className="font-medium">
              {t(`logisticsTypes.${item.logistics_type}`, item.logistics_type)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('common.status', 'Status')}</label>
            <select
              value={editData.status || item.status}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  status: e.target.value as LogisticsStatus,
                }))
              }
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            >
              {(
                [
                  'pending',
                  'requested',
                  'quoted',
                  'approved',
                  'booked',
                  'confirmed',
                  'cancelled',
                  'completed',
                ] as LogisticsStatus[]
              ).map((status) => (
                <option key={status} value={status}>
                  {t(`logisticsStatus.${status}`, status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('logistics.actualCost', 'Actual Cost')}
            </label>
            <input
              type="number"
              value={editData.actual_cost ?? ''}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  actual_cost: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
              placeholder={item.estimated_cost?.toString() || '0'}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('common.notes', 'Notes')}</label>
          <textarea
            value={editData.notes ?? item.notes ?? ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancelEdit}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={onUpdate.isPending} className="gap-2">
            {onUpdate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('actions.save', 'Save')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-lg">
          {getTypeIcon(item.logistics_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className="font-medium text-start">
                {t(`logisticsTypes.${item.logistics_type}`, item.logistics_type)}
              </h4>
              {item.provider_name && (
                <p className="text-xs text-muted-foreground">{item.provider_name}</p>
              )}
            </div>
            <Badge variant={statusConfig.variant} className="text-xs shrink-0">
              {statusConfig.icon}
              <span className="ms-1">{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Requirements */}
          {requirements && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 text-start">
              {requirements}
            </p>
          )}

          {/* Meta Row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {/* Provider Contact */}
            {item.provider_contact && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.provider_contact}
              </span>
            )}
            {item.provider_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {item.provider_phone}
              </span>
            )}
            {item.provider_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {item.provider_email}
              </span>
            )}

            {/* Cost */}
            {(item.estimated_cost || item.actual_cost) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {item.actual_cost
                  ? new Intl.NumberFormat(i18n.language, {
                      style: 'currency',
                      currency: item.currency || 'SAR',
                    }).format(item.actual_cost)
                  : item.estimated_cost
                    ? `~${new Intl.NumberFormat(i18n.language, {
                        style: 'currency',
                        currency: item.currency || 'SAR',
                      }).format(item.estimated_cost)}`
                    : null}
              </span>
            )}

            {/* Deadline */}
            {item.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(item.deadline).toLocaleDateString(i18n.language)}
              </span>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Add Logistics Form Component
interface AddLogisticsFormProps {
  eventId: string
  isRTL: boolean
  onClose: () => void
  onCreate: ReturnType<typeof useCreateEventLogistics>
  logisticsTypes: LogisticsType[]
  t: ReturnType<typeof useTranslation>['t']
  getTypeIcon: (type: LogisticsType) => React.ReactNode
}

function AddLogisticsForm({
  eventId,
  onClose,
  onCreate,
  logisticsTypes,
  t,
  getTypeIcon,
}: AddLogisticsFormProps) {
  const [formData, setFormData] = useState<CreateLogisticsRequest>({
    event_id: eventId,
    logistics_type: 'catering',
    provider_name: '',
    provider_contact: '',
    provider_email: '',
    provider_phone: '',
    requirements_en: '',
    requirements_ar: '',
    quantity: 1,
    estimated_cost: undefined,
    currency: 'SAR',
    deadline: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreate.mutateAsync(formData)
    onClose()
  }

  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{t('logistics.create', 'Add Logistics')}</h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block text-start">
            {t('common.type', 'Type')} *
          </label>
          <select
            value={formData.logistics_type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                logistics_type: e.target.value as LogisticsType,
              }))
            }
            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
          >
            {logisticsTypes.map((type) => (
              <option key={type} value={type}>
                {getTypeIcon(type)} {t(`logisticsTypes.${type}`, type)}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.providerName', 'Provider')}
            </label>
            <input
              type="text"
              value={formData.provider_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, provider_name: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.providerContact', 'Contact')}
            </label>
            <input
              type="text"
              value={formData.provider_contact}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, provider_contact: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.providerEmail', 'Email')}
            </label>
            <input
              type="email"
              value={formData.provider_email}
              onChange={(e) => setFormData((prev) => ({ ...prev, provider_email: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.providerPhone', 'Phone')}
            </label>
            <input
              type="tel"
              value={formData.provider_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, provider_phone: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.requirements', 'Requirements')} (EN)
            </label>
            <textarea
              value={formData.requirements_en}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requirements_en: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.requirements', 'Requirements')} (AR)
            </label>
            <textarea
              dir="rtl"
              value={formData.requirements_ar}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requirements_ar: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
            />
          </div>
        </div>

        {/* Cost & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.quantity', 'Quantity')}
            </label>
            <input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) }))
              }
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('logistics.estimatedCost', 'Est. Cost')}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.estimated_cost ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimated_cost: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-start">
              {t('assignments.deadline', 'Deadline')}
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={onCreate.isPending} className="gap-2">
            {onCreate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('logistics.create', 'Add')}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Helper function for status config
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

function getStatusConfig(status: LogisticsStatus, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<
    LogisticsStatus,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    pending: {
      label: t('logisticsStatus.pending', 'Pending'),
      variant: 'outline',
      icon: <Clock className="h-3 w-3" />,
    },
    requested: {
      label: t('logisticsStatus.requested', 'Requested'),
      variant: 'secondary',
      icon: <Clock className="h-3 w-3" />,
    },
    quoted: {
      label: t('logisticsStatus.quoted', 'Quoted'),
      variant: 'secondary',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    approved: {
      label: t('logisticsStatus.approved', 'Approved'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    booked: {
      label: t('logisticsStatus.booked', 'Booked'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    confirmed: {
      label: t('logisticsStatus.confirmed', 'Confirmed'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    cancelled: {
      label: t('logisticsStatus.cancelled', 'Cancelled'),
      variant: 'destructive',
      icon: <X className="h-3 w-3" />,
    },
    completed: {
      label: t('logisticsStatus.completed', 'Completed'),
      variant: 'outline',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  }

  return configs[status] || configs.pending
}

export default EventLogisticsPanel
