/**
 * Dashboard Export Button
 *
 * DropdownMenu with CSV and Print export options.
 * CSV exports visible metric data + recent dossiers table.
 * Print uses the browser's native print dialog.
 */

import { useTranslation } from 'react-i18next'
import { Download, FileDown, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DossierDashboardSummary } from '@/types/dossier-dashboard.types'
import type { MyDossier } from '@/types/dossier-dashboard.types'

interface DashboardExportButtonProps {
  className?: string
  summary?: DossierDashboardSummary
  dossiers?: MyDossier[]
}

function generateCSV(
  summary: DossierDashboardSummary | undefined,
  dossiers: MyDossier[],
  t: (key: string) => string,
  isRTL: boolean,
): string {
  const rows: string[][] = []
  const getName = (d: MyDossier) => (isRTL ? d.name_ar : d.name_en)

  // Summary section
  rows.push([t('export.section_summary')])
  if (summary) {
    rows.push([t('metrics.myDossiers'), String(summary.total_dossiers)])
    rows.push([t('metrics.activeDossiers'), String(summary.active_dossiers)])
    rows.push([t('metrics.pendingWork'), String(summary.total_pending_work)])
    rows.push([t('metrics.needsAttention'), String(summary.attention_needed)])
    rows.push([t('export.overdue'), String(summary.total_overdue)])
    rows.push([t('export.dueToday'), String(summary.due_today)])
  }
  rows.push([])

  // Dossiers table section
  if (dossiers.length > 0) {
    rows.push([t('export.section_dossiers')])
    rows.push([
      t('recentTable.columns.name'),
      t('recentTable.columns.type'),
      t('recentTable.columns.status'),
      t('recentTable.columns.pending'),
    ])
    for (const d of dossiers) {
      rows.push([getName(d), d.type, d.status, String(d.stats.pending_tasks_count)])
    }
  }

  // Escape CSV values
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(','),
    )
    .join('\n')
}

function downloadCSV(csv: string, filename: string) {
  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DashboardExportButton({
  className,
  summary,
  dossiers,
}: DashboardExportButtonProps) {
  const { t, i18n } = useTranslation('dashboard')
  const isRTL = i18n.language === 'ar'

  const handleExportCSV = () => {
    const csv = generateCSV(summary, dossiers ?? [], t, isRTL)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `dashboard-export-${date}.csv`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn('h-9 gap-2 text-sm', className)}>
          <Download className="size-4" />
          <span className="hidden sm:inline">{t('export.title')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileDown className="size-4 me-2" />
          {t('export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="size-4 me-2" />
          {t('export.pdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
