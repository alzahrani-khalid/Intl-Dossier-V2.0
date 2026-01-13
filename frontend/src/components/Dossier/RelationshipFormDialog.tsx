/**
 * Relationship Form Dialog Component
 * Feature: universal-relationship-crud
 *
 * Dialog for creating and editing dossier relationships.
 * Mobile-first design with RTL support.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link2, Loader2, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { FieldLabelWithHelp } from '@/components/Forms/ContextualHelp'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_STATUS_LABELS,
  DOSSIER_TYPE_LABELS,
  type DossierRelationshipType,
  type RelationshipStatus,
  type DossierRelationshipWithDossiers,
  type RelationshipCreate,
  type RelationshipUpdate,
} from '@/types/relationship.types'
import { useCreateRelationship, useUpdateRelationship } from '@/hooks/useRelationships'

// ============================================================================
// Types
// ============================================================================

interface DossierOption {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
}

interface RelationshipFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierId: string
  dossierName: string
  dossierType: string
  relationship?: DossierRelationshipWithDossiers
  mode: 'create' | 'edit'
}

// ============================================================================
// Form Schema
// ============================================================================

const relationshipFormSchema = z.object({
  target_dossier_id: z.string().min(1, 'Target dossier is required'),
  relationship_type: z.string().min(1, 'Relationship type is required'),
  status: z.enum(['active', 'historical', 'terminated']).default('active'),
  notes_en: z.string().optional(),
  notes_ar: z.string().optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
})

type RelationshipFormValues = z.infer<typeof relationshipFormSchema>

// ============================================================================
// Component
// ============================================================================

export function RelationshipFormDialog({
  open,
  onOpenChange,
  dossierId,
  dossierName,
  dossierType,
  relationship,
  mode,
}: RelationshipFormDialogProps) {
  const { t, i18n } = useTranslation(['relationships', 'contextual-help'])
  const isRTL = i18n.language === 'ar'

  const [dossierSearchOpen, setDossierSearchOpen] = useState(false)
  const [dossierSearch, setDossierSearch] = useState('')
  const [selectedDossier, setSelectedDossier] = useState<DossierOption | null>(null)

  const createMutation = useCreateRelationship()
  const updateMutation = useUpdateRelationship()

  const isLoading = createMutation.isPending || updateMutation.isPending

  // Search for dossiers
  const { data: dossierOptions, isLoading: isSearching } = useQuery({
    queryKey: ['dossiers', 'search', dossierSearch],
    queryFn: async () => {
      if (!dossierSearch || dossierSearch.length < 2) return []

      const { data, error } = await supabase
        .from('dossiers')
        .select('id, type, name_en, name_ar, status')
        .neq('id', dossierId) // Exclude current dossier
        .neq('status', 'archived')
        .or(`name_en.ilike.%${dossierSearch}%,name_ar.ilike.%${dossierSearch}%`)
        .limit(10)

      if (error) throw error
      return data as DossierOption[]
    },
    enabled: dossierSearch.length >= 2,
    staleTime: 30_000,
  })

  // Form setup
  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipFormSchema),
    defaultValues: {
      target_dossier_id: relationship?.target_dossier_id || '',
      relationship_type: relationship?.relationship_type || '',
      status: relationship?.status || 'active',
      notes_en: relationship?.notes_en || '',
      notes_ar: relationship?.notes_ar || '',
      effective_from: relationship?.effective_from?.split('T')[0] || '',
      effective_to: relationship?.effective_to?.split('T')[0] || '',
    },
  })

  // Set selected dossier when editing
  useEffect(() => {
    if (mode === 'edit' && relationship?.target_dossier) {
      setSelectedDossier(relationship.target_dossier)
    }
  }, [mode, relationship])

  // Handle form submission
  const onSubmit = async (values: RelationshipFormValues) => {
    try {
      if (mode === 'create') {
        const createData: RelationshipCreate = {
          source_dossier_id: dossierId,
          target_dossier_id: values.target_dossier_id,
          relationship_type: values.relationship_type as DossierRelationshipType,
          status: values.status as RelationshipStatus,
          notes_en: values.notes_en || undefined,
          notes_ar: values.notes_ar || undefined,
          effective_from: values.effective_from
            ? new Date(values.effective_from).toISOString()
            : undefined,
          effective_to: values.effective_to
            ? new Date(values.effective_to).toISOString()
            : undefined,
        }

        await createMutation.mutateAsync(createData)
      } else if (relationship) {
        const updateData: RelationshipUpdate = {
          relationship_type: values.relationship_type as DossierRelationshipType,
          status: values.status as RelationshipStatus,
          notes_en: values.notes_en || undefined,
          notes_ar: values.notes_ar || undefined,
          effective_from: values.effective_from
            ? new Date(values.effective_from).toISOString()
            : undefined,
          effective_to: values.effective_to
            ? new Date(values.effective_to).toISOString()
            : undefined,
        }

        await updateMutation.mutateAsync({ id: relationship.id, updates: updateData })
      }

      onOpenChange(false)
      form.reset()
      setSelectedDossier(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Handle dossier selection
  const handleSelectDossier = (dossier: DossierOption) => {
    setSelectedDossier(dossier)
    form.setValue('target_dossier_id', dossier.id)
    setDossierSearchOpen(false)
    setDossierSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" />
            {mode === 'create' ? t('dialog.createTitle') : t('dialog.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('dialog.createDescription', { name: dossierName })
              : t('dialog.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Target Dossier Selection (only for create) */}
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="target_dossier_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FieldLabelWithHelp
                      label={t('relationships:form.targetDossier')}
                      required
                      helpProps={{
                        tooltip: t('contextual-help:relationship.targetDossier.tooltip'),
                        title: t('contextual-help:relationship.targetDossier.title'),
                        description: t('contextual-help:relationship.targetDossier.description'),
                        formatRequirements: t(
                          'contextual-help:relationship.targetDossier.formatRequirements',
                          { returnObjects: true },
                        ) as string[],
                        examples: t('contextual-help:relationship.targetDossier.examples', {
                          returnObjects: true,
                        }) as Array<{ value: string; description: string }>,
                        mode: 'both',
                      }}
                    />
                    <Popover open={dossierSearchOpen} onOpenChange={setDossierSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between min-h-11 ${
                              !field.value ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {selectedDossier ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {DOSSIER_TYPE_LABELS[
                                    selectedDossier.type as keyof typeof DOSSIER_TYPE_LABELS
                                  ]?.[isRTL ? 'ar' : 'en'] || selectedDossier.type}
                                </Badge>
                                <span className="truncate">
                                  {isRTL ? selectedDossier.name_ar : selectedDossier.name_en}
                                </span>
                              </div>
                            ) : (
                              <span>{t('form.selectDossier')}</span>
                            )}
                            <Search className="h-4 w-4 shrink-0 opacity-50 ms-2" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t('form.searchDossiers')}
                            value={dossierSearch}
                            onValueChange={setDossierSearch}
                          />
                          <CommandList>
                            {isSearching ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : dossierSearch.length < 2 ? (
                              <CommandEmpty>{t('form.searchMinChars')}</CommandEmpty>
                            ) : !dossierOptions?.length ? (
                              <CommandEmpty>{t('form.noResults')}</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {dossierOptions.map((dossier) => (
                                  <CommandItem
                                    key={dossier.id}
                                    value={dossier.id}
                                    onSelect={() => handleSelectDossier(dossier)}
                                    className="flex items-center gap-2"
                                  >
                                    <Badge variant="outline" className="text-xs">
                                      {DOSSIER_TYPE_LABELS[
                                        dossier.type as keyof typeof DOSSIER_TYPE_LABELS
                                      ]?.[isRTL ? 'ar' : 'en'] || dossier.type}
                                    </Badge>
                                    <span className="truncate">
                                      {isRTL ? dossier.name_ar : dossier.name_en}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Relationship Type */}
            <FormField
              control={form.control}
              name="relationship_type"
              render={({ field }) => (
                <FormItem>
                  <FieldLabelWithHelp
                    label={t('relationships:form.relationshipType')}
                    required
                    helpProps={{
                      tooltip: t('contextual-help:relationship.relationshipType.tooltip'),
                      title: t('contextual-help:relationship.relationshipType.title'),
                      description: t('contextual-help:relationship.relationshipType.description'),
                      mode: 'both',
                    }}
                  />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('form.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {RELATIONSHIP_TYPE_LABELS[type][isRTL ? 'ar' : 'en']}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FieldLabelWithHelp
                    label={t('relationships:form.status')}
                    helpProps={{
                      tooltip: t('contextual-help:relationship.status.tooltip'),
                      title: t('contextual-help:relationship.status.title'),
                      description: t('contextual-help:relationship.status.description'),
                      mode: 'tooltip',
                    }}
                  />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('form.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RELATIONSHIP_STATUS_LABELS).map(([value, labels]) => (
                        <SelectItem key={value} value={value}>
                          {labels[isRTL ? 'ar' : 'en']}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('relationships:form.effectiveFrom')}
                      helpProps={{
                        tooltip: t('contextual-help:relationship.effectiveFrom.tooltip'),
                        mode: 'tooltip',
                      }}
                    />
                    <FormControl>
                      <Input type="date" className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_to"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('relationships:form.effectiveTo')}
                      helpProps={{
                        tooltip: t('contextual-help:relationship.effectiveTo.tooltip'),
                        title: t('contextual-help:relationship.effectiveTo.title'),
                        description: t('contextual-help:relationship.effectiveTo.description'),
                        mode: 'both',
                      }}
                    />
                    <FormControl>
                      <Input type="date" className="min-h-11" {...field} />
                    </FormControl>
                    <FormDescription>{t('relationships:form.effectiveToHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="notes_en"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('relationships:form.notesEn')}
                      helpProps={{
                        tooltip: t('contextual-help:relationship.notes.tooltip'),
                        mode: 'tooltip',
                      }}
                    />
                    <FormControl>
                      <Textarea
                        placeholder={t('relationships:form.notesPlaceholder')}
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes_ar"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('relationships:form.notesAr')}
                      helpProps={{
                        tooltip: t('contextual-help:relationship.notes.tooltip'),
                        mode: 'tooltip',
                      }}
                    />
                    <FormControl>
                      <Textarea
                        placeholder={t('relationships:form.notesPlaceholder')}
                        className="resize-none min-h-[80px]"
                        dir="rtl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="min-h-11"
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="min-h-11">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {mode === 'create' ? t('actions.create') : t('actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
