/**
 * CalendarSyncSettings Component
 * Two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
 *
 * Features:
 * - Connect/disconnect OAuth providers (Google, Outlook, Exchange)
 * - Manage iCal feed subscriptions
 * - Configure sync direction and conflict resolution
 * - View and resolve sync conflicts
 * - Manual sync trigger
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
  Clock,
  CloudOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { useCalendarSync, useExternalCalendars } from '@/hooks/useCalendarSync'
import type {
  ExternalCalendarProvider,
  ExternalCalendarConnection,
  CalendarSyncConflict,
  ICalFeedSubscription,
} from '@/types/calendar-sync.types'
import {
  CALENDAR_PROVIDERS,
  SYNC_DIRECTION_OPTIONS,
  CONFLICT_STRATEGY_OPTIONS,
} from '@/types/calendar-sync.types'

// ============================================================================
// Provider Icons
// ============================================================================

function ProviderIcon({ provider }: { provider: ExternalCalendarProvider }) {
  switch (provider) {
    case 'google_calendar':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      )
    case 'outlook':
    case 'exchange':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 5.5V18.5C2 19.33 2.67 20 3.5 20H20.5C21.33 20 22 19.33 22 18.5V5.5C22 4.67 21.33 4 20.5 4H3.5C2.67 4 2 4.67 2 5.5ZM12 13L4 8V6L12 11L20 6V8L12 13Z" />
        </svg>
      )
    case 'ical_feed':
      return <Calendar className="h-5 w-5" />
    default:
      return <Calendar className="h-5 w-5" />
  }
}

// ============================================================================
// Status Badge
// ============================================================================

function SyncStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('calendar-sync')

  const variants: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
  > = {
    active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
    pending: { variant: 'secondary', className: '' },
    paused: { variant: 'outline', className: '' },
    error: { variant: 'destructive', className: '' },
    disconnected: { variant: 'outline', className: 'text-muted-foreground' },
  }

  const defaultConfig = { variant: 'secondary' as const, className: '' }
  const config = variants[status] ?? defaultConfig

  return (
    <Badge variant={config.variant} className={config.className}>
      {t(`status.${status}`)}
    </Badge>
  )
}

// ============================================================================
// Connection Card
// ============================================================================

interface ConnectionCardProps {
  connection: ExternalCalendarConnection
  onSync: () => void
  onDisconnect: () => void
  onUpdateSettings: (updates: Record<string, unknown>) => void
  isSyncing: boolean
}

function ConnectionCard({
  connection,
  onSync,
  onDisconnect,
  onUpdateSettings,
  isSyncing,
}: ConnectionCardProps) {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const { data: calendars } = useExternalCalendars(isExpanded ? connection.id : undefined)

  const providerConfig = CALENDAR_PROVIDERS[connection.provider]

  return (
    <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: providerConfig.color + '20',
                  color: providerConfig.color,
                }}
              >
                <ProviderIcon provider={connection.provider} />
              </div>
              <div>
                <CardTitle className="text-base">{providerConfig.name}</CardTitle>
                <CardDescription className="text-sm">
                  {connection.provider_email || connection.provider_name || t('noAccountLinked')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SyncStatusBadge status={connection.sync_status} />
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-4 border-t">
            {/* Sync Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing || connection.sync_status === 'disconnected'}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 me-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('syncing') : t('syncNow')}
              </Button>
              <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4 me-2" />
                    {t('disconnect')}
                  </Button>
                </DialogTrigger>
                <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                  <DialogHeader>
                    <DialogTitle>{t('disconnectConfirm.title')}</DialogTitle>
                    <DialogDescription>
                      {t('disconnectConfirm.description', { provider: providerConfig.name })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onDisconnect()
                        setShowDisconnectDialog(false)
                      }}
                    >
                      {t('disconnect')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sync Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('settings.syncEnabled')}</Label>
                <Switch
                  checked={connection.sync_enabled}
                  onCheckedChange={(checked) => onUpdateSettings({ sync_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.syncDirection')}</Label>
                <Select
                  value={connection.sync_direction}
                  onValueChange={(value) => onUpdateSettings({ sync_direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SYNC_DIRECTION_OPTIONS).map(([key, option]) => (
                      <SelectItem key={key} value={key}>
                        {isRTL ? option.label_ar : option.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.conflictStrategy')}</Label>
                <Select
                  value={connection.conflict_strategy}
                  onValueChange={(value) => onUpdateSettings({ conflict_strategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONFLICT_STRATEGY_OPTIONS).map(([key, option]) => (
                      <SelectItem key={key} value={key}>
                        {isRTL ? option.label_ar : option.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('settings.syncPastDays')}</Label>
                  <Input
                    type="number"
                    value={connection.sync_past_days}
                    onChange={(e) => onUpdateSettings({ sync_past_days: parseInt(e.target.value) })}
                    min={1}
                    max={365}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('settings.syncFutureDays')}</Label>
                  <Input
                    type="number"
                    value={connection.sync_future_days}
                    onChange={(e) =>
                      onUpdateSettings({ sync_future_days: parseInt(e.target.value) })
                    }
                    min={1}
                    max={365}
                  />
                </div>
              </div>
            </div>

            {/* Calendars */}
            {calendars && calendars.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('calendars.title')}</Label>
                <div className="space-y-2">
                  {calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: calendar.color || '#3B82F6' }}
                        />
                        <div>
                          <p className="text-sm font-medium">{calendar.name}</p>
                          {calendar.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              {t('calendars.primary')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={calendar.sync_enabled}
                        onCheckedChange={() => {
                          // TODO: This would call updateCalendar mutation
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Sync Info */}
            {connection.last_sync_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {t('lastSync')}:{' '}
                  {new Date(connection.last_sync_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            )}

            {connection.last_sync_error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{connection.last_sync_error}</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// ============================================================================
// Connect Provider Dialog
// ============================================================================

interface ConnectProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (provider: ExternalCalendarProvider) => void
  isConnecting: boolean
}

function ConnectProviderDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectProviderDialogProps) {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'

  const providers: ExternalCalendarProvider[] = ['google_calendar', 'outlook', 'exchange']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('connect.title')}</DialogTitle>
          <DialogDescription>{t('connect.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {providers.map((provider) => {
            const config = CALENDAR_PROVIDERS[provider]
            return (
              <Button
                key={provider}
                variant="outline"
                className="h-auto p-4 justify-start gap-3"
                onClick={() => onConnect(provider)}
                disabled={isConnecting}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: config.color + '20', color: config.color }}
                >
                  <ProviderIcon provider={provider} />
                </div>
                <div className="text-start">
                  <p className="font-medium">{config.name}</p>
                  <p className="text-sm text-muted-foreground">{t(`connect.${provider}`)}</p>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// iCal Feed Dialog
// ============================================================================

interface ICalFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (input: { feed_url: string; feed_name: string; color?: string }) => void
  isAdding: boolean
}

function ICalFeedDialog({ open, onOpenChange, onAdd, isAdding }: ICalFeedDialogProps) {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'
  const [feedUrl, setFeedUrl] = useState('')
  const [feedName, setFeedName] = useState('')
  const [color, setColor] = useState('#3B82F6')

  const handleSubmit = () => {
    if (feedUrl && feedName) {
      onAdd({ feed_url: feedUrl, feed_name: feedName, color })
      setFeedUrl('')
      setFeedName('')
      setColor('#3B82F6')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('ical.addTitle')}</DialogTitle>
          <DialogDescription>{t('ical.addDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feed-url">{t('ical.feedUrl')}</Label>
            <Input
              id="feed-url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://calendar.example.com/feed.ics"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feed-name">{t('ical.feedName')}</Label>
            <Input
              id="feed-name"
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              placeholder={t('ical.feedNamePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feed-color">{t('ical.color')}</Label>
            <div className="flex items-center gap-3">
              <Input
                id="feed-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 p-1"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!feedUrl || !feedName || isAdding}>
            {isAdding ? t('adding') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// iCal Subscription Card
// ============================================================================

interface ICalSubscriptionCardProps {
  subscription: ICalFeedSubscription
  onRefresh: () => void
  onRemove: () => void
  onUpdate: (updates: Record<string, unknown>) => void
  isRefreshing: boolean
}

function ICalSubscriptionCard({
  subscription,
  onRefresh,
  onRemove,
  onUpdate,
  isRefreshing,
}: ICalSubscriptionCardProps) {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'

  return (
    <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: subscription.color + '20', color: subscription.color }}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{subscription.feed_name}</p>
              <p className="text-sm text-muted-foreground">
                {subscription.event_count} {t('ical.events')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={subscription.sync_enabled}
              onCheckedChange={(checked) => onUpdate({ sync_enabled: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {subscription.last_refresh_error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{subscription.last_refresh_error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Conflict Resolution Card
// ============================================================================

interface ConflictCardProps {
  conflict: CalendarSyncConflict
  onResolve: (resolution: 'keep_internal' | 'keep_external' | 'merge' | 'ignore') => void
  isResolving: boolean
}

function ConflictCard({ conflict, onResolve, isResolving }: ConflictCardProps) {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'

  return (
    <Card className="w-full border-warning" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{t('conflicts.detected')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">{t('conflicts.internal')}</p>
            <p className="text-sm">{conflict.internal_snapshot.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(conflict.internal_snapshot.start_datetime).toLocaleString(
                isRTL ? 'ar-SA' : 'en-US',
              )}
            </p>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">{t('conflicts.external')}</p>
            <p className="text-sm">{conflict.external_snapshot.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(conflict.external_snapshot.start_datetime).toLocaleString(
                isRTL ? 'ar-SA' : 'en-US',
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve('keep_internal')}
            disabled={isResolving}
          >
            {t('conflicts.keepInternal')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve('keep_external')}
            disabled={isResolving}
          >
            {t('conflicts.keepExternal')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResolve('ignore')}
            disabled={isResolving}
          >
            {t('conflicts.ignore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function CalendarSyncSettings() {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'

  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showICalDialog, setShowICalDialog] = useState(false)

  const {
    connections,
    isLoadingConnections,
    conflicts,
    icalSubscriptions,
    connectProvider,
    isConnecting,
    disconnectProvider,
    updateConnection,
    triggerSync,
    isSyncing,
    resolveConflict,
    isResolvingConflict,
    addICalFeed,
    isAddingIcal,
    updateICalFeed,
    removeICalFeed,
    refreshICalFeed,
    isRefreshingIcal,
  } = useCalendarSync()

  const handleConnect = async (provider: ExternalCalendarProvider) => {
    const redirectUri = `${window.location.origin}/settings/calendar/callback`
    await connectProvider(provider, redirectUri)
    setShowConnectDialog(false)
  }

  const pendingConflicts = conflicts.filter((c) => c.status === 'pending')

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)} className="h-11 min-w-11">
          <Plus className="h-4 w-4 me-2" />
          {t('addConnection')}
        </Button>
      </div>

      {/* Conflicts Alert */}
      {pendingConflicts.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-warning">
                {t('conflicts.pending', { count: pendingConflicts.length })}
              </p>
              <p className="text-sm text-muted-foreground">{t('conflicts.resolvePrompt')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Calendars */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('sections.connected')}</h2>
        {isLoadingConnections ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : connections.length > 0 ? (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onSync={() => triggerSync({ connection_id: connection.id })}
                onDisconnect={() => disconnectProvider(connection.id)}
                onUpdateSettings={(updates) => updateConnection(connection.id, updates as any)}
                isSyncing={isSyncing}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <CloudOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noConnections')}</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowConnectDialog(true)}>
                <Link2 className="h-4 w-4 me-2" />
                {t('connectFirst')}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* iCal Feeds */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('sections.icalFeeds')}</h2>
          <Button variant="outline" size="sm" onClick={() => setShowICalDialog(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t('ical.add')}
          </Button>
        </div>
        {icalSubscriptions.length > 0 ? (
          <div className="grid gap-4">
            {icalSubscriptions.map((subscription) => (
              <ICalSubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onRefresh={() => refreshICalFeed(subscription.id)}
                onRemove={() => removeICalFeed(subscription.id)}
                onUpdate={(updates) => updateICalFeed(subscription.id, updates as any)}
                isRefreshing={isRefreshingIcal}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('ical.noFeeds')}</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowICalDialog(true)}>
                <Plus className="h-4 w-4 me-2" />
                {t('ical.addFirst')}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Conflicts */}
      {pendingConflicts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('sections.conflicts')}</h2>
          <div className="grid gap-4">
            {pendingConflicts.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolve={(resolution) =>
                  resolveConflict({ conflict_id: conflict.id, resolution })
                }
                isResolving={isResolvingConflict}
              />
            ))}
          </div>
        </section>
      )}

      {/* Dialogs */}
      <ConnectProviderDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnect={handleConnect}
        isConnecting={isConnecting}
      />

      <ICalFeedDialog
        open={showICalDialog}
        onOpenChange={setShowICalDialog}
        onAdd={addICalFeed}
        isAdding={isAddingIcal}
      />
    </div>
  )
}

export default CalendarSyncSettings
