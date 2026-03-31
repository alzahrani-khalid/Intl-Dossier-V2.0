/**
 * ContextTab — Intelligence/prep sheet (D-02)
 *
 * Shows the engagement's diplomatic context:
 * - Linked dossiers organized by tier (Anchors, Activities, Threads, Contacts)
 * - AI recommendations from useEngagementRecommendations
 * - Talking points / engagement description
 *
 * Mobile-first, RTL-safe, logical properties only.
 */

import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from '@tanstack/react-router'
import {
  FileText,
  Link2,
  Lightbulb,
  Plus,
} from 'lucide-react'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'
import {
  useEngagementRecommendations,
  type RecommendationListResponse,
  type EngagementRecommendationListItem,
} from '@/domains/engagements/hooks/useEngagementRecommendations'
import {
  getRecommendationTypeBgColor,
  RECOMMENDATION_TYPE_LABELS,
} from '@/types/engagement-recommendation.types'
import type { RecommendationType } from '@/types/engagement-recommendation.types'
import { DossierContextBadge } from '@/components/dossier'
import type { DossierType } from '@/types/relationship.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// Dossier Tier Classification
// ============================================================================

interface LinkedDossier {
  id: string
  type: DossierType
  name_en: string
  name_ar?: string
}

interface DossierTier {
  label: { en: string; ar: string }
  types: DossierType[]
  dossiers: LinkedDossier[]
}

const TIER_DEFINITIONS: Array<{ label: { en: string; ar: string }; types: DossierType[] }> = [
  {
    label: { en: 'Anchors', ar: '\u0627\u0644\u0631\u0643\u0627\u0626\u0632' },
    types: ['country', 'organization'] as DossierType[],
  },
  {
    label: { en: 'Activities', ar: '\u0627\u0644\u0623\u0646\u0634\u0637\u0629' },
    types: ['engagement', 'forum'] as DossierType[],
  },
  {
    label: { en: 'Threads', ar: '\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639' },
    types: ['topic', 'working_group'] as DossierType[],
  },
  {
    label: { en: 'Contacts', ar: '\u0627\u0644\u062c\u0647\u0627\u062a' },
    types: ['person', 'elected_official'] as DossierType[],
  },
]

function classifyDossiersByTier(dossiers: LinkedDossier[]): DossierTier[] {
  return TIER_DEFINITIONS.map((tier) => ({
    ...tier,
    dossiers: dossiers.filter((d) => (tier.types as string[]).includes(d.type)),
  })).filter((tier) => tier.dossiers.length > 0)
}

// ============================================================================
// Component
// ============================================================================

