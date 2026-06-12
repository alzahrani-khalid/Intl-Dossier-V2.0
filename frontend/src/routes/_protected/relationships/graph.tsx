import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RelationshipGraphPage } from '@/pages/relationships/RelationshipGraphPage'

interface GraphSearch {
  dossierId?: string
}

export const Route = createFileRoute('/_protected/relationships/graph')({
  validateSearch: (search: Record<string, unknown>): GraphSearch => {
    const dossierId = search.dossierId

    return {
      dossierId: typeof dossierId === 'string' && dossierId.length > 0 ? dossierId : undefined,
    }
  },
  component: RelationshipGraphRoute,
})

function RelationshipGraphRoute(): ReactElement {
  return <RelationshipGraphPage />
}
