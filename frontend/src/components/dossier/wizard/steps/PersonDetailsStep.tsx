import type { ReactElement } from 'react'
import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { Upload, X } from 'lucide-react'

import { FormWizardStep } from '@/components/ui/form-wizard'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDirection } from '@/hooks/useDirection'
import { useUploadStore } from '@/services/upload'
import type { PersonFormData } from '../schemas/person.schema'

interface PersonDetailsStepProps {
  form: UseFormReturn<PersonFormData>
}

export function PersonDetailsStep({ form }: PersonDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFile } = useUploadStore()

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0]
      if (file == null) return

      // Show immediate preview
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      setIsUploading(true)

      try {
        await uploadFile(file, {
          bucket: 'attachments',
          path: 'person-photos',
          onComplete: (url: string) => {
            form.setValue('photo_url', url)
          },
          onError: (error: string) => {
            console.error('Photo upload failed:', error)
          },
        })
      } catch {
        // Keep local preview, user can retry or remove
        console.error('Photo upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [form, uploadFile],
  )

  const handleRemovePhoto = useCallback((): void => {
    setPreviewUrl(null)
    form.setValue('photo_url', '')
    if (fileInputRef.current != null) {
      fileInputRef.current.value = ''
    }
  }, [form])

  const currentPhotoUrl = form.watch('photo_url')
  const displayUrl = previewUrl ?? (currentPhotoUrl !== '' ? currentPhotoUrl : null)

  return (
    <FormWizardStep stepId="person-details" className="space-y-6">
      {/* Title pair - bilingual free-text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title EN */}
        <FormField
          control={form.control}
          name="title_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:person.title_en')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  placeholder={t('form-wizard:person.title_en_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title AR */}
        <FormField
          control={form.control}
          name="title_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:person.title_ar')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  dir={direction}
                  placeholder={t('form-wizard:person.title_ar_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Photo file picker with thumbnail preview */}
      <FormField
        control={form.control}
        name="photo_url"
        render={() => (
          <FormItem>
            <FormLabel>{t('form-wizard:person.photo')}</FormLabel>
            <div className="flex items-start gap-4">
              {/* Thumbnail preview */}
              {displayUrl != null && (
                <div className="relative">
                  <img
                    src={displayUrl}
                    alt=""
                    className="h-32 w-32 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -end-2 rounded-full bg-destructive text-destructive-foreground p-1 min-h-[28px] min-w-[28px] flex items-center justify-center"
                    aria-label={t('form-wizard:person.remove_photo')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {/* File picker button */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleFileSelect(e)
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 min-h-11 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? '...' : t('form-wizard:person.upload_photo')}
                </button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Biography EN */}
      <FormField
        control={form.control}
        name="biography_en"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:person.biography_en')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[88px]"
                placeholder={t('form-wizard:person.biography_en_ph')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Biography AR */}
      <FormField
        control={form.control}
        name="biography_ar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:person.biography_ar')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[88px]"
                dir={direction}
                placeholder={t('form-wizard:person.biography_ar_ph')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormWizardStep>
  )
}
