import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Download, Monitor, Trash2, Loader2, LogOut, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

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
  const { t } = useTranslation('settings')
  const { logout } = useAuthStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isSigningOutAll, setIsSigningOutAll] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [_isLoadingSessions, setIsLoadingSessions] = useState(true)

  // Fetch active sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          // Current session info
          const currentSession: Session = {
            id: 'current',
            device: getDeviceInfo(),
            browser: getBrowserInfo(),
            location: 'Current location',
            lastActive: 'Now',
            isCurrent: true,
          }
          setSessions([currentSession])
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setIsLoadingSessions(false)
      }
    }

    fetchSessions()
  }, [])

  // Helper to get browser info
  const getBrowserInfo = (): string => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown Browser'
  }

  // Helper to get device info
  const getDeviceInfo = (): string => {
    const ua = navigator.userAgent
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('iPad')) return 'iPad'
    if (ua.includes('Android')) return 'Android Device'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Windows')) return 'Windows PC'
    if (ua.includes('Linux')) return 'Linux'
    return 'Unknown Device'
  }

  const handleExportData = async () => {
    setIsExporting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // D-7: query the REAL tables. `user_settings` and `activity_log` do not
      // exist on staging — the prior code swallowed those errors and still
      // showed a success toast over an incomplete export. The real homes are
      // `user_preferences` and `activity_stream` (filtered by `actor_id`). Each
      // query's error is checked so the export never claims success over a
      // failed read.
      const [profileRes, preferencesRes, activityRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('activity_stream')
          .select('*')
          .eq('actor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (profileRes.error) throw profileRes.error
      if (preferencesRes.error) throw preferencesRes.error
      if (activityRes.error) throw activityRes.error
      if (!profileRes.data) {
        throw new Error(t('dataPrivacy.exportNoData', 'No data available to export.'))
      }

      // Compile export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        profile: profileRes.data,
        preferences: preferencesRes.data ?? {},
        recentActivity: activityRes.data ?? [],
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(t('dataPrivacy.exportSuccess'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSignOutAll = async () => {
    setIsSigningOutAll(true)

    try {
      // Sign out from all sessions using Supabase Auth
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) throw error

      toast.success(t('dataPrivacy.signedOutAll'))

      // Redirect to login after short delay
      setTimeout(() => {
        logout()
        window.location.href = '/login'
      }, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed'
      toast.error(message)
    } finally {
      setIsSigningOutAll(false)
    }
  }

  // D-8: self-service account deletion is intentionally not wired here. The
  // prior client-side `users` update targeted columns that do not exist
  // (`status`, `deleted_at`) and performed a destructive self-delete from the
  // browser — it threw at runtime yet the UI implied it worked. Until a server
  // edge function (admin authz + confirmation) exists, the action is disabled
  // and the user is directed to an administrator. No broken write, no false
  // success toast.

  return (
    <SettingsSectionCard
      title={t('dataPrivacy.title')}
      description={t('dataPrivacy.description')}
      icon={Shield}
    >
      <div className="space-y-8">
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
              <AlertDialogContent>
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

                  <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                    {t(
                      'dataPrivacy.deleteContactAdmin',
                      'To delete your account, please contact your administrator.',
                    )}
                  </p>

                  <Button variant="destructive" size="sm" className="mt-4 min-h-10" disabled>
                    <Trash2 className="h-4 w-4 me-2" />
                    {t('dataPrivacy.deleteButton')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
