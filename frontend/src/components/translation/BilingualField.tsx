/**
 * BilingualField Component
 * Feature: translation-service
 *
 * A combined component for bilingual (English/Arabic) input fields
 * with integrated translation buttons.
 */

import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TranslateButton } from './TranslateButton'
import type { BilingualFieldProps } from '@/types/translation.types'

export function BilingualField({
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  labelKey,
  fieldType = 'input',
  rows = 3,
  placeholderKey,
  required = false,
  disabled = false,
  contentType = 'general',
  entityType,
  entityId,
  showTranslateButtons = true,
}: BilingualFieldProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const InputComponent = fieldType === 'textarea' ? Textarea : Input

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* English Field */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${labelKey}-en`} className="flex items-center gap-1">
            {t(`${labelKey}_en`, { defaultValue: `${t(labelKey)} (EN)` })}
            {required && <span className="text-destructive">*</span>}
          </Label>
          {showTranslateButtons && valueAr && !valueEn && (
            <TranslateButton
              sourceText={valueAr}
              onTranslate={onChangeEn}
              direction="ar_to_en"
              contentType={contentType}
              entityType={entityType}
              entityId={entityId}
              fieldName={`${labelKey}_en`}
              disabled={disabled}
              size="sm"
            />
          )}
        </div>
        <div className="relative">
          <InputComponent
            id={`${labelKey}-en`}
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            placeholder={placeholderKey ? t(`${placeholderKey}_en`) : undefined}
            disabled={disabled}
            required={required}
            dir="ltr"
            {...(fieldType === 'textarea' ? { rows } : {})}
            className={cn(showTranslateButtons && valueEn && !valueAr && 'pe-10')}
          />
          {showTranslateButtons && valueEn && !valueAr && (
            <div className="absolute end-1 top-1">
              <TranslateButton
                sourceText={valueEn}
                onTranslate={onChangeAr}
                direction="en_to_ar"
                contentType={contentType}
                entityType={entityType}
                entityId={entityId}
                fieldName={`${labelKey}_ar`}
                disabled={disabled}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Arabic Field */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${labelKey}-ar`} className="flex items-center gap-1">
            {t(`${labelKey}_ar`, { defaultValue: `${t(labelKey)} (AR)` })}
            {required && <span className="text-destructive">*</span>}
          </Label>
          {showTranslateButtons && valueEn && !valueAr && (
            <TranslateButton
              sourceText={valueEn}
              onTranslate={onChangeAr}
              direction="en_to_ar"
              contentType={contentType}
              entityType={entityType}
              entityId={entityId}
              fieldName={`${labelKey}_ar`}
              disabled={disabled}
              size="sm"
            />
          )}
        </div>
        <div className="relative">
          <InputComponent
            id={`${labelKey}-ar`}
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholderKey ? t(`${placeholderKey}_ar`) : undefined}
            disabled={disabled}
            required={required}
            dir="rtl"
            {...(fieldType === 'textarea' ? { rows } : {})}
            className={cn(showTranslateButtons && valueAr && !valueEn && 'ps-10')}
          />
          {showTranslateButtons && valueAr && !valueEn && (
            <div className="absolute start-1 top-1">
              <TranslateButton
                sourceText={valueAr}
                onTranslate={onChangeEn}
                direction="ar_to_en"
                contentType={contentType}
                entityType={entityType}
                entityId={entityId}
                fieldName={`${labelKey}_en`}
                disabled={disabled}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BilingualField
