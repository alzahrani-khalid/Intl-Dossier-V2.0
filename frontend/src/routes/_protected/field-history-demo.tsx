/**
 * Field History Demo Page
 *
 * Demo page for testing field-level history tracking feature.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, ArrowLeftRight, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldHistoryTimeline } from '@/components/field-history/FieldHistoryTimeline'
import type { TrackableEntityType } from '@/types/field-history.types'
import { ENTITY_TYPE_DISPLAY } from '@/types/field-history.types'

export const Route = createFileRoute('/_protected/field-history-demo')({
  component: FieldHistoryDemoPage,
})

function FieldHistoryDemoPage() {
  const { t, i18n } = useTranslation('field-history')
  const isRTL = i18n.language === 'ar'

  // Demo state
  const [entityType, setEntityType] = useState<TrackableEntityType>('person')
  const [entityId, setEntityId] = useState<string>('')
  const [showTimeline, setShowTimeline] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (entityType && entityId) {
      setShowTimeline(true)
    }
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <History className="h-7 w-7" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
      </div>

      {/* Entity Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Entity
          </CardTitle>
          <CardDescription>
            Choose an entity type and enter its ID to view field history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type</Label>
                <Select
                  value={entityType}
                  onValueChange={(v) => {
                    setEntityType(v as TrackableEntityType)
                    setShowTimeline(false)
                  }}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_DISPLAY).map(([key, display]) => (
                      <SelectItem key={key} value={key}>
                        {isRTL ? display.ar : display.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityId">Entity ID (UUID)</Label>
                <Input
                  id="entityId"
                  placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                  value={entityId}
                  onChange={(e) => {
                    setEntityId(e.target.value)
                    setShowTimeline(false)
                  }}
                />
              </div>
            </div>

            <Button type="submit" disabled={!entityType || !entityId} className="w-full sm:w-auto">
              <ArrowLeftRight className="h-4 w-4 me-2" />
              View Field History
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Field History Timeline */}
      {showTimeline && entityType && entityId && (
        <FieldHistoryTimeline
          entityType={entityType}
          entityId={entityId}
          showFilters={true}
          showGroupedView={true}
          onRollback={(entry) => {
            console.log('Rolled back:', entry)
          }}
        />
      )}

      {/* Demo Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Information</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            This feature tracks changes to individual fields within entities, showing who changed
            what and when. Key capabilities include:
          </p>
          <ul>
            <li>
              <strong>Timeline View:</strong> See all field changes in chronological order with
              before/after comparisons
            </li>
            <li>
              <strong>Grouped View:</strong> View changes organized by field name with change
              statistics
            </li>
            <li>
              <strong>Selective Rollback:</strong> Roll back specific field changes without
              reverting entire entity versions
            </li>
            <li>
              <strong>Category Filtering:</strong> Filter by field category (Core, Extended,
              Metadata, Relationships)
            </li>
            <li>
              <strong>Full Audit Trail:</strong> Track who made changes, when, and preserve rollback
              history
            </li>
          </ul>
          <p className="text-muted-foreground">
            <strong>Note:</strong> Field history is automatically recorded for persons, engagements,
            commitments, organizations, countries, forums, MOUs, positions, dossiers, and intake
            tickets.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
