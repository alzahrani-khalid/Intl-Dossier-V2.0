import { createFileRoute } from '@tanstack/react-router'
import { AdvancedSearchPage } from '@/pages/advanced-search'

export const Route = createFileRoute('/_protected/advanced-search')({
  component: AdvancedSearchPage,
})
