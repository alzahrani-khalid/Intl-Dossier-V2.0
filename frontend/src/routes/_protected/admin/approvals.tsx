/**
 * Route: /admin/approvals
 * Admin reassignment panel for stuck approvals
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDayFirstYear } from '@/lib/format-date'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth/require-admin'
import { AlertCircle, Users, CheckCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'

export const Route = createFileRoute('/_protected/admin/approvals')({
  component: AdminApprovalsPage,
  beforeLoad: requireAdmin,
})

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function fetchUnderReviewPositions() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(`${API_BASE_URL}/positions-list?status=under_review`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch positions')
  }

  const data = await response.json()
  return data.data || []
}

async function reassignApproval(approvalId: string, newApproverId: string, reason: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(`${API_BASE_URL}/approvals-reassign?id=${approvalId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reassign_to: newApproverId,
      reason,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to reassign approval')
  }

  return response.json()
}

function AdminApprovalsPage() {
  const { t } = useTranslation('admin')
  const queryClient = useQueryClient()
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [reassignData, setReassignData] = useState({
    newApproverId: '',
    reason: '',
  })

  const { data: positions, isLoading } = useQuery({
    queryKey: ['admin', 'approvals', 'under_review'],
    queryFn: fetchUnderReviewPositions,
    staleTime: 30 * 1000, // 30 seconds
  })

  const reassignMutation = useMutation({
    mutationFn: ({
      approvalId,
      newApproverId,
      reason,
    }: {
      approvalId: string
      newApproverId: string
      reason: string
    }) => reassignApproval(approvalId, newApproverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] })
      setIsReassignDialogOpen(false)
      setReassignData({ newApproverId: '', reason: '' })
    },
  })

  const handleReassign = (position: any) => {
    setSelectedPosition(position)
    setIsReassignDialogOpen(true)
  }

  const handleReassignSubmit = () => {
    if (selectedPosition && reassignData.newApproverId && reassignData.reason) {
      reassignMutation.mutate({
        approvalId: selectedPosition.current_approval_id || '', // This would need to come from the position
        newApproverId: reassignData.newApproverId,
        reason: reassignData.reason,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CheckCircle className="h-6 w-6" />}
        title={t('approvals.title')}
        subtitle={t('approvals.subtitle')}
      />

      {/* Warning Banner */}
      <Card className="p-4 border-warning/50 bg-warning/5 dark:bg-warning/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium text-warning">
              {t('approvals.warning')}
            </p>
            <p className="text-sm text-warning">
              {t(
                'approvals.warningText'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Positions Under Review Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {t('approvals.underReview')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('approvals.underReviewDesc')}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('approvals.position')}</TableHead>
              <TableHead>{t('approvals.stage')}</TableHead>
              <TableHead>{t('approvals.category')}</TableHead>
              <TableHead>{t('approvals.submittedDate')}</TableHead>
              <TableHead>{t('approvals.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions && positions.length > 0 ? (
              positions.map((position: any) => (
                <TableRow key={position.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{position.title_en}</p>
                      <p className="text-sm text-muted-foreground">{position.title_ar}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t('approvals.stageOf', {
                        current: position.current_stage,
                        total: position.approval_chain_config?.stages?.length || 0,
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.thematic_category || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDayFirstYear(position.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleReassign(position)}>
                      <Users className="me-2 h-4 w-4" />
                      {t('approvals.reassign')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t('approvals.noPositions')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('approvals.reassignTitle')}</DialogTitle>
            <DialogDescription>
              {t(
                'approvals.reassignDesc'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">{t('approvals.position')}</Label>
              <p className="text-sm font-medium">{selectedPosition?.title_en}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newApprover">{t('approvals.newApprover')} *</Label>
              <Input
                id="newApprover"
                placeholder={t('approvals.newApproverPlaceholder')}
                value={reassignData.newApproverId}
                onChange={(e) =>
                  setReassignData({ ...reassignData, newApproverId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">{t('approvals.reason')} *</Label>
              <Textarea
                id="reason"
                placeholder={t(
                  'approvals.reasonPlaceholder'
                )}
                value={reassignData.reason}
                onChange={(e) => setReassignData({ ...reassignData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleReassignSubmit}
              disabled={!reassignData.newApproverId || !reassignData.reason}
            >
              {t('approvals.confirmReassign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
