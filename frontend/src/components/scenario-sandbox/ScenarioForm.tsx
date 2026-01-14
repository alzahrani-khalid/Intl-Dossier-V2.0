/**
 * ScenarioForm Component
 * Feature: Scenario Planning and What-If Analysis
 *
 * Form for creating and editing scenarios.
 */

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
} from '@/components/ui/dialog'
import type { Scenario, ScenarioType, CreateScenarioRequest } from '@/types/scenario-sandbox.types'
import { SCENARIO_TYPE_LABELS } from '@/types/scenario-sandbox.types'
import { Loader2 } from 'lucide-react'

const scenarioSchema = z.object({
  title_en: z.string().min(1, 'Title is required').max(200),
  title_ar: z.string().min(1, 'Title is required').max(200),
  description_en: z.string().max(1000).optional(),
  description_ar: z.string().max(1000).optional(),
  type: z.enum([
    'stakeholder_engagement',
    'policy_change',
    'relationship_impact',
    'resource_allocation',
    'strategic_planning',
  ]),
  projection_period_days: z.coerce.number().min(1).max(365).default(90),
  tags: z.string().optional(),
})

type ScenarioFormValues = z.infer<typeof scenarioSchema>

interface ScenarioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenario?: Scenario
  onSubmit: (data: CreateScenarioRequest) => Promise<void>
  isLoading?: boolean
}

export function ScenarioForm({
  open,
  onOpenChange,
  scenario,
  onSubmit,
  isLoading,
}: ScenarioFormProps) {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'

  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      title_en: scenario?.title_en || '',
      title_ar: scenario?.title_ar || '',
      description_en: scenario?.description_en || '',
      description_ar: scenario?.description_ar || '',
      type: scenario?.type || 'stakeholder_engagement',
      projection_period_days: scenario?.projection_period_days || 90,
      tags: scenario?.tags?.join(', ') || '',
    },
  })

  const handleSubmit = async (values: ScenarioFormValues) => {
    const data: CreateScenarioRequest = {
      title_en: values.title_en,
      title_ar: values.title_ar,
      description_en: values.description_en || undefined,
      description_ar: values.description_ar || undefined,
      type: values.type,
      projection_period_days: values.projection_period_days,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
    }
    await onSubmit(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{scenario ? t('scenario.edit') : t('scenario.create')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('scenario.fields.type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(SCENARIO_TYPE_LABELS) as ScenarioType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {isRTL ? SCENARIO_TYPE_LABELS[type].ar : SCENARIO_TYPE_LABELS[type].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title English */}
            <FormField
              control={form.control}
              name="title_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.title_en')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter scenario title" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Arabic */}
            <FormField
              control={form.control}
              name="title_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.title_ar')}</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل عنوان السيناريو" dir="rtl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description English */}
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.description_en')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the scenario..."
                      dir="ltr"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Arabic */}
            <FormField
              control={form.control}
              name="description_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.description_ar')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder="وصف السيناريو..." dir="rtl" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Projection Period */}
            <FormField
              control={form.control}
              name="projection_period_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.projection_period_days')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={365} {...field} />
                  </FormControl>
                  <FormDescription>{t('analysis.stats.projectionDays')} (1-365)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenario.fields.tags')}</FormLabel>
                  <FormControl>
                    <Input placeholder="strategy, Q1, pilot" {...field} />
                  </FormControl>
                  <FormDescription>Separate tags with commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {scenario ? t('actions.update') : t('actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
