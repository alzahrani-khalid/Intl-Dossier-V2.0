/**
 * Export/Import Route
 * Feature: export-import-templates
 *
 * Route for the export/import demo page.
 */

import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import ExportImportPage from '@/pages/export-import/ExportImportPage'

export const Route = createFileRoute('/_protected/export-import')({
  beforeLoad: devModeGuard,
  component: ExportImportPage,
})
