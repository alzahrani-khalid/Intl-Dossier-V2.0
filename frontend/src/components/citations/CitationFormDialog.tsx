/**
 * Citation Form Dialog Component
 * Feature: citation-tracking
 *
 * Dialog for creating and editing citations.
 * Supports both internal entity references and external sources.
 * Mobile-first with RTL support.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateCitation, useUpdateCitation } from '@/hooks/useCitations'
import type {
  CitationSourceType,
  CitationCreate,
  CitationUpdate,
  EntityCitation,
} from '@/types/citation.types'
import {
  CITATION_SOURCE_TYPE_LABELS,
  INTERNAL_SOURCE_TYPES,
  EXTERNAL_SOURCE_TYPES,
  isExternalSourceType,
} from '@/types/citation.types'

// ============================================================================
// Props
// ============================================================================

interface CitationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  citingEntityType: CitationSourceType
  citingEntityId: string
  citingEntityName?: string
  editingCitation?: EntityCitation | null
}

// ============================================================================
// Form Values
// ============================================================================

interface FormValues {
  citationType: 'internal' | 'external'
  cited_entity_type: CitationSourceType
  cited_entity_id: string
  external_url: string
  external_title: string
  external_author: string
  external_publication_date: string
  citation_context: string
  citation_note: string
  relevance_score: number
}

// ============================================================================
// Component
// ============================================================================

export function CitationFormDialog({
  open,
  onOpenChange,
  citingEntityType,
  citingEntityId,
  citingEntityName,
  editingCitation,
}: CitationFormDialogProps) {
  const { t, i18n } = useTranslation('citations')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!editingCitation

  // Form state
  const [citationType, setCitationType] = useState<'internal' | 'external'>('internal')
  const [relevanceScore, setRelevanceScore] = useState([0.5])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      citationType: 'internal',
      cited_entity_type: 'dossier',
      cited_entity_id: '',
      external_url: '',
      external_title: '',
      external_author: '',
      external_publication_date: '',
      citation_context: '',
      citation_note: '',
      relevance_score: 0.5,
    },
  })

  const watchedEntityType = watch('cited_entity_type')

  // Mutations
  const createMutation = useCreateCitation()
  const updateMutation = useUpdateCitation()

  // Reset form when dialog opens/closes or editing changes
  useEffect(() => {
    if (open) {
      if (editingCitation) {
        const isExternal = isExternalSourceType(editingCitation.related_entity_type)
        setCitationType(isExternal ? 'external' : 'internal')
        setRelevanceScore([editingCitation.relevance_score || 0.5])
        reset({
          citationType: isExternal ? 'external' : 'internal',
          cited_entity_type: editingCitation.related_entity_type,
          cited_entity_id: editingCitation.related_entity_id || '',
          external_url: editingCitation.external_url || '',
          external_title: editingCitation.external_title || '',
          external_author: '',
          external_publication_date: '',
          citation_context: editingCitation.citation_context || '',
          citation_note: '',
          relevance_score: editingCitation.relevance_score || 0.5,
        })
      } else {
        setCitationType('internal')
        setRelevanceScore([0.5])
        reset({
          citationType: 'internal',
          cited_entity_type: 'dossier',
          cited_entity_id: '',
          external_url: '',
          external_title: '',
          external_author: '',
          external_publication_date: '',
          citation_context: '',
          citation_note: '',
          relevance_score: 0.5,
        })
      }
    }
  }, [open, editingCitation, reset])

  // Handle form submission
  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        if (isEditing && editingCitation) {
          // Update existing citation
          const updates: CitationUpdate = {
            citation_context: data.citation_context || undefined,
            citation_note: data.citation_note || undefined,
            relevance_score: relevanceScore[0],
          }

          if (citationType === 'external') {
            updates.external_title = data.external_title || undefined
            updates.external_author = data.external_author || undefined
          }

          await updateMutation.mutateAsync({
            id: editingCitation.citation_id,
            updates,
          })
        } else {
          // Create new citation
          const citation: CitationCreate = {
            citing_entity_type: citingEntityType,
            citing_entity_id: citingEntityId,
            cited_entity_type: data.cited_entity_type,
            relevance_score: relevanceScore[0],
            detection_method: 'manual',
          }

          if (citationType === 'internal') {
            citation.cited_entity_id = data.cited_entity_id
          } else {
            citation.external_url = data.external_url
            citation.external_title = data.external_title || undefined
            citation.external_author = data.external_author || undefined
            citation.external_publication_date = data.external_publication_date || undefined
          }

          if (data.citation_context) {
            citation.citation_context = data.citation_context
          }
          if (data.citation_note) {
            citation.citation_note = data.citation_note
          }

          await createMutation.mutateAsync(citation)
        }

        onOpenChange(false)
      } catch (error) {
        console.error('Failed to save citation:', error)
      }
    },
    [
      isEditing,
      editingCitation,
      citationType,
      citingEntityType,
      citingEntityId,
      relevanceScore,
      createMutation,
      updateMutation,
      onOpenChange,
    ],
  )

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('form.editTitle', 'Edit Citation')
              : t('form.createTitle', 'Add Citation')}
          </DialogTitle>
          <DialogDescription>
            {citingEntityName
              ? t('form.description', 'Add a reference from "{{name}}" to another source.', {
                  name: citingEntityName,
                })
              : t('form.descriptionGeneric', 'Add a reference to another source.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Citation Type Tabs */}
          {!isEditing && (
            <Tabs
              value={citationType}
              onValueChange={(v) => {
                setCitationType(v as 'internal' | 'external')
                setValue('cited_entity_type', v === 'internal' ? 'dossier' : 'external_url')
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal">
                  {t('form.tabs.internal', 'Internal Reference')}
                </TabsTrigger>
                <TabsTrigger value="external">
                  {t('form.tabs.external', 'External Source')}
                </TabsTrigger>
              </TabsList>

              {/* Internal Citation Fields */}
              <TabsContent value="internal" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cited_entity_type">
                    {t('form.fields.entityType', 'Reference Type')}
                  </Label>
                  <Select
                    value={watchedEntityType}
                    onValueChange={(v) => setValue('cited_entity_type', v as CitationSourceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.placeholders.selectType', 'Select type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_SOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CITATION_SOURCE_TYPE_LABELS[type]?.[isRTL ? 'ar' : 'en'] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cited_entity_id">{t('form.fields.entityId', 'Entity ID')}</Label>
                  <Input
                    id="cited_entity_id"
                    placeholder={t('form.placeholders.entityId', 'Enter entity UUID')}
                    {...register('cited_entity_id', {
                      required: citationType === 'internal',
                    })}
                  />
                  {errors.cited_entity_id && (
                    <p className="text-xs text-destructive">
                      {t('form.errors.required', 'This field is required')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'form.hints.entityId',
                      'Enter the UUID of the dossier, document, or other entity you want to reference.',
                    )}
                  </p>
                </div>
              </TabsContent>

              {/* External Citation Fields */}
              <TabsContent value="external" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cited_entity_type">
                    {t('form.fields.sourceType', 'Source Type')}
                  </Label>
                  <Select
                    value={watchedEntityType}
                    onValueChange={(v) => setValue('cited_entity_type', v as CitationSourceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.placeholders.selectType', 'Select type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTERNAL_SOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CITATION_SOURCE_TYPE_LABELS[type]?.[isRTL ? 'ar' : 'en'] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_url">{t('form.fields.url', 'URL')} *</Label>
                  <Input
                    id="external_url"
                    type="url"
                    placeholder="https://..."
                    {...register('external_url', {
                      required: citationType === 'external',
                      pattern: {
                        value: /^https?:\/\/.+/i,
                        message: t('form.errors.invalidUrl', 'Please enter a valid URL'),
                      },
                    })}
                  />
                  {errors.external_url && (
                    <p className="text-xs text-destructive">
                      {errors.external_url.message ||
                        t('form.errors.required', 'This field is required')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_title">{t('form.fields.title', 'Title')}</Label>
                  <Input
                    id="external_title"
                    placeholder={t('form.placeholders.title', 'Source title')}
                    {...register('external_title')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="external_author">{t('form.fields.author', 'Author')}</Label>
                    <Input
                      id="external_author"
                      placeholder={t('form.placeholders.author', 'Author name')}
                      {...register('external_author')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="external_publication_date">
                      {t('form.fields.date', 'Date')}
                    </Label>
                    <Input
                      id="external_publication_date"
                      type="date"
                      {...register('external_publication_date')}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Common Fields (shown for both types) */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="citation_context">
                {t('form.fields.context', 'Context / Excerpt')}
              </Label>
              <Textarea
                id="citation_context"
                rows={3}
                placeholder={t(
                  'form.placeholders.context',
                  'Quote or describe the relevant content...',
                )}
                {...register('citation_context')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="citation_note">{t('form.fields.note', 'Note')}</Label>
              <Textarea
                id="citation_note"
                rows={2}
                placeholder={t('form.placeholders.note', 'Add a note about this citation...')}
                {...register('citation_note')}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('form.fields.relevance', 'Relevance Score')}</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(relevanceScore[0] * 100)}%
                </span>
              </div>
              <Slider
                value={relevanceScore}
                onValueChange={setRelevanceScore}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('form.hints.relevance', 'How relevant is this citation to the source document?')}
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading
              ? t('actions.saving', 'Saving...')
              : isEditing
                ? t('actions.save', 'Save Changes')
                : t('actions.create', 'Add Citation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CitationFormDialog
