/**
 * AgendaItemForm Component
 *
 * Form for creating and editing forum agenda items.
 * Supports hierarchical parent selection, speakers, documents.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, Trash2, FileText, User, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useForumAgendaItems,
  useCreateForumAgendaItem,
  useUpdateForumAgendaItem,
} from '@/hooks/useForumAgendaItems'
import type {
  ForumAgendaItem,
  ForumAgendaItemWithStats,
  CreateAgendaItemRequest,
  UpdateAgendaItemRequest,
  AgendaItemType,
  AgendaItemStatus,
  AgendaItemPriority,
  AgendaItemDocument,
  AgendaItemSpeaker,
} from '@/types/forum-extended.types'

interface AgendaItemFormProps {
  sessionId: string
  item?: ForumAgendaItemWithStats | null
  onClose: () => void
  onSuccess?: (item: ForumAgendaItem) => void
}

export function AgendaItemForm({ sessionId, item, onClose, onSuccess }: AgendaItemFormProps) {
  const { t, i18n } = useTranslation('forum-management')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!item

  // Fetch existing items for parent selection
  const { data: existingItems } = useForumAgendaItems(sessionId)

  // Mutations
  const createItem = useCreateForumAgendaItem()
  const updateItem = useUpdateForumAgendaItem()

  // Form state
  const [formData, setFormData] = useState({
    item_number: item?.item_number || '',
    sequence_order: item?.sequence_order || 1,
    title_en: item?.title_en || '',
    title_ar: item?.title_ar || '',
    description_en: item?.description_en || '',
    description_ar: item?.description_ar || '',
    item_type: item?.item_type || ('discussion' as AgendaItemType),
    parent_item_id: item?.parent_item_id || '',
    time_allocation_minutes: item?.time_allocation_minutes || 30,
    scheduled_start_time: item?.scheduled_start_time?.slice(0, 16) || '',
    scheduled_end_time: item?.scheduled_end_time?.slice(0, 16) || '',
    status: item?.status || ('pending' as AgendaItemStatus),
    priority: item?.priority || ('normal' as AgendaItemPriority),
    background_notes_en: item?.background_notes_en || '',
    background_notes_ar: item?.background_notes_ar || '',
    outcome_en: item?.outcome_en || '',
    outcome_ar: item?.outcome_ar || '',
    resolution_reference: item?.resolution_reference || '',
    documents: item?.documents || ([] as AgendaItemDocument[]),
    speakers: item?.speakers || ([] as AgendaItemSpeaker[]),
    tags: item?.tags || ([] as string[]),
  })

  // Temp state for adding speakers/documents
  const [newTag, setNewTag] = useState('')
  const [newDocument, setNewDocument] = useState<AgendaItemDocument>({
    title: '',
    url: '',
    type: 'document',
  })
  const [newSpeaker, setNewSpeaker] = useState<AgendaItemSpeaker>({
    name_en: '',
    name_ar: '',
    organization: '',
    role: '',
  })

  // Types
  const itemTypes: AgendaItemType[] = [
    'discussion',
    'decision',
    'information',
    'election',
    'procedural',
    'report',
    'adoption',
  ]
  const statuses: AgendaItemStatus[] = [
    'pending',
    'in_progress',
    'completed',
    'deferred',
    'withdrawn',
    'adopted',
    'rejected',
  ]
  const priorities: AgendaItemPriority[] = ['low', 'normal', 'high', 'urgent']

  // Flatten existing items for parent selection
  const flattenItems = (
    items: ForumAgendaItemWithStats[],
    level = 0,
  ): { item: ForumAgendaItemWithStats; level: number }[] => {
    return items.reduce<{ item: ForumAgendaItemWithStats; level: number }[]>((acc, item) => {
      // Exclude current item and its children from parent selection
      if (item.id !== formData.parent_item_id) {
        acc.push({ item, level })
        if (item.children) {
          acc.push(...flattenItems(item.children, level + 1))
        }
      }
      return acc
    }, [])
  }

  const parentOptions = existingItems?.data ? flattenItems(existingItems.data) : []

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing && item) {
        const updateData: UpdateAgendaItemRequest = {
          item_number: formData.item_number,
          sequence_order: formData.sequence_order,
          title_en: formData.title_en,
          title_ar: formData.title_ar,
          description_en: formData.description_en || undefined,
          description_ar: formData.description_ar || undefined,
          item_type: formData.item_type,
          parent_item_id: formData.parent_item_id || undefined,
          time_allocation_minutes: formData.time_allocation_minutes || undefined,
          scheduled_start_time: formData.scheduled_start_time || undefined,
          scheduled_end_time: formData.scheduled_end_time || undefined,
          status: formData.status,
          priority: formData.priority,
          background_notes_en: formData.background_notes_en || undefined,
          background_notes_ar: formData.background_notes_ar || undefined,
          outcome_en: formData.outcome_en || undefined,
          outcome_ar: formData.outcome_ar || undefined,
          resolution_reference: formData.resolution_reference || undefined,
          documents: formData.documents,
          speakers: formData.speakers,
          tags: formData.tags,
        }
        const result = await updateItem.mutateAsync({ id: item.id, data: updateData })
        onSuccess?.(result)
      } else {
        const createData: CreateAgendaItemRequest = {
          session_id: sessionId,
          item_number: formData.item_number,
          sequence_order: formData.sequence_order,
          title_en: formData.title_en,
          title_ar: formData.title_ar,
          description_en: formData.description_en || undefined,
          description_ar: formData.description_ar || undefined,
          item_type: formData.item_type,
          parent_item_id: formData.parent_item_id || undefined,
          time_allocation_minutes: formData.time_allocation_minutes || undefined,
          scheduled_start_time: formData.scheduled_start_time || undefined,
          scheduled_end_time: formData.scheduled_end_time || undefined,
          priority: formData.priority,
          background_notes_en: formData.background_notes_en || undefined,
          background_notes_ar: formData.background_notes_ar || undefined,
          documents: formData.documents,
          speakers: formData.speakers,
          tags: formData.tags,
        }
        const result = await createItem.mutateAsync(createData)
        onSuccess?.(result)
      }
      onClose()
    } catch (error) {
      // Error handled by mutation
      console.error('Form submission error:', error)
    }
  }

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag('')
    }
  }

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  // Add document
  const addDocument = () => {
    if (newDocument.title && newDocument.url) {
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, { ...newDocument }],
      }))
      setNewDocument({ title: '', url: '', type: 'document' })
    }
  }

  // Remove document
  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  // Add speaker
  const addSpeaker = () => {
    if (newSpeaker.name_en || newSpeaker.name_ar) {
      setFormData((prev) => ({
        ...prev,
        speakers: [...prev.speakers, { ...newSpeaker }],
      }))
      setNewSpeaker({ name_en: '', name_ar: '', organization: '', role: '' })
    }
  }

  // Remove speaker
  const removeSpeaker = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }))
  }

  const isSubmitting = createItem.isPending || updateItem.isPending

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          'fixed inset-y-0 w-full sm:w-[500px] md:w-[600px] bg-background shadow-xl',
          'overflow-y-auto',
          isRTL ? 'start-0' : 'end-0',
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isEditing
                ? t('agendaItems.edit', 'Edit Agenda Item')
                : t('agendaItems.create', 'Create Agenda Item')}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('common.basicInfo', 'Basic Information')}
            </h3>

            {/* Item Number & Sequence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('agendaItems.itemNumber', 'Item Number')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, item_number: e.target.value }))
                  }
                  placeholder="1.1"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('agendaItems.sequenceOrder', 'Sequence')} *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.sequence_order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sequence_order: parseInt(e.target.value) }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>
            </div>

            {/* Title EN */}
            <div>
              <label className="text-sm font-medium mb-2 block text-start">
                {t('common.titleEn', 'Title (English)')} *
              </label>
              <input
                type="text"
                required
                value={formData.title_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, title_en: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              />
            </div>

            {/* Title AR */}
            <div>
              <label className="text-sm font-medium mb-2 block text-start">
                {t('common.titleAr', 'Title (Arabic)')} *
              </label>
              <input
                type="text"
                required
                dir="rtl"
                value={formData.title_ar}
                onChange={(e) => setFormData((prev) => ({ ...prev, title_ar: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              />
            </div>

            {/* Description EN */}
            <div>
              <label className="text-sm font-medium mb-2 block text-start">
                {t('common.descriptionEn', 'Description (English)')}
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description_en: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
              />
            </div>

            {/* Description AR */}
            <div>
              <label className="text-sm font-medium mb-2 block text-start">
                {t('common.descriptionAr', 'Description (Arabic)')}
              </label>
              <textarea
                dir="rtl"
                value={formData.description_ar}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description_ar: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
              />
            </div>
          </div>

          {/* Classification Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('common.classification', 'Classification')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.type', 'Type')} *
                </label>
                <select
                  value={formData.item_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      item_type: e.target.value as AgendaItemType,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  {itemTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`agendaItemTypes.${type}`, type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              {isEditing && (
                <div>
                  <label className="text-sm font-medium mb-2 block text-start">
                    {t('common.status', 'Status')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as AgendaItemStatus,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`agendaItemStatus.${status}`, status)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.priority', 'Priority')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as AgendaItemPriority,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {t(`agendaItemPriority.${priority}`, priority)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent Item */}
            <div>
              <label className="text-sm font-medium mb-2 block text-start">
                {t('agendaItems.parentItem', 'Parent Item')}
              </label>
              <select
                value={formData.parent_item_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, parent_item_id: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">{t('common.none', 'None (Top-level item)')}</option>
                {parentOptions.map(({ item: parentItem, level }) => (
                  <option key={parentItem.id} value={parentItem.id}>
                    {'—'.repeat(level)} {parentItem.item_number}:{' '}
                    {isRTL ? parentItem.title_ar : parentItem.title_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('common.scheduling', 'Scheduling')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Time Allocation */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('agendaItems.timeAllocation', 'Duration (min)')}
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={formData.time_allocation_minutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      time_allocation_minutes: parseInt(e.target.value) || 30,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.startTime', 'Start Time')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduled_start_time: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.endTime', 'End Time')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduled_end_time: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* Speakers Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('agendaItems.speakers', 'Speakers')}
            </h3>

            {/* Existing Speakers */}
            {formData.speakers.length > 0 && (
              <div className="space-y-2">
                {formData.speakers.map((speaker, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isRTL ? speaker.name_ar || speaker.name_en : speaker.name_en}
                      </p>
                      {(speaker.organization || speaker.role) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[speaker.role, speaker.organization].filter(Boolean).join(' - ')}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => removeSpeaker(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Speaker Form */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t('common.nameEn', 'Name (EN)')}
                value={newSpeaker.name_en}
                onChange={(e) => setNewSpeaker((prev) => ({ ...prev, name_en: e.target.value }))}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              />
              <input
                type="text"
                dir="rtl"
                placeholder={t('common.nameAr', 'Name (AR)')}
                value={newSpeaker.name_ar}
                onChange={(e) => setNewSpeaker((prev) => ({ ...prev, name_ar: e.target.value }))}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              />
              <input
                type="text"
                placeholder={t('common.organization', 'Organization')}
                value={newSpeaker.organization}
                onChange={(e) =>
                  setNewSpeaker((prev) => ({ ...prev, organization: e.target.value }))
                }
                className="h-9 px-3 rounded-md border bg-background text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('common.role', 'Role')}
                  value={newSpeaker.role}
                  onChange={(e) => setNewSpeaker((prev) => ({ ...prev, role: e.target.value }))}
                  className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={addSpeaker}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('common.documents', 'Documents')}
            </h3>

            {/* Existing Documents */}
            {formData.documents.length > 0 && (
              <div className="space-y-2">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {doc.type}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => removeDocument(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Document Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={t('common.documentTitle', 'Document Title')}
                value={newDocument.title}
                onChange={(e) => setNewDocument((prev) => ({ ...prev, title: e.target.value }))}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              />
              <input
                type="url"
                placeholder={t('common.documentUrl', 'URL')}
                value={newDocument.url}
                onChange={(e) => setNewDocument((prev) => ({ ...prev, url: e.target.value }))}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument((prev) => ({ ...prev, type: e.target.value }))}
                  className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="document">Document</option>
                  <option value="presentation">Presentation</option>
                  <option value="report">Report</option>
                  <option value="reference">Reference</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={addDocument}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('common.tags', 'Tags')}
            </h3>

            {/* Existing Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pe-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ms-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('common.addTag', 'Add tag...')}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
              />
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Background Notes (for editing) */}
          {isEditing && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('agendaItems.outcome', 'Outcome')}
              </h3>

              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('agendaItems.resolutionReference', 'Resolution Reference')}
                </label>
                <input
                  type="text"
                  value={formData.resolution_reference}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, resolution_reference: e.target.value }))
                  }
                  placeholder="RES/2024/001"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.outcomeEn', 'Outcome (English)')}
                </label>
                <textarea
                  value={formData.outcome_en}
                  onChange={(e) => setFormData((prev) => ({ ...prev, outcome_en: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.outcomeAr', 'Outcome (Arabic)')}
                </label>
                <textarea
                  dir="rtl"
                  value={formData.outcome_ar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, outcome_ar: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-4 sm:px-6 bg-background border-t flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-11 sm:min-h-10"
            >
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-11 sm:min-h-10 gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? t('actions.save', 'Save Changes') : t('agendaItems.create', 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgendaItemForm
