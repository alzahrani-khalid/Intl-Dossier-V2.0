/**
 * NewPositionDialog — quick-create dialog for a new position from a dossier.
 *
 * Extracted from the broken `PositionDialog` in AddToDossierDialogs.tsx (which
 * posted position_type_id = dossier_id, a blank title_ar, and empty
 * audience_groups). This dialog offers a real position-type picker, required
 * bilingual titles, an optional bilingual content pair, an audience multi-select,
 * localized inline validation, and fail-safe translate assists.
 *
 * Phase 64 — POSNEW-01 (form layer, this plan) / POSNEW-02 (submit flow, plan 64-04).
 *
 * @module components/positions/NewPositionDialog
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Info, Languages, Loader2, MessageSquare } from 'lucide-react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { usePositionTypes } from '@/domains/positions/hooks/usePositionTypes'
import { useAudienceGroups } from '@/domains/positions/hooks/useAudienceGroups'
import { useCreatePosition } from '@/domains/positions/hooks/useCreatePosition'
import {
  createPositionDossierLink,
  translateContent,
} from '@/domains/positions/repositories/positions.repository'
import { dossierOverviewKeys } from '@/services/dossier-overview.service'
import type { DossierContextForAction } from '@/hooks/useAddToDossierActions'

// =============================================================================
// Props contract — consumed by plan 64-04 (AddToDossierDialogs) and 64-05
// (DossierPositionsTab). Keep this stable.
// =============================================================================

export interface NewPositionDialogProps {
  isOpen: boolean
  onClose: () => void
  dossierContext: DossierContextForAction
  isRTL: boolean
}

// =============================================================================
// Validation schema — messages are i18n KEYS rendered via <FormMessage /> (the
// FormMessage primitive runs them back through t(), TaskEditDialog precedent).
// =============================================================================

const newPositionSchema = z.object({
  position_type_id: z.string().min(1, 'positions:validation.type_required'),
  title_en: z
    .string()
    .min(1, 'positions:validation.title_en_required')
    .max(200, 'positions:validation.title_max_length'),
  title_ar: z
    .string()
    .min(1, 'positions:validation.title_ar_required')
    .max(200, 'positions:validation.title_max_length'),
  content_en: z.string().optional(),
  content_ar: z.string().optional(),
  audience_groups: z.array(z.string()).min(1, 'positions:validation.audience_required'),
})

type NewPositionFormValues = z.infer<typeof newPositionSchema>

// Name-match default literals (D-05/D-06) — resolved against live lookup rows
// with a first-row fallback. Never a hard-coded UUID.
const STANDARD_TYPE_NAME = 'Standard Position'
const ALL_STAFF_NAME = 'All Staff'

// The four translatable fields, each pointing at its counterpart.
type TranslatableField = 'title_en' | 'title_ar' | 'content_en' | 'content_ar'

// =============================================================================
// Local DossierContextBadge — copied from AddToDossierDialogs.tsx L117-144
// (that file is owned by plan 64-04; this dialog must NOT import from it).
// Reads t('addToDossier.context.linkedTo') from the `dossier` namespace.
// =============================================================================

function DossierContextBadge({
  dossierContext,
  isRTL,
}: {
  dossierContext: DossierContextForAction
  isRTL: boolean
}): React.JSX.Element {
  const { t } = useTranslation('dossier')

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{t('addToDossier.context.linkedTo')}</p>
        <p className="text-sm font-medium truncate">
          {isRTL
            ? dossierContext.dossier_name_ar || dossierContext.dossier_name_en
            : dossierContext.dossier_name_en}
        </p>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {t(`addToDossier.context.${dossierContext.inheritance_source}`, {
          defaultValue: dossierContext.inheritance_source,
        })}
      </Badge>
    </div>
  )
}

// Arabic-font controls render Tajawal even in EN locale (content-driven, not
// locale-driven — UI-SPEC Bilingual Contract). There is no `font-arabic`
// Tailwind utility; the token lives in :root as --font-arabic.
const ARABIC_FONT_STYLE = { fontFamily: 'var(--font-arabic)' } as const

// =============================================================================
// NewPositionDialog — full form layer (submit flow lands in plan 64-04)
// =============================================================================

export function NewPositionDialog({
  isOpen,
  onClose,
  dossierContext,
  isRTL,
}: NewPositionDialogProps): React.JSX.Element {
  const { t } = useTranslation(['positions', 'dossier'])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createPosition = useCreatePosition()

  const typesQuery = usePositionTypes()
  const groupsQuery = useAudienceGroups()
  const types = typesQuery.data ?? []
  const groups = groupsQuery.data ?? []
  const lookupsLoading = typesQuery.isLoading || groupsQuery.isLoading
  // Resolved-but-EMPTY lookups are as unusable as errored ones: the defaults
  // effect early-returns, the audience grid renders no checkboxes, and .min(1)
  // can never pass — render the same lookup_error message (WR-04).
  const typesUnavailable = typesQuery.error != null || (!typesQuery.isLoading && types.length === 0)
  const groupsUnavailable =
    groupsQuery.error != null || (!groupsQuery.isLoading && groups.length === 0)

  // The translate button currently in flight (and its disabled pair share state).
  const [translating, setTranslating] = useState<TranslatableField | null>(null)
  // Guards against double-submit while the two-step create→link flow runs.
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<NewPositionFormValues>({
    resolver: zodResolver(newPositionSchema),
    mode: 'onTouched',
    defaultValues: {
      position_type_id: '',
      title_en: '',
      title_ar: '',
      content_en: '',
      content_ar: '',
      audience_groups: [],
    },
  })

  // Defaults (D-05/D-06): once both lookups have data, the dialog is open, and
  // no type is selected yet, preselect Standard Position and pre-check All Staff
  // by name-match with a first-row fallback. Never a hard-coded UUID.
  useEffect(() => {
    if (!isOpen) return
    if (types.length === 0 || groups.length === 0) return
    if (form.getValues('position_type_id') !== '') return

    const standardType = types.find((row) => row.name_en === STANDARD_TYPE_NAME) ?? types[0]
    const allStaff = groups.find((row) => row.name_en === ALL_STAFF_NAME) ?? groups[0]
    if (standardType === undefined || allStaff === undefined) return

    // Preserve anything the user already typed while the lookups were in flight
    // (cold cache, first open): only the two defaultable fields are filled, and
    // audience only when still empty (WR-01).
    const current = form.getValues()
    form.reset(
      {
        ...current,
        position_type_id: standardType.id,
        audience_groups:
          current.audience_groups.length === 0 ? [allStaff.id] : current.audience_groups,
      },
      { keepDefaultValues: false },
    )
  }, [isOpen, types, groups, form])

  // After a full success (both create and link resolved), refresh every
  // dossier-scoped reader and surface the success toast. The mutation hooks only
  // invalidate the GLOBAL ['positions','list'] (useCreatePosition.onSuccess) and
  // the INVERSE ['position-dossier-links', positionId] keys; the dossier
  // Positions tab reads ['dossier-position-links', dossierId] and the overview
  // KPI reads dossierOverviewKeys.detail(dossierId), so both would stay stale
  // until their window expires unless invalidated here (R12-04 precedent).
  const finishSuccess = async (positionId: string): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: ['dossier-position-links', dossierContext.dossier_id],
    })
    await queryClient.invalidateQueries({
      queryKey: dossierOverviewKeys.detail(dossierContext.dossier_id),
    })
    await queryClient.invalidateQueries({
      queryKey: ['position-dossier-links', positionId],
    })
    form.reset()
    onClose()
    toast.success(t('positions:create_dialog.toast_success'), {
      action: {
        label: t('positions:create_dialog.toast_open_position'),
        onClick: () => void navigate({ to: '/positions/$id', params: { id: positionId } }),
      },
    })
  }

  // Step 2 (and the retry path) — always passes link_type explicitly; the edge
  // defaults to related_to when omitted, which would be the wrong relationship
  // for a position created FROM this dossier (D-09/D-10, Pitfall 2).
  const linkToDossier = async (positionId: string): Promise<void> => {
    await createPositionDossierLink(positionId, {
      dossier_id: dossierContext.dossier_id,
      link_type: 'applies_to',
    })
  }

  // finishSuccess, but a post-link failure must never masquerade as a link
  // failure (WR-02): the link write already succeeded, so showing the partial-
  // failure toast would invite a retry that re-POSTs the same link and trips
  // unique_position_dossier_link — an unescapable false-warning loop. Log the
  // bookkeeping failure and still close with the success toast.
  const finishSuccessSafely = async (positionId: string): Promise<void> => {
    try {
      await finishSuccess(positionId)
    } catch (error) {
      console.error('NewPositionDialog: post-link refresh failed after create+link', error)
      form.reset()
      onClose()
      toast.success(t('positions:create_dialog.toast_success'))
    }
  }

  // Partial failure (position created, link write threw): the dialog has already
  // closed (re-submitting would duplicate the position — UI-SPEC state 9). Offer a
  // Retry link action; on retry success run the full-success path, on retry
  // failure re-show the same warning. Never render clean success here.
  const showPartialFailure = (positionId: string): void => {
    toast.warning(t('positions:create_dialog.toast_partial_failure'), {
      duration: 10000,
      action: {
        label: t('positions:create_dialog.toast_retry_link'),
        onClick: () => {
          void (async (): Promise<void> => {
            try {
              await linkToDossier(positionId)
            } catch (error) {
              // The api-client throws Error('API error 409: …') on conflict —
              // the link already exists (lost response, or an earlier write that
              // WR-02 previously misreported). Treat 409 as already-linked and
              // fall through to the success path (WR-02).
              const alreadyLinked =
                error instanceof Error && error.message.startsWith('API error 409')
              if (!alreadyLinked) {
                showPartialFailure(positionId)
                return
              }
            }
            await finishSuccessSafely(positionId)
          })()
        },
      },
    })
  }

  // Two-step submit: positions-create, then the applies_to dossier link. The two
  // writes have independent try/catch so a link failure is reported as a partial
  // failure (warning + retry) — distinct from a total create failure (D-11).
  const onSubmit = async (values: NewPositionFormValues): Promise<void> => {
    if (submitting) return
    setSubmitting(true)

    let positionId: string
    try {
      const position = await createPosition.mutateAsync(values)
      positionId = position.id
    } catch {
      // Total failure (UI-SPEC state 10): keep the dialog open with input intact;
      // the shared api-client strips the edge bilingual body (Pitfall 3), so show
      // a generic localized error. The hook already invalidated ['positions','list'].
      toast.error(t('positions:create_dialog.toast_error'))
      setSubmitting(false)
      return
    }

    // The catch is scoped to the LINK write only (WR-02): a finishSuccess throw
    // after a successful link must not surface as a linking failure, because
    // retrying would violate unique_position_dossier_link.
    try {
      await linkToDossier(positionId)
    } catch {
      // Partial failure: the position persisted but the link write failed.
      form.reset()
      onClose()
      showPartialFailure(positionId)
      return
    } finally {
      setSubmitting(false)
    }

    await finishSuccessSafely(positionId)
  }

  const handleTranslate = async (
    source: TranslatableField,
    target: TranslatableField,
    direction: 'en_to_ar' | 'ar_to_en',
    contentType: 'title' | 'content',
  ): Promise<void> => {
    const text = form.getValues(source)
    if (text === undefined || text.length === 0) return

    setTranslating(source)
    try {
      const result = await translateContent({ text, direction, content_type: contentType })
      // Fill the counterpart as an editable draft only on a 2xx response.
      form.setValue(target, result.translated_text, { shouldValidate: true, shouldDirty: true })
    } catch {
      // Any throw → translation unavailable. Leave the target untouched and never
      // block submission on the AI (D-07/D-08). The bilingual edge error body is
      // discarded by the shared api-client (Pitfall 3); use a generic local toast.
      toast.error(t('positions:create_dialog.translate_unavailable'))
    } finally {
      setTranslating(null)
    }
  }

  const selectedAudience = form.watch('audience_groups')

  const toggleAudience = (groupId: string, checked: boolean): void => {
    const current = form.getValues('audience_groups')
    const next = checked ? [...current, groupId] : current.filter((id) => id !== groupId)
    form.setValue('audience_groups', next, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('dossier:addToDossier.dialogs.position.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dossier:addToDossier.dialogs.position.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[calc(85vh-10rem)] space-y-4 overflow-y-auto"
          >
            <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

            {/* Position type ------------------------------------------------ */}
            {typesUnavailable ? (
              <p className="text-xs text-[var(--danger)]">
                {t('positions:create_dialog.lookup_error')}
              </p>
            ) : (
              <FormField
                control={form.control}
                name="position_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start">
                      {t('positions:create_dialog.type_label')}
                      <span aria-hidden="true"> *</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lookupsLoading}
                    >
                      <FormControl required>
                        <SelectTrigger className="min-h-11 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {isRTL ? row.name_ar || row.name_en : row.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title (English) — translate fills title_ar -------------------- */}
            <FormField
              control={form.control}
              name="title_en"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-start">
                      {t('positions:create_dialog.title_en_label')}
                      <span aria-hidden="true"> *</span>
                    </FormLabel>
                    <TranslateButton
                      label={t('positions:create_dialog.translate_to_ar')}
                      inFlight={translating === 'title_en'}
                      disabled={translating !== null || (field.value?.length ?? 0) === 0}
                      onClick={() =>
                        void handleTranslate('title_en', 'title_ar', 'en_to_ar', 'title')
                      }
                    />
                  </div>
                  <FormControl required>
                    <Input {...field} dir="ltr" className="min-h-11" maxLength={200} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title (Arabic) — translate fills title_en -------------------- */}
            <FormField
              control={form.control}
              name="title_ar"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-start">
                      {t('positions:create_dialog.title_ar_label')}
                      <span aria-hidden="true"> *</span>
                    </FormLabel>
                    <TranslateButton
                      label={t('positions:create_dialog.translate_to_en')}
                      inFlight={translating === 'title_ar'}
                      disabled={translating !== null || (field.value?.length ?? 0) === 0}
                      onClick={() =>
                        void handleTranslate('title_ar', 'title_en', 'ar_to_en', 'title')
                      }
                    />
                  </div>
                  <FormControl required>
                    <Input
                      {...field}
                      dir="rtl"
                      style={ARABIC_FONT_STYLE}
                      className="min-h-11"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content (English) — optional, translate fills content_ar ----- */}
            <FormField
              control={form.control}
              name="content_en"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-start">
                      {t('positions:create_dialog.content_en_label')}
                    </FormLabel>
                    <TranslateButton
                      label={t('positions:create_dialog.translate_to_ar')}
                      inFlight={translating === 'content_en'}
                      disabled={translating !== null || (field.value?.length ?? 0) === 0}
                      onClick={() =>
                        void handleTranslate('content_en', 'content_ar', 'en_to_ar', 'content')
                      }
                    />
                  </div>
                  <FormControl>
                    <Textarea {...field} dir="ltr" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content (Arabic) — optional, translate fills content_en ------ */}
            <FormField
              control={form.control}
              name="content_ar"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-start">
                      {t('positions:create_dialog.content_ar_label')}
                    </FormLabel>
                    <TranslateButton
                      label={t('positions:create_dialog.translate_to_en')}
                      inFlight={translating === 'content_ar'}
                      disabled={translating !== null || (field.value?.length ?? 0) === 0}
                      onClick={() =>
                        void handleTranslate('content_ar', 'content_en', 'ar_to_en', 'content')
                      }
                    />
                  </div>
                  <FormControl>
                    <Textarea {...field} dir="rtl" style={ARABIC_FONT_STYLE} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audience groups --------------------------------------------- */}
            {groupsUnavailable ? (
              <p className="text-xs text-[var(--danger)]">
                {t('positions:create_dialog.lookup_error')}
              </p>
            ) : (
              <FormField
                control={form.control}
                name="audience_groups"
                render={() => (
                  <FormItem>
                    <fieldset disabled={lookupsLoading}>
                      <legend className="label text-start">
                        {t('positions:create_dialog.audience_legend')}
                        <span aria-hidden="true"> *</span>
                      </legend>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {groups.map((row) => {
                          const checkboxId = `audience-${row.id}`
                          return (
                            <div key={row.id} className="flex items-center gap-2">
                              <Checkbox
                                id={checkboxId}
                                checked={selectedAudience.includes(row.id)}
                                onCheckedChange={(checked) =>
                                  toggleAudience(row.id, checked === true)
                                }
                              />
                              <Label
                                htmlFor={checkboxId}
                                className="flex-1 cursor-pointer text-start text-[13px]"
                                style={isRTL ? ARABIC_FONT_STYLE : undefined}
                              >
                                {isRTL ? row.name_ar || row.name_en : row.name_en}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* aria-live region for translate-in-flight announcements ------- */}
            <div aria-live="polite" className="sr-only">
              {translating !== null ? t('positions:create_dialog.translating') : ''}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="min-h-11"
              >
                {t('dossier:action.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || submitting}
                className="min-h-11"
              >
                {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t('dossier:addToDossier.form.submit.position')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// TranslateButton — ghost assist on the SOURCE field that fills the COUNTERPART.
// Languages icon swaps to a spinner while in flight; disabled-while-in-flight IS
// the debounce (D-09). Icon is non-directional — no RTL flip.
// =============================================================================

function TranslateButton({
  label,
  inFlight,
  disabled,
  onClick,
}: {
  label: string
  inFlight: boolean
  disabled: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onClick}>
      {inFlight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
      {label}
    </Button>
  )
}
