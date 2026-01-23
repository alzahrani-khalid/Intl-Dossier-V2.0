/**
 * ArrayFieldManager Component
 *
 * A unified, reusable component for managing dynamic array fields (emails, phones, etc.)
 * with built-in validation, animations, and RTL support.
 *
 * Features:
 * - Add/remove items with smooth animations
 * - Per-item validation with contextual errors
 * - Minimum/maximum item constraints
 * - Drag-and-drop reordering (optional)
 * - Mobile-first, RTL-compatible design
 * - Integration with react-hook-form
 *
 * @module components/Forms/ArrayFieldManager
 */

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { Plus, X, GripVertical, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  Path,
  PathValue,
} from 'react-hook-form'

// =============================================================================
// TYPES
// =============================================================================

export interface ArrayFieldItem {
  id: string
  value: string
}

export interface ArrayFieldValidation {
  pattern?: RegExp
  patternMessage?: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

export interface ArrayFieldManagerProps<TFormValues extends Record<string, unknown>> {
  /** Field name in the form (e.g., 'email_addresses') */
  name: Path<TFormValues>
  /** Label for the field group */
  label: string
  /** Placeholder for individual items */
  placeholder?: string
  /** Input type (email, tel, text, url) */
  inputType?: 'email' | 'tel' | 'text' | 'url'
  /** Minimum number of items required */
  minItems?: number
  /** Maximum number of items allowed */
  maxItems?: number
  /** Allow drag-and-drop reordering */
  allowReorder?: boolean
  /** Validation rules for individual items */
  validation?: ArrayFieldValidation
  /** Help text shown below the field */
  helpText?: string
  /** react-hook-form register function */
  register?: UseFormRegister<TFormValues>
  /** react-hook-form watch function */
  watch?: UseFormWatch<TFormValues>
  /** react-hook-form setValue function */
  setValue?: UseFormSetValue<TFormValues>
  /** react-hook-form errors */
  errors?: FieldErrors<TFormValues>
  /** External values (if not using react-hook-form) */
  values?: string[]
  /** External onChange handler (if not using react-hook-form) */
  onChange?: (values: string[]) => void
  /** Text for add button */
  addButtonText?: string
  /** Additional class names */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

// =============================================================================
// UTILITIES
// =============================================================================

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function validateItem(
  value: string,
  validation?: ArrayFieldValidation,
): { isValid: boolean; message?: string } {
  if (!value.trim()) {
    if (validation?.required) {
      return { isValid: false, message: 'validation.required' }
    }
    return { isValid: true }
  }

  if (validation?.minLength && value.length < validation.minLength) {
    return { isValid: false, message: 'validation.min_length' }
  }

  if (validation?.maxLength && value.length > validation.maxLength) {
    return { isValid: false, message: 'validation.max_length' }
  }

  if (validation?.pattern && !validation.pattern.test(value)) {
    return { isValid: false, message: validation.patternMessage || 'validation.invalid_format' }
  }

  return { isValid: true }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ArrayFieldItemRowProps {
  item: ArrayFieldItem
  index: number
  inputType: string
  placeholder: string
  validation?: ArrayFieldValidation
  allowReorder: boolean
  canRemove: boolean
  isRTL: boolean
  disabled?: boolean
  onChange: (id: string, value: string) => void
  onRemove: (id: string) => void
  error?: string
}

function ArrayFieldItemRow({
  item,
  index,
  inputType,
  placeholder,
  validation,
  allowReorder,
  canRemove,
  isRTL,
  disabled,
  onChange,
  onRemove,
  error,
}: ArrayFieldItemRowProps) {
  const { t } = useTranslation('validation')
  const [localError, setLocalError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(item.id, newValue)

      // Validate on change if touched
      if (touched) {
        const result = validateItem(newValue, validation)
        setLocalError(result.isValid ? null : result.message || null)
      }
    },
    [item.id, onChange, touched, validation],
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
    const result = validateItem(item.value, validation)
    setLocalError(result.isValid ? null : result.message || null)
  }, [item.value, validation])

  const displayError = error || (touched && localError ? t(localError) : null)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group"
    >
      <div className="flex items-start gap-2">
        {/* Reorder handle */}
        {allowReorder && (
          <Reorder.Item
            value={item}
            id={item.id}
            className={cn(
              'flex items-center justify-center',
              'h-11 w-8 sm:h-10',
              'cursor-grab active:cursor-grabbing',
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200',
              disabled && 'pointer-events-none opacity-30',
            )}
          >
            <GripVertical className="h-4 w-4" />
          </Reorder.Item>
        )}

