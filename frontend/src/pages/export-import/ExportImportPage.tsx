/**
 * Export/Import Demo Page
 * Feature: export-import-templates
 *
 * Demonstration page for the export/import functionality.
 * Shows how to integrate export and import dialogs with entity management.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Building2,
  Calendar,
  Briefcase,
  Target,
  ClipboardList,
} from 'lucide-react'
import { ExportDialog, ImportDialog } from '@/components/export-import'
import type { ExportableEntityType } from '@/types/export-import.types'

const ENTITY_OPTIONS: Array<{
  value: ExportableEntityType
  label: string
  labelAr: string
  icon: React.ReactNode
}> = [
  {
    value: 'dossier',
    label: 'Dossiers',
    labelAr: 'الملفات',
    icon: <Building2 className="size-4" />,
  },
  { value: 'person', label: 'Persons', labelAr: 'الأشخاص', icon: <Users className="size-4" /> },
  {
    value: 'engagement',
    label: 'Engagements',
    labelAr: 'الارتباطات',
    icon: <Calendar className="size-4" />,
  },
  {
    value: 'working-group',
    label: 'Working Groups',
    labelAr: 'مجموعات العمل',
    icon: <Briefcase className="size-4" />,
  },
  {
    value: 'commitment',
    label: 'Commitments',
    labelAr: 'الالتزامات',
    icon: <Target className="size-4" />,
  },
  {
    value: 'deliverable',
    label: 'Deliverables',
    labelAr: 'المخرجات',
    icon: <ClipboardList className="size-4" />,
  },
]

export function ExportImportPage() {
  const { t, i18n } = useTranslation('export-import')
  const isRTL = i18n.language === 'ar'

  const [entityType, setEntityType] = useState<ExportableEntityType>('dossier')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const selectedEntity = ENTITY_OPTIONS.find((e) => e.value === entityType)

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('export.description')} / {t('import.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              {t('export.title')}
            </CardTitle>
            <CardDescription>{t('export.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('entities.dossier').split(' ')[0]} Type</Label>
              <Select
                value={entityType}
                onValueChange={(value) => setEntityType(value as ExportableEntityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {isRTL ? option.labelAr : option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                {selectedEntity?.icon}
                <div>
                  <p className="font-medium">
                    {isRTL ? selectedEntity?.labelAr : selectedEntity?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">Export to Excel, CSV, or JSON</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <FileSpreadsheet className="me-1 size-3" />
                  XLSX
                </Badge>
                <Badge variant="outline">CSV</Badge>
                <Badge variant="outline">JSON</Badge>
              </div>
            </div>

            <Button onClick={() => setExportDialogOpen(true)} className="w-full">
              <Download className="me-2 size-4" />
              {t('export.button')}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              {t('import.title')}
            </CardTitle>
            <CardDescription>{t('import.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('entities.dossier').split(' ')[0]} Type</Label>
              <Select
                value={entityType}
                onValueChange={(value) => setEntityType(value as ExportableEntityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {isRTL ? option.labelAr : option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                {selectedEntity?.icon}
                <div>
                  <p className="font-medium">
                    {isRTL ? selectedEntity?.labelAr : selectedEntity?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">Import from Excel or CSV files</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{t('template.instructions.requiredFields')}</p>
                <p>{t('template.instructions.dateFormat')}</p>
              </div>
            </div>

            <Button onClick={() => setImportDialogOpen(true)} className="w-full">
              <Upload className="me-2 size-4" />
              {t('import.button')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Features Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('import.validation.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Row-by-row validation with detailed error messages and suggestions for fixing issues.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('import.conflictResolution.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detect and resolve conflicts with existing records. Choose to skip, overwrite, or
              merge changes.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('export.language.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Export with English, Arabic, or bilingual column headers for maximum compatibility.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        entityType={entityType}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType={entityType}
      />
    </div>
  )
}

export default ExportImportPage