export default function ContextTab(): ReactElement {
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })
  const { t } = useTranslation('workspace')
  const { direction, isRTL } = useDirection()

  // Data fetching
  const { data: profile, isLoading: profileLoading } = useEngagement(engagementId)
  const { data: recommendationsData, isLoading: recsLoading } =
    useEngagementRecommendations({ target_dossier_id: engagementId })

  const engagement = profile?.engagement

  // Extract linked dossiers from profile participants/hosts
  const linkedDossiers = useMemo((): LinkedDossier[] => {
    if (profile == null) return []
    const dossiers: LinkedDossier[] = []

    // Host country
    if (profile.host_country != null) {
      dossiers.push({
        id: profile.host_country.id,
        type: 'country' as DossierType,
        name_en: profile.host_country.name_en,
        name_ar: profile.host_country.name_ar,
      })
    }

    // Host organization
    if (profile.host_organization != null) {
      dossiers.push({
        id: profile.host_organization.id,
        type: 'organization' as DossierType,
        name_en: profile.host_organization.name_en,
        name_ar: profile.host_organization.name_ar,
      })
    }

    // Participants with dossier links
    if (profile.participants != null) {
      for (const p of profile.participants) {
        if (p.dossier_info != null) {
          // Avoid duplicates
          const exists = dossiers.some((d) => d.id === p.dossier_info?.id)
          if (!exists) {
            dossiers.push({
              id: p.dossier_info.id,
              type: p.dossier_info.type as DossierType,
              name_en: p.dossier_info.name_en,
              name_ar: p.dossier_info.name_ar,
            })
          }
        }
      }
    }

    return dossiers
  }, [profile])

  const tiers = useMemo(() => classifyDossiersByTier(linkedDossiers), [linkedDossiers])

  const recommendations = useMemo((): EngagementRecommendationListItem[] => {
    const raw = recommendationsData as RecommendationListResponse | undefined
    return raw?.data ?? []
  }, [recommendationsData])

  // Talking points content — description or notes
  const talkingPointsContent = useMemo((): string | null => {
    if (engagement == null) return null
    if (isRTL) {
      return engagement.objectives_ar
        ?? engagement.description_ar
        ?? engagement.objectives_en
        ?? engagement.description_en
        ?? null
    }
    return engagement.objectives_en
      ?? engagement.description_en
      ?? null
  }, [engagement, isRTL])

  return (
    <div dir={direction} className="space-y-6">
      {/* Linked Dossiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Link2 className="size-5" />
            {isRTL ? '\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629' : 'Linked Dossiers'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-7 w-36" />
              </div>
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-medium text-muted-foreground">
                {t('empty.context.heading')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('empty.context.body')}
              </p>
              <Button variant="outline" size="sm" className="mt-3 min-h-11 min-w-11">
                <Plus className="size-4" />
                {t('empty.context.action')}
              </Button>
            </div>
          ) : (
            <>
              {tiers.map((tier) => (
                <div key={tier.label.en} className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isRTL ? tier.label.ar : tier.label.en}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tier.dossiers.map((dossier) => (
                      <DossierContextBadge
                        key={dossier.id}
                        dossierId={dossier.id}
                        dossierType={dossier.type}
                        nameEn={dossier.name_en}
                        nameAr={dossier.name_ar}
                        inheritanceSource="direct"
                      />
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2 min-h-11 min-w-11">
                <Plus className="size-4" />
                {t('actions.linkDossier')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Lightbulb className="size-5" />
            {isRTL ? '\u062a\u0648\u0635\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a' : 'AI Recommendations'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRTL
                ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0648\u0635\u064a\u0627\u062a \u0645\u062a\u0627\u062d\u0629'
                : 'No AI recommendations available'}
            </p>
          ) : (
            recommendations.map((rec) => {
              const typeLabels =
                RECOMMENDATION_TYPE_LABELS[rec.recommendation_type as RecommendationType]
              const typeLabel = isRTL ? typeLabels?.ar : typeLabels?.en
              const typeBg = getRecommendationTypeBgColor(
                rec.recommendation_type as RecommendationType,
              )
              return (
                <div
                  key={rec.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <p className="text-base font-semibold">
                    {isRTL ? rec.title_ar : rec.title_en}
                  </p>
                  {rec.target_dossier_name_en != null && (
                    <p className="text-xs text-muted-foreground">
                      {isRTL
                        ? (rec.target_dossier_name_ar ?? rec.target_dossier_name_en)
                        : rec.target_dossier_name_en}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', typeBg)}
                    >
                      {typeLabel ?? rec.recommendation_type}
                    </Badge>
                    {rec.priority >= 4 && (
                      <Badge variant="destructive" className="text-xs">
                        {isRTL ? '\u0623\u0648\u0644\u0648\u064a\u0629 \u0639\u0627\u0644\u064a\u0629' : 'High Priority'}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Talking Points */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <FileText className="size-5" />
            {isRTL ? '\u0646\u0642\u0627\u0637 \u0627\u0644\u062d\u0648\u0627\u0631' : 'Talking Points'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : talkingPointsContent != null && talkingPointsContent !== '' ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {talkingPointsContent}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRTL
                ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0642\u0627\u0637 \u062d\u0648\u0627\u0631 \u0628\u0639\u062f'
                : 'No talking points available'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
