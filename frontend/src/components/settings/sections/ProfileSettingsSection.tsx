import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Trash2, Upload, Loader2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'

// D-9: avatar upload constraints. Mirror the i18n copy (`avatarFormats`,
// `invalidFileType`, `fileTooLarge`) and the `avatars` bucket RLS.
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const AVATAR_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

interface ProfileSettingsSectionProps {
  form: UseFormReturn<any>
  email?: string
}

/**
 * Profile settings section component
 * Handles avatar, display name, job title, department, phone, and bio
 */
export function ProfileSettingsSection({ form, email }: ProfileSettingsSectionProps) {
  const { t } = useTranslation('settings')

  const displayName = form.watch('display_name')
  const avatarUrl = form.watch('avatar_url')

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  // D-9: avatar upload targets the `avatars` Storage bucket (public read,
  // owner-scoped writes under `<user_id>/`). On success the public URL is staged
  // into the form; the page's existing Save mutation persists `avatar_url` to the
  // `users` row. Clearing also stages a dirty change for the same Save path.
  const userId = useAuthStore((state) => state.user?.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleRemoveAvatar = useCallback(() => {
    form.setValue('avatar_url', null, { shouldDirty: true })
  }, [form])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0]
      // Allow re-selecting the same file after a failed/cleared attempt.
      event.target.value = ''
      if (file == null) return

      if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
        toast.error(t('profile.invalidFileType'))
        return
      }
      if (file.size > MAX_AVATAR_BYTES) {
        toast.error(t('profile.fileTooLarge'))
        return
      }
      if (userId == null) {
        toast.error(t('profile.avatarUploadError'))
        return
      }

      setIsUploading(true)
      try {
        const extension = AVATAR_EXTENSION_BY_TYPE[file.type] ?? 'jpg'
        // Unique name busts the public-URL CDN cache; first segment must equal
        // the user id to satisfy the bucket's owner-scoped INSERT policy.
        const path = `${userId}/avatar-${Date.now()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { contentType: file.type, upsert: true })
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)

        form.setValue('avatar_url', publicUrl, { shouldDirty: true })
        toast.success(t('profile.avatarUploaded'))
      } catch (error: unknown) {
        console.error('Avatar upload failed', error)
        toast.error(t('profile.avatarUploadError'))
      } finally {
        setIsUploading(false)
      }
    },
    [form, t, userId],
  )

  // D-20: surface Zod validation errors so a blocked submit isn't silent.
  const fieldError = (name: string): string | undefined => {
    const message = form.formState.errors[name]?.message
    return typeof message === 'string' ? message : undefined
  }

  return (
    <SettingsSectionCard
      title={t('profile.title')}
      description={t('profile.description')}
      icon={User}
    >
      <div className="space-y-6">
        {/* Avatar Section — upload, display, and clear (D-9) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <p className="text-sm font-medium text-start">{t('profile.avatar')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(',')}
              className="sr-only"
              onChange={handleFileSelect}
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 me-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 me-1" />
                )}
                {t('profile.uploadAvatar')}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 me-1" />
                  {t('profile.removeAvatar')}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-start">{t('profile.avatarFormats')}</p>
          </div>
        </div>

        {/* Form Fields */}
        <SettingsGroup>
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-start block">
              {t('profile.displayName')}
            </Label>
            <Input
              id="display_name"
              {...form.register('display_name')}
              aria-invalid={!!fieldError('display_name')}
              aria-describedby={fieldError('display_name') ? 'display_name-error' : undefined}
              className="max-w-md"
            />
            {fieldError('display_name') && (
              <p
                id="display_name-error"
                role="alert"
                className="text-xs text-destructive text-start"
              >
                {fieldError('display_name')}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-start">
              {t('profile.displayNameHint')}
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-start block">
              {t('profile.email')}
            </Label>
            <Input id="email" value={email || ''} disabled className="max-w-md bg-muted" />
            <p className="text-xs text-muted-foreground text-start">{t('profile.emailHint')}</p>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-start block">
              {t('profile.jobTitle')}
            </Label>
            <Input
              id="job_title"
              {...form.register('job_title')}
              placeholder={t('profile.jobTitlePlaceholder')}
              aria-invalid={!!fieldError('job_title')}
              aria-describedby={fieldError('job_title') ? 'job_title-error' : undefined}
              className="max-w-md"
            />
            {fieldError('job_title') && (
              <p id="job_title-error" role="alert" className="text-xs text-destructive text-start">
                {fieldError('job_title')}
              </p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-start block">
              {t('profile.department')}
            </Label>
            <Input
              id="department"
              {...form.register('department')}
              placeholder={t('profile.departmentPlaceholder')}
              aria-invalid={!!fieldError('department')}
              aria-describedby={fieldError('department') ? 'department-error' : undefined}
              className="max-w-md"
            />
            {fieldError('department') && (
              <p id="department-error" role="alert" className="text-xs text-destructive text-start">
                {fieldError('department')}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-start block">
              {t('profile.phone')}
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register('phone')}
              placeholder={t('profile.phonePlaceholder')}
              aria-invalid={!!fieldError('phone')}
              aria-describedby={fieldError('phone') ? 'phone-error' : undefined}
              className="max-w-md"
              dir="ltr"
            />
            {fieldError('phone') && (
              <p id="phone-error" role="alert" className="text-xs text-destructive text-start">
                {fieldError('phone')}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-start block">
              {t('profile.bio')}
            </Label>
            <Textarea
              id="bio"
              {...form.register('bio')}
              placeholder={t('profile.bioPlaceholder')}
              aria-invalid={!!fieldError('bio')}
              aria-describedby={fieldError('bio') ? 'bio-error' : undefined}
              className="max-w-md resize-none"
              rows={3}
              maxLength={200}
            />
            {fieldError('bio') && (
              <p id="bio-error" role="alert" className="text-xs text-destructive text-start">
                {fieldError('bio')}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-start">{t('profile.bioHint')}</p>
          </div>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
