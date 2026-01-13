/**
 * Audit Log Export Component
 *
 * Export button and dialog for downloading audit logs in CSV or JSON format
 *
 * Mobile-first and RTL-ready
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuditLogExport } from '@/hooks/useAuditLogs'
import type { AuditLogFilters, ExportFormat } from '@/types/audit-log.types'

// =============================================
// PROPS
// =============================================

interface AuditLogExportProps {
  filters: AuditLogFilters
  disabled?: boolean
  className?: string
}

// =============================================
// COMPONENT
// =============================================

export function AuditLogExport({ filters, disabled = false, className }: AuditLogExportProps) {
  const { t, i18n } = useTranslation('audit-logs')
  const isRTL = i18n.language === 'ar'

  const { exportLogs, isExporting, error } = useAuditLogExport()

  const handleExport = async (format: ExportFormat) => {
    await exportLogs({ format, filters })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className={cn('gap-2', className)}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? t('export.exporting') : t('export.button')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 me-2" />
          {t('export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} disabled={isExporting}>
          <FileJson className="h-4 w-4 me-2" />
          {t('export.json')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AuditLogExport
