/**
 * Route: /positions/:id (index child — the default "editor" tab panel)
 *
 * Phase 95 DEAD-08: this is the editor panel content moved out of the old
 * $id.tsx page body. The page header and the tab strip live in the parent
 * layout ($id.tsx) and are NOT remounted when the tab changes.
 */

import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { usePosition } from '@/hooks/usePosition'
import { useUpdatePosition } from '@/hooks/useUpdatePosition'
import { GlobeSpinner } from '@/components/signature-visuals'
// Phase 49 D-06: PositionEditor pulls in tiptap/prosemirror chain (~140 KB gz).
// Lazy-loaded so it only enters the chunk graph when the editor tab actually mounts.
const PositionEditor = lazy(() => import('@/components/position-editor/PositionEditor'))
import {
  ApprovalChain,
  type ApprovalChainConfig as ComponentApprovalChainConfig,
} from '@/components/approval-chain/ApprovalChain'
import { AttachmentUploader } from '@/components/positions/AttachmentUploader'

export const Route = createFileRoute('/_protected/positions/$id/')({
  component: PositionEditorPanel,
})

const READ_ONLY_BANNER_KEYS = {
  under_review: 'positions:readOnlyBanner.under_review',
  approved: 'positions:readOnlyBanner.approved',
  published: 'positions:readOnlyBanner.published',
} as const

type ReadOnlyPositionStatus = keyof typeof READ_ONLY_BANNER_KEYS

const isReadOnlyPositionStatus = (status: string): status is ReadOnlyPositionStatus =>
  status in READ_ONLY_BANNER_KEYS

export function PositionReadOnlyBanner({ status }: { status: ReadOnlyPositionStatus }) {
  const { t } = useTranslation('positions')

  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs font-bold text-foreground">{t(READ_ONLY_BANNER_KEYS[status])}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PositionEditorPanel() {
  const { id } = Route.useParams()
  const { t } = useTranslation('positions')
  const { data: position } = usePosition(id)
  const updatePosition = useUpdatePosition()

  // The layout gates on loading/not-found before rendering the Outlet.
  if (!position) return null

  const handleSave = async (data: any) => {
    await updatePosition.mutateAsync({
      id: position.id,
      data: {
        ...data,
        version: position.version,
      },
    })
  }

  return (
    <>
      {/* Editor Status Banner */}
      {isReadOnlyPositionStatus(position.status) && (
        <PositionReadOnlyBanner status={position.status} />
      )}

      {position.status === 'draft' && (
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold text-foreground">
                Draft Mode - Editing Enabled. You can edit this position. Changes are auto-saved
                every 30 seconds. Click "Submit for Review" when ready to start the approval
                process.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <Suspense
              fallback={
                <div
                  className="flex items-center justify-center"
                  style={{
                    minHeight: 'var(--row-h)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <GlobeSpinner size={16} />
                </div>
              }
            >
              <PositionEditor
                initialData={position}
                onSave={handleSave}
                readOnly={position.status !== 'draft'}
                autoSaveInterval={30000}
              />
            </Suspense>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('attachments', 'Attachments')}</h3>
            <AttachmentUploader positionId={position.id} />
          </Card>
        </div>

        <div className="space-y-6">
          {(position.status === 'under_review' || position.status === 'approved') && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('approvalChain', 'Approval Progress')}
              </h3>
              <ApprovalChain
                approvalChainConfig={
                  position.approval_chain_config as unknown as ComponentApprovalChainConfig
                }
                currentStage={position.current_stage}
                approvals={[]}
                status={position.status as 'draft' | 'under_review' | 'approved' | 'published'}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
