import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon != null && <span className="text-muted-foreground">{icon}</span>}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle != null && (
            <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions != null && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </header>
  )
}
