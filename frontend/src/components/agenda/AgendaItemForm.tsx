/**
 * AgendaItemForm Component
 * Feature: meeting-agenda-builder
 *
 * Form for adding/editing agenda items with:
 * - Time allocation
 * - Presenter assignment
 * - Entity linking
 * - Item type selection
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, User, Link, X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { useAddAgendaItem, useUpdateAgendaItem } from '@/hooks/useMeetingAgenda'
import type { AgendaItem, AgendaItemType, PresenterType } from '@/types/meeting-agenda.types'
import { AGENDA_ITEM_TYPES, ITEM_TYPE_COLORS, formatDuration } from '@/types/meeting-agenda.types'
import { cn } from '@/lib/utils'

interface AgendaItemFormProps {
  agendaId: string
  item?: AgendaItem | null
  onClose: () => void
}

// Form validation schema
const itemFormSchema = z.object({
  title_en: z.string().min(1, 'Title is required').max(200),
  title_ar: z.string().max(200).optional(),
  description_en: z.string().max(2000).optional(),
  description_ar: z.string().max(2000).optional(),
  planned_duration_minutes: z.number().min(1).max(480),
  item_type: z.enum(AGENDA_ITEM_TYPES as unknown as [string, ...string[]]),
  presenter_type: z.enum(['user', 'person_dossier', 'external', 'organization']).optional(),
  presenter_user_id: z.string().uuid().optional().nullable(),
  presenter_person_id: z.string().uuid().optional().nullable(),
  presenter_org_id: z.string().uuid().optional().nullable(),
  presenter_name_en: z.string().max(100).optional(),
  presenter_name_ar: z.string().max(100).optional(),
  presenter_title_en: z.string().max(100).optional(),
  presenter_title_ar: z.string().max(100).optional(),
  linked_dossier_id: z.string().uuid().optional().nullable(),
  linked_commitment_id: z.string().uuid().optional().nullable(),
  indent_level: z.number().min(0).max(3).optional(),
})

type ItemFormValues = z.infer<typeof itemFormSchema>

// Duration presets in minutes
const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120]

export function AgendaItemForm({ agendaId, item, onClose }: AgendaItemFormProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!item

  const [activeTab, setActiveTab] = useState('basic')

  // Mutations
  const addItem = useAddAgendaItem()
  const updateItem = useUpdateAgendaItem()

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title_en: item?.title_en || '',
      title_ar: item?.title_ar || '',
      description_en: item?.description_en || '',
      description_ar: item?.description_ar || '',
      planned_duration_minutes: item?.planned_duration_minutes || 15,
      item_type: item?.item_type || 'discussion',
      presenter_type: item?.presenter_type,
      presenter_user_id: item?.presenter_user_id || null,
      presenter_person_id: item?.presenter_person_id || null,
      presenter_org_id: item?.presenter_org_id || null,
      presenter_name_en: item?.presenter_name_en || '',
      presenter_name_ar: item?.presenter_name_ar || '',
      presenter_title_en: item?.presenter_title_en || '',
      presenter_title_ar: item?.presenter_title_ar || '',
      linked_dossier_id: item?.linked_dossier_id || null,
      linked_commitment_id: item?.linked_commitment_id || null,
      indent_level: item?.indent_level || 0,
    },
  })

  const watchedDuration = watch('planned_duration_minutes')
  const watchedType = watch('item_type')
  const watchedPresenterType = watch('presenter_type')

  // Handle form submission
  const onSubmit = async (data: ItemFormValues) => {
    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({
          agendaId,
          itemId: item.id,
          input: {
            title_en: data.title_en,
            title_ar: data.title_ar || undefined,
            description_en: data.description_en || undefined,
            description_ar: data.description_ar || undefined,
            planned_duration_minutes: data.planned_duration_minutes,
            item_type: data.item_type as AgendaItemType,
            presenter_type: data.presenter_type as PresenterType | undefined,
            presenter_user_id: data.presenter_user_id || undefined,
            presenter_person_id: data.presenter_person_id || undefined,
            presenter_org_id: data.presenter_org_id || undefined,
            presenter_name_en: data.presenter_name_en || undefined,
            presenter_name_ar: data.presenter_name_ar || undefined,
            presenter_title_en: data.presenter_title_en || undefined,
            presenter_title_ar: data.presenter_title_ar || undefined,
            linked_dossier_id: data.linked_dossier_id || undefined,
            linked_commitment_id: data.linked_commitment_id || undefined,
            indent_level: data.indent_level,
          },
        })
      } else {
        await addItem.mutateAsync({
          agendaId,
          input: {
            agenda_id: agendaId,
            title_en: data.title_en,
            title_ar: data.title_ar || undefined,
            description_en: data.description_en || undefined,
            description_ar: data.description_ar || undefined,
            planned_duration_minutes: data.planned_duration_minutes,
            item_type: data.item_type as AgendaItemType,
            presenter_type: data.presenter_type as PresenterType | undefined,
            presenter_user_id: data.presenter_user_id || undefined,
            presenter_person_id: data.presenter_person_id || undefined,
            presenter_org_id: data.presenter_org_id || undefined,
            presenter_name_en: data.presenter_name_en || undefined,
            presenter_name_ar: data.presenter_name_ar || undefined,
            presenter_title_en: data.presenter_title_en || undefined,
            presenter_title_ar: data.presenter_title_ar || undefined,
            linked_dossier_id: data.linked_dossier_id || undefined,
            linked_commitment_id: data.linked_commitment_id || undefined,
            indent_level: data.indent_level,
          },
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to save agenda item:', error)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editItem') : t('addItem')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="min-h-10">
                {t('basic')}
              </TabsTrigger>
              <TabsTrigger value="presenter" className="min-h-10">
                <User className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                {t('presenter')}
              </TabsTrigger>
              <TabsTrigger value="links" className="min-h-10">
                <Link className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                {t('links')}
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              {/* Item Type */}
              <div className="space-y-2">
                <Label>{t('itemType')}</Label>
                <Controller
                  name="item_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENDA_ITEM_TYPES.map((type) => {
                          const colors = ITEM_TYPE_COLORS[type]
                          return (
                            <SelectItem key={type} value={type}>
                              <span className={cn(colors.text)}>{t(`itemTypes.${type}`)}</span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Title (EN) */}
              <div className="space-y-2">
                <Label htmlFor="title_en">{t('titleEn')} *</Label>
                <Input
                  id="title_en"
                  {...register('title_en')}
                  placeholder={t('enterTitleEn')}
                  className="min-h-11"
                />
                {errors.title_en && (
                  <p className="text-sm text-destructive">{errors.title_en.message}</p>
                )}
              </div>

              {/* Title (AR) */}
              <div className="space-y-2">
                <Label htmlFor="title_ar">{t('titleAr')}</Label>
                <Input
                  id="title_ar"
                  {...register('title_ar')}
                  placeholder={t('enterTitleAr')}
                  dir="rtl"
                  className="min-h-11"
                />
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('duration')}: {formatDuration(watchedDuration)}
                </Label>

                {/* Duration presets */}
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={watchedDuration === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('planned_duration_minutes', preset)}
                      className="min-h-9"
                    >
                      {formatDuration(preset)}
                    </Button>
                  ))}
                </div>

                {/* Custom duration slider */}
                <Controller
                  name="planned_duration_minutes"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      min={5}
                      max={180}
                      step={5}
                      className="py-4"
                    />
                  )}
                />
              </div>

              {/* Description (EN) */}
              <div className="space-y-2">
                <Label htmlFor="description_en">{t('descriptionEn')}</Label>
                <Textarea
                  id="description_en"
                  {...register('description_en')}
                  placeholder={t('enterDescriptionEn')}
                  rows={3}
                />
              </div>

              {/* Description (AR) */}
              <div className="space-y-2">
                <Label htmlFor="description_ar">{t('descriptionAr')}</Label>
                <Textarea
                  id="description_ar"
                  {...register('description_ar')}
                  placeholder={t('enterDescriptionAr')}
                  dir="rtl"
                  rows={3}
                />
              </div>

              {/* Indent Level */}
              <div className="space-y-2">
                <Label>{t('indentLevel')}</Label>
                <Controller
                  name="indent_level"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value || 0)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger className="min-h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('noIndent')}</SelectItem>
                        <SelectItem value="1">{t('indent1')}</SelectItem>
                        <SelectItem value="2">{t('indent2')}</SelectItem>
                        <SelectItem value="3">{t('indent3')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </TabsContent>

            {/* Presenter Tab */}
            <TabsContent value="presenter" className="space-y-4 pt-4">
              {/* Presenter Type */}
              <div className="space-y-2">
                <Label>{t('presenterType')}</Label>
                <Controller
                  name="presenter_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    >
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('selectPresenterType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t('presenterTypes.user')}</SelectItem>
                        <SelectItem value="person_dossier">
                          {t('presenterTypes.person_dossier')}
                        </SelectItem>
                        <SelectItem value="external">{t('presenterTypes.external')}</SelectItem>
                        <SelectItem value="organization">
                          {t('presenterTypes.organization')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* External presenter name fields */}
              {watchedPresenterType === 'external' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="presenter_name_en">{t('presenterNameEn')}</Label>
                    <Input
                      id="presenter_name_en"
                      {...register('presenter_name_en')}
                      placeholder={t('enterPresenterNameEn')}
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presenter_name_ar">{t('presenterNameAr')}</Label>
                    <Input
                      id="presenter_name_ar"
                      {...register('presenter_name_ar')}
                      placeholder={t('enterPresenterNameAr')}
                      dir="rtl"
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presenter_title_en">{t('presenterTitleEn')}</Label>
                    <Input
                      id="presenter_title_en"
                      {...register('presenter_title_en')}
                      placeholder={t('enterPresenterTitleEn')}
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presenter_title_ar">{t('presenterTitleAr')}</Label>
                    <Input
                      id="presenter_title_ar"
                      {...register('presenter_title_ar')}
                      placeholder={t('enterPresenterTitleAr')}
                      dir="rtl"
                      className="min-h-11"
                    />
                  </div>
                </>
              )}

              {/* User/Person/Org selector placeholder */}
              {watchedPresenterType && watchedPresenterType !== 'external' && (
                <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                  {t('selectPresenterFromSystem')}
                  {/* TODO: Add entity autocomplete component */}
                </div>
              )}
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4 pt-4">
              {/* Linked Dossier */}
              <div className="space-y-2">
                <Label>{t('linkedDossier')}</Label>
                <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                  {t('searchAndLinkDossier')}
                  {/* TODO: Add dossier autocomplete component */}
                </div>
              </div>

              {/* Linked Commitment */}
              <div className="space-y-2">
                <Label>{t('linkedCommitment')}</Label>
                <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                  {t('searchAndLinkCommitment')}
                  {/* TODO: Add commitment autocomplete component */}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              <X className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-11">
              {isSubmitting ? (
                <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
              ) : (
                <Save className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              )}
              {isEditing ? t('saveChanges') : t('addItem')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgendaItemForm
