// WatchButton Component
// Quick action button to add/remove entity from watchlist
// Feature: personal-watchlist

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Loader2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useIsEntityWatched } from '@/hooks/useWatchlist'
import type {
  WatchableEntityType,
  WatchPriority,
  AddToWatchlistRequest,
} from '@/types/watchlist.types'
import { PRIORITY_INFO } from '@/types/watchlist.types'

interface WatchButtonProps {
  entityType: WatchableEntityType
  entityId: string
  entityName?: string
  variant?: 'icon' | 'button' | 'compact'
  showSettings?: boolean
  className?: string
  onWatchChange?: (isWatched: boolean) => void
}

export function WatchButton({
  entityType,
  entityId,
  entityName,
  variant = 'icon',
  showSettings = true,
  className,
  onWatchChange,
}: WatchButtonProps) {
  const { t, i18n } = useTranslation('watchlist')
  const isRTL = i18n.language === 'ar'

  const { isWatched, watch, isLoading, toggleWatch } = useIsEntityWatched(entityType, entityId)

  const [isOpen, setIsOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [settings, setSettings] = useState<Partial<AddToWatchlistRequest>>({
    priority: 'medium',
    notes: '',
    notify_on_modification: true,
    notify_on_relationship_change: true,
    notify_on_deadline: true,
    notify_on_status_change: true,
  })

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await toggleWatch(isWatched ? undefined : settings)
      onWatchChange?.(!isWatched)
    } finally {
      setIsToggling(false)
      setIsOpen(false)
    }
  }

  const handleQuickToggle = async () => {
    setIsToggling(true)
    try {
      await toggleWatch()
      onWatchChange?.(!isWatched)
    } finally {
      setIsToggling(false)
    }
  }

  const isProcessing = isLoading || isToggling

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9 min-h-9 min-w-9', isWatched && 'text-primary', className)}
        onClick={handleQuickToggle}
        disabled={isProcessing}
        aria-label={isWatched ? t('actions.unwatch') : t('actions.watch')}
        title={isWatched ? t('actions.unwatch') : t('actions.watch')}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isWatched ? (
          <Eye className="h-4 w-4 fill-current" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Button
        variant={isWatched ? 'default' : 'outline'}
        size="sm"
        className={cn('h-8 min-h-8 gap-1.5 px-2.5', className)}
        onClick={handleQuickToggle}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isWatched ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        <span className="text-xs">{isWatched ? t('actions.watching') : t('actions.watch')}</span>
      </Button>
    )
  }

  // Full button variant with settings popover
  return (
    <div className={cn('flex items-center gap-1', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Button
        variant={isWatched ? 'default' : 'outline'}
        size="sm"
        className="h-9 min-h-9 gap-2 px-3"
        onClick={handleQuickToggle}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isWatched ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
        <span>{isWatched ? t('actions.watching') : t('actions.watch')}</span>
      </Button>

      {showSettings && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-h-9 min-w-9"
              aria-label={t('actions.settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80"
            align={isRTL ? 'start' : 'end'}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">{t('settings.title')}</h4>
                {entityName && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{entityName}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>{t('settings.priority')}</Label>
                <Select
                  value={watch?.priority || settings.priority}
                  onValueChange={(value) =>
                    setSettings((s) => ({ ...s, priority: value as WatchPriority }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <span className={info.color}>{t(info.labelKey)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{t('settings.notes')}</Label>
                <Textarea
                  value={watch?.notes || settings.notes}
                  onChange={(e) => setSettings((s) => ({ ...s, notes: e.target.value }))}
                  placeholder={t('settings.notesPlaceholder')}
                  className="min-h-[60px] text-sm"
                />
              </div>

              {/* Notification toggles */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  {t('settings.notifications')}
                </Label>

                <div className="space-y-2">
                  {(
                    [
                      { key: 'notify_on_modification', label: 'notifyModification' },
                      { key: 'notify_on_relationship_change', label: 'notifyRelationship' },
                      { key: 'notify_on_deadline', label: 'notifyDeadline' },
                      { key: 'notify_on_status_change', label: 'notifyStatus' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <Label className="text-sm font-normal cursor-pointer">
                        {t(`settings.${label}`)}
                      </Label>
                      <Switch
                        checked={
                          (watch?.[key] as boolean | undefined) ??
                          (settings[key] as boolean | undefined) ??
                          true
                        }
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  {t('common:cancel')}
                </Button>
                <Button size="sm" className="flex-1" onClick={handleToggle} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {isWatched ? t('actions.update') : t('actions.addToWatchlist')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default WatchButton
