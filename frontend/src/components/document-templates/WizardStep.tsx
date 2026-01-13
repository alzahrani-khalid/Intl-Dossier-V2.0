/**
 * WizardStep Component
 * Renders a single step/section of the document template wizard
 * Mobile-first responsive design with RTL support
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, AlertCircle, HelpCircle, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type {
  DocumentTemplateSection,
  DocumentTemplateField,
  TemplateValidationError,
  SelectOption,
} from '@/types/document-template.types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WizardStepProps {
  section: DocumentTemplateSection & { fields: DocumentTemplateField[] }
  fieldValues: Record<string, unknown>
  validationErrors: TemplateValidationError[]
  onFieldChange: (fieldKey: string, value: unknown) => void
  isRTL: boolean
}

export function WizardStep({
  section,
  fieldValues,
  validationErrors,
  onFieldChange,
  isRTL,
}: WizardStepProps) {
  const { t } = useTranslation('document-templates')
  const dateLocale = isRTL ? ar : enUS

  const getFieldError = (fieldKey: string) => {
    return validationErrors.find((e) => e.field_key === fieldKey)
  }

  const renderField = (field: DocumentTemplateField) => {
    const value = fieldValues[field.field_key]
    const error = getFieldError(field.field_key)
    const label = isRTL ? field.label_ar : field.label_en
    const placeholder = isRTL ? field.placeholder_ar : field.placeholder_en
    const helpText = isRTL ? field.help_text_ar : field.help_text_en

    const fieldId = `field-${field.id}`
    const hasError = !!error

    const gridClass = cn(
      field.grid_width === 12
        ? 'col-span-12'
        : field.grid_width === 6
          ? 'col-span-12 sm:col-span-6'
          : field.grid_width === 4
            ? 'col-span-12 sm:col-span-6 md:col-span-4'
            : field.grid_width === 3
              ? 'col-span-12 sm:col-span-6 md:col-span-3'
              : 'col-span-12',
    )

    return (
      <div key={field.id} className={cn(gridClass, 'space-y-2')}>
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId} className={cn(hasError && 'text-destructive')}>
            {label}
            {field.is_required && <span className="text-destructive ms-1">*</span>}
          </Label>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'} className="max-w-xs">
                  {helpText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {renderFieldInput(field, value, fieldId, placeholder, hasError)}

        {hasError && (
          <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            {t(`validation.${error.error}`)}
          </p>
        )}
      </div>
    )
  }

  const renderFieldInput = (
    field: DocumentTemplateField,
    value: unknown,
    fieldId: string,
    placeholder: string | undefined,
    hasError: boolean,
  ) => {
    switch (field.field_type) {
      case 'text':
      case 'url':
        return (
          <Input
            id={fieldId}
            type={field.field_type === 'url' ? 'url' : 'text'}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            className={cn('min-h-11', hasError && 'border-destructive')}
            aria-invalid={hasError}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <Input
            id={fieldId}
            type="number"
            value={(value as number) || ''}
            onChange={(e) =>
              onFieldChange(field.field_key, e.target.value ? Number(e.target.value) : null)
            }
            placeholder={placeholder}
            className={cn('min-h-11', hasError && 'border-destructive')}
            aria-invalid={hasError}
            dir="ltr"
            step={field.field_type === 'percentage' ? '0.01' : '1'}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            className={cn('min-h-[100px]', hasError && 'border-destructive')}
            aria-invalid={hasError}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )

      case 'rich_text':
        // For now, use a textarea. In production, you'd use a rich text editor
        return (
          <Textarea
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            className={cn('min-h-[150px]', hasError && 'border-destructive')}
            aria-invalid={hasError}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={fieldId}
                variant="outline"
                className={cn(
                  'w-full min-h-11 justify-start text-start font-normal',
                  !value && 'text-muted-foreground',
                  hasError && 'border-destructive',
                )}
              >
                <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {value
                  ? format(new Date(value as string), 'PPP', { locale: dateLocale })
                  : placeholder || t('fields.selectOption')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
              <Calendar
                mode="single"
                selected={value ? new Date(value as string) : undefined}
                onSelect={(date) => onFieldChange(field.field_key, date?.toISOString())}
                locale={dateLocale}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </PopoverContent>
          </Popover>
        )

      case 'date_range':
        const dateRange = value as { from?: string; to?: string } | undefined
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 min-h-11 justify-start text-start font-normal',
                    !dateRange?.from && 'text-muted-foreground',
                    hasError && 'border-destructive',
                  )}
                >
                  <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {dateRange?.from
                    ? format(new Date(dateRange.from), 'PPP', { locale: dateLocale })
                    : t('fields.dateFrom')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
                <Calendar
                  mode="single"
                  selected={dateRange?.from ? new Date(dateRange.from) : undefined}
                  onSelect={(date) =>
                    onFieldChange(field.field_key, { ...dateRange, from: date?.toISOString() })
                  }
                  locale={dateLocale}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 min-h-11 justify-start text-start font-normal',
                    !dateRange?.to && 'text-muted-foreground',
                    hasError && 'border-destructive',
                  )}
                >
                  <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {dateRange?.to
                    ? format(new Date(dateRange.to), 'PPP', { locale: dateLocale })
                    : t('fields.dateTo')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
                <Calendar
                  mode="single"
                  selected={dateRange?.to ? new Date(dateRange.to) : undefined}
                  onSelect={(date) =>
                    onFieldChange(field.field_key, { ...dateRange, to: date?.toISOString() })
                  }
                  locale={dateLocale}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  disabled={(date) => (dateRange?.from ? date < new Date(dateRange.from) : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        )

      case 'select':
        const options = (field.options?.options || []) as SelectOption[]
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => onFieldChange(field.field_key, val)}
          >
            <SelectTrigger
              id={fieldId}
              className={cn('min-h-11', hasError && 'border-destructive')}
            >
              <SelectValue placeholder={placeholder || t('fields.selectOption')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {isRTL ? option.label_ar : option.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const multiOptions = (field.options?.options || []) as SelectOption[]
        const selectedValues = (value as string[]) || []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {selectedValues.map((val) => {
                const opt = multiOptions.find((o) => o.value === val)
                return (
                  <Badge key={val} variant="secondary" className="gap-1">
                    {opt ? (isRTL ? opt.label_ar : opt.label_en) : val}
                    <button
                      type="button"
                      onClick={() =>
                        onFieldChange(
                          field.field_key,
                          selectedValues.filter((v) => v !== val),
                        )
                      }
                      className="rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
            <Select
              value=""
              onValueChange={(val) => {
                if (!selectedValues.includes(val)) {
                  onFieldChange(field.field_key, [...selectedValues, val])
                }
              }}
            >
              <SelectTrigger
                id={fieldId}
                className={cn('min-h-11', hasError && 'border-destructive')}
              >
                <SelectValue placeholder={placeholder || t('fields.selectMultiple')} />
              </SelectTrigger>
              <SelectContent>
                {multiOptions
                  .filter((opt) => !selectedValues.includes(opt.value))
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isRTL ? option.label_ar : option.label_en}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2 min-h-11">
            <Checkbox
              id={fieldId}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => onFieldChange(field.field_key, checked)}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {isRTL ? field.label_ar : field.label_en}
            </Label>
          </div>
        )

      case 'file_attachment':
        return (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center min-h-[100px]',
              'hover:border-primary/50 transition-colors cursor-pointer',
              hasError && 'border-destructive',
            )}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('fields.dragDropFile')}</p>
            <input
              id={fieldId}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onFieldChange(field.field_key, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  })
                }
              }}
            />
          </div>
        )

      case 'entity_reference':
        // Simplified entity reference - in production, you'd use an entity search component
        return (
          <Input
            id={fieldId}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.field_key, e.target.value)}
            placeholder={placeholder || t('fields.selectEntity')}
            className={cn('min-h-11', hasError && 'border-destructive')}
            aria-invalid={hasError}
          />
        )

      case 'tags':
        const tags = (value as string[]) || []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      onFieldChange(
                        field.field_key,
                        tags.filter((_, i) => i !== index),
                      )
                    }
                    className="rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id={fieldId}
              type="text"
              placeholder={placeholder || t('fields.tags')}
              className={cn('min-h-11', hasError && 'border-destructive')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const input = e.target as HTMLInputElement
                  const newTag = input.value.trim()
                  if (newTag && !tags.includes(newTag)) {
                    onFieldChange(field.field_key, [...tags, newTag])
                    input.value = ''
                  }
                }
              }}
            />
          </div>
        )

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            className={cn('min-h-11', hasError && 'border-destructive')}
          />
        )
    }
  }

  const sectionName = isRTL ? section.name_ar : section.name_en
  const sectionDescription = isRTL ? section.description_ar : section.description_en

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Section header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{sectionName}</h3>
        {sectionDescription && (
          <p className="text-sm text-muted-foreground">{sectionDescription}</p>
        )}
        {section.is_optional && (
          <Badge variant="outline" className="mt-2">
            {t('wizard.optionalSection')}
          </Badge>
        )}
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {section.fields.sort((a, b) => a.field_order - b.field_order).map(renderField)}
      </div>
    </div>
  )
}

export default WizardStep
