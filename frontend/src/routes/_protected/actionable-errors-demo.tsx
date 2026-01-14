/**
 * Actionable Errors Demo Page
 * Demonstrates the actionable error handling with fix buttons
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ActionableErrorMessage,
  ActionableErrorSummary,
  FieldErrorHighlight,
  useActionableErrors,
} from '@/components/actionable-errors'
import type { ActionableError, ErrorAction } from '@/types/actionable-error.types'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_protected/actionable-errors-demo')({
  component: ActionableErrorsDemo,
})

function ActionableErrorsDemo() {
  const { t, i18n } = useTranslation('actionable-errors')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [formValues, setFormValues] = useState({
    email: '',
    website: '',
    phone: '',
    name: '',
    description: '',
  })

  // Actionable errors hook
  const {
    errors,
    highlightedFields,
    removeError,
    clearErrors,
    executeAction,
    focusField,
    fromValidation,
  } = useActionableErrors({
    onErrorAdded: (error) => {
      console.log('Error added:', error.code)
    },
    onActionExecuted: (errorCode, action) => {
      console.log('Action executed:', action.type, 'for error:', errorCode)
      if (action.type === 'auto_fix') {
        toast.success(t('toast.errorFixed'))
      }
    },
  })

  // Handle field change with validation
  const handleFieldChange = useCallback(
    (fieldName: keyof typeof formValues, value: string) => {
      setFormValues((prev) => ({ ...prev, [fieldName]: value }))

      // Map field names to types
      const fieldTypes: Record<string, string> = {
        email: 'email',
        website: 'url',
        phone: 'phone',
        name: 'text',
        description: 'text',
      }

      // Trigger validation
      fromValidation(fieldName, fieldTypes[fieldName] || 'text', value)
    },
    [fromValidation],
  )

  // Handle action execution
  const handleAction = useCallback(
    (errorCode: string, action: ErrorAction) => {
      executeAction(errorCode, action, (fieldName, value) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }))
        toast.success(t('toast.errorFixed'))
      })
    },
    [executeAction, t],
  )

  // Handle fix all
  const handleFixAll = useCallback(() => {
    errors.forEach((error) => {
      const autoFixAction = error.actions.find(
        (a) => a.type === 'auto_fix' || a.type === 'suggest_value',
      )
      if (autoFixAction && autoFixAction.value && error.fieldName) {
        setFormValues((prev) => ({
          ...prev,
          [error.fieldName!]: autoFixAction.value!,
        }))
        removeError(error.code)
      }
    })
    toast.success(t('toast.allErrorsFixed'))
  }, [errors, removeError, t])

  // Add demo errors
  const addDemoErrors = useCallback(() => {
    setFormValues({
      email: 'john doe@email',
      website: 'www.example.com',
      phone: 'abc',
      name: '',
      description: 'Too short',
    })

    // Trigger validation for each field
    setTimeout(() => {
      fromValidation('email', 'email', 'john doe@email')
      fromValidation('website', 'url', 'www.example.com')
      fromValidation('phone', 'phone', 'abc')
    }, 100)
  }, [fromValidation])

  // Get field error
  const getFieldError = useCallback(
    (fieldName: string): ActionableError | undefined => {
      return errors.find((e) => e.fieldName === fieldName)
    },
    [errors],
  )

  // Check if field is highlighted
  const isFieldHighlighted = useCallback(
    (fieldName: string): boolean => {
      return highlightedFields.some((h) => h.fieldName === fieldName)
    },
    [highlightedFields],
  )

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-start">Actionable Errors Demo</h1>
        <p className="text-muted-foreground mt-2 text-start">
          Transform generic error messages into actionable guidance with fix buttons
        </p>
      </div>

      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="mb-6">
          <ActionableErrorSummary
            errors={errors}
            onAction={handleAction}
            onFieldFocus={focusField}
            onFixAll={handleFixAll}
            maxVisible={3}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">Contact Form</CardTitle>
            <CardDescription className="text-start">
              Enter invalid data to see actionable error handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-start block">
                {t('fields.email')}
              </Label>
              <FieldErrorHighlight
                hasError={!!getFieldError('email')}
                severity="error"
                animation="pulse"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="name@example.com"
                  className={cn(getFieldError('email') && 'border-red-500 focus:ring-red-500')}
                  data-field-name="email"
                />
              </FieldErrorHighlight>
              {getFieldError('email') && (
                <ActionableErrorMessage
                  error={getFieldError('email')!}
                  onAction={(action) => handleAction(getFieldError('email')!.code, action)}
                  onDismiss={() => removeError(getFieldError('email')!.code)}
                  compact
                />
              )}
            </div>

            {/* Website Field */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-start block">
                {t('fields.website')}
              </Label>
              <FieldErrorHighlight
                hasError={!!getFieldError('website')}
                severity="error"
                animation="pulse"
              >
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formValues.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className={cn(getFieldError('website') && 'border-red-500 focus:ring-red-500')}
                  data-field-name="website"
                />
              </FieldErrorHighlight>
              {getFieldError('website') && (
                <ActionableErrorMessage
                  error={getFieldError('website')!}
                  onAction={(action) => handleAction(getFieldError('website')!.code, action)}
                  onDismiss={() => removeError(getFieldError('website')!.code)}
                  compact
                />
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-start block">
                {t('fields.phone')}
              </Label>
              <FieldErrorHighlight
                hasError={!!getFieldError('phone')}
                severity="error"
                animation="pulse"
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formValues.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+1 (234) 567-8900"
                  className={cn(getFieldError('phone') && 'border-red-500 focus:ring-red-500')}
                  data-field-name="phone"
                />
              </FieldErrorHighlight>
              {getFieldError('phone') && (
                <ActionableErrorMessage
                  error={getFieldError('phone')!}
                  onAction={(action) => handleAction(getFieldError('phone')!.code, action)}
                  onDismiss={() => removeError(getFieldError('phone')!.code)}
                  compact
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button type="button" onClick={addDemoErrors} variant="outline">
                Add Demo Errors
              </Button>
              <Button
                type="button"
                onClick={clearErrors}
                variant="ghost"
                disabled={errors.length === 0}
              >
                Clear All Errors
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">Feature Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.ul
              className="space-y-3 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {[
                'Specific error messages based on exact issue',
                'One-click fix buttons for common errors',
                'Auto-correction for URL protocols and email spaces',
                'Field highlighting with pulse animation',
                'Form-level error summary with "Fix All" button',
                'Full RTL support for Arabic',
                'Mobile-first responsive design',
                'Keyboard accessible actions',
              ].map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2 text-start"
                >
                  <span className="text-emerald-500 mt-1">✓</span>
                  {feature}
                </motion.li>
              ))}
            </motion.ul>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 text-start">Try these scenarios:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-start">
                <li>• Enter "john doe@email" (spaces in email)</li>
                <li>• Enter "www.example.com" (missing https://)</li>
                <li>• Enter "abc" in phone (no digits)</li>
                <li>• Leave required fields empty</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
