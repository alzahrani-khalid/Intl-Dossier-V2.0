/**
 * ExportDossierDialog - One-click export dialog for dossier briefing packs
 * Feature: dossier-export-pack
 *
 * Allows users to export dossier information as PDF/DOCX with configurable sections.
 * Supports bilingual output (EN/AR) and mobile-first responsive design.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type {
  ExportDossierDialogProps,
  DossierExportFormat,
  ExportLanguage,
  ExportSectionConfig,
} from '@/types/dossier-export.types'
import { DEFAULT_EXPORT_SECTIONS } from '@/types/dossier-export.types'
import { useDossierExport } from '@/hooks/useDossierExport'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

/**
 * Export dialog for dossier briefing packs
 */
export function ExportDossierDialog({
  dossierId,
  dossierName,
  dossierType,
  open,
  onClose,
  onSuccess,
}: ExportDossierDialogProps) {
  const { t } = useTranslation('dossier-export')
  const { isRTL } = useDirection()
  // Export configuration state
  const [format, setFormat] = useState<DossierExportFormat>('pdf')
  const [language, setLanguage] = useState<ExportLanguage>('both')
  const [sections, setSections] = useState<ExportSectionConfig[]>(DEFAULT_EXPORT_SECTIONS)
  const [includeCoverPage, setIncludeCoverPage] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Export hook
  const { exportDossier, progress, isExporting, error, reset } = useDossierExport({
    onSuccess: (response) => {
      onSuccess?.(response)
    },
  })

  // Handle section toggle
  const toggleSection = useCallback((sectionType: string) => {
    setSections((prev) =>
      prev.map((s) => (s.type === sectionType ? { ...s, enabled: !s.enabled } : s)),
    )
  }, [])

  // Handle export
  const handleExport = async () => {
    try {
      const response = await exportDossier(dossierId, {
        format,
        language,
        sections,
        includeCoverPage,
        includeTableOfContents,
        includePageNumbers: true,
      })

      // If successful, the download will be triggered by the hook
      if (response.success && response.download_url) {
        // Auto-close after success (with small delay to show success state)
        setTimeout(() => {
          onClose()
          reset()
        }, 1500)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Reset and close
  const handleClose = () => {
    if (!isExporting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            {t('title', { defaultValue: 'Export Briefing Pack' })}
          </DialogTitle>
          <DialogDescription>
            {t('description', {
              defaultValue: 'Export all dossier information as a formatted briefing packet.',
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Dossier Info */}
        <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--line-soft)] p-3 sm:p-4">
          <p className="font-medium text-sm sm:text-base line-clamp-1">{dossierName}</p>
          <p className="text-xs capitalize text-[var(--ink-mute)] sm:text-sm">
            {t(`type.${dossierType}`, { defaultValue: dossierType })}
          </p>
        </div>

        {/* Progress State */}
        {isExporting && progress && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
              <span className="text-sm">{isRTL ? progress.message_ar : progress.message_en}</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <p className="text-center text-xs text-[var(--ink-mute)]">{progress.progress}%</p>
          </div>
        )}

        {/* Success State */}
        {progress?.status === 'ready' && (
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[var(--ok-soft)] p-4">
            <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" />
            <span className="text-sm text-[var(--ok)]">
              {t('success', { defaultValue: 'Export complete! Download starting...' })}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger-soft)] p-4">
            <AlertCircle className="h-5 w-5 text-[var(--danger)]" />
            <span className="text-sm text-[var(--danger)]">{error.message}</span>
          </div>
        )}

        {/* Configuration - Hidden during export */}
        {!isExporting && progress?.status !== 'ready' && (
          <div className="space-y-6 py-2">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('format.label', { defaultValue: 'Export Format' })}
              </Label>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as DossierExportFormat)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="pdf"
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border p-3 transition-colors sm:p-4',
                    format === 'pdf'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                      : 'border-[var(--line)] hover:border-[var(--ink-faint)]',
                  )}
                >
                  <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">PDF</span>
                </Label>
                <Label
                  htmlFor="docx"
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border p-3 transition-colors sm:p-4',
                    format === 'docx'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                      : 'border-[var(--line)] hover:border-[var(--ink-faint)]',
                  )}
                >
                  <RadioGroupItem value="docx" id="docx" className="sr-only" />
                  <FileDown className="h-5 w-5" />
                  <span className="font-medium">Word</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('language.label', { defaultValue: 'Language' })}
              </Label>
              <RadioGroup
                value={language}
                onValueChange={(v) => setLanguage(v as ExportLanguage)}
                className="flex flex-wrap gap-3"
              >
                {(['en', 'ar', 'both'] as ExportLanguage[]).map((lang) => (
                  <Label
                    key={lang}
                    htmlFor={`lang-${lang}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 transition-colors',
                      language === lang
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                        : 'border-[var(--line)] hover:border-[var(--ink-faint)]',
                    )}
                  >
                    <RadioGroupItem value={lang} id={`lang-${lang}`} className="sr-only" />
                    <span className="text-sm">
                      {lang === 'en'
                        ? 'English'
                        : lang === 'ar'
                          ? 'العربية'
                          : t('language.both', { defaultValue: 'Bilingual' })}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Advanced Options Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>{t('advanced.label', { defaultValue: 'Advanced Options' })}</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--line-soft)] p-4">
                {/* Document Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="coverPage"
                      checked={includeCoverPage}
                      onCheckedChange={(c) => setIncludeCoverPage(c === true)}
                    />
                    <Label htmlFor="coverPage" className="text-sm cursor-pointer">
                      {t('options.coverPage', { defaultValue: 'Include cover page' })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="toc"
                      checked={includeTableOfContents}
                      onCheckedChange={(c) => setIncludeTableOfContents(c === true)}
                    />
                    <Label htmlFor="toc" className="text-sm cursor-pointer">
                      {t('options.tableOfContents', {
                        defaultValue: 'Include table of contents',
                      })}
                    </Label>
                  </div>
                </div>

                {/* Section Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {t('sections.label', { defaultValue: 'Include Sections' })}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sections.map((section) => (
                      <div key={section.type} className="flex items-center gap-2">
                        <Checkbox
                          id={`section-${section.type}`}
                          checked={section.enabled}
                          onCheckedChange={() => toggleSection(section.type)}
                        />
                        <Label
                          htmlFor={`section-${section.type}`}
                          className="text-sm cursor-pointer"
                        >
                          {isRTL ? section.title_ar : section.title_en}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter thumbZone>
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            {t('cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || progress?.status === 'ready'}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('exporting', { defaultValue: 'Exporting...' })}
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                {t('export', { defaultValue: 'Export' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
