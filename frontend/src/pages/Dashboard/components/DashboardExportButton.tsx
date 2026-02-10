/**
 * Dashboard Export Button
 *
 * DropdownMenu with Excel/PDF/CSV export options.
 */

import { useTranslation } from 'react-i18next'
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardExportButtonProps {
  className?: string
}

export function DashboardExportButton({ className }: DashboardExportButtonProps) {
  const { t, i18n } = useTranslation('dashboard')
  const isRTL = i18n.language === 'ar'

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    // TODO: Implement actual export
    console.log(`Exporting dashboard as ${format}`)
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
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="size-4 me-2" />
          {t('export.excel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="size-4 me-2" />
          {t('export.pdf')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileDown className="size-4 me-2" />
          {t('export.csv')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
