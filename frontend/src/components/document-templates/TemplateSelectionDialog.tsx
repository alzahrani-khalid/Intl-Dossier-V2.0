/**
 * TemplateSelectionDialog Component
 * Dialog for selecting a document template to create a new document
 * Mobile-first responsive design with RTL support
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, FileText, AlertCircle, Filter } from 'lucide-react'
import { TemplateCard } from './TemplateCard'
import { DocumentWizard } from './DocumentWizard'
import { useDocumentTemplates, useTemplatesForEntity } from '@/hooks/useDocumentTemplates'
import type {
  DocumentTemplate,
  DocumentTemplateCategory,
  TemplatedDocument,
} from '@/types/document-template.types'
import { TEMPLATE_CATEGORIES } from '@/types/document-template.types'

interface TemplateSelectionDialogProps {
  open: boolean
  onClose: () => void
  entityType: string
  entityId: string
  onDocumentCreated?: (document: TemplatedDocument) => void
}

export function TemplateSelectionDialog({
  open,
  onClose,
  entityType,
  entityId,
  onDocumentCreated,
}: TemplateSelectionDialogProps) {
  const { t, i18n } = useTranslation('document-templates')
  const isRTL = i18n.language === 'ar'

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DocumentTemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  // Fetch templates for entity type
  const { data, isLoading, error } = useTemplatesForEntity(entityType)
  const templates = data?.templates || []

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name_en.toLowerCase().includes(query) ||
          t.name_ar.includes(query) ||
          t.description_en?.toLowerCase().includes(query) ||
          t.description_ar?.includes(query),
      )
    }

    return result
  }, [templates, selectedCategory, searchQuery])

  // Get unique categories from available templates
  const availableCategories = useMemo(() => {
    const categories = new Set(templates.map((t) => t.category))
    return TEMPLATE_CATEGORIES.filter((c) => categories.has(c.key))
  }, [templates])

  // Handle template selection
  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
  }

  // Handle starting wizard
  const handleStartWizard = () => {
    if (selectedTemplate) {
      setShowWizard(true)
    }
  }

  // Handle wizard completion
  const handleWizardComplete = (document: TemplatedDocument) => {
    setShowWizard(false)
    setSelectedTemplate(null)
    onDocumentCreated?.(document)
    onClose()
  }

  // Handle wizard close
  const handleWizardClose = () => {
    setShowWizard(false)
  }

  // If wizard is open, show it instead
  if (showWizard && selectedTemplate) {
    return (
      <DocumentWizard
        templateId={selectedTemplate.id}
        entityType={entityType}
        entityId={entityId}
        open={showWizard}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl">{t('templates.selectTitle')}</DialogTitle>
          <DialogDescription>{t('templates.selectDescription')}</DialogDescription>
        </DialogHeader>

        {/* Search and filter */}
        <div className="px-4 sm:px-6 py-3 border-b flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  isRTL ? 'end-3' : 'start-3',
                )}
              />
              <Input
                type="search"
                placeholder={t('templates.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('min-h-11', isRTL ? 'pe-10' : 'ps-10')}
              />
            </div>

            {/* Category filter - hidden on mobile, shown in tabs */}
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as DocumentTemplateCategory | 'all')
                }
                className="min-h-11 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">{t('categories.all')}</option>
                {availableCategories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {isRTL ? cat.label_ar : cat.label_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category tabs for mobile */}
          <div className="sm:hidden mt-3 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="whitespace-nowrap"
              >
                {t('categories.all')}
              </Button>
              {availableCategories.map((cat) => (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  className="whitespace-nowrap"
                >
                  {isRTL ? cat.label_ar : cat.label_en}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates grid */}
        <ScrollArea className="flex-1 px-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive">{t('errors.loadFailed')}</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? t('templates.noTemplates') : t('templates.noTemplates')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  isSelected={selectedTemplate?.id === template.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-4 sm:px-6 py-4 border-t flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="min-h-11">
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleStartWizard} disabled={!selectedTemplate} className="min-h-11">
              {selectedTemplate ? (
                <>
                  {t('actions.startWizard')}
                  <Badge variant="secondary" className="ms-2">
                    {isRTL ? selectedTemplate.name_ar : selectedTemplate.name_en}
                  </Badge>
                </>
              ) : (
                t('actions.selectTemplate')
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TemplateSelectionDialog
