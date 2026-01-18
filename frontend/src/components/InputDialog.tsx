/**
 * InputDialog - A styled modal dialog for collecting user input
 * Replaces browser prompt() for better UX and accessibility
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export interface InputDialogOption {
  value: string
  label: string
}

export interface InputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'textarea' | 'select'
  options?: InputDialogOption[]
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (value: string) => void
  onCancel?: () => void
  isLoading?: boolean
  required?: boolean
  minLength?: number
  maxLength?: number
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue = '',
  inputType = 'text',
  options = [],
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  required = true,
  minLength,
  maxLength,
}: InputDialogProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)

  // Reset value when dialog opens/closes
  useEffect(() => {
    if (open) {
      setValue(defaultValue)
      setError(null)
    }
  }, [open, defaultValue])

  const validate = useCallback(() => {
    if (required && !value.trim()) {
      setError(t('validation.required', 'This field is required'))
      return false
    }
    if (minLength && value.length < minLength) {
      setError(t('validation.minLength', { min: minLength }))
      return false
    }
    if (maxLength && value.length > maxLength) {
      setError(t('validation.maxLength', { max: maxLength }))
      return false
    }
    setError(null)
    return true
  }, [value, required, minLength, maxLength, t])

  const handleConfirm = () => {
    if (validate()) {
      onConfirm(value.trim())
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {inputType === 'text' && (
            <div className="space-y-2">
              <Input
                id="dialog-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                className={error ? 'border-red-500' : ''}
                disabled={isLoading}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {inputType === 'textarea' && (
            <div className="space-y-2">
              <Textarea
                id="dialog-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={error ? 'border-red-500' : ''}
                disabled={isLoading}
                rows={4}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {inputType === 'select' && (
            <div className="space-y-2">
              <Select value={value} onValueChange={setValue} disabled={isLoading}>
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>

        <DialogFooter thumbZone>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelLabel || t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('common.saving', 'Saving...')}
              </span>
            ) : (
              confirmLabel || t('common.confirm', 'Confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
