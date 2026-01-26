import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SettingsSectionCardProps {
  /** Section title translation key or string */
  title: string
  /** Section description translation key or string */
  description?: string
  /** Icon component to display */
  icon?: LucideIcon
  /** Children content */
  children: ReactNode
  /** Additional className for the card */
  className?: string
}

/**
 * Reusable card component for settings sections
 * Mobile-first, RTL-safe implementation
 */
export function SettingsSectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: SettingsSectionCardProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card
      className={cn(
        'overflow-hidden',
        // Mobile-first responsive
        'w-full',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl text-start">
          {Icon && <Icon className={cn('h-5 w-5 shrink-0 text-primary', isRTL && 'order-first')} />}
          <span>{title}</span>
        </CardTitle>
        {description && (
          <CardDescription className="text-start text-sm mt-1">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</CardContent>
    </Card>
  )
}

interface SettingsItemProps {
  /** Label for the setting */
  label: string
  /** Description for the setting */
  description?: string
  /** Icon component */
  icon?: LucideIcon
  /** Control element (switch, select, etc.) */
  children: ReactNode
  /** Additional className */
  className?: string
}

/**
 * Individual setting item with label, description, and control
 */
export function SettingsItem({
  label,
  description,
  icon: Icon,
  children,
  className,
}: SettingsItemProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between',
        'gap-3 sm:gap-4',
        'rounded-lg border p-3 sm:p-4',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3 text-start flex-1 min-w-0">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-medium leading-none">{label}</p>
          {description && <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-center">{children}</div>
    </div>
  )
}

interface SettingsGroupProps {
  /** Group title */
  title?: string
  /** Children settings items */
  children: ReactNode
  /** Additional className */
  className?: string
}

/**
 * Group of related settings with optional title
 */
export function SettingsGroup({ title, children, className }: SettingsGroupProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-start">
          {title}
        </h3>
      )}
      <div className="space-y-2 sm:space-y-3">{children}</div>
    </div>
  )
}
