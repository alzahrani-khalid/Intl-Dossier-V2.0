/**
 * Elected Officials List Page Route
 * Displays data table of elected officials with filters.
 */

import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { UserCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ElectedOfficialListTable } from '@/components/elected-officials/ElectedOfficialListTable'

// URL search params type for dossier list pagination
interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/elected-officials/')({
  component: ElectedOfficialsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function ElectedOfficialsListPage(): ReactElement {
  const { t } = useTranslation('elected-officials')

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-start">
              {t('list.title')}
            </h1>
          </div>
        </div>
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/create">
            <Plus className="h-4 w-4 me-2" />
            {t('list.add')}
          </Link>
        </Button>
      </header>

      {/* Data Table */}
      <ElectedOfficialListTable />
    </div>
  )
}
