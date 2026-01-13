/**
 * Person Create Page
 * Feature: persons-entity-management
 *
 * Form for creating new person dossiers.
 * Mobile-first design with RTL support.
 */

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Languages,
  Briefcase,
  Star,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreatePerson } from '@/hooks/usePersons'
import type { ImportanceLevel } from '@/types/person.types'
import { IMPORTANCE_LEVEL_LABELS } from '@/types/person.types'

// Form validation schema
const personFormSchema = z.object({
  name_en: z.string().min(2, 'Name must be at least 2 characters').max(200),
  name_ar: z.string().min(2, 'Name must be at least 2 characters').max(200),
  title_en: z.string().max(200).optional(),
  title_ar: z.string().max(200).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  organization_name: z.string().max(200).optional(),
  biography_en: z.string().max(5000).optional(),
  biography_ar: z.string().max(5000).optional(),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  importance_level: z.number().min(1).max(5).default(1),
  languages: z.string().optional(),
  expertise_areas: z.string().optional(),
})

type PersonFormValues = z.infer<typeof personFormSchema>

export function PersonCreatePage() {
  const { t, i18n } = useTranslation('persons')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const createPerson = useCreatePerson()

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      title_en: '',
      title_ar: '',
      email: '',
      phone: '',
      organization_name: '',
      biography_en: '',
      biography_ar: '',
      linkedin_url: '',
      twitter_url: '',
      importance_level: 1,
      languages: '',
      expertise_areas: '',
    },
  })

  const onSubmit = async (data: PersonFormValues) => {
    try {
      const result = await createPerson.mutateAsync({
        name_en: data.name_en,
        name_ar: data.name_ar,
        title_en: data.title_en || undefined,
        title_ar: data.title_ar || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        biography_en: data.biography_en || undefined,
        biography_ar: data.biography_ar || undefined,
        linkedin_url: data.linkedin_url || undefined,
        twitter_url: data.twitter_url || undefined,
        importance_level: data.importance_level as ImportanceLevel,
        languages: data.languages ? data.languages.split(',').map((l) => l.trim()) : undefined,
        expertise_areas: data.expertise_areas
          ? data.expertise_areas.split(',').map((e) => e.trim())
          : undefined,
      })

      navigate({ to: '/persons/$personId', params: { personId: result.id } })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleBack = () => {
    navigate({ to: '/persons' })
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10">
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {t('create.title', 'Add New Person')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('create.subtitle', 'Create a new contact profile')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  {t('create.sections.basicInfo', 'Basic Information')}
                </CardTitle>
                <CardDescription>
                  {t('create.sections.basicInfoDescription', "Enter the person's name and title")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.nameEn', 'Name (English)')} *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.nameAr', 'Name (Arabic)')} *</FormLabel>
                        <FormControl>
                          <Input placeholder="جون دو" dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.titleEn', 'Title (English)')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Director of Operations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.titleAr', 'Title (Arabic)')}</FormLabel>
                        <FormControl>
                          <Input placeholder="مدير العمليات" dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="importance_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        {t('form.importanceLevel', 'Importance Level')}
                      </FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {([1, 2, 3, 4, 5] as ImportanceLevel[]).map((level) => (
                            <SelectItem key={level} value={String(level)}>
                              {isRTL
                                ? IMPORTANCE_LEVEL_LABELS[level].ar
                                : IMPORTANCE_LEVEL_LABELS[level].en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('form.importanceLevelDescription', 'How important is this contact?')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  {t('create.sections.contactInfo', 'Contact Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('form.email', 'Email')}
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('form.phone', 'Phone')}
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+966 50 123 4567" dir="ltr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('form.linkedin', 'LinkedIn')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('form.twitter', 'Twitter / X')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {t('create.sections.professionalDetails', 'Professional Details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        {t('form.languages', 'Languages')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="English, Arabic, French" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('form.languagesDescription', 'Comma-separated list of languages')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expertise_areas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.expertiseAreas', 'Expertise Areas')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Statistics, Data Analysis, Policy" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'form.expertiseAreasDescription',
                          'Comma-separated list of expertise areas',
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Biography */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('create.sections.biography', 'Biography')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="biography_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.biographyEn', 'Biography (English)')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Professional background and achievements..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biography_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.biographyAr', 'Biography (Arabic)')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="السيرة المهنية والإنجازات..."
                          className="min-h-[100px]"
                          dir="rtl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button type="button" variant="outline" onClick={handleBack}>
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createPerson.isPending}>
                {createPerson.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Save className="h-4 w-4 me-2" />
                )}
                {t('actions.create', 'Create Person')}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  )
}

export default PersonCreatePage
