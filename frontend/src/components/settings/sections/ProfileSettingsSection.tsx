import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Trash2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'

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

  // D-9: avatar upload targets a non-existent `avatars` Storage bucket, so it
  // always errored. The upload control is hidden until the bucket exists; the
  // avatar is shown read-only and can still be cleared (avatar_url is a real
  // `users` column). Re-introduce upload once the bucket is provisioned.
  const handleRemoveAvatar = useCallback(() => {
    form.setValue('avatar_url', null, { shouldDirty: true })
  }, [form])

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
        {/* Avatar Section — display + clear only (upload hidden until bucket exists, D-9) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium text-start">{t('profile.avatar')}</p>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 me-1" />
                {t('profile.removeAvatar')}
              </Button>
            )}
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
