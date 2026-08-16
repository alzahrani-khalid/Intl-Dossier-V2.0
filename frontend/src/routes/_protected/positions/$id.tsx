/**
 * Route: /positions/:id (slot LAYOUT)
 *
 * Owns the page header and the URL-driven tab strip; the tab panel content is
 * rendered by the matched child route through <Outlet/>:
 *   /positions/:id            -> $id/index.tsx  (editor)
 *   /positions/:id/approvals  -> $id/approvals.tsx
 *   /positions/:id/versions   -> $id/versions.tsx
 *
 * Phase 95 DEAD-08: this file is the ONLY owner of the dynamic positions slot
 * (the competing $positionId.tsx was deleted). The tab strip's active value
 * derives from the matched child, so deep links open the right tab and browser
 * back moves tab state.
 */

import { createFileRoute, Outlet, useChildMatches, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, CheckCircle, FileText, History, Users } from 'lucide-react'
import { usePosition } from '@/hooks/usePosition'
import { useSubmitPosition } from '@/hooks/useSubmitPosition'
import { usePositionNavigation } from '@/hooks/useEntityNavigation'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { p } from '@/lib/navigation'

/**
 * The statuses for which the approvals trigger is offered. Shared with
 * $id/approvals.tsx so a deep link and the strip can never disagree: a status
 * outside this set hides the trigger AND redirects the child to the editor.
 */
export const APPROVALS_TAB_STATUSES = ['under_review', 'approved', 'published']

export const Route = createFileRoute('/_protected/positions/$id')({
  component: PositionDetailLayout,
})

function PositionDetailLayout() {
  const { id } = Route.useParams()
  const { t } = useTranslation('positions')
  const navigate = useNavigate()
  const { data: position, isLoading } = usePosition(id)
  const submitPosition = useSubmitPosition()

  // Active tab is derived from the matched child route, not local state.
  const childMatches = useChildMatches()
  const activeTab = childMatches.some((match) => match.routeId.endsWith('/approvals'))
    ? 'approvals'
    : childMatches.some((match) => match.routeId.endsWith('/versions'))
      ? 'versions'
      : 'editor'

  // Track this position in navigation history
  usePositionNavigation(id, position, { skip: isLoading })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!position) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6 text-center">
          <p className="text-lg text-muted-foreground">{t('notFound', 'Position not found')}</p>
        </Card>
      </div>
    )
  }

  const handleSubmit = async () => {
    await submitPosition.mutateAsync(position.id)
  }

  const handleTabChange = (value: string) => {
    if (value === 'approvals') {
      void navigate({ to: '/positions/$id/approvals', params: p({ id }) })
    } else if (value === 'versions') {
      void navigate({ to: '/positions/$id/versions', params: p({ id }) })
    } else {
      void navigate({ to: '/positions/$id', params: p({ id }) })
    }
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'under_review':
        return 'secondary'
      case 'approved':
        return 'outline'
      case 'published':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">
            <FileText className="me-2 h-4 w-4" />
            {t('tabs.editor', 'Editor')}
          </TabsTrigger>
          {APPROVALS_TAB_STATUSES.includes(position.status) && (
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

        {/* The matched child renders the panel body. One TabsContent bound to the
            active value keeps the active trigger's aria-controls resolvable. */}
        <TabsContent value={activeTab} className="space-y-6">
          <Outlet />
        </TabsContent>
      </Tabs>
    </div>
  )
}
