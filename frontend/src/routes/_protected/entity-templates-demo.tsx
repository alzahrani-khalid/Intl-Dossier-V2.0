/**
 * Entity Templates Demo Page
 * Feature: Entity Creation Templates
 *
 * Demo page to showcase template selection and quick entry functionality.
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { TemplateSelector, QuickEntryDialog } from '@/components/entity-templates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Command, FileText, CheckCircle, ClipboardList, FolderOpen } from 'lucide-react'
import type { EntityTemplate, TemplateEntityType } from '@/types/entity-template.types'

export const Route = createFileRoute('/_protected/entity-templates-demo')({
  component: EntityTemplatesDemoPage,
})

function EntityTemplatesDemoPage() {
  const { t, i18n } = useTranslation('entity-templates')
  const isRTL = i18n.language === 'ar'

  // State
  const [selectedEntityType, setSelectedEntityType] = useState<TemplateEntityType>('task')
  const [selectedTemplate, setSelectedTemplate] = useState<EntityTemplate | null>(null)
  const [appliedValues, setAppliedValues] = useState<Record<string, unknown>>({})
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)

  // Handle template selection
  const handleTemplateSelect = (template: EntityTemplate, values: Record<string, unknown>) => {
    setSelectedTemplate(template)
    setAppliedValues(values)
  }

  // Handle quick entry selection
  const handleQuickEntrySelect = (
    template: EntityTemplate,
    values: Record<string, unknown>,
    entityType: TemplateEntityType,
  ) => {
    setSelectedEntityType(entityType)
    setSelectedTemplate(template)
    setAppliedValues(values)
  }

  // Handle skip
  const handleSkip = () => {
    setSelectedTemplate(null)
    setAppliedValues({})
  }

  // Entity type options
  const entityTypes: { type: TemplateEntityType; icon: React.ReactNode; label: string }[] = [
    { type: 'task', icon: <ClipboardList className="h-4 w-4" />, label: t('entityType.task') },
    {
      type: 'commitment',
      icon: <CheckCircle className="h-4 w-4" />,
      label: t('entityType.commitment'),
    },
    {
      type: 'engagement',
      icon: <FileText className="h-4 w-4" />,
      label: t('entityType.engagement'),
    },
    { type: 'dossier', icon: <FolderOpen className="h-4 w-4" />, label: t('entityType.dossier') },
  ]

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Entity Templates Demo</h1>
          <p className="mt-1 text-muted-foreground">
            Pre-fill entity creation forms with templates
          </p>
        </div>

        <Button
          onClick={() => setIsQuickEntryOpen(true)}
          className="gap-2"
          data-testid="quick-entry-button"
        >
          <Command className="h-4 w-4" />
          Quick Entry (Alt+T)
        </Button>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Selector */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('title.selectTemplate')}</CardTitle>
              <CardDescription>{t('subtitle.selectTemplate')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Entity Type Tabs */}
              <Tabs
                value={selectedEntityType}
                onValueChange={(v) => setSelectedEntityType(v as TemplateEntityType)}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  {entityTypes.map(({ type, icon, label }) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="gap-2"
                      data-testid={`tab-${type}`}
                    >
                      {icon}
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {entityTypes.map(({ type }) => (
                  <TabsContent key={type} value={type} className="mt-4">
                    <TemplateSelector
                      entityType={type}
                      onSelect={handleTemplateSelect}
                      onSkip={handleSkip}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Selected Template Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Selected Template</CardTitle>
              <CardDescription>Preview of applied template values</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* Template info */}
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                      {selectedTemplate.scope}
                    </Badge>
                    <span className="font-medium" data-testid="selected-template-name">
                      {isRTL ? selectedTemplate.name_ar : selectedTemplate.name_en}
                    </span>
                  </div>

                  {/* Description */}
                  {(selectedTemplate.description_en || selectedTemplate.description_ar) && (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? selectedTemplate.description_ar : selectedTemplate.description_en}
                    </p>
                  )}

                  {/* Keyboard shortcut */}
                  {selectedTemplate.keyboard_shortcut && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Shortcut:</span>
                      <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        {selectedTemplate.keyboard_shortcut}
                      </kbd>
                    </div>
                  )}

                  {/* Applied values */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Applied Values:</h4>
                    <pre
                      className="overflow-auto rounded-lg bg-muted p-3 text-xs"
                      data-testid="applied-values"
                    >
                      {JSON.stringify(appliedValues, null, 2)}
                    </pre>
                  </div>

                  {/* Tags */}
                  {selectedTemplate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Select a template to see preview
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Help */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Command className="h-4 w-4" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open Quick Entry</span>
                  <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Alt+T</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Navigate</span>
                  <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">↑ ↓</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Select</span>
                  <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search</span>
                  <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">/</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Entry Dialog */}
      <QuickEntryDialog
        open={isQuickEntryOpen}
        onOpenChange={setIsQuickEntryOpen}
        onSelect={handleQuickEntrySelect}
      />
    </div>
  )
}

export default EntityTemplatesDemoPage
