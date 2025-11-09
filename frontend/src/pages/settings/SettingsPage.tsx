import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
 User, Globe, Bell, Shield, Palette, Clock, Calendar, Moon, Sun,
 Monitor, Save, ChevronRight, Check, AlertCircle, Key, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { switchLanguage } from '@/i18n'
import { useTheme } from '@/hooks/use-theme'

interface UserSettings {
 language_preference: 'en' | 'ar'
 timezone: string
 theme: 'light' | 'dark' | 'auto'
 notifications: {
 email: boolean
 push: boolean
 mou_expiry: boolean
 event_reminders: boolean
 report_generation: boolean
 }
 security: {
 mfa_enabled: boolean
 session_timeout: number
 }
}

export function SettingsPage() {
 const { t, i18n } = useTranslation()
 const { user } = useAuthStore()
 const { theme, setTheme, colorMode, setColorMode } = useTheme()
 const [activeSection, setActiveSection] = useState('general')
 const [hasChanges, setHasChanges] = useState(false)
 const isRTL = i18n.language === 'ar'

 const { data: settings, isLoading } = useQuery({
 queryKey: ['user-settings', user?.id],
 queryFn: async () => {
 const { data, error } = await supabase
 .from('users')
 .select('*')
 .eq('id', user?.id)
 .single()

 if (error) throw error
 
 // Transform to settings format
 return {
 language_preference: data.language_preference || 'en',
 timezone: data.timezone || 'UTC',
 theme: data.theme || 'auto',
 notifications: {
 email: data.notifications_email ?? true,
 push: data.notifications_push ?? true,
 mou_expiry: data.notifications_mou_expiry ?? true,
 event_reminders: data.notifications_event_reminders ?? true,
 report_generation: data.notifications_report_generation ?? true
 },
 security: {
 mfa_enabled: data.mfa_enabled || false,
 session_timeout: data.session_timeout || 30
 }
 } as UserSettings
 },
 enabled: !!user?.id
 })

 const [formData, setFormData] = useState<UserSettings>(settings || {
 language_preference: 'en',
 timezone: 'UTC',
 theme: 'auto',
 notifications: {
 email: true,
 push: true,
 mou_expiry: true,
 event_reminders: true,
 report_generation: true
 },
 security: {
 mfa_enabled: false,
 session_timeout: 30
 }
 })

 const updateSettingsMutation = useMutation({
 mutationFn: async (newSettings: UserSettings) => {
 const { error } = await supabase
 .from('users')
 .update({
 language_preference: newSettings.language_preference,
 timezone: newSettings.timezone,
 theme: newSettings.theme,
 notifications_email: newSettings.notifications.email,
 notifications_push: newSettings.notifications.push,
 notifications_mou_expiry: newSettings.notifications.mou_expiry,
 notifications_event_reminders: newSettings.notifications.event_reminders,
 notifications_report_generation: newSettings.notifications.report_generation,
 mfa_enabled: newSettings.security.mfa_enabled,
 session_timeout: newSettings.security.session_timeout,
 updated_at: new Date().toISOString()
 })
 .eq('id', user?.id)

 if (error) throw error

 // Apply language change
 if (newSettings.language_preference !== i18n.language) {
 await switchLanguage(newSettings.language_preference)
 }

 // Apply theme change
 if (newSettings.theme === 'dark') {
 document.documentElement.classList.add('dark')
 } else if (newSettings.theme === 'light') {
 document.documentElement.classList.remove('dark')
 } else {
 // Auto theme based on system preference
 if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
 document.documentElement.classList.add('dark')
 } else {
 document.documentElement.classList.remove('dark')
 }
 }

 return newSettings
 },
 onSuccess: () => {
 setHasChanges(false)
 }
 })

 const updateFormData = (updates: Partial<UserSettings>) => {
 setFormData(prev => ({ ...prev, ...updates }))
 setHasChanges(true)
 }

 const updateNotifications = (key: keyof UserSettings['notifications'], value: boolean) => {
 setFormData(prev => ({
 ...prev,
 notifications: {
 ...prev.notifications,
 [key]: value
 }
 }))
 setHasChanges(true)
 }

 const updateSecurity = (key: keyof UserSettings['security'], value: any) => {
 setFormData(prev => ({
 ...prev,
 security: {
 ...prev.security,
 [key]: value
 }
 }))
 setHasChanges(true)
 }

 const sections = [
 { id: 'general', label: t('settings.general'), icon: <User className="h-4 w-4" /> },
 { id: 'appearance', label: t('settings.appearance'), icon: <Palette className="h-4 w-4" /> },
 { id: 'notifications', label: t('settings.notifications'), icon: <Bell className="h-4 w-4" /> },
 { id: 'security', label: t('settings.security'), icon: <Shield className="h-4 w-4" /> }
 ]

 const timezones = [
 { value: 'UTC', label: 'UTC' },
 { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
 { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
 { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
 { value: 'Europe/London', label: 'London (GMT)' },
 { value: 'America/New_York', label: 'New York (GMT-5)' }
 ]

 return (
 <div className="container mx-auto py-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">{t('navigation.settings')}</h1>
 {hasChanges && (
 <Button
 onClick={() => updateSettingsMutation.mutate(formData)}
 disabled={updateSettingsMutation.isPending}
 >
 <Save className="h-4 w-4 me-2" />
 {t('common.save')}
 </Button>
 )}
 </div>

 {updateSettingsMutation.isSuccess && (
 <Card className="mb-6 border-green-200 bg-green-50">
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-green-800">
 <Check className="h-5 w-5" />
 <span>{t('settings.savedSuccessfully')}</span>
 </div>
 </CardContent>
 </Card>
 )}

 <div className="grid gap-6 md:grid-cols-4">
 <div>
 <Card>
 <CardContent className="p-0">
 {sections.map(section => (
 <button
 key={section.id}
 className={`w-full flex items-center justify-between p-4 hover:bg-muted transition-colors ${
 activeSection === section.id ? 'bg-muted' : ''
 }`}
 onClick={() => setActiveSection(section.id)}
 >
 <div className="flex items-center gap-3">
 {section.icon}
 <span className="font-medium">{section.label}</span>
 </div>
 <ChevronRight className="h-4 w-4" />
 </button>
 ))}
 </CardContent>
 </Card>
 </div>

 <div className="md:col-span-3">
 {isLoading ? (
 <Card>
 <CardContent className="p-8 text-center">{t('common.loading')}</CardContent>
 </Card>
 ) : (
 <>
 {activeSection === 'general' && (
 <Card>
 <CardHeader>
 <CardTitle>{t('settings.general')}</CardTitle>
 <CardDescription>{t('settings.generalDesc')}</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-2">
 <Label>{t('settings.language')}</Label>
 <div className="flex gap-2">
 <Button
 variant={formData.language_preference === 'en' ? 'default' : 'outline'}
 onClick={() => updateFormData({ language_preference: 'en' })}
 >
 <Globe className="h-4 w-4 me-2" />
 English
 </Button>
 <Button
 variant={formData.language_preference === 'ar' ? 'default' : 'outline'}
 onClick={() => updateFormData({ language_preference: 'ar' })}
 >
 <Globe className="h-4 w-4 me-2" />
 العربية
 </Button>
 </div>
 </div>

 <div className="space-y-2">
 <Label>{t('settings.timezone')}</Label>
 <select
 value={formData.timezone}
 onChange={(e) => updateFormData({ timezone: e.target.value })}
 className="w-full rounded-md border border-input bg-background px-3 py-2"
 >
 {timezones.map(tz => (
 <option key={tz.value} value={tz.value}>
 {tz.label}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <Label>{t('settings.dateFormat')}</Label>
 <div className="flex gap-2">
 <Button variant="outline" size="sm">DD/MM/YYYY</Button>
 <Button variant="outline" size="sm">MM/DD/YYYY</Button>
 <Button variant="outline" size="sm">YYYY-MM-DD</Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {activeSection === 'appearance' && (
 <Card>
 <CardHeader>
 <CardTitle>{t('settings.appearance')}</CardTitle>
 <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
 </CardHeader>
 <CardContent className="space-y-8">
 {/* Color Mode Section */}
 <div className="space-y-4">
 <Label className="text-base font-semibold">{t('settings.colorMode')}</Label>
 <div className="grid grid-cols-2 gap-4">
 <Card
 className={`cursor-pointer transition-all hover:shadow-md ${
 colorMode === 'light' ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => setColorMode('light')}
 >
 <CardContent className="p-6 text-center">
 <Sun className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
 <span className="text-sm font-medium">{t('settings.lightMode')}</span>
 </CardContent>
 </Card>
 <Card
 className={`cursor-pointer transition-all hover:shadow-md ${
 colorMode === 'dark' ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => setColorMode('dark')}
 >
 <CardContent className="p-6 text-center">
 <Moon className="h-10 w-10 mx-auto mb-3 text-blue-500" />
 <span className="text-sm font-medium">{t('settings.darkMode')}</span>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Theme Section */}
 <div className="space-y-4">
 <div>
 <Label className="text-base font-semibold">Theme Style</Label>
 <p className="text-sm text-muted-foreground mt-1">
 Choose your preferred color palette
 </p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {/* Natural Theme */}
 <Card
 className={`cursor-pointer transition-all hover:shadow-md ${
 theme === 'natural' ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => setTheme('natural')}
 >
 <CardContent className="p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="flex gap-1">
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(0 0% 20.5%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(0 0% 97%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(0 0% 55.6%)' }}
 />
 </div>
 {theme === 'natural' && (
 <Check className="h-5 w-5 text-primary ms-auto" />
 )}
 </div>
 <div className="text-center">
 <span className="text-sm font-medium">
 {isRTL ? 'طبيعي' : 'Natural'}
 </span>
 <p className="text-xs text-muted-foreground mt-1">
 {isRTL ? 'رمادي دافئ ومحايد' : 'Warm, neutral gray'}
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Slate Theme */}
 <Card
 className={`cursor-pointer transition-all hover:shadow-md ${
 theme === 'slate' ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => setTheme('slate')}
 >
 <CardContent className="p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="flex gap-1">
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(222.2 47.4% 11.2%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(215.4 16.3% 46.9%)' }}
 />
 </div>
 {theme === 'slate' && (
 <Check className="h-5 w-5 text-primary ms-auto" />
 )}
 </div>
 <div className="text-center">
 <span className="text-sm font-medium">
 {isRTL ? 'رمادي' : 'Slate'}
 </span>
 <p className="text-xs text-muted-foreground mt-1">
 {isRTL ? 'رمادي أزرق ناعم' : 'Cool, blue-gray'}
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Zinc Theme */}
 <Card
 className={`cursor-pointer transition-all hover:shadow-md ${
 theme === 'zinc' ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => setTheme('zinc')}
 >
 <CardContent className="p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="flex gap-1">
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(240 5.9% 10%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(240 4.8% 95.9%)' }}
 />
 <div
 className="w-4 h-4 rounded-full"
 style={{ backgroundColor: 'hsl(240 3.8% 46.1%)' }}
 />
 </div>
 {theme === 'zinc' && (
 <Check className="h-5 w-5 text-primary ms-auto" />
 )}
 </div>
 <div className="text-center">
 <span className="text-sm font-medium">
 {isRTL ? 'زنك' : 'Zinc'}
 </span>
 <p className="text-xs text-muted-foreground mt-1">
 {isRTL ? 'رمادي محايد احترافي' : 'Professional, neutral'}
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {activeSection === 'notifications' && (
 <Card>
 <CardHeader>
 <CardTitle>{t('settings.notifications')}</CardTitle>
 <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label>{t('settings.emailNotifications')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.emailNotificationsDesc')}
 </p>
 </div>
 <Switch
 checked={formData.notifications.email}
 onCheckedChange={(checked) => updateNotifications('email', checked)}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label>{t('settings.pushNotifications')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.pushNotificationsDesc')}
 </p>
 </div>
 <Switch
 checked={formData.notifications.push}
 onCheckedChange={(checked) => updateNotifications('push', checked)}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label>{t('settings.mouExpiryAlerts')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.mouExpiryAlertsDesc')}
 </p>
 </div>
 <Switch
 checked={formData.notifications.mou_expiry}
 onCheckedChange={(checked) => updateNotifications('mou_expiry', checked)}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label>{t('settings.eventReminders')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.eventRemindersDesc')}
 </p>
 </div>
 <Switch
 checked={formData.notifications.event_reminders}
 onCheckedChange={(checked) => updateNotifications('event_reminders', checked)}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label>{t('settings.reportGeneration')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.reportGenerationDesc')}
 </p>
 </div>
 <Switch
 checked={formData.notifications.report_generation}
 onCheckedChange={(checked) => updateNotifications('report_generation', checked)}
 />
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {activeSection === 'security' && (
 <Card>
 <CardHeader>
 <CardTitle>{t('settings.security')}</CardTitle>
 <CardDescription>{t('settings.securityDesc')}</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="space-y-0.5">
 <Label className="flex items-center gap-2">
 <Smartphone className="h-4 w-4" />
 {t('settings.twoFactorAuth')}
 </Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.twoFactorAuthDesc')}
 </p>
 </div>
 <Switch
 checked={formData.security.mfa_enabled}
 onCheckedChange={(checked) => updateSecurity('mfa_enabled', checked)}
 />
 </div>

 {formData.security.mfa_enabled && (
 <Card className="border-orange-200 bg-orange-50">
 <CardContent className="p-4">
 <div className="flex items-start gap-2">
 <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
 <div className="text-sm text-orange-800">
 <p className="font-medium mb-1">{t('settings.mfaSetupRequired')}</p>
 <p>{t('settings.mfaSetupInstructions')}</p>
 <Button size="sm" className="mt-2">
 <Key className="h-4 w-4 me-2" />
 {t('settings.setupMfa')}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 <div className="space-y-2">
 <Label>{t('settings.sessionTimeout')}</Label>
 <p className="text-sm text-muted-foreground">
 {t('settings.sessionTimeoutDesc')}
 </p>
 <select
 value={formData.security.session_timeout}
 onChange={(e) => updateSecurity('session_timeout', Number(e.target.value))}
 className="w-full rounded-md border border-input bg-background px-3 py-2"
 >
 <option value={15}>15 {t('settings.minutes')}</option>
 <option value={30}>30 {t('settings.minutes')}</option>
 <option value={60}>1 {t('settings.hour')}</option>
 <option value={120}>2 {t('settings.hours')}</option>
 <option value={480}>8 {t('settings.hours')}</option>
 </select>
 </div>

 <div className="pt-4 border-t">
 <h3 className="font-medium mb-4">{t('settings.passwordChange')}</h3>
 <div className="space-y-4">
 <div>
 <Label>{t('settings.currentPassword')}</Label>
 <Input type="password" className="mt-2" />
 </div>
 <div>
 <Label>{t('settings.newPassword')}</Label>
 <Input type="password" className="mt-2" />
 </div>
 <div>
 <Label>{t('settings.confirmPassword')}</Label>
 <Input type="password" className="mt-2" />
 </div>
 <Button>
 <Key className="h-4 w-4 me-2" />
 {t('settings.changePassword')}
 </Button>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </>
 )}
 </div>
 </div>
 </div>
 )
}