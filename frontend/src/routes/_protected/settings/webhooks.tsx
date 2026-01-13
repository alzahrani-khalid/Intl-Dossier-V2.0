/**
 * Webhooks Settings Route
 * Feature: webhook-integration
 */

import { createFileRoute } from '@tanstack/react-router'
import { WebhooksPage } from '@/pages/webhooks/WebhooksPage'

interface SearchParams {
  tab?: 'list' | 'templates'
  search?: string
}

export const Route = createFileRoute('/_protected/settings/webhooks')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      tab: (['list', 'templates'].includes(search.tab as string)
        ? search.tab
        : undefined) as SearchParams['tab'],
      search: search.search as string | undefined,
    }
  },
  component: WebhooksRoute,
})

function WebhooksRoute() {
  const { tab, search } = Route.useSearch()

  return <WebhooksPage initialTab={tab || 'list'} initialSearch={search} />
}
