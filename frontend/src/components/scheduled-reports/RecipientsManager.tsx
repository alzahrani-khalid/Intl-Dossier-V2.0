/**
 * Recipients Manager
 *
 * Component for managing schedule recipients including
 * internal users and external email addresses.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Mail, User } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import {
  useScheduleRecipients,
  useAddRecipient,
  useRemoveRecipient,
  type ScheduleRecipient,
} from '@/hooks/useScheduledReports'

const externalRecipientSchema = z.object({
  external_email: z.string().email('Invalid email address'),
  external_name: z.string().optional(),
  delivery_channels: z.array(z.enum(['email', 'in_app', 'slack', 'teams'])).min(1),
  preferred_format: z.enum(['pdf', 'excel', 'csv', 'json']),
  preferred_language: z.enum(['en', 'ar']),
})

type ExternalRecipientForm = z.infer<typeof externalRecipientSchema>

interface RecipientsManagerProps {
  scheduleId: string
}

export function RecipientsManager({ scheduleId }: RecipientsManagerProps) {
  const { t, i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data: recipients, isLoading } = useScheduleRecipients(scheduleId)
  const addRecipient = useAddRecipient()
  const removeRecipient = useRemoveRecipient()

  const form = useForm<ExternalRecipientForm>({
    resolver: zodResolver(externalRecipientSchema),
    defaultValues: {
      external_email: '',
      external_name: '',
      delivery_channels: ['email'],
      preferred_format: 'pdf',
      preferred_language: isRTL ? 'ar' : 'en',
    },
  })

  const onSubmit = async (values: ExternalRecipientForm) => {
    try {
      await addRecipient.mutateAsync({
        schedule_id: scheduleId,
        ...values,
        is_active: true,
      })
      toast({ title: t('messages.createSuccess') })
      setAddDialogOpen(false)
      form.reset()
    } catch {
      toast({ title: t('messages.error'), variant: 'destructive' })
    }
  }

  const handleRemove = async (recipient: ScheduleRecipient) => {
    try {
      await removeRecipient.mutateAsync({
        id: recipient.id,
        scheduleId,
      })
      toast({ title: t('messages.deleteSuccess') })
    } catch {
      toast({ title: t('messages.error'), variant: 'destructive' })
    }
  }

  const deliveryChannels = [
    { value: 'email', label: t('channels.email') },
    { value: 'in_app', label: t('channels.in_app') },
    { value: 'slack', label: t('channels.slack') },
    { value: 'teams', label: t('channels.teams') },
  ] as const

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
          <h3 className="font-medium">{t('recipients.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('recipients.description')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('recipients.addExternal')}
        </Button>
      </div>

      {/* Empty State */}
      {recipients?.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{t('recipients.noRecipients')}</p>
            <p className="text-sm text-muted-foreground">
              {t('recipients.noRecipientsDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recipients List */}
      <div className="space-y-2">
        {recipients?.map((recipient) => (
          <Card key={recipient.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {recipient.user_id ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {recipient.user?.full_name ||
                      recipient.external_name ||
                      recipient.external_email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {recipient.user?.email || recipient.external_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {recipient.delivery_channels?.map((channel) => (
                    <Badge key={channel} variant="secondary" className="text-xs">
                      {t(`channels.${channel}`)}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(recipient)}
                  disabled={removeRecipient.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add External Recipient Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('recipients.addExternal')}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="external_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recipients.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('recipients.emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="external_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recipients.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('recipients.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_channels"
                render={() => (
                  <FormItem>
                    <FormLabel>{t('recipients.deliveryChannels')}</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      {deliveryChannels.map((channel) => (
                        <FormField
                          key={channel.value}
                          control={form.control}
                          name="delivery_channels"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(channel.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, channel.value])
                                    } else {
                                      field.onChange(
                                        field.value?.filter((v) => v !== channel.value),
                                      )
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 font-normal">{channel.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferred_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('recipients.preferredFormat')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">{t('format.pdf')}</SelectItem>
                          <SelectItem value="excel">{t('format.excel')}</SelectItem>
                          <SelectItem value="csv">{t('format.csv')}</SelectItem>
                          <SelectItem value="json">{t('format.json')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('recipients.preferredLanguage')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">{t('language.en')}</SelectItem>
                          <SelectItem value="ar">{t('language.ar')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={addRecipient.isPending}>
                  {t('recipients.addRecipient')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
