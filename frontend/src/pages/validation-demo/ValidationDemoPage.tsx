/**
 * ValidationDemoPage
 * Demonstrates the real-time form validation system with contextual errors
 */
import { useState, useCallback } from 'react'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import { FormFieldWithValidation } from '@/components/forms/FormFieldWithValidation'
import { ValidationSummary } from '@/components/forms/ValidationIndicator'
import { SmartInputDemo } from './SmartInputDemo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, User, Phone, Globe, Lock, FileText, Send, RotateCcw } from 'lucide-react'
import type { ValidationResult } from '@/lib/validation-rules'
import { useDirection } from '@/hooks/useDirection'

// =============================================================================
// TYPES
// =============================================================================

// Form data type for state management
interface DemoFormData {
  fullName: string
  email: string
  phone: string
  website: string
  password: string
  bio: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ValidationDemoPage() {
const { isRTL } = useDirection()
// Form state
  const [formValues, setFormValues] = useState<Partial<DemoFormData>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationResult>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldName: string) => (value: string) => {
      setFormValues((prev) => ({ ...prev, [fieldName]: value }))
      setIsSubmitted(false)
    },
    [],
  )

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitted(true)

      // Check if there are any errors
      const hasErrors = Object.keys(validationErrors).length > 0

      if (!hasErrors) {
        // Form is valid - show success
        console.warn('Form submitted:', formValues)
      }
    },
    [formValues, validationErrors],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    setFormValues({})
    setValidationErrors({})
    setIsSubmitted(false)
  }, [])

  // Scroll to field when clicking in summary
  const handleFieldClick = useCallback((fieldName: string) => {
    const element = document.querySelector(`[name="${fieldName}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ;(element as HTMLInputElement).focus()
    }
  }, [])

  return (
    <div
      className="py-6 sm:py-8 lg:py-12"
    >
      {/* Page Header */}
      <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {isRTL ? 'عرض التحقق في الوقت الحقيقي' : 'Real-time Validation Demo'}
        </h1>
        <p className="text-muted-foreground text-start">
          {isRTL
            ? 'تجربة رسائل الخطأ السياقية مع اقتراحات الإصلاح'
            : 'Experience contextual error messages with recovery suggestions'}
        </p>
      </m.div>

      {/* Feature Badges */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        <Badge variant="secondary">
          {isRTL ? 'التحقق في الوقت الحقيقي' : 'Real-time Validation'}
        </Badge>
        <Badge variant="secondary">{isRTL ? 'رسائل سياقية' : 'Contextual Messages'}</Badge>
        <Badge variant="secondary">{isRTL ? 'مؤشرات مرئية' : 'Visual Indicators'}</Badge>
        <Badge variant="secondary">{isRTL ? 'اقتراحات الإصلاح' : 'Recovery Suggestions'}</Badge>
        <Badge variant="secondary">{isRTL ? 'دعم RTL' : 'RTL Support'}</Badge>
      </m.div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="demo">{isRTL ? 'العرض التوضيحي' : 'Demo Form'}</TabsTrigger>
          <TabsTrigger value="smart-input" data-testid="smart-input-tab">
            {isRTL ? 'الإدخال الذكي' : 'Smart Input'}
          </TabsTrigger>
          <TabsTrigger value="features">{isRTL ? 'الميزات' : 'Features'}</TabsTrigger>
        </TabsList>

        {/* Demo Form Tab */}
        <TabsContent value="demo">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-start">
                  {isRTL ? 'نموذج التسجيل' : 'Registration Form'}
                </CardTitle>
                <CardDescription className="text-start">
                  {isRTL
                    ? 'جرّب الكتابة لرؤية التحقق في الوقت الحقيقي'
                    : 'Try typing to see real-time validation in action'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Validation Summary */}
                  {isSubmitted && Object.keys(validationErrors).length > 0 && (
                    <ValidationSummary errors={validationErrors} onFieldClick={handleFieldClick} />
                  )}

                  {/* Full Name */}
                  <FormFieldWithValidation
                    name="fullName"
                    label={isRTL ? 'الاسم الكامل' : 'Full Name'}
                    required
                    icon={<User className="h-5 w-5" />}
                    helpText={
                      isRTL
                        ? 'أدخل اسمك الكامل كما يظهر في الوثائق الرسمية'
                        : 'Enter your name as it appears on official documents'
                    }
                    validation={{
                      required: true,
                      minLength: 2,
                      maxLength: 50,
                    }}
                    maxLength={50}
                    showCharCount
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('fullName')}
                  />

                  {/* Email */}
                  <FormFieldWithValidation
                    name="email"
                    label={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                    type="email"
                    required
                    icon={<Mail className="h-5 w-5" />}
                    helpText={isRTL ? 'سنستخدم هذا للتواصل معك' : "We'll use this to contact you"}
                    validation={{
                      required: true,
                      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      patternName: 'email',
                    }}
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('email')}
                  />

                  {/* Phone */}
                  <FormFieldWithValidation
                    name="phone"
                    label={isRTL ? 'رقم الهاتف' : 'Phone Number'}
                    type="tel"
                    icon={<Phone className="h-5 w-5" />}
                    helpText={
                      isRTL ? 'اختياري - للتواصل السريع' : 'Optional - for quick communication'
                    }
                    validation={{
                      pattern: /^\+?[\d\s-()]{7,20}$/,
                      patternName: 'phone',
                    }}
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('phone')}
                  />

                  {/* Website */}
                  <FormFieldWithValidation
                    name="website"
                    label={isRTL ? 'الموقع الإلكتروني' : 'Website'}
                    type="url"
                    icon={<Globe className="h-5 w-5" />}
                    helpText={
                      isRTL
                        ? 'اختياري - موقعك الشخصي أو محفظتك'
                        : 'Optional - your personal site or portfolio'
                    }
                    validation={{
                      pattern: /^https?:\/\/.+\..+/,
                      patternName: 'url',
                    }}
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('website')}
                  />

                  {/* Password */}
                  <FormFieldWithValidation
                    name="password"
                    label={isRTL ? 'كلمة المرور' : 'Password'}
                    type="password"
                    required
                    icon={<Lock className="h-5 w-5" />}
                    helpText={isRTL ? 'استخدم 8 أحرف على الأقل' : 'Use at least 8 characters'}
                    validation={{
                      required: true,
                      minLength: 8,
                    }}
                    showPasswordStrength
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('password')}
                  />

                  {/* Bio */}
                  <FormFieldWithValidation
                    name="bio"
                    label={isRTL ? 'نبذة عنك' : 'Bio'}
                    type="textarea"
                    icon={<FileText className="h-5 w-5" />}
                    helpText={
                      isRTL ? 'اختياري - أخبرنا عن نفسك' : 'Optional - tell us about yourself'
                    }
                    maxLength={500}
                    showCharCount
                    validation={{
                      maxLength: 500,
                    }}
                    validationDisplay="message"
                    variant="aceternity"
                    onChange={handleFieldChange('bio')}
                  />

                  {/* Actions */}
                  <div className={cn('flex gap-4 pt-4', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                    <Button type="submit" className="flex-1 sm:flex-none min-h-11">
                      <Send className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {isRTL ? 'إرسال' : 'Submit'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={handleReset}
                    >
                      <RotateCcw className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {isRTL ? 'إعادة تعيين' : 'Reset'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Live State Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-start text-lg">
                  {isRTL ? 'حالة النموذج' : 'Form State'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 text-start">
                    {isRTL ? 'القيم الحالية' : 'Current Values'}
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 text-start">
                    {JSON.stringify(formValues, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 text-start">
                    {isRTL ? 'الأخطاء' : 'Validation Errors'}
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 text-start">
                    {Object.keys(validationErrors).length > 0
                      ? JSON.stringify(
                          Object.fromEntries(
                            Object.entries(validationErrors).map(([k, v]) => [k, v.messageKey]),
                          ),
                          null,
                          2,
                        )
                      : isRTL
                        ? '// لا توجد أخطاء'
                        : '// No errors'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Smart Input Tab */}
        <TabsContent value="smart-input">
          <SmartInputDemo />
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            {[
              {
                title: isRTL ? 'التحقق في الوقت الحقيقي' : 'Real-time Validation',
                description: isRTL
                  ? 'يتم التحقق من المدخلات أثناء الكتابة مع تأخير للأداء الأمثل'
                  : 'Input is validated as you type with debouncing for optimal performance',
                icon: '⚡',
              },
              {
                title: isRTL ? 'رسائل سياقية' : 'Contextual Messages',
                description: isRTL
                  ? 'رسائل خطأ محددة بناءً على نوع الخطأ الفعلي'
                  : 'Specific error messages based on the actual error type',
                icon: '💬',
              },
              {
                title: isRTL ? 'اقتراحات الإصلاح' : 'Recovery Suggestions',
                description: isRTL
                  ? 'اقتراحات قابلة للتطبيق لمساعدتك في إصلاح الأخطاء'
                  : 'Actionable suggestions to help you fix errors',
                icon: '💡',
              },
              {
                title: isRTL ? 'مؤشرات مرئية' : 'Visual Indicators',
                description: isRTL
                  ? 'أيقونات وألوان واضحة للتحقق الناجح والتحذيرات والأخطاء'
                  : 'Clear icons and colors for valid, warning, and error states',
                icon: '🎨',
              },
              {
                title: isRTL ? 'قوة كلمة المرور' : 'Password Strength',
                description: isRTL
                  ? 'مؤشر قوة مع اقتراحات التحسين'
                  : 'Strength indicator with improvement suggestions',
                icon: '🔐',
              },
              {
                title: isRTL ? 'دعم RTL كامل' : 'Full RTL Support',
                description: isRTL
                  ? 'تصميم متوافق تمامًا مع اللغة العربية'
                  : 'Fully compatible design for Arabic and other RTL languages',
                icon: '🌍',
              },
            ].map((feature, index) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg text-start">
                      <span className="text-2xl">{feature.icon}</span>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm text-start">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </m.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
