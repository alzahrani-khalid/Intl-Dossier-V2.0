/**
 * Entity Selector Component
 *
 * Allows users to select which data sources to include in their report.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  Building2,
  Calendar,
  CheckSquare,
  Briefcase,
  MessageSquare,
  File,
  GitBranch,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { REPORT_ENTITY_TYPES, type ReportEntityType } from '@/types/report-builder.types'

interface EntitySelectorProps {
  selectedEntities: ReportEntityType[]
  onToggleEntity: (entity: ReportEntityType) => void
}

const entityIcons: Record<ReportEntityType, React.ComponentType<{ className?: string }>> = {
  dossiers: FileText,
  engagements: Briefcase,
  commitments: CheckSquare,
  work_items: CheckSquare,
  calendar_entries: Calendar,
  persons: UserCircle,
  organizations: Building2,
  forums: MessageSquare,
  documents: File,
  relationships: GitBranch,
}

export function EntitySelector({ selectedEntities, onToggleEntity }: EntitySelectorProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{t('entities.title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('entities.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {REPORT_ENTITY_TYPES.map((entity) => {
            const Icon = entityIcons[entity]
            const isSelected = selectedEntities.includes(entity)

            return (
              <div
                key={entity}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all',
                  'hover:border-primary/50 hover:bg-accent/50',
                  'min-h-[80px] sm:min-h-[100px]',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background',
                )}
                onClick={() => onToggleEntity(entity)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggleEntity(entity)
                  }
                }}
              >
                <div className="absolute top-2 end-2">
                  <Checkbox checked={isSelected} className="pointer-events-none" aria-hidden />
                </div>
                <Icon
                  className={cn(
                    'h-6 w-6 sm:h-8 sm:w-8',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-xs sm:text-sm font-medium text-center',
                    isSelected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {t(`entities.${entity}`)}
                </span>
              </div>
            )
          })}
        </div>

        {selectedEntities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground me-2">{t('entities.title')}:</span>
            {selectedEntities.map((entity) => (
              <Badge
                key={entity}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onToggleEntity(entity)}
              >
                {t(`entities.${entity}`)}
                <span className="ms-1">&times;</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