        {/* Input field */}
        <div className="flex-1">
          <div className="relative">
            <Input
              type={inputType}
              value={item.value}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={`${placeholder} ${index + 1}`}
              aria-invalid={!!displayError}
              className={cn(
                'h-11 px-4 text-base sm:h-10',
                displayError && 'border-red-500 focus-visible:ring-red-500',
              )}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {displayError && (
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2',
                  'text-red-500',
                  isRTL ? 'start-3' : 'end-3',
                )}
              >
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Error message */}
          <AnimatePresence>
            {displayError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {displayError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Remove button */}
        {canRemove && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            className={cn(
              'h-11 w-11 sm:h-10 sm:w-10',
              'shrink-0',
              'opacity-60 hover:opacity-100',
              'hover:bg-red-50 hover:border-red-200 hover:text-red-600',
              'dark:hover:bg-red-950 dark:hover:border-red-800 dark:hover:text-red-400',
              'transition-all duration-200',
            )}
            aria-label={`Remove item ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ArrayFieldManager<TFormValues extends Record<string, unknown>>({
  name,
  label,
  placeholder = '',
  inputType = 'text',
  minItems = 1,
  maxItems = 10,
  allowReorder = false,
  validation,
  helpText,
  register,
  watch,
  setValue,
  errors,
  values: externalValues,
  onChange: externalOnChange,
  addButtonText,
  className,
  disabled = false,
}: ArrayFieldManagerProps<TFormValues>) {
  const { t, i18n } = useTranslation(['common', 'validation'])
  const isRTL = i18n.language === 'ar'

  // State for items
  const [items, setItems] = useState<ArrayFieldItem[]>(() => {
    const initialValues = externalValues || (watch?.(name) as string[]) || ['']
    return initialValues.map((value) => ({
      id: generateId(),
      value: value || '',
    }))
  })

  // Sync external values if they change
  const syncValues = useCallback(
    (newItems: ArrayFieldItem[]) => {
      const values = newItems.map((item) => item.value)

      if (setValue) {
        setValue(name, values as PathValue<TFormValues, Path<TFormValues>>)
      }

      if (externalOnChange) {
        externalOnChange(values)
      }
    },
    [name, setValue, externalOnChange],
  )

  // Update item value
  const handleItemChange = useCallback(
    (id: string, value: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) => (item.id === id ? { ...item, value } : item))
        syncValues(newItems)
        return newItems
      })
    },
    [syncValues],
  )

  // Add new item
  const handleAddItem = useCallback(() => {
    if (items.length >= maxItems) return

    setItems((prev) => {
      const newItems = [...prev, { id: generateId(), value: '' }]
      syncValues(newItems)
      return newItems
    })
  }, [items.length, maxItems, syncValues])

  // Remove item
  const handleRemoveItem = useCallback(
    (id: string) => {
      if (items.length <= minItems) return

      setItems((prev) => {
        const newItems = prev.filter((item) => item.id !== id)
        syncValues(newItems)
        return newItems
      })
    },
    [items.length, minItems, syncValues],
  )

  // Handle reorder
  const handleReorder = useCallback(
    (newItems: ArrayFieldItem[]) => {
      setItems(newItems)
      syncValues(newItems)
    },
    [syncValues],
  )

  // Get field errors from react-hook-form
  const getItemError = (index: number): string | undefined => {
    if (!errors) return undefined
    const fieldErrors = errors[name as keyof typeof errors]
    if (Array.isArray(fieldErrors)) {
      const error = fieldErrors[index]
      return error?.message as string | undefined
    }
    return undefined
  }

  const canAddMore = items.length < maxItems
  const canRemove = items.length > minItems

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">
          {label}
          {minItems > 0 && (
            <span className="ms-1 text-xs text-gray-500">
              ({t('common:forms.min_items', { count: minItems })})
            </span>
          )}
        </Label>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {items.length} / {maxItems}
        </span>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {allowReorder ? (
          <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <ArrayFieldItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  inputType={inputType}
                  placeholder={placeholder}
                  validation={validation}
                  allowReorder={allowReorder}
                  canRemove={canRemove}
                  isRTL={isRTL}
                  disabled={disabled}
                  onChange={handleItemChange}
                  onRemove={handleRemoveItem}
                  error={getItemError(index)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <ArrayFieldItemRow
                key={item.id}
                item={item}
                index={index}
                inputType={inputType}
                placeholder={placeholder}
                validation={validation}
                allowReorder={false}
                canRemove={canRemove}
                isRTL={isRTL}
                disabled={disabled}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
                error={getItemError(index)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add button */}
      {canAddMore && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={disabled}
            className={cn(
              'h-9 gap-2',
              'border-dashed',
              'hover:border-primary-500 hover:text-primary-600',
              'transition-colors duration-200',
            )}
          >
            <Plus className="h-4 w-4" />
            {addButtonText || t('common:forms.add_item')}
          </Button>
        </motion.div>
      )}

      {/* Help text */}
      {helpText && <p className="text-sm text-gray-600 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Pre-configured ArrayFieldManager for email addresses
 */
export function EmailArrayField<TFormValues extends Record<string, unknown>>(
  props: Omit<ArrayFieldManagerProps<TFormValues>, 'inputType' | 'validation'>,
) {
  const { t } = useTranslation('validation')

  return (
    <ArrayFieldManager
      {...props}
      inputType="email"
      validation={{
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: t('email_invalid'),
      }}
    />
  )
}

/**
 * Pre-configured ArrayFieldManager for phone numbers
 */
export function PhoneArrayField<TFormValues extends Record<string, unknown>>(
  props: Omit<ArrayFieldManagerProps<TFormValues>, 'inputType' | 'validation'>,
) {
  const { t } = useTranslation('validation')

  return (
    <ArrayFieldManager
      {...props}
      inputType="tel"
      validation={{
        pattern: /^[\d\s\-+()]+$/,
        patternMessage: t('phone_invalid'),
        minLength: 7,
      }}
    />
  )
}

/**
 * Pre-configured ArrayFieldManager for URLs
 */
export function UrlArrayField<TFormValues extends Record<string, unknown>>(
  props: Omit<ArrayFieldManagerProps<TFormValues>, 'inputType' | 'validation'>,
) {
  const { t } = useTranslation('validation')

  return (
    <ArrayFieldManager
      {...props}
      inputType="url"
      validation={{
        pattern: /^https?:\/\/.+/,
        patternMessage: t('url_invalid'),
      }}
    />
  )
}

export default ArrayFieldManager
