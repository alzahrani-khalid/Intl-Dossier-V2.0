/**
 * Merge Dialog Component
 * Feature: entity-duplicate-detection
 *
 * Dialog for merging duplicate entities with field resolution options
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Merge,
  User,
  Building2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { useMergeDuplicates } from '@/hooks/useDuplicateDetection'
import type {
  DuplicateCandidateListItem,
  FieldResolution,
  DuplicateEntityType,
} from '@/types/duplicate-detection.types'

interface MergeDialogProps {
  isOpen: boolean
  onClose: () => void
  candidate: DuplicateCandidateListItem | null
  sourceEntity?: {
    id: string
    name_en: string
    name_ar: string
    email?: string
    phone?: string
    [key: string]: unknown
  }
  targetEntity?: {
    id: string
    name_en: string
    name_ar: string
    email?: string
    phone?: string
    [key: string]: unknown
  }
}

interface FieldComparisonRow {
  field: string
  label_en: string
  label_ar: string
  source_value: unknown
  target_value: unknown
  is_different: boolean
}

export function MergeDialog({
  isOpen,
  onClose,
  candidate,
  sourceEntity,
  targetEntity,
}: MergeDialogProps) {
  const { t, i18n } = useTranslation('duplicate-detection')
  const isRTL = i18n.language === 'ar'

  // State for which entity is primary
  const [primaryEntityId, setPrimaryEntityId] = useState<string>('')
  const [fieldResolutions, setFieldResolutions] = useState<Record<string, 'primary' | 'duplicate'>>(
    {},
  )

  const mergeMutation = useMergeDuplicates()

  // Reset state when dialog opens
  useMemo(() => {
    if (isOpen && candidate) {
      setPrimaryEntityId(candidate.source_entity_id)
      setFieldResolutions({})
    }
  }, [isOpen, candidate])

  if (!candidate) return null

  const entityType = candidate.entity_type as DuplicateEntityType

  // Get display values
  const source = {
    id: candidate.source_entity_id,
    name_en: candidate.source_name_en,
    name_ar: candidate.source_name_ar,
    ...sourceEntity,
  }

  const target = {
    id: candidate.target_entity_id,
    name_en: candidate.target_name_en,
    name_ar: candidate.target_name_ar,
    ...targetEntity,
  }

  const primary = primaryEntityId === source.id ? source : target
  const duplicate = primaryEntityId === source.id ? target : source

  // Build field comparisons from match details
  const fieldComparisons: FieldComparisonRow[] = useMemo(() => {
    const details = candidate.match_details || {}
    const fields: FieldComparisonRow[] = []

    // Name comparison
    fields.push({
      field: 'name_en',
      label_en: 'Name (English)',
      label_ar: 'الاسم (الإنجليزية)',
      source_value: source.name_en,
      target_value: target.name_en,
      is_different: source.name_en !== target.name_en,
    })

    fields.push({
      field: 'name_ar',
      label_en: 'Name (Arabic)',
      label_ar: 'الاسم (العربية)',
      source_value: source.name_ar,
      target_value: target.name_ar,
      is_different: source.name_ar !== target.name_ar,
    })

    // Additional fields from match details
    if (details.person1 && details.person2) {
      const p1 = details.person1 as Record<string, unknown>
      const p2 = details.person2 as Record<string, unknown>

      if (p1.email || p2.email) {
        fields.push({
          field: 'email',
          label_en: 'Email',
          label_ar: 'البريد الإلكتروني',
          source_value: p1.email,
          target_value: p2.email,
          is_different: p1.email !== p2.email,
        })
      }

      if (p1.phone || p2.phone) {
        fields.push({
          field: 'phone',
          label_en: 'Phone',
          label_ar: 'الهاتف',
          source_value: p1.phone,
          target_value: p2.phone,
          is_different: p1.phone !== p2.phone,
        })
      }
    }

    if (details.org1 && details.org2) {
      const o1 = details.org1 as Record<string, unknown>
      const o2 = details.org2 as Record<string, unknown>

      if (o1.org_code || o2.org_code) {
        fields.push({
          field: 'org_code',
          label_en: 'Organization Code',
          label_ar: 'رمز المنظمة',
          source_value: o1.org_code,
          target_value: o2.org_code,
          is_different: o1.org_code !== o2.org_code,
        })
      }

      if (o1.email || o2.email) {
        fields.push({
          field: 'email',
          label_en: 'Email',
          label_ar: 'البريد الإلكتروني',
          source_value: o1.email,
          target_value: o2.email,
          is_different: o1.email !== o2.email,
        })
      }
    }

    return fields
  }, [candidate, source, target])

  const handleFieldResolution = (field: string, value: 'primary' | 'duplicate') => {
    setFieldResolutions((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleMerge = async () => {
    if (!primaryEntityId) return

    const resolutions: Record<string, FieldResolution> = {}
    Object.entries(fieldResolutions).forEach(([field, choice]) => {
      const fieldData = fieldComparisons.find((f) => f.field === field)
      if (fieldData) {
        resolutions[field] = {
          field,
          source: choice,
          primary_value: choice === 'primary' ? fieldData.source_value : fieldData.target_value,
          duplicate_value: choice === 'primary' ? fieldData.target_value : fieldData.source_value,
        }
      }
    })

    await mergeMutation.mutateAsync({
      primaryId: primary.id,
      duplicateId: duplicate.id,
      entityType,
      fieldResolutions: resolutions,
      candidateId: candidate.id,
    })

    onClose()
  }

  const getEntityIcon = () => {
    return entityType === 'person' ? (
      <User className="h-5 w-5" />
    ) : (
      <Building2 className="h-5 w-5" />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            {t('merge_entities', 'Merge Entities')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'merge_description',
              'Choose which entity to keep as the primary record. All relationships, documents, and history from the duplicate will be transferred.',
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pe-4">
          <div className="space-y-6 py-4">
            {/* Warning Alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('warning', 'Warning')}</AlertTitle>
              <AlertDescription>
                {t(
                  'merge_warning',
                  'This action cannot be easily undone. The duplicate entity will be archived and all its references will be redirected to the primary entity.',
                )}
              </AlertDescription>
            </Alert>

            {/* Primary Entity Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t('select_primary', 'Select Primary Entity')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t(
                  'primary_description',
                  'The primary entity will be kept. All data from the duplicate will be merged into it.',
                )}
              </p>

              <RadioGroup
                value={primaryEntityId}
                onValueChange={setPrimaryEntityId}
                className="grid gap-3 sm:grid-cols-2"
              >
                {/* Source Entity */}
                <div>
                  <RadioGroupItem value={source.id} id="source" className="peer sr-only" />
                  <Label
                    htmlFor="source"
                    className={cn(
                      'flex flex-col cursor-pointer rounded-lg border-2 p-4 transition-colors',
                      'hover:bg-muted/50',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getEntityIcon()}
                      <span className="font-medium">{t('entity_1', 'Entity 1')}</span>
                      {primaryEntityId === source.id && (
                        <Badge variant="default" className="ms-auto">
                          {t('primary', 'Primary')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {isRTL ? source.name_ar : source.name_en}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isRTL ? source.name_en : source.name_ar}
                    </div>
                  </Label>
                </div>

                {/* Target Entity */}
                <div>
                  <RadioGroupItem value={target.id} id="target" className="peer sr-only" />
                  <Label
                    htmlFor="target"
                    className={cn(
                      'flex flex-col cursor-pointer rounded-lg border-2 p-4 transition-colors',
                      'hover:bg-muted/50',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getEntityIcon()}
                      <span className="font-medium">{t('entity_2', 'Entity 2')}</span>
                      {primaryEntityId === target.id && (
                        <Badge variant="default" className="ms-auto">
                          {t('primary', 'Primary')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {isRTL ? target.name_ar : target.name_en}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isRTL ? target.name_en : target.name_ar}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Field Resolution */}
            <Accordion type="single" collapsible defaultValue="fields">
              <AccordionItem value="fields">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    {t('resolve_conflicts', 'Resolve Field Conflicts')}
                    <Badge variant="outline" className="ms-2">
                      {fieldComparisons.filter((f) => f.is_different).length}{' '}
                      {t('differences', 'differences')}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {fieldComparisons
                      .filter((f) => f.is_different)
                      .map((field) => (
                        <div key={field.field} className="rounded-lg border p-3 space-y-2">
                          <Label className="text-sm font-medium">
                            {isRTL ? field.label_ar : field.label_en}
                          </Label>
                          <RadioGroup
                            value={fieldResolutions[field.field] || 'primary'}
                            onValueChange={(v) =>
                              handleFieldResolution(field.field, v as 'primary' | 'duplicate')
                            }
                            className="grid gap-2 sm:grid-cols-2"
                          >
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="primary" id={`${field.field}-primary`} />
                              <Label
                                htmlFor={`${field.field}-primary`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="text-xs text-muted-foreground">
                                  {t('from_primary', 'From Primary')}
                                </div>
                                <div className="text-sm truncate">
                                  {String(
                                    primaryEntityId === source.id
                                      ? field.source_value
                                      : field.target_value,
                                  ) || '-'}
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="duplicate" id={`${field.field}-duplicate`} />
                              <Label
                                htmlFor={`${field.field}-duplicate`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="text-xs text-muted-foreground">
                                  {t('from_duplicate', 'From Duplicate')}
                                </div>
                                <div className="text-sm truncate">
                                  {String(
                                    primaryEntityId === source.id
                                      ? field.target_value
                                      : field.source_value,
                                  ) || '-'}
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}

                    {fieldComparisons.filter((f) => f.is_different).length === 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {t('no_conflicts', 'No field conflicts to resolve')}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Info about what will be transferred */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{t('what_transfers', 'What will be transferred')}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  {entityType === 'person' && (
                    <>
                      <li>{t('transfer_relationships', 'Person relationships')}</li>
                      <li>{t('transfer_roles', 'Career roles and positions')}</li>
                      <li>{t('transfer_affiliations', 'Organization affiliations')}</li>
                      <li>{t('transfer_engagements', 'Engagement participations')}</li>
                    </>
                  )}
                  {entityType === 'organization' && (
                    <>
                      <li>{t('transfer_persons', 'Associated persons')}</li>
                      <li>{t('transfer_child_orgs', 'Child organizations')}</li>
                      <li>{t('transfer_working_groups', 'Working groups')}</li>
                    </>
                  )}
                  <li>{t('transfer_documents', 'Related documents')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={mergeMutation.isPending}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!primaryEntityId || mergeMutation.isPending}
            className="gap-2"
          >
            {mergeMutation.isPending ? (
              <>{t('merging', 'Merging...')}</>
            ) : (
              <>
                <Merge className="h-4 w-4" />
                {t('confirm_merge', 'Confirm Merge')}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Error display */}
        {mergeMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error', 'Error')}</AlertTitle>
            <AlertDescription>
              {(mergeMutation.error as Error)?.message ||
                t('merge_error', 'Failed to merge entities')}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MergeDialog
