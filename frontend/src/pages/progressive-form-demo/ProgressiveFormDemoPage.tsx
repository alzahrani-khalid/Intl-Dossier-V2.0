/**
 * ProgressiveFormDemoPage
 * Demonstrates progressive disclosure forms with clear required/optional field distinction,
 * field grouping, and completion tracking
 */

import { useTranslation } from 'react-i18next'
import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useProgressiveForm } from '@/hooks/useProgressiveForm'
import { ProgressiveFormField } from '@/components/Forms/ProgressiveFormField'
import { FormFieldGroup } from '@/components/Forms/FormFieldGroup'
import { FormCompletionProgress } from '@/components/Forms/FormCompletionProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Users,
  FileText,
  Globe,
  Bell,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { ProgressiveFormConfig } from '@/types/progressive-form.types'

// =============================================================================
// FORM CONFIGURATION
// =============================================================================

const formConfig: ProgressiveFormConfig = {
  showOptionalByDefault: false,
  autoExpandOnError: true,
  showProgress: true,
  groups: [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Essential information required for the form',
      icon: 'user',
      collapsible: true,
      defaultCollapsed: false,
      fields: ['firstName', 'lastName', 'email'],
    },
    {
      id: 'contact-info',
      title: 'Contact Information',
      description: 'How we can reach you',
      icon: 'phone',
      collapsible: true,
      defaultCollapsed: false,
      fields: ['phone', 'organization'],
    },
    {
      id: 'additional-details',
      title: 'Additional Details',
      description: 'Optional information to provide more context',
      icon: 'file',
      collapsible: true,
      defaultCollapsed: true,
      fields: ['jobTitle', 'department', 'bio', 'website'],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      icon: 'settings',
      collapsible: true,
      defaultCollapsed: true,
      fields: ['newsletter', 'notifications'],
    },
  ],
  fields: [
    {
      name: 'firstName',
      label: 'First Name',
      importance: 'required',
      group: 'basic-info',
      helpText: 'Your legal first name as it appears on official documents',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      importance: 'required',
      group: 'basic-info',
      helpText: 'Your legal family name',
    },
    {
      name: 'email',
      label: 'Email Address',
      importance: 'required',
      group: 'basic-info',
      helpText: "We'll use this to send you important updates",
    },
    {
      name: 'phone',
      label: 'Phone Number',
      importance: 'recommended',
      group: 'contact-info',
      helpText: 'Include country code for international numbers',
    },
    {
      name: 'organization',
      label: 'Organization',
      importance: 'recommended',
      group: 'contact-info',
      helpText: 'Your current employer or affiliated organization',
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      importance: 'optional',
      group: 'additional-details',
      helpText: 'Your current position or role',
    },
    {
      name: 'department',
      label: 'Department',
      importance: 'optional',
      group: 'additional-details',
      helpText: 'The department you work in',
    },
    {
      name: 'bio',
      label: 'Bio',
      importance: 'optional',
      group: 'additional-details',
      helpText: 'A brief description about yourself (max 500 characters)',
    },
    {
      name: 'website',
      label: 'Website',
      importance: 'optional',
      group: 'additional-details',
      helpText: 'Your personal or professional website URL',
    },
    {
      name: 'newsletter',
      label: 'Subscribe to newsletter',
      importance: 'optional',
      group: 'preferences',
      helpText: 'Receive updates about new features and announcements',
    },
    {
      name: 'notifications',
      label: 'Enable notifications',
      importance: 'optional',
      group: 'preferences',
      helpText: 'Get notified about important events',
    },
  ],
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProgressiveFormDemoPage() {
  const { t, i18n } = useTranslation(['progressive-form', 'common'])
  const isRTL = i18n.language === 'ar'

  // Form state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Progressive form hook
  const {
    completionState,
    showOptional,
    toggleOptionalFields,
    getFieldConfig,
    getFieldStatus,
    isFieldVisible,
    getFieldsByGroup,
    getGroupCompletion,
    groupHasErrors,
    collapsedGroups,
    toggleGroupCollapse,
  } = useProgressiveForm({
    config: formConfig,
    values: formValues,
    touched,
    errors,
  })

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when user starts typing
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }, [])

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
  }, [])

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Validate required fields
      const newErrors: Record<string, string> = {}
      formConfig.fields.forEach((field) => {
        if (field.importance === 'required' && !formValues[field.name]) {
          newErrors[field.name] = t('validation.requiredField')
        }
      })

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {}
      formConfig.fields.forEach((field) => {
        allTouched[field.name] = true
      })
      setTouched(allTouched)
      setErrors(newErrors)

      if (Object.keys(newErrors).length === 0) {
        console.log('Form submitted:', formValues)
        alert(isRTL ? 'تم إرسال النموذج بنجاح!' : 'Form submitted successfully!')
      }
    },
    [formValues, t, isRTL],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    setFormValues({})
    setTouched({})
    setErrors({})
  }, [])

  // Get icon for group
  const getGroupIcon = (iconName?: string) => {
    switch (iconName) {
      case 'user':
        return <User className="w-5 h-5 text-blue-500" />
      case 'phone':
        return <Phone className="w-5 h-5 text-green-500" />
      case 'file':
        return <FileText className="w-5 h-5 text-purple-500" />
      case 'settings':
        return <Bell className="w-5 h-5 text-amber-500" />
      default:
        return null
    }
  }

  // Get icon for field
  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        return <User className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'organization':
        return <Building2 className="w-4 h-4" />
      case 'jobTitle':
        return <Briefcase className="w-4 h-4" />
      case 'department':
        return <Users className="w-4 h-4" />
      case 'bio':
        return <FileText className="w-4 h-4" />
      case 'website':
        return <Globe className="w-4 h-4" />
      default:
        return null
    }
  }

  // Render field input based on field name
  const renderFieldInput = (fieldName: string) => {
    const value = formValues[fieldName] as string | boolean | undefined

    switch (fieldName) {
      case 'bio':
        return (
          <Textarea
            id={fieldName}
            name={fieldName}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            onBlur={() => handleFieldBlur(fieldName)}
            placeholder={t(`demo.fields.${fieldName}Help`)}
            className="min-h-24 resize-y"
            maxLength={500}
          />
        )
      case 'newsletter':
      case 'notifications':
        return (
          <div className="flex items-center gap-3">
            <Switch
              id={fieldName}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <Label htmlFor={fieldName} className="text-sm text-gray-600 dark:text-gray-400">
              {t(`demo.fields.${fieldName}Help`)}
            </Label>
          </div>
        )
      default:
        return (
          <div className="relative">
            <Input
              id={fieldName}
              name={fieldName}
              type={fieldName === 'email' ? 'email' : fieldName === 'phone' ? 'tel' : 'text'}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              onBlur={() => handleFieldBlur(fieldName)}
              placeholder={t(`demo.fields.${fieldName}Help`)}
              className={cn('min-h-11 sm:min-h-10', getFieldIcon(fieldName) && 'ps-10')}
            />
            {getFieldIcon(fieldName) && (
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 text-gray-400',
                  isRTL ? 'end-3' : 'start-3',
                )}
              >
                {getFieldIcon(fieldName)}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {t('demo.title')}
        </h1>
        <p className="text-muted-foreground text-start">{t('demo.description')}</p>
      </motion.div>

      {/* Feature Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        <Badge variant="secondary">{t('importance.required')}</Badge>
        <Badge variant="secondary">{t('importance.recommended')}</Badge>
        <Badge variant="secondary">{t('importance.optional')}</Badge>
        <Badge variant="secondary">{isRTL ? 'تجميع الحقول' : 'Field Grouping'}</Badge>
        <Badge variant="secondary">{isRTL ? 'تتبع الإكمال' : 'Completion Tracking'}</Badge>
        <Badge variant="secondary">{isRTL ? 'الكشف التدريجي' : 'Progressive Disclosure'}</Badge>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Optional Fields Toggle */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showOptional ? (
                    <Eye className="w-5 h-5 text-primary-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-start">
                      {showOptional ? t('toggle.hideOptional') : t('toggle.showOptional')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-start">
                      {t('toggle.optionalFieldsCount', {
                        count: formConfig.fields.filter(
                          (f) => f.importance === 'optional' || f.importance === 'recommended',
                        ).length,
                      })}
                    </p>
                  </div>
                </div>
                <Switch checked={showOptional} onCheckedChange={toggleOptionalFields} />
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field Groups */}
            {formConfig.groups?.map((group) => {
              const groupFields = getFieldsByGroup(group.id)
              const visibleFields = groupFields.filter((f) => isFieldVisible(f.name))

              // Don't render group if no visible fields
              if (visibleFields.length === 0) return null

              return (
                <FormFieldGroup
                  key={group.id}
                  id={group.id}
                  title={
                    isRTL
                      ? t(`demo.${group.id.replace(/-/g, '')}` as any) || group.title
                      : group.title
                  }
                  description={
                    isRTL
                      ? t(`demo.${group.id.replace(/-/g, '')}Description` as any) ||
                        group.description
                      : group.description
                  }
                  icon={getGroupIcon(group.icon)}
                  collapsible={group.collapsible}
                  isCollapsed={collapsedGroups[group.id]}
                  onCollapsedChange={() => toggleGroupCollapse(group.id)}
                  completionPercentage={getGroupCompletion(group.id)}
                  hasErrors={groupHasErrors(group.id)}
                  fieldCount={visibleFields.length}
                  completedCount={
                    visibleFields.filter((f) => getFieldStatus(f.name) === 'complete').length
                  }
                >
                  {visibleFields.map((field) => (
                    <ProgressiveFormField
                      key={field.name}
                      name={field.name}
                      label={
                        isRTL ? t(`demo.fields.${field.name}` as any) || field.label : field.label
                      }
                      importance={field.importance}
                      status={getFieldStatus(field.name)}
                      helpText={
                        isRTL
                          ? t(`demo.fields.${field.name}Help` as any) || field.helpText
                          : field.helpText
                      }
                      error={errors[field.name]}
                      touched={touched[field.name]}
                      showStatusIndicator={true}
                      showImportanceBadge={true}
                    >
                      {renderFieldInput(field.name)}
                    </ProgressiveFormField>
                  ))}
                </FormFieldGroup>
              )
            })}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="submit"
                disabled={!completionState.canSubmit}
                className="min-h-11 sm:min-h-10 gap-2"
              >
                <Send className="w-4 h-4" />
                {t('demo.submit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="min-h-11 sm:min-h-10 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('demo.reset')}
              </Button>
            </div>
          </form>
        </div>

        {/* Progress Sidebar */}
        <div className="space-y-6">
          {/* Sticky Progress Card */}
          <div className="lg:sticky lg:top-6">
            <FormCompletionProgress
              completionState={completionState}
              showDetails={true}
              showWarnings={true}
              defaultExpanded={false}
              variant="default"
            />

            {/* Additional Stats Card */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-start">
                  {isRTL ? 'إحصائيات النموذج' : 'Form Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'إجمالي الحقول' : 'Total Fields'}
                  </span>
                  <span className="font-medium">{formConfig.fields.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'الحقول المرئية' : 'Visible Fields'}
                  </span>
                  <span className="font-medium">{completionState.totalFields}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'المجموعات' : 'Groups'}
                  </span>
                  <span className="font-medium">{formConfig.groups?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'الحقول المطلوبة' : 'Required Fields'}
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {completionState.requiredFields}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressiveFormDemoPage
