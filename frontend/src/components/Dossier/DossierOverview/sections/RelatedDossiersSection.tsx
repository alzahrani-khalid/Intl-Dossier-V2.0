/**
 * RelatedDossiersSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays related dossiers grouped by relationship type.
 * Mobile-first, RTL-supported.
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Network,
  ChevronRight,
  GitBranch,
  Building2,
  Users,
  Globe,
  MapPin,
  Briefcase,
  UserCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DossierTypeIcon } from '../../DossierTypeIcon'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import type {
  RelatedDossiersSectionProps,
  RelatedDossier,
  DossierRelationshipType,
} from '@/types/dossier-overview.types'
import type { DossierType } from '@/services/dossier-api'

/**
 * Get icon for relationship type
 */
function getRelationshipIcon(type: DossierRelationshipType) {
  const icons: Record<DossierRelationshipType, React.ElementType> = {
    parent: GitBranch,
    child: GitBranch,
    bilateral: Network,
    member_of: Users,
    has_member: Users,
    partner: Briefcase,
    related_to: Network,
    predecessor: ChevronRight,
    successor: ChevronRight,
  }
  return icons[type] || Network
}

/**
 * RelatedDossierCard component
 */
function RelatedDossierCard({ dossier, isRTL }: { dossier: RelatedDossier; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')
  const Icon = getRelationshipIcon(dossier.relationship_type)

  return (
    <Link to={getDossierDetailPath(dossier.id, dossier.type)}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <DossierTypeIcon type={dossier.type} className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-semibold line-clamp-2 mb-1">
                {isRTL ? dossier.name_ar : dossier.name_en}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {t(`dossierType.${dossier.type}`)}
                </Badge>
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {t(`relationshipType.${dossier.relationship_type}`)}
                </Badge>
                {!dossier.is_outgoing && (
                  <Badge variant="outline" className="text-xs">
                    {t('relationship.incoming')}
                  </Badge>
                )}
              </div>
              {dossier.notes_en && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                  {isRTL ? dossier.notes_ar : dossier.notes_en}
                </p>
              )}
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground shrink-0 ${isRTL ? 'rotate-180' : ''}`}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Empty state component
 */
function EmptyState({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="text-center py-8 sm:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-4 rounded-full bg-muted inline-block mb-4">
        <Network className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-2">{t('relatedDossiers.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {t('relatedDossiers.empty.description')}
      </p>
    </div>
  )
}

/**
 * Main RelatedDossiersSection component
 */
export function RelatedDossiersSection({
  data,
  isLoading,
  isRTL = false,
  className = '',
}: RelatedDossiersSectionProps) {
  const { t } = useTranslation('dossier-overview')
  const [viewMode, setViewMode] = useState<'relationship' | 'type'>('relationship')

  // Get all relationships
  const allRelationships = useMemo(() => {
    if (!data) return []
    return Object.values(data.by_relationship_type).flat()
  }, [data])

  // Filter out empty relationship types
  const activeRelationshipTypes = useMemo(() => {
    if (!data) return []
    return (
      Object.entries(data.by_relationship_type) as [DossierRelationshipType, RelatedDossier[]][]
    ).filter(([_, dossiers]) => dossiers.length > 0)
  }, [data])

  // Filter out empty dossier types
  const activeDossierTypes = useMemo(() => {
    if (!data) return []
    return (Object.entries(data.by_dossier_type) as [DossierType, RelatedDossier[]][]).filter(
      ([_, dossiers]) => dossiers.length > 0,
    )
  }, [data])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6">
          <EmptyState isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Network className="h-5 w-5" />
            {t('relatedDossiers.title')}
            <Badge variant="secondary">{data.total_count}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'relationship' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('relationship')}
              className="text-xs"
            >
              {t('relatedDossiers.groupBy.relationship')}
            </Button>
            <Button
              variant={viewMode === 'type' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('type')}
              className="text-xs"
            >
              {t('relatedDossiers.groupBy.type')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        {viewMode === 'relationship' ? (
          <div className="space-y-6">
            {activeRelationshipTypes.map(([type, dossiers]) => (
              <div key={type}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  {(() => {
                    const Icon = getRelationshipIcon(type)
                    return <Icon className="h-4 w-4" />
                  })()}
                  {t(`relationshipType.${type}`)}
                  <Badge variant="outline" className="text-xs">
                    {dossiers.length}
                  </Badge>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dossiers.map((dossier) => (
                    <RelatedDossierCard
                      key={dossier.relationship_id}
                      dossier={dossier}
                      isRTL={isRTL}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activeDossierTypes.map(([type, dossiers]) => (
              <div key={type}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <DossierTypeIcon type={type} className="h-4 w-4" />
                  {t(`dossierType.${type}`)}
                  <Badge variant="outline" className="text-xs">
                    {dossiers.length}
                  </Badge>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dossiers.map((dossier) => (
                    <RelatedDossierCard
                      key={dossier.relationship_id}
                      dossier={dossier}
                      isRTL={isRTL}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RelatedDossiersSection
