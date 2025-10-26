/**
 * DossierForm Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T055)
 *
 * Universal form for creating/editing dossiers with type-specific field sections.
 * Mobile-first, RTL-compatible, with full validation and i18n support.
 *
 * Features:
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Type-specific extension fields
 * - Form validation with error messages
 * - Touch-friendly inputs (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CreateDossierRequest,
  UpdateDossierRequest,
  DossierType,
  DossierStatus,
  DossierWithExtension,
  DossierExtensionData,
} from '@/services/dossier-api';

interface DossierFormProps {
  dossier?: DossierWithExtension;
  type?: DossierType;
  onSubmit: (data: CreateDossierRequest | UpdateDossierRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Base dossier schema (common fields)
 */
const baseDossierSchema = z.object({
  name_en: z.string().min(2, { message: 'English name must be at least 2 characters' }),
  name_ar: z.string().min(2, { message: 'Arabic name must be at least 2 characters' }),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(0).max(5).default(0),
  tags: z.array(z.string()).optional(),
});

/**
 * Type-specific extension schemas
 */
const countryExtensionSchema = z.object({
  iso_code_2: z.string().length(2).optional(),
  iso_code_3: z.string().length(3).optional(),
  capital_en: z.string().optional(),
  capital_ar: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  population: z.number().positive().optional(),
  area_sq_km: z.number().positive().optional(),
  flag_url: z.string().url().optional(),
});

const organizationExtensionSchema = z.object({
  org_code: z.string().optional(),
  org_type: z.enum(['government', 'ngo', 'private', 'international', 'academic']).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address_en: z.string().optional(),
  address_ar: z.string().optional(),
  logo_url: z.string().url().optional(),
  established_date: z.string().optional(),
});

const forumExtensionSchema = z.object({
  number_of_sessions: z.number().int().positive().optional(),
  registration_fee: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  agenda_url: z.string().url().optional(),
  live_stream_url: z.string().url().optional(),
});

const engagementExtensionSchema = z.object({
  engagement_type: z.enum(['meeting', 'consultation', 'coordination', 'workshop', 'conference', 'site_visit', 'ceremony']).optional(),
  engagement_category: z.enum(['bilateral', 'multilateral', 'regional', 'internal']).optional(),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
});

const themeExtensionSchema = z.object({
  theme_category: z.enum(['policy', 'technical', 'strategic', 'operational']).optional(),
});

const workingGroupExtensionSchema = z.object({
  mandate_en: z.string().optional(),
  mandate_ar: z.string().optional(),
  wg_status: z.enum(['active', 'suspended', 'disbanded']).optional(),
  established_date: z.string().optional(),
  disbandment_date: z.string().optional(),
});

const personExtensionSchema = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  biography_en: z.string().optional(),
  biography_ar: z.string().optional(),
  photo_url: z.string().url().optional(),
});

export function DossierForm({
  dossier,
  type: initialType,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: DossierFormProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const isEditMode = Boolean(dossier);
  const dossierType = isEditMode ? dossier.type : initialType;

  const form = useForm<CreateDossierRequest | UpdateDossierRequest>({
    resolver: zodResolver(baseDossierSchema),
    defaultValues: {
      name_en: dossier?.name_en || '',
      name_ar: dossier?.name_ar || '',
      description_en: dossier?.description_en || '',
      description_ar: dossier?.description_ar || '',
      status: dossier?.status || 'active',
      sensitivity_level: dossier?.sensitivity_level || 0,
      tags: dossier?.tags || [],
    },
  });

  const handleSubmit = (data: CreateDossierRequest | UpdateDossierRequest) => {
    if (!isEditMode && dossierType) {
      // For create, add type
      onSubmit({ ...data, type: dossierType } as CreateDossierRequest);
    } else {
      // For update, no type field
      onSubmit(data);
    }
  };

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
          {/* Type indicator (edit mode only) */}
          {isEditMode && dossierType && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs sm:text-sm">
                {t(`type.${dossierType}`)}
              </Badge>
            </div>
          )}

          {/* Base Fields Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-start">
              {t('form.basicInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Name */}
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.nameEn')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.nameEnPlaceholder')}
                        className="min-h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Name */}
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.nameAr')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.nameArPlaceholder')}
                        className="min-h-11"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Description */}
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.descriptionEn')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('form.descriptionEnPlaceholder')}
                        className="min-h-[88px]"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Description */}
              <FormField
                control={form.control}
                name="description_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.descriptionAr')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('form.descriptionArPlaceholder')}
                        className="min-h-[88px]"
                        dir="rtl"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder={t('form.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                        <SelectItem value="archived">{t('status.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sensitivity Level */}
              <FormField
                control={form.control}
                name="sensitivity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.sensitivityLevel')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder={t('form.selectSensitivity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            {t(`sensitivityLevel.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('form.sensitivityDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Type-Specific Extension Fields */}
          {dossierType && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-start">
                {t(`form.${dossierType}Fields`)}
              </h3>

              {/* Person-specific fields */}
              {dossierType === 'person' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title English */}
                    <FormField
                      control={form.control}
                      name="extension_data.title_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.person.titleEn')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('form.person.titleEnPlaceholder')}
                              className="min-h-11"
                            />
                          </FormControl>
                          <FormDescription>{t('form.person.titleDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Title Arabic */}
                    <FormField
                      control={form.control}
                      name="extension_data.title_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.person.titleAr')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('form.person.titleArPlaceholder')}
                              className="min-h-11"
                              dir="rtl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Photo URL */}
                  <FormField
                    control={form.control}
                    name="extension_data.photo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.person.photoUrl')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder={t('form.person.photoUrlPlaceholder')}
                            className="min-h-11"
                          />
                        </FormControl>
                        <FormDescription>{t('form.person.photoUrlDescription')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Biography English */}
                    <FormField
                      control={form.control}
                      name="extension_data.biography_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.person.biographyEn')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t('form.person.biographyEnPlaceholder')}
                              className="min-h-[120px]"
                              rows={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Biography Arabic */}
                    <FormField
                      control={form.control}
                      name="extension_data.biography_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.person.biographyAr')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t('form.person.biographyArPlaceholder')}
                              className="min-h-[120px]"
                              dir="rtl"
                              rows={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Placeholder for other types - to be implemented if needed */}
              {dossierType !== 'person' && (
                <p className="text-sm text-muted-foreground text-start">
                  {t('form.typeSpecificFieldsPlaceholder', { type: t(`type.${dossierType}`) })}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 sm:justify-end pt-4 sm:pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="min-h-11 w-full sm:w-auto"
              >
                {t('form.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="min-h-11 w-full sm:w-auto"
            >
              {isLoading && <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />}
              {isEditMode ? t('form.update') : t('form.create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
