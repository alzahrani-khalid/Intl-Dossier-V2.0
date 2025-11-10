/**
 * Engagement Dossier Page (Feature 028 - User Story 3 - T027)
 *
 * Wrapper page component for engagement dossiers.
 * Uses DossierDetailLayout with single-column grid.
 * Renders EngagementDossierDetail component.
 * Includes header actions: View Kanban Board and Log After Action.
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, FileText } from 'lucide-react';
import type { EngagementDossier } from '@/lib/dossier-type-guards';
import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout';
import { EngagementDossierDetail } from '@/components/Dossier/EngagementDossierDetail';
import { Button } from '@/components/ui/button';
import { EngagementKanbanDialog } from '@/components/assignments/EngagementKanbanDialog';
import { useEngagementKanban } from '@/hooks/useEngagementKanban';

interface EngagementDossierPageProps {
  dossier: EngagementDossier;
}

export function EngagementDossierPage({ dossier }: EngagementDossierPageProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const [kanbanOpen, setKanbanOpen] = useState(false);

  const { columns, stats, handleDragEnd } = useEngagementKanban(dossier.id);

  const headerActions = (
    <>
      <Button
        variant="outline"
        onClick={() => setKanbanOpen(true)}
        className="gap-2 min-h-11 min-w-11"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">
          {t('engagement.viewKanban')}
        </span>
      </Button>
      <Button asChild className="gap-2 min-h-11 min-w-11">
        <Link
          to="/engagements/$engagementId/after-action"
          params={{ engagementId: dossier.id }}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('engagement.logAfterAction')}
          </span>
        </Link>
      </Button>
    </>
  );

  return (
    <>
      <DossierDetailLayout
        dossier={dossier}
        gridClassName="grid-cols-1"
        headerActions={headerActions}
      >
        <EngagementDossierDetail dossier={dossier} />
      </DossierDetailLayout>

      {/* Kanban Dialog */}
      <EngagementKanbanDialog
        open={kanbanOpen}
        onClose={() => setKanbanOpen(false)}
        engagementTitle={isRTL ? (dossier?.name_ar || '') : (dossier?.name_en || '')}
        columns={columns}
        stats={stats || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, progressPercentage: 0 }}
        onDragEnd={handleDragEnd}
      />
    </>
  );
}
