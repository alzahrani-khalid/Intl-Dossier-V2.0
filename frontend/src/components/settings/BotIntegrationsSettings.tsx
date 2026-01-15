import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Loader2, Slack, MessageSquare, Link2, Unlink, Bell, Clock, Check, X } from 'lucide-react'
import { toast } from 'sonner'

// Types
interface BotLink {
  link_id: string
  platform: 'slack' | 'teams'
  workspace_name: string
  platform_username: string
  is_verified: boolean
  dm_notifications_enabled: boolean
  daily_briefing_dm: boolean
  created_at: string
}

interface BriefingSchedule {
  id: string
  is_active: boolean
  schedule_time: string
  days_of_week: number[]
  include_assignments: boolean
  include_deadlines: boolean
  include_calendar: boolean
  include_commitments: boolean
  max_items_per_section: number
  deadline_lookahead_days: number
}

// Fetch user's bot links
async function fetchBotLinks(): Promise<BotLink[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('get_user_bot_links', {
    p_user_id: user.id,
  })

  if (error) throw error
  return data || []
}

// Fetch briefing schedules for a link
async function fetchBriefingSchedules(linkId: string): Promise<BriefingSchedule[]> {
  const { data, error } = await supabase
    .from('bot_briefing_schedules')
    .select('*')
    .eq('user_link_id', linkId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Verify bot link
async function verifyBotLink(params: {
  platform: 'slack' | 'teams'
  code: string
  platformUserId: string
  tenantOrTeamId: string
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Find the pending link
  const { data: links, error: findError } = await supabase
    .from('bot_user_links')
    .select('id, workspace_id, verification_code, verification_expires_at')
    .eq(params.platform === 'slack' ? 'slack_user_id' : 'teams_user_id', params.platformUserId)
    .eq('verification_code', params.code)
    .is('user_id', null)
    .single()

  if (findError || !links) {
    throw new Error('Invalid or expired verification code')
  }

  // Check expiration
  if (new Date(links.verification_expires_at) < new Date()) {
    throw new Error('Verification code has expired')
  }

  // Update the link
  const { error: updateError } = await supabase
    .from('bot_user_links')
    .update({
      user_id: user.id,
      is_verified: true,
      verified_at: new Date().toISOString(),
      verification_code: null,
      verification_expires_at: null,
    })
    .eq('id', links.id)

  if (updateError) throw updateError
}

// Update link preferences
async function updateLinkPreferences(
  linkId: string,
  updates: Partial<{
    dm_notifications_enabled: boolean
    daily_briefing_dm: boolean
    language_preference: string
  }>,
): Promise<void> {
  const { error } = await supabase.from('bot_user_links').update(updates).eq('id', linkId)

  if (error) throw error
}

// Unlink bot account
async function unlinkBotAccount(linkId: string): Promise<void> {
  const { error } = await supabase.from('bot_user_links').delete().eq('id', linkId)

  if (error) throw error
}

// Update briefing schedule
async function updateBriefingSchedule(
  scheduleId: string,
  updates: Partial<BriefingSchedule>,
): Promise<void> {
  const { error } = await supabase
    .from('bot_briefing_schedules')
    .update(updates)
    .eq('id', scheduleId)

  if (error) throw error
}

// Create briefing schedule
async function createBriefingSchedule(
  linkId: string,
  platform: 'slack' | 'teams',
  targetId: string,
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase.from('bot_briefing_schedules').insert({
    user_link_id: linkId,
    workspace_id: workspaceId,
    platform,
    target_type: 'dm',
    target_id: targetId,
    is_active: true,
    schedule_time: '08:00',
    days_of_week: [1, 2, 3, 4, 5],
  })

  if (error) throw error
}

// Days of week options
const DAYS_OF_WEEK = [
  { value: 0, label: 'sunday' },
  { value: 1, label: 'monday' },
  { value: 2, label: 'tuesday' },
  { value: 3, label: 'wednesday' },
  { value: 4, label: 'thursday' },
  { value: 5, label: 'friday' },
  { value: 6, label: 'saturday' },
]

export function BotIntegrationsSettings() {
  const { t, i18n } = useTranslation('integrations')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // Get URL search params
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>

  // Handle verification from URL params
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const verify = searchParams.verify
    const code = searchParams.code
    const slackUser = searchParams.slack_user
    const teamsUser = searchParams.teams_user
    const teamId = searchParams.team_id
    const tenantId = searchParams.tenant_id

    if (verify && code && (slackUser || teamsUser)) {
      setVerifying(true)

      verifyBotLink({
        platform: verify as 'slack' | 'teams',
        code,
        platformUserId: slackUser || teamsUser || '',
        tenantOrTeamId: teamId || tenantId || '',
      })
        .then(() => {
          toast.success(t('verification.success'))
          queryClient.invalidateQueries({ queryKey: ['bot-links'] })
          // Clear URL params
          window.history.replaceState({}, '', '/settings/integrations')
        })
        .catch((error) => {
          toast.error(error.message || t('verification.error'))
        })
        .finally(() => {
          setVerifying(false)
        })
    }

    // Handle OAuth success/error
    const success = searchParams.success as string | undefined
    const error = searchParams.error as string | undefined

    if (success) {
      toast.success(t(`oauth.success.${success}`))
      queryClient.invalidateQueries({ queryKey: ['bot-links'] })
      window.history.replaceState({}, '', '/settings/integrations')
    }

    if (error) {
      toast.error(t(`oauth.error.${error}`))
      window.history.replaceState({}, '', '/settings/integrations')
    }
  }, [searchParams, queryClient, t])

  // Fetch bot links
  const { data: botLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['bot-links'],
    queryFn: fetchBotLinks,
  })

  // Mutations
  const updatePreferencesMutation = useMutation({
    mutationFn: ({
      linkId,
      updates,
    }: {
      linkId: string
      updates: Parameters<typeof updateLinkPreferences>[1]
    }) => updateLinkPreferences(linkId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-links'] })
      toast.success(t('preferences.saved'))
    },
    onError: () => {
      toast.error(t('preferences.error'))
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: unlinkBotAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-links'] })
      toast.success(t('unlink.success'))
    },
    onError: () => {
      toast.error(t('unlink.error'))
    },
  })

  // Slack OAuth URL
  const slackClientId = import.meta.env.VITE_SLACK_CLIENT_ID
  const slackRedirectUri = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/slack-bot/oauth'
  const slackOAuthUrl = slackClientId
    ? `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=chat:write,commands,users:read&redirect_uri=${encodeURIComponent(slackRedirectUri)}`
    : null

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('verification.verifying')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start mt-2">{t('description')}</p>
      </div>

      {/* Connect New Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('connect.title')}</CardTitle>
          <CardDescription className="text-start">{t('connect.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slack */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4A154B] rounded-lg">
                  <Slack className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">{t('platforms.slack')}</h3>
                  <p className="text-sm text-muted-foreground">{t('platforms.slackDesc')}</p>
                </div>
              </div>
              {slackOAuthUrl ? (
                <Button asChild size="sm">
                  <a href={slackOAuthUrl}>
                    <Link2 className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('connect.button')}
                  </a>
                </Button>
              ) : (
                <Badge variant="outline">{t('connect.notConfigured')}</Badge>
              )}
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5558AF] rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">{t('platforms.teams')}</h3>
                  <p className="text-sm text-muted-foreground">{t('platforms.teamsDesc')}</p>
                </div>
              </div>
              <Badge variant="outline">{t('connect.comingSoon')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('connected.title')}</CardTitle>
          <CardDescription className="text-start">{t('connected.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !botLinks || botLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('connected.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {botLinks.map((link) => (
                <BotLinkCard
                  key={link.link_id}
                  link={link}
                  onUpdatePreferences={(updates) =>
                    updatePreferencesMutation.mutate({ linkId: link.link_id, updates })
                  }
                  onUnlink={() => unlinkMutation.mutate(link.link_id)}
                  isUpdating={updatePreferencesMutation.isPending}
                  isUnlinking={unlinkMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('features.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{t('features.notifications.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('features.notifications.desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{t('features.briefing.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('features.briefing.desc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Bot Link Card Component
function BotLinkCard({
  link,
  onUpdatePreferences,
  onUnlink,
  isUpdating,
  isUnlinking,
}: {
  link: BotLink
  onUpdatePreferences: (updates: Parameters<typeof updateLinkPreferences>[1]) => void
  onUnlink: () => void
  isUpdating: boolean
  isUnlinking: boolean
}) {
  const { t, i18n } = useTranslation('integrations')
  const isRTL = i18n.language === 'ar'

  const PlatformIcon = link.platform === 'slack' ? Slack : MessageSquare
  const platformColor = link.platform === 'slack' ? '#4A154B' : '#5558AF'

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: platformColor }}>
            <PlatformIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{link.workspace_name}</h3>
              {link.is_verified ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="h-3 w-3 me-1" />
                  {t('connected.verified')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {t('connected.pending')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('connected.linkedAs', { name: link.platform_username })}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUnlinking}>
              {isUnlinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlink className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('connected.unlink')}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('unlink.confirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('unlink.confirmDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={onUnlink}
                className="bg-destructive text-destructive-foreground"
              >
                {t('connected.unlink')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Preferences */}
      {link.is_verified && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('preferences.dmNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('preferences.dmNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={link.dm_notifications_enabled}
              onCheckedChange={(checked) =>
                onUpdatePreferences({ dm_notifications_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t('preferences.dailyBriefing')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.dailyBriefingDesc')}</p>
            </div>
            <Switch
              checked={link.daily_briefing_dm}
              onCheckedChange={(checked) => onUpdatePreferences({ daily_briefing_dm: checked })}
              disabled={isUpdating}
            />
          </div>
        </div>
      )}
    </div>
  )
}
