/**
 * Save Report Dialog Component
 *
 * Dialog for saving report configurations.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ReportConfiguration,
  ReportAccessLevel,
  SavedReport,
} from '@/types/report-builder.types'

interface SaveReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  configuration: ReportConfiguration
  existingReport?: SavedReport | null
  onSave: (data: {
    name: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    accessLevel: ReportAccessLevel
    tags: string[]
  }) => Promise<void>
  isSaving: boolean
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameAr: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  accessLevel: z.enum(['private', 'team', 'organization', 'public']),
  tagInput: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function SaveReportDialog({
  open,
  onOpenChange,
  configuration,
  existingReport,
  onSave,
  isSaving,
}: SaveReportDialogProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'
  const [tags, setTags] = useState<string[]>(existingReport?.tags || [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingReport?.name || '',
      nameAr: existingReport?.nameAr || '',
      description: existingReport?.description || '',
      descriptionAr: existingReport?.descriptionAr || '',
      accessLevel: existingReport?.accessLevel || 'private',
      tagInput: '',
    },
  })

  const handleAddTag = (value: string) => {
    if (value.trim() && !tags.includes(value.trim())) {
      setTags([...tags, value.trim()])
      form.setValue('tagInput', '')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const onSubmit = async (values: FormValues) => {
    await onSave({
      name: values.name,
      nameAr: values.nameAr,
      description: values.description,
      descriptionAr: values.descriptionAr,
      accessLevel: values.accessLevel as ReportAccessLevel,
      tags,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {existingReport ? t('save.updateButton') : t('save.title')}
          </DialogTitle>
          <DialogDescription>{t('save.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('save.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Arabic Name */}
            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.nameAr')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('save.nameArPlaceholder')} dir="rtl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('save.descriptionPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Arabic Description */}
            <FormField
              control={form.control}
              name="descriptionAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.descriptionAr')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('save.descriptionArPlaceholder')}
                      className="resize-none"
                      dir="rtl"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Level */}
            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.accessLevel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">{t('save.accessLevels.private')}</SelectItem>
                      <SelectItem value="team">{t('save.accessLevels.team')}</SelectItem>
                      <SelectItem value="organization">
                        {t('save.accessLevels.organization')}
                      </SelectItem>
                      <SelectItem value="public">{t('save.accessLevels.public')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tagInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('save.tags')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('save.tagsPlaceholder')}
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          handleAddTag(field.value || '')
                        }
                      }}
                    />
                  </FormControl>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ms-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('savedReports.confirmDelete.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {existingReport ? t('save.updateButton') : t('save.saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
