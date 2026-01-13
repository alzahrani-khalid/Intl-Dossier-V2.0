/**
 * GraphExportDialog Component
 * Feature: knowledge-graph-export
 *
 * Modal dialog for exporting relationship graphs in standard formats.
 * Supports RDF (Turtle, N-Triples, RDF/XML), GraphML, and JSON-LD.
 * Mobile-first with RTL support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Share2,
  FileCode,
  FileJson,
  Network,
  Loader2,
  Settings2,
  Globe,
  Clock,
  Tag,
} from 'lucide-react'
import { useGraphExport } from '@/hooks/useGraphExport'
import type {
  GraphExportFormat,
  RDFSerializationFormat,
  GraphExportScope,
  GraphExportRequest,
} from '@/types/graph-export.types'
import type { DossierRelationshipType, DossierType } from '@/types/relationship.types'
import { RELATIONSHIP_TYPES, DOSSIER_TYPE_LABELS } from '@/types/relationship.types'

interface GraphExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Starting dossier ID for subgraph export */
  startDossierId?: string
  /** Name of starting dossier for display */
  startDossierName?: string
  /** Callback when export completes */
  onExportComplete?: () => void
}

export function GraphExportDialog({
  open,
  onOpenChange,
  startDossierId,
  startDossierName,
  onExportComplete,
}: GraphExportDialogProps) {
  const { t, i18n } = useTranslation('graph-export')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [format, setFormat] = useState<GraphExportFormat>('json-ld')
  const [rdfFormat, setRdfFormat] = useState<RDFSerializationFormat>('turtle')
  const [scope, setScope] = useState<GraphExportScope>(startDossierId ? 'subgraph' : 'full')
  const [maxDepth, setMaxDepth] = useState<number>(3)
  const [language, setLanguage] = useState<'en' | 'ar' | 'both'>('both')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeTemporalInfo, setIncludeTemporalInfo] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<
    DossierRelationshipType[]
  >([])
  const [selectedDossierTypes, setSelectedDossierTypes] = useState<DossierType[]>([])

  const { exportGraph, progress, isExporting, reset } = useGraphExport({
    onSuccess: () => {
      onExportComplete?.()
      setTimeout(() => {
        reset()
        onOpenChange(false)
      }, 2000)
    },
  })

  const handleExport = useCallback(async () => {
    const request: GraphExportRequest = {
      format,
      scope,
      startDossierId: scope === 'subgraph' ? startDossierId : undefined,
      maxDepth: scope === 'subgraph' ? maxDepth : undefined,
      rdfFormat: format === 'rdf' ? rdfFormat : undefined,
      includeMetadata,
      includeTemporalInfo,
      includeInactive,
      language,
      relationshipTypes:
        selectedRelationshipTypes.length > 0 ? selectedRelationshipTypes : undefined,
      dossierTypes: selectedDossierTypes.length > 0 ? selectedDossierTypes : undefined,
    }

    await exportGraph(request)
  }, [
    format,
    scope,
    startDossierId,
    maxDepth,
    rdfFormat,
    includeMetadata,
    includeTemporalInfo,
    includeInactive,
    language,
    selectedRelationshipTypes,
    selectedDossierTypes,
    exportGraph,
  ])

  const handleClose = useCallback(() => {
    if (!isExporting) {
      reset()
      onOpenChange(false)
    }
  }, [isExporting, reset, onOpenChange])

  const toggleRelationshipType = useCallback((type: DossierRelationshipType) => {
    setSelectedRelationshipTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const toggleDossierType = useCallback((type: DossierType) => {
    setSelectedDossierTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const formatIcons: Record<GraphExportFormat, React.ReactNode> = {
    rdf: <FileCode className="h-4 w-4" />,
    graphml: <Network className="h-4 w-4" />,
    'json-ld': <FileJson className="h-4 w-4" />,
  }

  const formatDescriptions: Record<GraphExportFormat, { en: string; ar: string }> = {
    rdf: {
      en: 'Semantic Web standard (Turtle, N-Triples, RDF/XML)',
      ar: 'معيار الويب الدلالي (Turtle، N-Triples، RDF/XML)',
    },
    graphml: {
      en: 'Graph analysis tools (Gephi, Neo4j, yEd)',
      ar: 'أدوات تحليل الرسم البياني (Gephi، Neo4j، yEd)',
    },
    'json-ld': {
      en: 'Linked Data JSON format',
      ar: 'تنسيق JSON للبيانات المترابطة',
    },
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('format.label')}</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as GraphExportFormat)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {(['json-ld', 'rdf', 'graphml'] as GraphExportFormat[]).map((fmt) => (
                <div key={fmt}>
                  <RadioGroupItem value={fmt} id={`format-${fmt}`} className="peer sr-only" />
                  <Label
                    htmlFor={`format-${fmt}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer min-h-[80px]"
                  >
                    {formatIcons[fmt]}
                    <span className="text-xs font-medium mt-1">{t(`format.${fmt}`)}</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-1">
                      {isRTL ? formatDescriptions[fmt].ar : formatDescriptions[fmt].en}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* RDF Format Selection (only when RDF is selected) */}
          {format === 'rdf' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('rdfFormat.label')}</Label>
              <Select
                value={rdfFormat}
                onValueChange={(value) => setRdfFormat(value as RDFSerializationFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turtle">{t('rdfFormat.turtle')}</SelectItem>
                  <SelectItem value="n-triples">{t('rdfFormat.ntriples')}</SelectItem>
                  <SelectItem value="rdf-xml">{t('rdfFormat.rdfxml')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('scope.label')}</Label>
            <RadioGroup
              value={scope}
              onValueChange={(value) => setScope(value as GraphExportScope)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="full" id="scope-full" />
                <Label htmlFor="scope-full" className="text-sm font-normal cursor-pointer">
                  {t('scope.full')}
                </Label>
              </div>
              {startDossierId && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="subgraph" id="scope-subgraph" />
                  <Label htmlFor="scope-subgraph" className="text-sm font-normal cursor-pointer">
                    {t('scope.subgraph', { name: startDossierName || startDossierId })}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Max Depth (only for subgraph) */}
          {scope === 'subgraph' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('maxDepth.label')}</Label>
              <Select
                value={String(maxDepth)}
                onValueChange={(value) => setMaxDepth(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((depth) => (
                    <SelectItem key={depth} value={String(depth)}>
                      {t('maxDepth.value', { depth })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language.label')}
            </Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as 'en' | 'ar' | 'both')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('language.en')}</SelectItem>
                <SelectItem value="ar">{t('language.ar')}</SelectItem>
                <SelectItem value="both">{t('language.both')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t('options.label')}
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                />
                <Label
                  htmlFor="include-metadata"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Tag className="h-3 w-3" />
                  {t('options.includeMetadata')}
                </Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="include-temporal"
                  checked={includeTemporalInfo}
                  onCheckedChange={(checked) => setIncludeTemporalInfo(!!checked)}
                />
                <Label
                  htmlFor="include-temporal"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  {t('options.includeTemporalInfo')}
                </Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={(checked) => setIncludeInactive(!!checked)}
                />
                <Label htmlFor="include-inactive" className="text-sm font-normal cursor-pointer">
                  {t('options.includeInactive')}
                </Label>
              </div>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters">
              <AccordionTrigger className="text-sm font-medium">
                {t('filters.label')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Relationship Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t('filters.relationshipTypes')}
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {RELATIONSHIP_TYPES.slice(0, 10).map((type) => (
                        <Badge
                          key={type}
                          variant={selectedRelationshipTypes.includes(type) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleRelationshipType(type)}
                        >
                          {type.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {selectedRelationshipTypes.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedRelationshipTypes([])}
                        >
                          {t('filters.clearAll')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Dossier Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t('filters.dossierTypes')}
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(DOSSIER_TYPE_LABELS) as DossierType[]).map((type) => (
                        <Badge
                          key={type}
                          variant={selectedDossierTypes.includes(type) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleDossierType(type)}
                        >
                          {isRTL ? DOSSIER_TYPE_LABELS[type].ar : DOSSIER_TYPE_LABELS[type].en}
                        </Badge>
                      ))}
                      {selectedDossierTypes.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedDossierTypes([])}
                        >
                          {t('filters.clearAll')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{isRTL ? progress.message_ar : progress.message_en}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('actions.exporting')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 me-2" />
                {t('actions.export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GraphExportDialog
