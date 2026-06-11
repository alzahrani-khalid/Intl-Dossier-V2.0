/**
 * ExportDossierDialog - One-click export dialog for dossier briefing packs
 * Feature: dossier-export-pack
 *
 * Exports dossier information as a print-ready HTML briefing pack delivered in a
 * new browser tab (with a popup-blocked blob-download fallback). Supports a
 * single output language (EN or AR) and mobile-first responsive design.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import type {
  ExportDossierDialogProps,
  ExportLanguage,
  ExportSectionConfig,
} from '@/types/dossier-export.types'
import { DEFAULT_EXPORT_SECTIONS } from '@/types/dossier-export.types'
import { useDossierExport } from '@/hooks/useDossierExport'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

/**
 * Build a filesystem-safe slug from a dossier name for the fallback filename.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30)
}

/**
 * Today's date as YYYYMMDD for the fallback filename.
 */
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

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
  const { t, i18n } = useTranslation('dossier-export')
  const { isRTL } = useDirection()
  // Export configuration state
  const [language, setLanguage] = useState<ExportLanguage>(i18n.language === 'ar' ? 'ar' : 'en')
  const [sections, setSections] = useState<ExportSectionConfig[]>(DEFAULT_EXPORT_SECTIONS)
  const [includeCoverPage, setIncludeCoverPage] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  // Auto-close timer handle — cleared on close/unmount so reset() never fires
  // after unmount and a pending auto-close never outlives a user action.
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current !== null) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
  }, [])

  // Clear any pending auto-close timer on unmount.
  useEffect(() => {
    return () => clearAutoCloseTimer()
  }, [clearAutoCloseTimer])

  // Export hook
  const { exportDossier, progress, isExporting, error, failedSections, reset } = useDossierExport({
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

  // Map failed section keys to their localized names for the warning banner.
  const failedSectionNames = useCallback(
    (keys: string[]): string =>
      keys
        .map((key) => t(`sections.${key}`, { defaultValue: key }))
        .filter(Boolean)
        .join(', '),
    [t],
  )

  // Handle export — popup-blocker-safe new-tab delivery (D-07).
  const handleExport = async () => {
    clearAutoCloseTimer()
    setPopupBlocked(false)

    // MUST open the tab synchronously before any await (popup-blocker constraint).
    const newTab = window.open('', '_blank')

    // Write a quiet placeholder so the user never stares at a blank tab.
    if (newTab) {
      const dir = language === 'ar' ? 'rtl' : 'ltr'
      newTab.document.write(
        `<!doctype html><html dir="${dir}" lang="${language}"><head><meta charset="utf-8">` +
          `<title>${t('newTab.generating')}</title></head>` +
          `<body style="margin:0;display:flex;align-items:center;justify-content:center;` +
          `min-height:100vh;background:#f7f6f4;color:#6b6459;font-family:system-ui;font-size:14px;">` +
          `<p>${t('newTab.generating')}</p></body></html>`,
      )
    }

    try {
      const { html, failedSections: failed } = await exportDossier(dossierId, {
        language,
        sections,
        includeCoverPage,
        includeTableOfContents,
        includePageNumbers: true,
      })

      if (newTab) {
        newTab.document.open()
        newTab.document.write(html)
        newTab.document.close()
      } else {
        // Fallback: blob download when popups are blocked.
        const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `briefing-pack-${slugify(dossierName)}-${todayStamp()}.html`
        a.click()
        URL.revokeObjectURL(url)
        setPopupBlocked(true)
      }

      // Clean success auto-closes; warnings (failed sections or popup-blocked)
      // keep the dialog open so the user can read them.
      if (newTab && failed.length === 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          autoCloseTimerRef.current = null
          onClose()
          reset()
        }, 1500)
      }
    } catch (err) {
      // Never leave an orphaned placeholder tab behind.
      newTab?.close()
      console.error('Export failed:', err)
    }
  }

  // Reset and close
  const handleClose = () => {
    if (!isExporting) {
      clearAutoCloseTimer()
      reset()
      setPopupBlocked(false)
      onClose()
    }
  }

  const isReady = progress?.status === 'ready'

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
        {isReady && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[var(--ok-soft)] p-4"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--ok)]" />
            <span className="text-sm text-[var(--ok)]">
              {popupBlocked
                ? t('popupBlocked', {
                    defaultValue:
                      'Pop-ups are blocked. The briefing pack was downloaded as an HTML file instead.',
                  })
                : t('success', {
                    defaultValue: 'Export complete. The briefing pack opened in a new tab.',
                  })}
            </span>
          </div>
        )}

        {/* Failed-sections warning (D-08) — below the success banner */}
        {isReady && failedSections.length > 0 && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--warn)] bg-[var(--warn-soft)] p-4"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--warn)]" />
            <span className="text-sm text-[var(--ink)] text-start">
              {t('warning.failedSections', {
                defaultValue: 'Some sections could not be generated: {{sections}}',
                sections: failedSectionNames(failedSections),
              })}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger-soft)] p-4"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--danger)]" />
            <span className="text-sm text-[var(--danger)]">
              {t('error', { defaultValue: 'Export failed. Please try again.' })}
            </span>
          </div>
        )}

        {/* Configuration - Hidden during export and after completion */}
        {!isExporting && !isReady && (
          <div className="space-y-6 py-2">
            {/* Format info line (D-03) — replaces the PDF/Word picker */}
            <div className="flex items-start gap-2 text-start">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--ink-mute)]" />
              <p className="text-sm text-[var(--ink-mute)]">
                {t('format.html_info', {
                  defaultValue:
                    "Exports as a print-ready HTML briefing pack. To save as PDF, use your browser's print dialog.",
                })}
              </p>
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
                {(['en', 'ar'] as ExportLanguage[]).map((lang) => (
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
                      {lang === 'en' ? t('language.en') : t('language.ar')}
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
            {t('cancel', { defaultValue: 'Close' })}
          </Button>
          <Button onClick={handleExport} disabled={isExporting || isReady} className="gap-2">
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
