import { createFileRoute } from '@tanstack/react-router'
import { FormInput } from '../components/Forms/FormInput'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../components/theme-provider/theme-provider'

export const Route = createFileRoute('/form-demo')({
  component: FormDemoPage,
})

function FormDemoPage() {
  const { t, i18n } = useTranslation()
  const { colorMode, setColorMode } = useTheme()
  const [showError, setShowError] = useState(false)
  const isRTL = i18n.dir() === 'rtl'

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
  }

  const toggleTheme = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            FormInput Theme Tokens Demo
          </h1>
          <div className="flex gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-input bg-background px-4 py-2 text-foreground hover:bg-accent"
            >
              {colorMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={toggleLanguage}
              className="rounded-lg border border-input bg-background px-4 py-2 text-foreground hover:bg-accent"
            >
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>
            <button
              onClick={() => setShowError(!showError)}
              className="rounded-lg border border-input bg-background px-4 py-2 text-foreground hover:bg-accent"
            >
              {showError ? 'Hide Error' : 'Show Error'}
            </button>
          </div>
        </div>

        {/* FormInput Component Tests */}
        <section className="space-y-4 rounded-lg border border-input bg-card p-6">
          <h2 className="text-2xl font-semibold text-foreground">
            FormInput Component (with Theme Tokens)
          </h2>

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="user@example.com"
            icon={<Mail className="h-4 w-4" />}
            helpText="Enter your email address"
            error={showError ? { message: 'This field is required' } : undefined}
            required
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            helpText="Minimum 8 characters"
            required
          />

          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="John Doe"
            icon={<User className="h-4 w-4" />}
          />

          <FormInput
            label="Disabled Input"
            name="disabled"
            type="text"
            placeholder="Disabled field"
            disabled
          />
        </section>

        {/* Standard Input Component for Comparison */}
        <section className="space-y-4 rounded-lg border border-input bg-card p-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Standard Input Component (for comparison)
          </h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Standard Input
            </label>
            <Input type="text" placeholder="Standard input field" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Standard Textarea
            </label>
            <Textarea placeholder="Standard textarea field" />
          </div>
        </section>

        {/* Theme Token Reference */}
        <section className="space-y-4 rounded-lg border border-input bg-card p-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Theme Token Reference
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="h-12 rounded border border-input bg-background" />
              <p className="text-sm text-muted-foreground">background</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded border border-input bg-foreground" />
              <p className="text-sm text-muted-foreground">foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded border border-input bg-card" />
              <p className="text-sm text-muted-foreground">card</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded border border-input bg-muted" />
              <p className="text-sm text-muted-foreground">muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded border border-input bg-destructive" />
              <p className="text-sm text-muted-foreground">destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded border border-ring" />
              <p className="text-sm text-muted-foreground">ring</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
