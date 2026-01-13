/**
 * ThemeForm Component
 * Feature: themes-entity-management
 *
 * Form for creating/editing themes with bilingual support and hierarchy selection.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Tag, Hash, Palette, Link as LinkIcon, FolderTree } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import type { Theme, ThemeCreateRequest, ThemeUpdateRequest } from '@/types/theme.types'
import type { DossierStatus, SensitivityLevel } from '@/types/dossier'

// Form validation schema
const themeFormSchema = z.object({
  name_en: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  name_ar: z
    .string()
    .min(1, 'Arabic name is required')
    .max(200, 'Name must be less than 200 characters'),
  summary_en: z
    .string()
    .max(2000, 'Summary must be less than 2000 characters')
    .optional()
    .nullable(),
  summary_ar: z
    .string()
    .max(2000, 'Summary must be less than 2000 characters')
    .optional()
    .nullable(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  sensitivity_level: z.enum(['low', 'medium', 'high']).default('low'),
  tags: z.array(z.string()).default([]),
  parent_theme_id: z.string().nullable().optional(),
  category_code: z
    .string()
    .min(1, 'Category code is required')
    .regex(/^[A-Z0-9\-_]+$/i, 'Category code must be alphanumeric with hyphens'),
  icon: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional()
    .nullable()
    .or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_standard: z.boolean().default(false),
  external_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
})

type ThemeFormValues = z.infer<typeof themeFormSchema>

interface ThemeFormProps {
  theme?: Theme | null
  parentThemes?: Array<{ id: string; name_en: string; name_ar: string; category_code: string }>
  onSubmit: (data: ThemeCreateRequest | ThemeUpdateRequest) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  defaultParentId?: string | null
}

export function ThemeForm({
  theme,
  parentThemes = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultParentId,
}: ThemeFormProps) {
  const { t, i18n } = useTranslation('themes')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!theme

  // Initialize form with defaults or existing theme data
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      name_en: theme?.name_en || '',
      name_ar: theme?.name_ar || '',
      summary_en: theme?.summary_en || '',
      summary_ar: theme?.summary_ar || '',
      status: theme?.status || 'active',
      sensitivity_level: theme?.sensitivity_level || 'low',
      tags: theme?.tags || [],
      parent_theme_id: theme?.extension?.parent_theme_id || defaultParentId || null,
      category_code: theme?.extension?.category_code || '',
      icon: theme?.extension?.icon || '',
      color: theme?.extension?.color || '',
      sort_order: theme?.extension?.sort_order || 0,
      is_standard: theme?.extension?.is_standard || false,
      external_url: theme?.extension?.external_url || '',
    },
  })

  // Handle form submission
  const handleSubmit = async (values: ThemeFormValues) => {
    const payload: ThemeCreateRequest | ThemeUpdateRequest = {
      name_en: values.name_en,
      name_ar: values.name_ar,
      summary_en: values.summary_en || undefined,
      summary_ar: values.summary_ar || undefined,
      status: values.status as DossierStatus,
      sensitivity_level: values.sensitivity_level as SensitivityLevel,
      tags: values.tags,
      extension: {
        parent_theme_id: values.parent_theme_id || null,
        category_code: values.category_code,
        icon: values.icon || null,
        color: values.color || null,
        sort_order: values.sort_order,
        is_standard: values.is_standard,
        external_url: values.external_url || null,
      },
    }

    await onSubmit(payload)
  }

  // Filter out current theme from parent options (can't be own parent)
  const availableParents = parentThemes.filter((p) => p.id !== theme?.id)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.nameEn')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.nameEnPlaceholder')} {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.nameAr')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.nameArPlaceholder')} {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Summary Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="summary_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.summaryEn')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('form.summaryPlaceholder')}
                    rows={3}
                    {...field}
                    value={field.value || ''}
                    dir="ltr"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="summary_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.summaryAr')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('form.summaryPlaceholder')}
                    rows={3}
                    {...field}
                    value={field.value || ''}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category Code and Parent Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('form.categoryCode')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.categoryCodePlaceholder')}
                    {...field}
                    className="font-mono uppercase"
                    dir="ltr"
                  />
                </FormControl>
                <FormDescription>{t('tooltips.categoryCode')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_theme_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  {t('form.parentTheme')}
                </FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.parentThemePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t('form.noParent')}</SelectItem>
                    {availableParents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {isRTL ? parent.name_ar : parent.name_en} ({parent.category_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status and Sensitivity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.status')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                    <SelectItem value="archived">{t('status.archived')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sensitivity_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.sensitivityLevel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectSensitivity')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Color and Sort Order */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t('form.color')}
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-14 h-10 p-1 cursor-pointer"
                      value={field.value || '#6366f1'}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input
                      placeholder={t('form.colorPlaceholder')}
                      {...field}
                      value={field.value || ''}
                      className="font-mono"
                      dir="ltr"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.sortOrder')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('form.sortOrderPlaceholder')}
                    {...field}
                    dir="ltr"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_standard"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>{t('form.isStandard')}</FormLabel>
                  <FormDescription className="text-xs">
                    {t('form.isStandardDescription')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* External URL */}
        <FormField
          control={form.control}
          name="external_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                {t('form.externalUrl')}
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t('form.externalUrlPlaceholder')}
                  {...field}
                  value={field.value || ''}
                  dir="ltr"
                />
              </FormControl>
              <FormDescription>{t('tooltips.externalUrl')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEditing ? t('actions.update') : t('actions.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default ThemeForm
