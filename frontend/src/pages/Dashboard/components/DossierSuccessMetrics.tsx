/**
 * Dossier Success Metrics Card
 *
 * Matches shadcn-ui-kit reference:
 * - Large number in header (CardDescription label + CardTitle value)
 * - Avatar stack (size-12, border-4)
 * - Highlights section with divide-y rows and directional arrows
 */

import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

interface DossierSuccessMetricsProps {
  isLoading?: boolean
  className?: string
}

// Mock data — connect to real endpoints later
const mockMetrics = {
  totalProfessionals: 12,
  contributors: [
    { initials: 'KA', name: 'Khalid A.' },
    { initials: 'SA', name: 'Sarah A.' },
    { initials: 'MN', name: 'Mohammed N.' },
    { initials: 'FA', name: 'Fatima A.' },
    { initials: 'OB', name: 'Omar B.' },
  ],
  highlights: [
    { key: 'completionRate', value: '78%', direction: 'up' as const },
    { key: 'avgResponseTime', value: '4h 32m', direction: 'down' as const },
    { key: 'activeContributors', value: '12', direction: 'up' as const },
  ],
}

export function DossierSuccessMetrics({ isLoading, className }: DossierSuccessMetricsProps) {
  const { t } = useTranslation('dashboard')

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const { totalProfessionals, contributors, highlights } = mockMetrics

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{t('successMetrics.professionals')}</CardDescription>
        <CardTitle className="font-display text-2xl font-semibold tabular-nums lg:text-3xl">
          {totalProfessionals}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Stack — Today's Heroes */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('successMetrics.todaysHeroes')}</p>
          <div className="flex -space-x-4">
            {contributors.map((c) => (
              <Tooltip key={c.initials}>
                <TooltipTrigger asChild>
                  <Avatar className="size-12 border-4 border-card">
                    <AvatarFallback className="text-sm">{c.initials}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{c.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-2">
          <p className="text-sm font-bold">{t('successMetrics.highlights')}</p>
          <div className="divide-y *:py-3">
            {highlights.map((h) => (
              <div key={h.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(`successMetrics.${h.key}`)}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  {h.value}
                  {h.direction === 'up' ? (
                    <ArrowUpRight className="size-4 text-green-600" />
                  ) : (
                    <ArrowDownLeft className="size-4 text-red-600" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
