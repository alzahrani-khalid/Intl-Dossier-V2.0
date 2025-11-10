/**
 * Topic Dossier Detail Component (Feature 028 - Type-Specific Detail Pages)
 *
 * Main detail view for topic dossiers (policy areas, strategic priorities).
 * Single-column layout with 4 collapsible sections.
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CollapsibleSection } from '@/components/Dossier/CollapsibleSection';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, FileText, Network, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DossierWithExtension } from '@/services/dossier-api';

interface TopicDossierDetailProps {
  dossier: DossierWithExtension & { type: 'topic' };
}

/**
 * Policy Overview Section
 * Displays strategic context, category, and parent topic if applicable
 */
function PolicyOverview({ dossier }: { dossier: TopicDossierDetailProps['dossier'] }) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const extension = dossier.extension as { topic_category?: string; parent_topic_id?: string };

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
          {extension?.topic_category && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px] text-start">
                {t('sections.topic.category')}:
              </span>
              <Badge variant="secondary" className="w-fit capitalize">
                {extension.topic_category}
              </Badge>
            </div>
          )}

          {/* Parent Topic */}
          {extension?.parent_topic_id && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px] text-start">
                {t('sections.topic.parentTopic')}:
              </span>
              <Badge variant="outline" className="w-fit">
                {extension.parent_topic_id}
              </Badge>
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
  );
}

/**
 * Related Dossiers Section
 * Shows countries, organizations, and engagements related to this topic
 */
function RelatedDossiers({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier');

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
          {t('sections.topic.relatedDossiersPlaceholder')}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Key Documents Section
 * Policy papers, reports, and guidelines related to this topic
 */
function KeyDocuments({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier');

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
          {t('sections.topic.keyDocumentsPlaceholder')}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Subtopics Section
 * Child topics under this policy area
 */
function Subtopics({ dossierId }: { dossierId: string }) {
  const { t } = useTranslation('dossier');

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
          {t('sections.topic.subtopicsPlaceholder')}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Topic Dossier Detail Component
 */
export function TopicDossierDetail({ dossier }: TopicDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Session storage for section collapse state
  const [policyOpen, setPolicyOpen] = useSessionStorage(
    `topic-${dossier.id}-policy-open`,
    true
  );

  const [relatedOpen, setRelatedOpen] = useSessionStorage(
    `topic-${dossier.id}-related-open`,
    true
  );

  const [documentsOpen, setDocumentsOpen] = useSessionStorage(
    `topic-${dossier.id}-documents-open`,
    true
  );

  const [subtopicsOpen, setSubtopicsOpen] = useSessionStorage(
    `topic-${dossier.id}-subtopics-open`,
    true
  );

  return (
    <div
      className="space-y-4 sm:space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Policy Overview Section */}
      <CollapsibleSection
        title={t('sections.topic.policyOverview')}
        description={t('sections.topic.policyOverviewDescription')}
        isOpen={policyOpen}
        onToggle={setPolicyOpen}
      >
        <PolicyOverview dossier={dossier} />
      </CollapsibleSection>

      {/* Related Dossiers Section */}
      <CollapsibleSection
        title={t('sections.topic.relatedDossiers')}
        description={t('sections.topic.relatedDossiersDescription')}
        isOpen={relatedOpen}
        onToggle={setRelatedOpen}
      >
        <RelatedDossiers dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Key Documents Section */}
      <CollapsibleSection
        title={t('sections.topic.keyDocuments')}
        description={t('sections.topic.keyDocumentsDescription')}
        isOpen={documentsOpen}
        onToggle={setDocumentsOpen}
      >
        <KeyDocuments dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Subtopics Section */}
      <CollapsibleSection
        title={t('sections.topic.subtopics')}
        description={t('sections.topic.subtopicsDescription')}
        isOpen={subtopicsOpen}
        onToggle={setSubtopicsOpen}
      >
        <Subtopics dossierId={dossier.id} />
      </CollapsibleSection>
    </div>
  );
}
