/**
 * Route: /approvals
 * My Approvals dashboard - positions pending current user's approval
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from '@tanstack/react-router'
import { Clock, CheckCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_protected/approvals/')({
  component: MyApprovalsPage,
})

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function fetchMyApprovals() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // This would need a dedicated endpoint, but for now we'll filter positions
  const response = await fetch(`${API_BASE_URL}/positions-list?status=under_review`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch approvals')
  }

  const data = await response.json()
  return data.data || []
}

function MyApprovalsPage() {
  const { t, i18n } = useTranslation('approvals')
  const dateLocale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'

  const { data: positions, isLoading } = useQuery({
    queryKey: ['approvals', 'my'],
    queryFn: fetchMyApprovals,
    staleTime: 30 * 1000, // 30 seconds
  })

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
      {/* Filter badges removed: the fetch is fixed to status=under_review so
          All/Pending/Completed never changed the list (inspection #4).
          Approved/Returned stat cards removed: both were hardcoded 0. */}
      <PageHeader
        icon={<CheckCircle className="h-6 w-6" />}
        title={t('myApprovals')}
        subtitle={t('subtitle')}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 dark:bg-warning/30 rounded-lg">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{positions?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{t('stats.pending')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Positions List */}
      <Card className="p-6">
        {positions && positions.length > 0 ? (
          <div className="space-y-4">
            {positions.map((position: any) => (
              <Link
                key={position.id}
                to="/positions/$id"
                params={{ id: position.id } as any}
                className="block p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{position.title_en}</h3>
                      <Badge variant="secondary">
                        {t('stage')} {position.current_stage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{position.title_ar}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('submittedBy')}: {position.author_id}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge>{position.thematic_category || t('uncategorized')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(position.created_at).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{t('noPositions')}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
