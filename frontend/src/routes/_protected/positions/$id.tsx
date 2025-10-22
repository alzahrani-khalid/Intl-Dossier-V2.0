/**
 * Route: /positions/:id
 * Position detail/editor page with approval chain, consistency panel, and attachments
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Send, CheckCircle, FileText, History, Users } from 'lucide-react';
import { usePosition } from '@/hooks/usePosition';
import { useUpdatePosition } from '@/hooks/useUpdatePosition';
import { useSubmitPosition } from '@/hooks/useSubmitPosition';
import { PositionEditor } from '@/components/PositionEditor';
import { ApprovalChain } from '@/components/ApprovalChain';
import { ConsistencyPanel } from '@/components/ConsistencyPanel';
import { AttachmentUploader } from '@/components/AttachmentUploader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/positions/$id')({
  component: PositionDetailPage,
});

function PositionDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation('positions');
  const { data: position, isLoading } = usePosition(id);
  const updatePosition = useUpdatePosition();
  const submitPosition = useSubmitPosition();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6 text-center">
          <p className="text-lg text-muted-foreground">
            {t('notFound', 'Position not found')}
          </p>
        </Card>
      </div>
    );
  }

  const handleSave = async (data: any) => {
    await updatePosition.mutateAsync({
      id: position.id,
      data: {
        ...data,
        version: position.version,
      },
    });
  };

  const handleSubmit = async () => {
    await submitPosition.mutateAsync(position.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'under_review':
        return 'secondary';
      case 'approved':
        return 'success';
      case 'published':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{position.title_en}</h1>
            <Badge variant={getStatusColor(position.status)}>
              {t(`status.${position.status}`, position.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{position.title_ar}</p>
        </div>

        <div className="flex gap-2">
          {position.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleSubmit}>
                <Send className="me-2 h-4 w-4" />
                {t('submit', 'Submit for Review')}
              </Button>
            </>
          )}
          {position.status === 'approved' && (
            <Button>
              <CheckCircle className="me-2 h-4 w-4" />
              {t('publish', 'Publish')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">
            <FileText className="me-2 h-4 w-4" />
            {t('tabs.editor', 'Editor')}
          </TabsTrigger>
          {(position.status === 'under_review' || position.status === 'approved' || position.status === 'published') && (
            <TabsTrigger value="approvals">
              <Users className="me-2 h-4 w-4" />
              {t('tabs.approvals', 'Approvals')}
            </TabsTrigger>
          )}
          <TabsTrigger value="versions">
            <History className="me-2 h-4 w-4" />
            {t('tabs.versions', 'Versions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Editor Status Banner */}
          {position.status !== 'draft' && (
            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-foreground">
                    {position.status === 'under_review' &&
                      'Position Under Review - Read Only. This position is currently under review and cannot be edited. It must go through the approval chain before any changes can be made.'}
                    {position.status === 'approved' &&
                      'Position Approved - Read Only. This position has been approved and is awaiting publication. Contact an administrator to make changes.'}
                    {position.status === 'published' &&
                      'Position Published - Read Only. This position has been published. To make changes, you must use the Emergency Correction workflow or create a new version.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {position.status === 'draft' && (
            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-foreground">
                    Draft Mode - Editing Enabled. You can edit this position. Changes are auto-saved every 30 seconds. Click "Submit for Review" when ready to start the approval process.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <PositionEditor
                  initialData={position}
                  onSave={handleSave}
                  readOnly={position.status !== 'draft'}
                  autoSaveInterval={30000}
                />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('attachments', 'Attachments')}
                </h3>
                <AttachmentUploader positionId={position.id} />
              </Card>
            </div>

            <div className="space-y-6">
              {position.consistency_score !== undefined && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('consistency.title', 'Consistency Check')}
                  </h3>
                  <ConsistencyPanel positionId={position.id} />
                </Card>
              )}

              {(position.status === 'under_review' || position.status === 'approved') && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('approvalChain', 'Approval Progress')}
                  </h3>
                  <ApprovalChain positionId={position.id} currentStage={position.current_stage} />
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="p-6">
            <ApprovalChain
              positionId={position.id}
              currentStage={position.current_stage}
              detailed={true}
            />
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card className="p-6">
            <p className="text-muted-foreground">
              {t('versions.description', 'View version history and compare changes')}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
