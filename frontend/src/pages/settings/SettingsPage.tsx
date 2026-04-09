import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { switchLanguage } from '@/i18n'
import { useTheme } from '@/hooks/useTheme'
import {
  SettingsLayout,
  SettingsSectionWrapper,
  SettingsSectionSkeleton,
  ProfileSettingsSection,
  GeneralSettingsSection,
  AppearanceSettingsSection,
  NotificationsSettingsSection,
  SecuritySettingsSection,
  AccessibilitySettingsSection,
  DataPrivacySettingsSection,
} from '@/components/settings'
import { EmailDigestSettings } from '@/components/email/EmailDigestSettings'
import { BotIntegrationsSettings } from '@/components/settings/BotIntegrationsSettings'
import { SettingsSectionId, defaultUserSettings } from '@/types/settings.types'

/**
 * Settings form schema
 */
const settingsSchema = z.object({
  // Profile
  display_name: z.string().min(1).max(100),
  job_title: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(200).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),

  // General
  language_preference: z.enum(['en', 'ar']),
  timezone: z.string(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  start_of_week: z.enum(['sunday', 'monday', 'saturday']),

  // Appearance
  color_mode: z.enum(['light', 'dark', 'system']),
  theme: z.enum(['canvas', 'ocean', 'sunset', 'azure', 'lavender']),
  display_density: z.enum(['compact', 'comfortable', 'spacious']),

  // Notifications
  notifications_push: z.boolean(),
  notifications_email: z.boolean(),
  notifications_mou_expiry: z.boolean(),
  notifications_event_reminders: z.boolean(),
  notifications_report_generation: z.boolean(),
  notifications_assignment_updates: z.boolean(),
  notifications_commitment_deadlines: z.boolean(),
  notifications_mentions: z.boolean(),

  // Accessibility
  high_contrast: z.boolean(),
  large_text: z.boolean(),
  reduce_motion: z.boolean(),
  keyboard_only: z.boolean(),
  focus_indicators: z.enum(['default', 'enhanced', 'none']),
  screen_reader: z.boolean(),

  // Security
  mfa_enabled: z.boolean(),
  session_timeout: z.number().min(5).max(480),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

/**
 * Main Settings Page component
 * Provides a comprehensive settings management interface with multiple sections
 */
export function SettingsPage() {
  const { t } = useTranslation('settings')
  const { user } = useAuthStore()
  const { setColorMode } = useTheme()
  const queryClient = useQueryClient()

  // Active section state
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile')

  // Fetch current user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      // Row doesn't exist yet — return defaults, form will create on first save
      if (data === null) {
        return defaultUserSettings as SettingsFormValues
      }

      // Map database fields to form fields with defaults
      return {
        // Profile
        display_name: data.display_name || data.email?.split('@')[0] || '',
        job_title: data.job_title || null,
        department: data.department || null,
        phone: data.phone || null,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,

        // General
        language_preference: data.language_preference || 'en',
        timezone: data.timezone || 'UTC',
        date_format: data.date_format || 'DD/MM/YYYY',
        start_of_week: data.start_of_week || 'sunday',

        // Appearance
        color_mode: data.color_mode || 'system',
        theme: data.theme || 'canvas',
        display_density: data.display_density || 'comfortable',

        // Notifications
        notifications_push: data.notifications_push ?? true,
        notifications_email: data.notifications_email ?? true,
        notifications_mou_expiry: data.notifications_mou_expiry ?? true,
        notifications_event_reminders: data.notifications_event_reminders ?? true,
        notifications_report_generation: data.notifications_report_generation ?? true,
        notifications_assignment_updates: data.notifications_assignment_updates ?? true,
        notifications_commitment_deadlines: data.notifications_commitment_deadlines ?? true,
        notifications_mentions: data.notifications_mentions ?? true,

        // Accessibility
        high_contrast: data.high_contrast ?? false,
        large_text: data.large_text ?? false,
        reduce_motion: data.reduce_motion ?? false,
        keyboard_only: data.keyboard_only ?? false,
        focus_indicators: data.focus_indicators || 'default',
        screen_reader: data.screen_reader ?? false,

        // Security
        mfa_enabled: data.mfa_enabled ?? false,
        session_timeout: data.session_timeout ?? 30,
      } as SettingsFormValues
    },
    enabled: !!user?.id,
  })

  // Initialize form with fetched settings
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultUserSettings as SettingsFormValues,
    values: settings,
  })

  const hasChanges = form.formState.isDirty

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { error } = await supabase.from('users').upsert({
        id: user.id,

        // Profile
        display_name: values.display_name,
        job_title: values.job_title,
        department: values.department,
        phone: values.phone,
        bio: values.bio,
        avatar_url: values.avatar_url,

        // General
        language_preference: values.language_preference,
        timezone: values.timezone,
        date_format: values.date_format,
        start_of_week: values.start_of_week,

        // Appearance
        color_mode: values.color_mode,
        theme: values.theme,
        display_density: values.display_density,

        // Notifications
        notifications_push: values.notifications_push,
        notifications_email: values.notifications_email,
        notifications_mou_expiry: values.notifications_mou_expiry,
        notifications_event_reminders: values.notifications_event_reminders,
        notifications_report_generation: values.notifications_report_generation,
        notifications_assignment_updates: values.notifications_assignment_updates,
        notifications_commitment_deadlines: values.notifications_commitment_deadlines,
        notifications_mentions: values.notifications_mentions,

        // Accessibility
        high_contrast: values.high_contrast,
        large_text: values.large_text,
        reduce_motion: values.reduce_motion,
        keyboard_only: values.keyboard_only,
        focus_indicators: values.focus_indicators,
        screen_reader: values.screen_reader,

        // Security
        mfa_enabled: values.mfa_enabled,
        session_timeout: values.session_timeout,

        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      return values
    },
    onSuccess: async (values) => {
      // Apply language change if needed
      if (values.language_preference !== settings?.language_preference) {
        await switchLanguage(values.language_preference)
      }

      // Apply color mode change
      if (values.color_mode !== settings?.color_mode) {
        // Map 'system' to the actual system preference
        const effectiveMode =
          values.color_mode === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : values.color_mode
        setColorMode(effectiveMode as 'light' | 'dark')
      }

      // Apply accessibility settings
      applyAccessibilitySettings(values)

      // Invalidate and reset form
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      form.reset(values)

      toast.success(t('savedSuccessfully'))
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  // Apply accessibility settings to document
  const applyAccessibilitySettings = useCallback((values: SettingsFormValues) => {
    const root = document.documentElement

    // High contrast
    root.classList.toggle('high-contrast', values.high_contrast)

    // Large text
    root.classList.toggle('large-text', values.large_text)

    // Reduce motion
    root.classList.toggle('reduce-motion', values.reduce_motion)

    // Focus indicators
    root.dataset.focusIndicators = values.focus_indicators
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    void form.handleSubmit((values) => {
      saveMutation.mutate(values)
    })()
  }, [form, saveMutation])

  // Handle section change
  const handleSectionChange = useCallback((section: SettingsSectionId) => {
    setActiveSection(section)
  }, [])

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      hasChanges={hasChanges}
      isSaving={saveMutation.isPending}
      onSave={handleSave}
    >
      {isLoading ? (
        <SettingsSectionSkeleton />
      ) : (
        <>
          {/* Profile Section */}
          <SettingsSectionWrapper sectionId="profile" activeSection={activeSection}>
            <ProfileSettingsSection form={form} email={user?.email} />
          </SettingsSectionWrapper>

          {/* General Section */}
          <SettingsSectionWrapper sectionId="general" activeSection={activeSection}>
            <GeneralSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Appearance Section */}
          <SettingsSectionWrapper sectionId="appearance" activeSection={activeSection}>
            <AppearanceSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Notifications Section */}
          <SettingsSectionWrapper sectionId="notifications" activeSection={activeSection}>
            <NotificationsSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Email Digest Section - Using existing component */}
          <SettingsSectionWrapper sectionId="email-digest" activeSection={activeSection}>
            <EmailDigestSettings />
          </SettingsSectionWrapper>

          {/* Integrations Section - Using existing component */}
          <SettingsSectionWrapper sectionId="integrations" activeSection={activeSection}>
            <BotIntegrationsSettings />
          </SettingsSectionWrapper>

          {/* Accessibility Section */}
          <SettingsSectionWrapper sectionId="accessibility" activeSection={activeSection}>
            <AccessibilitySettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Data & Privacy Section */}
          <SettingsSectionWrapper sectionId="data-privacy" activeSection={activeSection}>
            <DataPrivacySettingsSection />
          </SettingsSectionWrapper>

          {/* Security Section */}
          <SettingsSectionWrapper sectionId="security" activeSection={activeSection}>
            <SecuritySettingsSection form={form} />
          </SettingsSectionWrapper>
        </>
      )}
    </SettingsLayout>
  )
}
