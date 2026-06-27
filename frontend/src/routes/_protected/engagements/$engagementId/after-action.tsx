import React, { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEngagement } from '@/hooks/useEngagement'
import { useCreateAfterAction } from '@/hooks/useAfterAction'
import type { ConflictError } from '@/hooks/useAfterAction'
import { AfterActionForm } from '@/components/after-action-form/AfterActionForm'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useDirection } from '@/hooks/useDirection'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

export const Route = createFileRoute('/_protected/engagements/$engagementId/after-action')({
  component: AfterActionFormPage,
})

function AfterActionFormPage(): React.ReactNode {
  const { engagementId } = Route.useParams()
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const navigate = useNavigate()
  const [conflict, setConflict] = useState<ConflictError | null>(null)
  const [formDirty, setFormDirty] = useState(false)

  useUnsavedChangesGuard(formDirty)

  const { data: engagement, isLoading: loadingEngagement } = useEngagement(engagementId)
  const createAfterAction = useCreateAfterAction()

  // B-6: the internal-owner <Select> in CommitmentEditor needs a real user list.
  // Without it the picker is empty, owner_user_id stays undefined and the
  // commitment insert fails the valid_owner CHECK. Fetch active org users once.
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['org-users', 'active'],
    queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true })
        .limit(500)
      if (error) throw error
      return (data ?? []).map((u) => ({ id: u.id, name: u.full_name || u.email || u.id }))
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (loadingEngagement) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-screen w-full" />
      </div>
    )
  }

  if (!engagement) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
            <CardDescription>{t('engagements.notFound')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleSaveDraft = async (data: any): Promise<void> => {
    try {
      // The form nests follow-ups under `follow_ups`; the create edge reads
      // `follow_up_actions`, so rename to avoid silently dropping them.
      const { follow_ups, ...rest } = data
      const afterAction = await createAfterAction.mutateAsync({
        engagement_id: engagementId,
        dossier_id: (engagement as any).dossier_id ?? engagement.id,
        publication_status: 'draft',
        ...rest,
        follow_up_actions: follow_ups,
      })

      setFormDirty(false)
      toast.success(t('afterActions.draftSaved'))
      navigate({
        to: '/after-actions/$afterActionId' as any,
        params: { afterActionId: afterAction.id } as any,
      })
    } catch (err: unknown) {
      // Check for conflict error from optimistic locking (D-41)
      const maybeConflict = err as Error & { conflict?: ConflictError }
      if (maybeConflict.conflict != null) {
        setConflict(maybeConflict.conflict)
        toast.error(t('afterActions.conflict.warning', 'This record was modified by another user.'))
        return
      }
      toast.error((err instanceof Error ? err.message : null) ?? t('afterActions.saveFailed'))
    }
  }

  return (
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label={t('common.goBack', 'Go back')}>
          <Link to={'/engagements/$engagementId' as any} params={{ engagementId } as any}>
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('afterActions.logAfterAction')}</h1>
          <p className="text-muted-foreground">{isRTL ? engagement.name_ar : engagement.name_en}</p>
        </div>
      </div>

      {/* Conflict Warning Banner (D-41 optimistic locking) */}
      {conflict != null && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              {t(
                'afterActions.conflict.warning',
                'This record was modified by another user. Review changes before saving.',
              )}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="min-h-11 min-w-11"
            onClick={(): void => {
              window.location.reload()
            }}
          >
            {t('afterActions.conflict.reviewChanges', 'Review Changes')}
          </Button>
        </div>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('afterActions.formTitle')}</CardTitle>
          <CardDescription>{t('afterActions.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AfterActionForm
            engagementId={engagementId}
            dossierId={(engagement as any).dossier_id ?? engagement.id}
            availableUsers={availableUsers}
            onSave={handleSaveDraft}
            onDirtyChange={setFormDirty}
          />
        </CardContent>
      </Card>
    </div>
  )
}
