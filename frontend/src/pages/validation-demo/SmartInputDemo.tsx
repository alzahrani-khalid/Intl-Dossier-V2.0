/**
 * SmartInput Demo Page
 * Demonstrates optimized mobile keyboards and input masking
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SmartInput, SearchableSelect, type SelectOption } from '@/components/Forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Sample options for searchable select demo
const countryOptions: SelectOption[] = [
  {
    value: 'sa',
    label: 'Saudi Arabia',
    description: 'Kingdom of Saudi Arabia',
    group: 'Middle East',
  },
  { value: 'ae', label: 'United Arab Emirates', description: 'UAE', group: 'Middle East' },
  { value: 'kw', label: 'Kuwait', description: 'State of Kuwait', group: 'Middle East' },
  { value: 'bh', label: 'Bahrain', description: 'Kingdom of Bahrain', group: 'Middle East' },
  { value: 'qa', label: 'Qatar', description: 'State of Qatar', group: 'Middle East' },
  { value: 'om', label: 'Oman', description: 'Sultanate of Oman', group: 'Middle East' },
  { value: 'eg', label: 'Egypt', description: 'Arab Republic of Egypt', group: 'Africa' },
  { value: 'ma', label: 'Morocco', description: 'Kingdom of Morocco', group: 'Africa' },
  { value: 'us', label: 'United States', description: 'USA', group: 'Americas' },
  { value: 'ca', label: 'Canada', group: 'Americas' },
  { value: 'uk', label: 'United Kingdom', description: 'UK', group: 'Europe' },
  { value: 'de', label: 'Germany', group: 'Europe' },
  { value: 'fr', label: 'France', group: 'Europe' },
  { value: 'jp', label: 'Japan', group: 'Asia' },
  { value: 'cn', label: 'China', group: 'Asia' },
  { value: 'in', label: 'India', group: 'Asia' },
]

export function SmartInputDemo() {
  const { t, i18n } = useTranslation(['smart-input', 'common'])
  const isRTL = i18n.language === 'ar'

  // Form state
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [url, setUrl] = useState('')
  const [amount, setAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  // Error states for demo
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleValidate = () => {
    const newErrors: Record<string, string> = {}

    if (!email) newErrors.email = t('errors.required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t('errors.invalidEmail')

    if (!phone) newErrors.phone = t('errors.required')
    else if (phone.replace(/\D/g, '').length < 7) newErrors.phone = t('errors.invalidPhone')

    if (url && !/^https?:\/\/.+/.test(url)) newErrors.url = t('errors.invalidUrl')

    if (!selectedCountry) newErrors.country = t('select.required')

    setErrors(newErrors)
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start sm:text-center">
            {isRTL ? 'عرض الإدخال الذكي' : 'Smart Input Demo'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start sm:text-center">
            {isRTL
              ? 'لوحات مفاتيح محسّنة للجوال مع إخفاء الإدخال'
              : 'Optimized mobile keyboards with input masking'}
          </p>
        </div>

        {/* Smart Input Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">
              {isRTL ? 'حقول الإدخال الذكية' : 'Smart Input Fields'}
            </CardTitle>
            <CardDescription className="text-start">
              {isRTL
                ? 'كل حقل يُظهر لوحة مفاتيح محسّنة على الجوال'
                : 'Each field shows an optimized keyboard on mobile'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input */}
            <SmartInput
              type="email"
              label={t('labels.email')}
              placeholder={t('placeholders.email')}
              helpText={t('helpText.email')}
              value={email}
              onChange={(_, raw) => setEmail(raw)}
              error={errors.email}
              required
              data-testid="smart-input-email"
            />

            {/* Phone Input */}
            <SmartInput
              type="phone"
              label={t('labels.phone')}
              placeholder={t('placeholders.phone')}
              helpText={t('helpText.phone')}
              value={phone}
              onChange={(_, raw) => setPhone(raw)}
              error={errors.phone}
              countryCode="+966"
              required
              data-testid="smart-input-phone"
            />

            {/* URL Input */}
            <SmartInput
              type="url"
              label={t('labels.url')}
              placeholder={t('placeholders.url')}
              helpText={t('helpText.url')}
              value={url}
              onChange={(_, raw) => setUrl(raw)}
              error={errors.url}
              data-testid="smart-input-url"
            />

            {/* Currency Input */}
            <SmartInput
              type="currency"
              label={t('labels.currency')}
              placeholder={t('placeholders.currency')}
              value={amount}
              onChange={(_, raw) => setAmount(raw)}
              currencyCode="SAR"
              data-testid="smart-input-currency"
            />

            {/* Credit Card Input */}
            <SmartInput
              type="creditcard"
              label={t('labels.creditcard')}
              placeholder={t('placeholders.creditcard')}
              helpText={t('helpText.creditcard')}
              value={cardNumber}
              onChange={(_, raw) => setCardNumber(raw)}
              data-testid="smart-input-creditcard"
            />

            {/* OTP Input */}
            <SmartInput
              type="otp"
              label={t('labels.otp')}
              placeholder={t('placeholders.otp')}
              helpText={t('helpText.otp')}
              value={otpCode}
              onChange={(_, raw) => setOtpCode(raw)}
              otpLength={6}
              data-testid="smart-input-otp"
            />

            {/* Date Input */}
            <SmartInput type="date" label={t('labels.date')} data-testid="smart-input-date" />

            {/* Number Input */}
            <SmartInput
              type="number"
              label={t('labels.number')}
              placeholder={t('placeholders.number')}
              data-testid="smart-input-number"
            />
          </CardContent>
        </Card>

        {/* Searchable Select Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">
              {isRTL ? 'القوائم المنسدلة القابلة للبحث' : 'Searchable Dropdowns'}
            </CardTitle>
            <CardDescription className="text-start">
              {isRTL
                ? 'للقوائم الكبيرة مع البحث والتجميع'
                : 'For large lists with search and grouping'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single Select */}
            <SearchableSelect
              options={countryOptions}
              value={selectedCountry}
              onChange={(val) => setSelectedCountry(val as string | null)}
              label={isRTL ? 'اختر دولة' : 'Select Country'}
              placeholder={isRTL ? 'اختر دولة...' : 'Select a country...'}
              searchPlaceholder={isRTL ? 'ابحث عن دولة...' : 'Search countries...'}
              error={errors.country}
              required
              groupBy
              data-testid="searchable-select-single"
            />

            {/* Multi Select */}
            <SearchableSelect
              options={countryOptions}
              value={selectedCountries}
              onChange={(val) => setSelectedCountries(val as string[])}
              label={isRTL ? 'اختر دول متعددة' : 'Select Multiple Countries'}
              placeholder={isRTL ? 'اختر دولًا...' : 'Select countries...'}
              searchPlaceholder={isRTL ? 'ابحث عن دول...' : 'Search countries...'}
              multiple
              groupBy
              data-testid="searchable-select-multi"
            />

            {/* Creatable Select */}
            <SearchableSelect
              options={countryOptions}
              label={isRTL ? 'مع إمكانية الإضافة' : 'With Create Option'}
              placeholder={isRTL ? 'اختر أو أضف...' : 'Select or add...'}
              creatable
              createOptionText={isRTL ? 'إضافة "{value}"' : 'Add "{value}"'}
              data-testid="searchable-select-creatable"
            />
          </CardContent>
        </Card>

        {/* Validate Button */}
        <div className="flex justify-center">
          <Button onClick={handleValidate} className="min-h-11 px-8" data-testid="validate-button">
            {isRTL ? 'التحقق من الحقول' : 'Validate Fields'}
          </Button>
        </div>

        {/* Debug Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-start text-sm">
              {isRTL ? 'بيانات التصحيح' : 'Debug Data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto p-2 bg-background rounded" dir="ltr">
              {JSON.stringify(
                {
                  email,
                  phone,
                  url,
                  amount,
                  cardNumber,
                  otpCode,
                  selectedCountry,
                  selectedCountries,
                  errors,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SmartInputDemo
