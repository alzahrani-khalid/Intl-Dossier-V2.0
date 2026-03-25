/**
 * Topic Dossier Detail Component (Feature 028 - Type-Specific Detail Pages)
 *
 * Main detail view for topic dossiers (policy areas, strategic priorities).
 * Single-column layout with 4 collapsible sections.
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { useSessionStorage } from '@/hooks/useSessionStorage'
import { useRelationshipsForDossier } from '@/hooks/useRelationships'
import { useDocuments } from '@/hooks/useDocuments'
import { useTopicSubtopics } from '@/hooks/useTopics'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { CollapsibleSection } from '@/components/dossier/CollapsibleSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, FileText, Network, FolderTree, ExternalLink } from 'lucide-react'
import type { DossierWithExtension, TopicExtension } from '@/services/dossier-api'
import type { RelationshipWithDossiers, DossierReference } from '@/services/relationship-api'
import { useDirection } from '@/hooks/useDirection'

interface TopicDossierDetailProps {
  dossier: DossierWithExtension & { type: 'topic' }
}

/**
 * Policy Overview Section
 * Displays strategic context, category, and parent topic if applicable
 */
function PolicyOverview({ dossier }: { dossier: TopicDossierDetailProps['dossier'] }) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
const extension = dossier.extension as TopicExtension | undefined

  // Fetch parent topic name if parent_theme_id exists
  const parentRelationships = useRelationshipsForDossier(
    extension?.parent_theme_id || '',
    undefined,
    undefined,
    { enabled: !!extension?.parent_theme_id },
  )

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Target className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-start">
              {t('sections.topic.policyOverview')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-start">
              {t('sections.topic.policyOverviewDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Topic Category */}
          {extension?.theme_category && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px] text-start">
                {t('sections.topic.category')}:
              </span>
              <Badge variant="secondary" className="w-fit capitalize">
                {t(`form.topic.categories.${extension.theme_category}`, extension.theme_category)}
              </Badge>
            </div>
          )}

          {/* Parent Topic */}
          {extension?.parent_theme_id && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px] text-start">
                {t('sections.topic.parentTopic')}:
              </span>
              <Link
                to={`/dossiers/topics/${extension.parent_theme_id}`}
                className="text-sm text-primary hover:underline"
              >
                {parentRelationships.isLoading
                  ? extension.parent_theme_id.slice(0, 8) + '...'
                  : extension.parent_theme_id.slice(0, 8) + '...'}
              </Link>
            </div>
          )}

          {/* Description */}
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground text-start leading-relaxed">
              {isRTL ? dossier.description_ar : dossier.description_en || t('common.notAvailable')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Related Dossiers Section
 * Shows countries, organizations, and engagements related to this topic
 */
function RelatedDossiers({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()

  const { data, isLoading } = useRelationshipsForDossier(dossierId)
  const relationships = data?.data || []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.relatedDossiers')}
              </h3>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (relationships.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.relatedDossiers')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-start">
                {t('sections.topic.relatedDossiersDescription')}
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('sections.topic.noRelatedDossiers', 'No related dossiers found')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-start">
              {t('sections.topic.relatedDossiers')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-start">
              {t('sections.topic.relatedDossiersDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {relationships.map((rel: RelationshipWithDossiers) => {
            const relatedDossier: DossierReference | undefined =
              rel.source_dossier_id === dossierId ? rel.target_dossier : rel.source_dossier
            if (!relatedDossier) return null

            const displayName = isRTL ? relatedDossier.name_ar : relatedDossier.name_en
            const routeSegment = getDossierRouteSegment(relatedDossier.type)

            return (
              <Link
                key={rel.id}
                to={`/dossiers/${routeSegment}/${relatedDossier.id}`}
                className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{displayName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {t(`type.${relatedDossier.type}`, relatedDossier.type)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {rel.relationship_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Key Documents Section
 * Policy papers, reports, and guidelines related to this topic
 */
function KeyDocuments({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()

  const { documents, isLoading } = useDocuments({
    owner_type: 'dossier',
    owner_id: dossierId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.keyDocuments')}
              </h3>
            </div>
          </div>
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.keyDocuments')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-start">
                {t('sections.topic.keyDocumentsDescription')}
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('sections.topic.noDocuments', 'No documents found')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-start">
              {t('sections.topic.keyDocuments')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-start">
              {t('sections.topic.keyDocumentsDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => {
            const displayTitle = isRTL ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar

            return (
              <div
                key={doc.id}
                className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {displayTitle || t('common.notAvailable')}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {doc.document_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Subtopics Section
 * Child topics under this policy area
 */
function Subtopics({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()

  const { data: subtopics, isLoading } = useTopicSubtopics(dossierId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FolderTree className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.subtopics')}
              </h3>
            </div>
          </div>
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!subtopics || subtopics.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FolderTree className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-start">
                {t('sections.topic.subtopics')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-start">
                {t('sections.topic.subtopicsDescription')}
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('sections.topic.noSubtopics', 'No subtopics found')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FolderTree className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-start">
              {t('sections.topic.subtopics')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-start">
              {t('sections.topic.subtopicsDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {subtopics.map((sub) => {
            const displayName = isRTL ? sub.name_ar : sub.name_en
            const displayDescription = isRTL ? sub.description_ar : sub.description_en
            const ext = sub.extension as TopicExtension | undefined

            return (
              <Link
                key={sub.id}
                to={`/dossiers/topics/${sub.id}`}
                className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="h-5 w-5 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{displayName}</h4>
                    {displayDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {displayDescription}
                      </p>
                    )}
                    {ext?.theme_category && (
                      <Badge variant="secondary" className="text-xs capitalize mt-1">
                        {t(`form.topic.categories.${ext.theme_category}`, ext.theme_category)}
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main Topic Dossier Detail Component
 */
export function TopicDossierDetail({ dossier }: TopicDossierDetailProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()

  // Session storage for section collapse state
  const [policyOpen, setPolicyOpen] = useSessionStorage(`topic-${dossier.id}-policy-open`, true)

  const [relatedOpen, setRelatedOpen] = useSessionStorage(`topic-${dossier.id}-related-open`, true)

  const [documentsOpen, setDocumentsOpen] = useSessionStorage(
    `topic-${dossier.id}-documents-open`,
    true,
  )

  const [subtopicsOpen, setSubtopicsOpen] = useSessionStorage(
    `topic-${dossier.id}-subtopics-open`,
    true,
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Policy Overview Section */}
      <CollapsibleSection
        id={`topic-${dossier.id}-policy`}
        title={t('sections.topic.policyOverview')}
        description={t('sections.topic.policyOverviewDescription')}
        isExpanded={policyOpen}
        onToggle={(expanded) => setPolicyOpen(expanded)}
      >
        <PolicyOverview dossier={dossier} />
      </CollapsibleSection>

      {/* Related Dossiers Section */}
      <CollapsibleSection
        id={`topic-${dossier.id}-related`}
        title={t('sections.topic.relatedDossiers')}
        description={t('sections.topic.relatedDossiersDescription')}
        isExpanded={relatedOpen}
        onToggle={(expanded) => setRelatedOpen(expanded)}
      >
        <RelatedDossiers dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Key Documents Section */}
      <CollapsibleSection
        id={`topic-${dossier.id}-documents`}
        title={t('sections.topic.keyDocuments')}
        description={t('sections.topic.keyDocumentsDescription')}
        isExpanded={documentsOpen}
        onToggle={(expanded) => setDocumentsOpen(expanded)}
      >
        <KeyDocuments dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Subtopics Section */}
      <CollapsibleSection
        id={`topic-${dossier.id}-subtopics`}
        title={t('sections.topic.subtopics')}
        description={t('sections.topic.subtopicsDescription')}
        isExpanded={subtopicsOpen}
        onToggle={(expanded) => setSubtopicsOpen(expanded)}
      >
        <Subtopics dossierId={dossier.id} />
      </CollapsibleSection>
    </div>
  )
}
