import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Download, Monitor, Trash2, Loader2, LogOut, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  device: string
  browser: string
  location: string
  lastActive: string
  isCurrent: boolean
}

/**
 * Data & Privacy settings section component
 * Handles data export, active sessions, and account deletion
 */
export function DataPrivacySettingsSection() {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const [isExporting, setIsExporting] = useState(false)
  const [isSigningOutAll, setIsSigningOutAll] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Mock sessions data - in production, fetch from Supabase
  const sessions: Session[] = [
    {
      id: '1',
      device: 'MacBook Pro',
      browser: 'Chrome 120',
      location: 'Riyadh, SA',
      lastActive: 'Now',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari',
      location: 'Riyadh, SA',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]

  const handleExportData = async () => {
    setIsExporting(true)
    // TODO: Implement data export via Supabase Edge Function
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsExporting(false)
  }

  const handleSignOutAll = async () => {
    setIsSigningOutAll(true)
    // TODO: Implement sign out all sessions via Supabase Auth
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSigningOutAll(false)
  }

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    console.log('Account deletion initiated')
  }

  return (
    <SettingsSectionCard
      title={t('dataPrivacy.title')}
      description={t('dataPrivacy.description')}
      icon={Shield}
    >
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Data Export */}
        <SettingsGroup>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border">
            <div className="flex items-start gap-3 text-start">
              <Download className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('dataPrivacy.dataExport')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('dataPrivacy.dataExportDesc')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="min-h-11 self-end sm:self-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('dataPrivacy.exportInProgress')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 me-2" />
                  {t('dataPrivacy.exportButton')}
                </>
              )}
            </Button>
          </div>
        </SettingsGroup>

        <Separator />

        {/* Active Sessions */}
        <SettingsGroup title={t('dataPrivacy.sessions')}>
          <p className="text-sm text-muted-foreground text-start -mt-2 mb-3">
            {t('dataPrivacy.sessionsDesc')}
          </p>
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={cn(session.isCurrent && 'border-primary/50 bg-primary/5')}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="text-start">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{session.device}</p>
                          {session.isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              {t('dataPrivacy.currentSession')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.browser} · {session.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('dataPrivacy.lastActive')}: {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button variant="ghost" size="sm">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="mt-3" disabled={isSigningOutAll}>
                  {isSigningOutAll ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 me-2" />
                  )}
                  {t('dataPrivacy.signOutAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-start">
                    {t('dataPrivacy.signOutAll')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-start">
                    {t('dataPrivacy.signOutConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse sm:flex-row gap-2">
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOutAll}>
                    {t('dataPrivacy.signOutAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </SettingsGroup>

        <Separator />

        {/* Delete Account */}
        <SettingsGroup>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 text-start">
                  <h4 className="text-sm font-medium text-destructive">
                    {t('dataPrivacy.deleteAccount')}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {t('dataPrivacy.deleteAccountDesc')}
                  </p>
                  <p className="text-xs sm:text-sm text-destructive/80 mt-2">
                    {t('dataPrivacy.deleteWarning')}
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="mt-4 min-h-10">
                        <Trash2 className="h-4 w-4 me-2" />
                        {t('dataPrivacy.deleteButton')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-start text-destructive">
                          {t('dataPrivacy.deleteConfirmTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-start">
                          {t('dataPrivacy.deleteConfirmDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label
                          htmlFor="delete-confirm"
                          className="text-sm text-muted-foreground block text-start mb-2"
                        >
                          {t('dataPrivacy.typeToConfirm')}
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="font-mono"
                        />
                      </div>
                      <AlertDialogFooter className="flex-row-reverse sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                          {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE'}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('dataPrivacy.deleteButton')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
