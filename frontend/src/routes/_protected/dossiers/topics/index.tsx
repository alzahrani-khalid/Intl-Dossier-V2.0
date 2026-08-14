import { createFileRoute } from '@tanstack/react-router'
import { parseListControlsSearch } from '@/components/list-controls/useListControls'
import { TopicsListPage, topicsListConfig } from './-TopicsListPage'

interface TopicsListSearch {
  page: number
  search?: string
  cols?: string
}

export const Route = createFileRoute('/_protected/dossiers/topics/')({
  component: TopicsListPage,
  validateSearch: (raw: Record<string, unknown>): TopicsListSearch => {
    const controls = parseListControlsSearch(raw, topicsListConfig)
    return {
      page: Math.max(1, Number(raw.page) || 1),
      search: typeof raw.search === 'string' && raw.search.length > 0 ? raw.search : undefined,
      cols: controls.cols,
    }
  },
})
