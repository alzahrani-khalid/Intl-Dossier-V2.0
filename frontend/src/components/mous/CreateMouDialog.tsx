/**
 * CreateMouDialog — quick-create dialog for a new MoU.
 *
 * Mirrors NewPositionDialog: controlled open state, RHF + zodResolver with i18n-key
 * error messages, bilingual required titles, enum pickers, two signatory
 * DossierPickers, and native date inputs. Submits through the deployed `mous`
 * edge fn via useCreateMou; the list refreshes off the ['mous'] invalidation.
 *
 * Party names for the list view are derived from the two selected dossiers and
 * sent as the `parties` jsonb (the `mous_frontend` view reads names from there,
 * not from the signatory FKs — RESEARCH Pitfall 2).
 *
 * @module components/mous/CreateMouDialog
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { DossierPicker, type DossierOption } from '@/components/work-creation/DossierPicker'
import { useCreateMou } from '@/domains/mous'
import type { CreateMouPayload, MouParty } from '@/domains/mous'

export interface CreateMouDialogProps {
  isOpen: boolean
  onClose: () => void
  isRTL: boolean
}

const MOU_TYPES = ['bilateral', 'multilateral', 'framework', 'technical'] as const
const MOU_CATEGORIES = ['data_exchange', 'capacity_building', 'strategic', 'technical'] as const
const MOU_STATES = [
  'draft',
  'negotiation',
  'pending_approval',
  'signed',
  'active',
  'suspended',
  'expired',
  'terminated',
] as const

// Messages are i18n KEYS in the default `common` ns — <FormMessage /> runs them
// back through t(). Refines mirror the edge-fn validators (client validation is
// UX only; the fn re-validates server-side).
const createMouSchema = z
  .object({
    title: z.string().min(1, 'mous.form.errors.titleRequired'),
    title_ar: z.string().min(1, 'mous.form.errors.titleArRequired'),
    type: z.enum(MOU_TYPES),
    mou_category: z.enum(MOU_CATEGORIES),
    lifecycle_state: z.enum(MOU_STATES),
    signatory_1_dossier_id: z.string().uuid().nullable().optional(),
    signatory_2_dossier_id: z.string().uuid().nullable().optional(),
    effective_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    description: z.string().optional(),
  })
  .refine(
    (v) => !v.signatory_1_dossier_id || v.signatory_1_dossier_id !== v.signatory_2_dossier_id,
    {
      message: 'mous.form.errors.signatoriesMustDiffer',
      path: ['signatory_2_dossier_id'],
    },
  )
  .refine(
    (v) =>
      !v.effective_date || !v.expiry_date || new Date(v.expiry_date) > new Date(v.effective_date),
    {
      message: 'mous.form.errors.expiryAfterEffective',
      path: ['expiry_date'],
    },
  )

type CreateMouFormValues = z.infer<typeof createMouSchema>

// Arabic-font controls render Tajawal even in EN locale (content-driven, not
// locale-driven). There is no `font-arabic` utility; the token lives in :root.
const ARABIC_FONT_STYLE = { fontFamily: 'var(--font-arabic)' } as const

const SIGNATORY_TYPES = ['country', 'organization'] as const

export function CreateMouDialog({
  isOpen,
  onClose,
  isRTL,
}: CreateMouDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const createMou = useCreateMou()

  const [submitting, setSubmitting] = useState(false)
  // The full DossierOption per signatory — the `parties` jsonb is derived from it.
  const [signatory1, setSignatory1] = useState<DossierOption | undefined>(undefined)
  const [signatory2, setSignatory2] = useState<DossierOption | undefined>(undefined)

  const form = useForm<CreateMouFormValues>({
    resolver: zodResolver(createMouSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      title_ar: '',
      type: 'bilateral',
      mou_category: 'data_exchange',
      lifecycle_state: 'draft',
      signatory_1_dossier_id: undefined,
      signatory_2_dossier_id: undefined,
      effective_date: undefined,
      expiry_date: undefined,
      description: '',
    },
  })

  const resetAndClose = (): void => {
    form.reset()
    setSignatory1(undefined)
    setSignatory2(undefined)
    onClose()
  }

  const onSubmit = async (values: CreateMouFormValues): Promise<void> => {
    if (submitting) return
    setSubmitting(true)

    const parties: MouParty[] = []
    if (signatory1) parties.push({ name_en: signatory1.name_en, name_ar: signatory1.name_ar })
    if (signatory2) parties.push({ name_en: signatory2.name_en, name_ar: signatory2.name_ar })

    const payload: CreateMouPayload = {
      title: values.title,
      title_ar: values.title_ar,
      type: values.type,
      mou_category: values.mou_category,
      lifecycle_state: values.lifecycle_state,
      description: values.description ? values.description : undefined,
      signatory_1_dossier_id: values.signatory_1_dossier_id ?? undefined,
      signatory_2_dossier_id: values.signatory_2_dossier_id ?? undefined,
      effective_date: values.effective_date ?? undefined,
      expiry_date: values.expiry_date ?? undefined,
      parties: parties.length > 0 ? parties : undefined,
    }

    try {
      await createMou.mutateAsync(payload)
      resetAndClose()
      toast.success(t('mous.form.toastSuccess'))
    } catch {
      // Keep the dialog open with input intact; api-client strips edge error
      // bodies, so show a generic localized error (NewPositionDialog precedent).
      toast.error(t('mous.form.toastError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('mous.form.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('mous.form.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[calc(85vh-10rem)] space-y-4 overflow-y-auto"
          >
            {/* Title (English) --------------------------------------------- */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">
                    {t('mous.form.title')}
                    <span aria-hidden="true"> *</span>
                  </FormLabel>
                  <FormControl required>
                    <Input {...field} dir="ltr" className="min-h-11" maxLength={500} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title (Arabic) ---------------------------------------------- */}
            <FormField
              control={form.control}
              name="title_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">
                    {t('mous.form.titleAr')}
                    <span aria-hidden="true"> *</span>
                  </FormLabel>
                  <FormControl required>
                    <Input
                      {...field}
                      dir="rtl"
                      style={ARABIC_FONT_STYLE}
                      className="min-h-11"
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type -------------------------------------------------------- */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.type')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOU_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`mous.form.types.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category ---------------------------------------------------- */}
            <FormField
              control={form.control}
              name="mou_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.category')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOU_CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`mous.form.categories.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lifecycle state --------------------------------------------- */}
            <FormField
              control={form.control}
              name="lifecycle_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.lifecycleState')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOU_STATES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`mous.statuses.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* First signatory --------------------------------------------- */}
            <FormField
              control={form.control}
              name="signatory_1_dossier_id"
              render={() => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.signatory1')}</FormLabel>
                  <DossierPicker
                    value={signatory1?.id}
                    selectedDossier={signatory1}
                    placeholder={t('mous.form.signatory1')}
                    filterByDossierType={[...SIGNATORY_TYPES]}
                    onChange={(id, dossier) => {
                      form.setValue('signatory_1_dossier_id', id ?? undefined, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                      setSignatory1(dossier)
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Second signatory -------------------------------------------- */}
            <FormField
              control={form.control}
              name="signatory_2_dossier_id"
              render={() => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.signatory2')}</FormLabel>
                  <DossierPicker
                    value={signatory2?.id}
                    selectedDossier={signatory2}
                    placeholder={t('mous.form.signatory2')}
                    filterByDossierType={[...SIGNATORY_TYPES]}
                    onChange={(id, dossier) => {
                      form.setValue('signatory_2_dossier_id', id ?? undefined, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                      setSignatory2(dossier)
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective date ---------------------------------------------- */}
            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.effectiveDate')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="date"
                      dir="ltr"
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry date ------------------------------------------------- */}
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.expiryDate')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="date"
                      dir="ltr"
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description ------------------------------------------------- */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('mous.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      style={isRTL ? ARABIC_FONT_STYLE : undefined}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={submitting}
                className="min-h-11"
              >
                {t('mous.form.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || submitting}
                className="min-h-11"
              >
                {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t('mous.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
