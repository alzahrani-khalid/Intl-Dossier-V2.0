/**
 * Route: /positions/:id/approvals — the "approvals" tab PANEL.
 *
 * Phase 95 DEAD-08: renders through the $id.tsx layout's <Outlet/>; the page
 * header and Back link that used to live here belong to the layout now (the
 * tab strip must not remount the page header).
 */

import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, UserPlus, Users } from 'lucide-react'
import ApprovalChain from '@/components/approval-chain/ApprovalChain'
import { Skeleton } from '@/components/ui/skeleton'
import { p } from '@/lib/navigation'
import { APPROVALS_TAB_STATUSES } from '../$id'
import { formatDateTime } from '@/lib/format-date'

export const Route = createFileRoute('/_protected/positions/$id/approvals')({
  component: ApprovalTrackingPage,
})

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function fetchApprovals(positionId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(`${API_BASE_URL}/positions-get?position_id=${positionId}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch position')
  }

  return response.json()
}

function ApprovalTrackingPage() {
  const { id } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: position, isLoading } = useQuery({
    queryKey: ['positions', 'detail', id],
    queryFn: () => fetchApprovals(id),
  })

  // Deep link without a trigger: the layout only offers the approvals tab for
  // APPROVALS_TAB_STATUSES. Landing here for any other status would select a tab
  // the strip does not render, so send the URL back to the editor index instead.
  const status: string | undefined = position?.status
  useEffect(() => {
    if (status !== undefined && !APPROVALS_TAB_STATUSES.includes(status)) {
      void navigate({ to: '/positions/$id', params: p({ id }), replace: true })
    }
  }, [status, id, navigate])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'request_revisions':
        return <XCircle className="h-4 w-4 text-danger" />
      case 'delegate':
        return <UserPlus className="h-4 w-4 text-accent" />
      case 'reassign':
        return <Users className="h-4 w-4 text-warning" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Approval Chain Visualization */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('positions:approvals.progress', 'Approval Progress')}
        </h2>
        <ApprovalChain
          approvalChainConfig={position?.approval_chain_config || { stages: [] }}
          currentStage={position?.current_stage || 0}
          approvals={position?.approvals || []}
          status={position?.status || 'draft'}
        />
      </Card>

      {/* Approval History Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('positions:approvals.history', 'Approval History')}
        </h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('positions:approvals.stage', 'Stage')}</TableHead>
              <TableHead>{t('positions:approvals.approver', 'Approver')}</TableHead>
              <TableHead>{t('positions:approvals.action', 'Action')}</TableHead>
              <TableHead>{t('positions:approvals.stepUp', 'Step-Up Verified')}</TableHead>
              <TableHead>{t('positions:approvals.comments', 'Comments')}</TableHead>
              <TableHead>{t('positions:approvals.timestamp', 'Timestamp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {position?.approvals?.map((approval: any) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Badge variant="outline">{approval.stage}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {approval.approver_name || approval.approver_id}
                    </span>
                    {approval.delegated_from && (
                      <span className="text-xs text-muted-foreground">
                        {t('positions:approvals.delegatedFrom', 'Delegated from')}:{' '}
                        {approval.delegated_from}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(approval.action)}
                    <span className="capitalize">{approval.action.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {approval.step_up_verified ? (
                    <Badge variant="default" className="text-xs">
                      {t('common:yes', 'Yes')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('common:no', 'No')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{approval.comments || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(approval.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
