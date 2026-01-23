/**
 * BackToParent Navigation Component
 *
 * Provides a quick way to navigate back to parent/list pages from detail views.
 * Intelligently detects the parent route based on current location.
 * Mobile-first design with RTL support.
 */

import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/** Route hierarchy mapping - child to parent */
const routeHierarchy: Record<string, { path: string; labelKey: string }> = {
  // Dossier detail pages
  '/dossiers/countries': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/organizations': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/forums': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/persons': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/engagements': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/working_groups': { path: '/dossiers', labelKey: 'navigation.allDossiers' },
  '/dossiers/topics': { path: '/dossiers', labelKey: 'navigation.allDossiers' },

  // Position details
  '/positions': { path: '/positions', labelKey: 'navigation.positions' },

  // Engagement details
  '/engagements': { path: '/engagements', labelKey: 'navigation.engagements' },

  // Task details
  '/tasks': { path: '/tasks', labelKey: 'navigation.myAssignments' },

  // Commitment details
  '/commitments': { path: '/commitments', labelKey: 'navigation.commitments' },

  // After-action details
  '/after-actions': { path: '/after-actions', labelKey: 'navigation.afterActions' },

  // Calendar event details
  '/calendar/events': { path: '/calendar', labelKey: 'navigation.calendar' },

  // Intake details
  '/my-work/intake': { path: '/my-work/intake', labelKey: 'navigation.intakeQueue' },

  // Brief details
  '/briefs': { path: '/briefs', labelKey: 'navigation.briefs' },

  // Briefing book details
  '/briefing-books': { path: '/briefing-books', labelKey: 'navigation.briefingBooks' },

  // Users details (admin)
  '/users': { path: '/users', labelKey: 'navigation.users' },

  // Intelligence details
  '/intelligence': { path: '/intelligence', labelKey: 'navigation.intelligence' },
}

interface BackToParentProps {
  /** Override the parent path */
  parentPath?: string
  /** Override the parent label */
  parentLabel?: string
  /** Show as button or link */
  variant?: 'button' | 'link' | 'icon'
  /** Additional className */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
}

export function BackToParent({
  parentPath,
  parentLabel,
  variant = 'button',
  className,
  size = 'default',
}: BackToParentProps) {
  const { t, i18n } = useTranslation('common')
  const location = useLocation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Determine parent route from current location
  const parentInfo = useMemo(() => {
    if (parentPath) {
      return { path: parentPath, label: parentLabel || t('navigation.back', 'Back') }
    }

    const pathname = location.pathname

    // Check for matching route hierarchy
    for (const [pattern, info] of Object.entries(routeHierarchy)) {
      if (pathname.startsWith(pattern) && pathname !== pattern) {
        return {
          path: info.path,
          label: t(info.labelKey, info.labelKey.split('.').pop() || 'Back'),
        }
      }
    }

    // Generic dossier detail pattern: /dossiers/TYPE/ID
    const dossierMatch = pathname.match(/^\/dossiers\/([^/]+)\/([^/]+)/)
    if (dossierMatch) {
      const type = dossierMatch[1]
      return {
        path: '/dossiers',
        label: t('navigation.allDossiers', 'All Dossiers'),
      }
    }

    // Generic detail pattern: /ROUTE/ID
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      const baseRoute = `/${segments[0]}`
      const routeInfo = routeHierarchy[baseRoute]
      if (routeInfo) {
        return { path: routeInfo.path, label: t(routeInfo.labelKey, segments[0]) }
      }
      // Fallback to base route
      return { path: baseRoute, label: t(`navigation.${segments[0]}`, segments[0]) }
    }

    return null
  }, [location.pathname, parentPath, parentLabel, t])

  // Don't render if no parent found or already at parent
  if (!parentInfo || location.pathname === parentInfo.path) {
    return null
  }

  const ArrowIcon = isRTL ? (
    <ArrowLeft
      className={cn('shrink-0', isRTL && 'rotate-180')}
      style={{
        width: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
        height: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
      }}
    />
  ) : (
    <ArrowLeft
      className="shrink-0"
      style={{
        width: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
        height: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
      }}
    />
  )

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={parentInfo.path as any}
              className={cn(
                'inline-flex items-center justify-center rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                size === 'sm' && 'h-8 w-8',
                size === 'default' && 'h-9 w-9',
                size === 'lg' && 'h-10 w-10',
                // Touch target
                'min-h-11 min-w-11 sm:min-h-0 sm:min-w-0',
                className,
              )}
            >
              {ArrowIcon}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {t('navigation.backTo', 'Back to')} {parentInfo.label}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Link variant
  if (variant === 'link') {
    return (
      <Link
        to={parentInfo.path as any}
        className={cn(
          'inline-flex items-center gap-1.5',
          'text-muted-foreground hover:text-foreground',
          'transition-colors',
          size === 'sm' && 'text-xs',
          size === 'default' && 'text-sm',
          size === 'lg' && 'text-base',
          className,
        )}
      >
        {ArrowIcon}
        <span>{parentInfo.label}</span>
      </Link>
    )
  }

  // Button variant (default)
  return (
    <Button
      variant="ghost"
      size={size}
      asChild
      className={cn(
        'gap-1.5',
        // Mobile-first touch target
        'min-h-11 sm:min-h-0',
        className,
      )}
    >
      <Link to={parentInfo.path as any}>
        {ArrowIcon}
        <span>{parentInfo.label}</span>
      </Link>
    </Button>
  )
}

/**
 * Enhanced breadcrumb-style back navigation
 * Shows the full path hierarchy
 */
interface BreadcrumbBackProps {
  /** Custom breadcrumb segments */
  segments?: Array<{ path: string; label: string }>
  /** Additional className */
  className?: string
}

export function BreadcrumbBack({ segments, className }: BreadcrumbBackProps) {
  const { t, i18n } = useTranslation('common')
  const location = useLocation()
  const isRTL = i18n.language === 'ar'

  // Build breadcrumb segments from current location
  const breadcrumbs = useMemo(() => {
    if (segments) return segments

    const pathname = location.pathname
    const parts = pathname.split('/').filter(Boolean)
    const crumbs: Array<{ path: string; label: string }> = []

    // Build path progressively
    let currentPath = ''
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += `/${parts[i]}`
      const labelKey = `navigation.${parts[i]}`
      crumbs.push({
        path: currentPath,
        label: t(labelKey, parts[i].charAt(0).toUpperCase() + parts[i].slice(1)),
      })
    }

    return crumbs
  }, [location.pathname, segments, t])

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav
      className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('navigation.breadcrumbs', 'Breadcrumbs')}
    >
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronUp
              className={cn('h-3.5 w-3.5 rotate-90', isRTL && '-rotate-90')}
              aria-hidden="true"
            />
          )}
          <Link to={crumb.path as any} className="hover:text-foreground transition-colors">
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}

export default BackToParent
