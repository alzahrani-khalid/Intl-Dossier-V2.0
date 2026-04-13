/**
 * Elected Officials List Page Route
 * Displays data table of elected officials with filters.
 */

import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Crown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
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
    <div className="space-y-6">
      <PageHeader
        icon={<Crown className="h-6 w-6" />}
        title={t('list.title')}
        actions={
          <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
            <Link to="/dossiers/create">
              <Plus className="h-4 w-4 me-2" />
              {t('list.add')}
            </Link>
          </Button>
        }
      />

      {/* Data Table */}
      <ElectedOfficialListTable />
    </div>
  )
}
