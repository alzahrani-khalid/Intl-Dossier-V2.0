import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEngagement } from '@/hooks/useEngagement'
import { useCreateAfterAction } from '@/hooks/useAfterAction'
import { AfterActionForm } from '@/components/AfterActionForm'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_protected/engagements/$engagementId/after-action')({
  component: AfterActionFormPage,
})

function AfterActionFormPage() {
  const { engagementId } = Route.useParams()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const { data: engagement, isLoading: loadingEngagement } = useEngagement(engagementId)
  const createAfterAction = useCreateAfterAction()

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

  const handleSaveDraft = async (data: any) => {
    try {
      const afterAction = await createAfterAction.mutateAsync({
        engagement_id: engagementId,
        dossier_id: (engagement as any).dossier_id ?? engagement.id,
        publication_status: 'draft',
        ...data,
      })

      toast.success(t('afterActions.draftSaved'))
      navigate({
        to: '/after-actions/$afterActionId' as any,
        params: { afterActionId: afterAction.id } as any,
      })
    } catch (error: any) {
      toast.error(error.message || t('afterActions.saveFailed'))
    }
  }

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={'/engagements/$engagementId' as any} params={{ engagementId } as any}>
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('afterActions.logAfterAction')}</h1>
          <p className="text-muted-foreground">{isRTL ? engagement.name_ar : engagement.name_en}</p>
        </div>
      </div>

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
            onSave={handleSaveDraft}
          />
        </CardContent>
      </Card>
    </div>
  )
}
