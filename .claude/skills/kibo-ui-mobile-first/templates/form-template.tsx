import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Form schema with validation
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

type FormValues = z.infer<typeof formSchema>

interface ResponsiveFormTemplateProps {
  onSubmit: (values: FormValues) => void
  defaultValues?: Partial<FormValues>
}

/**
 * Responsive Form Template - Mobile-optimized with touch-friendly inputs
 * 
 * Features:
 * - 44px minimum touch targets on mobile
 * - Full-width buttons on mobile
 * - Optimized spacing for small screens
 * - RTL-compatible
 */
export function ResponsiveFormTemplate({
  onSubmit,
  defaultValues
}: ResponsiveFormTemplateProps) {
  const { isMobile } = useResponsive()
  const { t } = useTranslation()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      ...defaultValues
    }
  })
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'space-y-4',
          isMobile && 'space-y-3'  // Tighter spacing on mobile
        )}
      >
        {/* Text Input */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMobile ? 'text-sm' : 'text-base')}>
                {t('forms.title')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('forms.title_placeholder')}
                  className={cn(
                    'min-h-[44px]',    // Mobile touch target
                    'sm:min-h-[40px]'  // Desktop
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Textarea */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMobile ? 'text-sm' : 'text-base')}>
                {t('forms.description')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('forms.description_placeholder')}
                  rows={isMobile ? 3 : 5}
                  className={cn(
                    'min-h-[88px]',     // Mobile
                    'sm:min-h-[100px]'  // Desktop
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Select Dropdown */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMobile ? 'text-sm' : 'text-base')}>
                {t('forms.priority')}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(
                    'min-h-[44px]',
                    'sm:min-h-[40px]'
                  )}>
                    <SelectValue placeholder={t('forms.select_priority')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">{t('priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('priority.high')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Form Actions */}
        <div className={cn(
          'flex gap-2 pt-2',
          isMobile ? 'flex-col' : 'flex-row justify-end'
        )}>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className={cn(
              'min-h-[44px]',
              'sm:min-h-[40px]',
              isMobile && 'w-full'
            )}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            className={cn(
              'min-h-[44px]',
              'sm:min-h-[40px]',
              isMobile && 'w-full'
            )}
          >
            {t('actions.submit')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
