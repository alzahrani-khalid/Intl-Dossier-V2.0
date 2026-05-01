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
    <header className={cn('page-head', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon != null && (
          <span className="page-head-icon mt-1 shrink-0 text-[var(--ink-faint)]">{icon}</span>
        )}
        <div className="min-w-0">
          <h1 className="page-title text-start">{title}</h1>
          {subtitle != null && <p className="page-sub text-start">{subtitle}</p>}
        </div>
      </div>
      {actions != null && <div className="dash-hero-actions">{actions}</div>}
    </header>
  )
}
