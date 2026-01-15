/**
 * Conditions Manager
 *
 * Component for managing delivery conditions that determine
 * when a scheduled report should be delivered.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import {
  useScheduleConditions,
  useAddCondition,
  useRemoveCondition,
  type DeliveryCondition,
} from '@/hooks/useScheduledReports'

const conditionSchema = z.object({
  field_path: z.string().min(1, 'Field path is required'),
  operator: z.enum([
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'contains',
    'not_contains',
    'is_empty',
    'is_not_empty',
  ]),
  value: z.string().optional(),
  is_required: z.boolean().default(true),
  fail_message: z.string().optional(),
  fail_message_ar: z.string().optional(),
  evaluation_order: z.number().default(0),
  is_active: z.boolean().default(true),
})

type ConditionForm = z.infer<typeof conditionSchema>

interface ConditionsManagerProps {
  scheduleId: string
}

export function ConditionsManager({ scheduleId }: ConditionsManagerProps) {
  const { t, i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data: conditions, isLoading } = useScheduleConditions(scheduleId)
  const addCondition = useAddCondition()
  const removeCondition = useRemoveCondition()

  const form = useForm<ConditionForm>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      field_path: '',
      operator: 'is_not_empty',
      value: '',
      is_required: true,
      fail_message: '',
      fail_message_ar: '',
      evaluation_order: (conditions?.length || 0) + 1,
      is_active: true,
    },
  })

  const operator = form.watch('operator')
  const needsValue = !['is_empty', 'is_not_empty'].includes(operator)

  const onSubmit = async (values: ConditionForm) => {
    try {
      await addCondition.mutateAsync({
        schedule_id: scheduleId,
        ...values,
      })
      toast({ title: t('messages.createSuccess') })
      setAddDialogOpen(false)
      form.reset()
    } catch {
      toast({ title: t('messages.error'), variant: 'destructive' })
    }
  }

  const handleRemove = async (condition: DeliveryCondition) => {
    try {
      await removeCondition.mutateAsync({
        id: condition.id,
        scheduleId,
      })
      toast({ title: t('messages.deleteSuccess') })
    } catch {
      toast({ title: t('messages.error'), variant: 'destructive' })
    }
  }

  const getOperatorLabel = (op: string) => {
    const key = `operators.${op}` as const
    return t(key)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{t('conditions.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('conditions.description')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('conditions.addCondition')}
        </Button>
      </div>

      {/* Empty State */}
      {conditions?.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Filter className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{t('conditions.noConditions')}</p>
            <p className="text-sm text-muted-foreground">
              {t('conditions.noConditionsDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conditions List */}
      <div className="space-y-2">
        {conditions?.map((condition, index) => (
          <Card key={condition.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                      {condition.field_path}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {getOperatorLabel(condition.operator)}
                    </span>
                    {condition.value && (
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {condition.value}
                      </code>
                    )}
                  </div>
                  {condition.fail_message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL && condition.fail_message_ar
                        ? condition.fail_message_ar
                        : condition.fail_message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {condition.is_required && (
                  <Badge variant="secondary">{t('conditions.isRequired')}</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(condition)}
                  disabled={removeCondition.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Condition Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('conditions.addCondition')}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="field_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('conditions.fieldPath')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('conditions.fieldPathPlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      e.g., metrics.total_count, data.length, status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('conditions.operator')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="equals">{t('operators.equals')}</SelectItem>
                        <SelectItem value="not_equals">{t('operators.not_equals')}</SelectItem>
                        <SelectItem value="greater_than">{t('operators.greater_than')}</SelectItem>
                        <SelectItem value="less_than">{t('operators.less_than')}</SelectItem>
                        <SelectItem value="contains">{t('operators.contains')}</SelectItem>
                        <SelectItem value="not_contains">{t('operators.not_contains')}</SelectItem>
                        <SelectItem value="is_empty">{t('operators.is_empty')}</SelectItem>
                        <SelectItem value="is_not_empty">{t('operators.is_not_empty')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsValue && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('conditions.value')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('conditions.valuePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="fail_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('conditions.failMessage')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{t('conditions.isRequired')}</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={addCondition.isPending}>
                  {t('conditions.addCondition')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
