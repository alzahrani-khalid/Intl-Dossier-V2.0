/**
 * CreateDossierHub
 *
 * Entry page at `/dossiers/create`. Renders an 8-card grid of dossier types and
 * routes the user to the matching per-type wizard at `/dossiers/{type_plural}/create`.
 *
 * Implements Phase 31 decisions:
 *   - D-01: 2 / md:3 / lg:4 mobile-first grid
 *   - D-02: 8 cards in DOSSIER_TYPES enum order (country → elected_official)
 *   - D-03: icon + bilingual type name + one-sentence description
 *   - D-05: stateless URL — no ?type=X preselect
 *   - D-16: replaces DossierCreatePage on the `/dossiers/create` route
 *
 * Hub card type union is local: the canonical `DossierType` (from
 * `@/lib/dossier-type-guards`) excludes `elected_official` (it is a PersonSubtype).
 * The hub surfaces elected_official as its own creation entry per D-02, so we
 * widen locally rather than touching the canonical domain type.
 */

import type { JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { getDossierRouteSegment } from '@/lib/dossier-routes'

/**
 * Hub-local card type. Includes `elected_official` which is not a canonical
 * DossierType (it is a PersonSubtype) but does have its own wizard route.
 */
type HubCardType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'

/**
 * All dossier creation entries surfaced by the hub, in the exact order mandated
 * by D-02. Order is stable and must not change without a phase-level decision.
 */
const DOSSIER_TYPES: HubCardType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
]

/**
 * Map each hub card type to its Lucide icon. Copied verbatim from
 * `DossierTypeStatsCard.getTypeIcon` (lines 54-75) and extended with an
 * `elected_official` case per 31-PATTERNS §"Per-type icon map".
 */
function getTypeIcon(type: HubCardType): LucideIcon {
  switch (type) {
    case 'country':
      return Globe
    case 'organization':
      return Building2
    case 'forum':
      return Users
    case 'engagement':
      return Calendar
    case 'topic':
      return Target
    case 'working_group':
      return Briefcase
    case 'person':
      return User
    case 'elected_official':
      return User
  }
}

export function CreateDossierHub(): JSX.Element {
  const { t } = useTranslation('dossier')

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
            {t('create.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2">
            {t('create.subtitleSelectType')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {DOSSIER_TYPES.map((type) => {
          const Icon = getTypeIcon(type)
          const href = `/dossiers/${getDossierRouteSegment(type)}/create`
          return (
            <Link
              key={type}
              to={href}
              className="min-h-11 block"
              data-testid={`hub-card-${type}`}
            >
              <Card className="cursor-pointer h-full transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
                <CardContent className="flex flex-col items-start gap-3 p-4 sm:p-6">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
                  <h2 className="text-base sm:text-lg font-semibold text-start">
                    {t(`type.${type}`)}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground text-start">
                    {t(`create.hubDescription.${type}`)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
