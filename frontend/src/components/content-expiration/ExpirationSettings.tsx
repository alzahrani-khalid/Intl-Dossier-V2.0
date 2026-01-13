/**
 * ExpirationSettings Component
 * Feature: content-expiration-dates
 * Allows users to set and manage expiration dates for content
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, RefreshCw, History, Plus, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useEntityExpiration } from '@/hooks/useContentExpiration'
import { ExpirationBadge } from './ExpirationBadge'
import type {
  ExpirationEntityType,
  ContentExpirationStatus,
} from '@/types/content-expiration.types'
import { EXTENSION_PRESETS, DEFAULT_EXPIRATION_DAYS } from '@/types/content-expiration.types'

interface ExpirationSettingsProps {
  entityType: ExpirationEntityType
  entityId: string
  entityName?: string
  currentExpiration?: ContentExpirationStatus | null
  onUpdate?: () => void
  className?: string
}

export function ExpirationSettings({
  entityType,
  entityId,
  entityName,
  currentExpiration,
  onUpdate,
  className,
}: ExpirationSettingsProps) {
  const { t, i18n } = useTranslation('content-expiration')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'set' | 'extend' | 'review'>('set')

  // Set expiration states
  const [expirationMode, setExpirationMode] = useState<'rule' | 'custom'>('rule')
  const [selectedRuleId, setSelectedRuleId] = useState<string>('')
  const [customDate, setCustomDate] = useState<string>('')

  // Extension states
  const [extensionDays, setExtensionDays] = useState<number>(30)
  const [extensionReason, setExtensionReason] = useState<string>('')

  // Review states
  const [reviewNotes, setReviewNotes] = useState<string>('')

  const {
    expirationStatus,
    expirationRules,
    expirationHistory,
    setExpiration,
    extendExpiration,
    markAsReviewed,
    requestReview,
    isSettingExpiration,
    isExtending,
    isMarking,
    isRequesting,
    isLoadingRules,
    refetchAll,
  } = useEntityExpiration(entityType, entityId)

  const status = currentExpiration || expirationStatus

  // Filter rules for this entity type
  const applicableRules = expirationRules.filter((rule) => rule.entity_type === entityType)

  const handleSetExpiration = async () => {
    try {
      const params: {
        entity_type: ExpirationEntityType
        entity_id: string
        expires_at?: string
        rule_id?: string
      } = {
        entity_type: entityType,
        entity_id: entityId,
      }

      if (expirationMode === 'custom' && customDate) {
        params.expires_at = new Date(customDate).toISOString()
      } else if (expirationMode === 'rule' && selectedRuleId) {
        params.rule_id = selectedRuleId
      }

      await setExpiration(params)
      toast({
        title: t('success.expirationSet'),
        variant: 'default',
      })
      await refetchAll()
      onUpdate?.()
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: t('errors.setFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleExtendExpiration = async () => {
    try {
      await extendExpiration({
        entity_type: entityType,
        entity_id: entityId,
        extension_days: extensionDays,
        reason: extensionReason || undefined,
      })
      toast({
        title: t('success.expirationExtended'),
        variant: 'default',
      })
      await refetchAll()
      onUpdate?.()
      setIsDialogOpen(false)
      setExtensionReason('')
    } catch (error) {
      toast({
        title: t('errors.extendFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleMarkReviewed = async () => {
    try {
      await markAsReviewed({
        entity_type: entityType,
        entity_id: entityId,
        notes: reviewNotes || undefined,
      })
      toast({
        title: t('success.markedReviewed'),
        variant: 'default',
      })
      await refetchAll()
      onUpdate?.()
      setIsDialogOpen(false)
      setReviewNotes('')
    } catch (error) {
      toast({
        title: t('errors.reviewFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleRequestReview = async () => {
    try {
      await requestReview({
        entity_type: entityType,
        entity_id: entityId,
        message: reviewNotes || undefined,
      })
      toast({
        title: t('success.reviewRequested'),
        variant: 'default',
      })
      setIsDialogOpen(false)
      setReviewNotes('')
    } catch (error) {
      toast({
        title: t('errors.requestFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className={cn('', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Current Status Display */}
      {status && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('title')}:</span>
            <ExpirationBadge
              status={status.freshness_status}
              expiresAt={status.expires_at}
              size="sm"
            />
          </div>
          {status.last_reviewed_at && (
            <span className="text-xs text-muted-foreground">
              {t('review.lastReviewed')}:{' '}
              {new Date(status.last_reviewed_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
            </span>
          )}
        </div>
      )}

      {/* Dialog Trigger */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            {status ? t('actions.extendExpiration') : t('actions.setExpiration')}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('settings.title')}
            </DialogTitle>
            <DialogDescription>
              {entityName || `${entityType} ${entityId.slice(0, 8)}...`}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="set" className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                {t('actions.setExpiration')}
              </TabsTrigger>
              <TabsTrigger value="extend" className="gap-1" disabled={!status}>
                <RefreshCw className="h-3.5 w-3.5" />
                {t('actions.extendExpiration')}
              </TabsTrigger>
              <TabsTrigger value="review" className="gap-1" disabled={!status}>
                <History className="h-3.5 w-3.5" />
                {t('actions.markReviewed')}
              </TabsTrigger>
            </TabsList>

            {/* Set Expiration Tab */}
            <TabsContent value="set" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="min-w-20">{t('settings.expirationRule')}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={expirationMode === 'rule' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpirationMode('rule')}
                    >
                      {t('settings.useRule')}
                    </Button>
                    <Button
                      variant={expirationMode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpirationMode('custom')}
                    >
                      {t('settings.customDate')}
                    </Button>
                  </div>
                </div>

                {expirationMode === 'rule' ? (
                  <div className="space-y-2">
                    <Label>{t('settings.selectRule')}</Label>
                    <Select
                      value={selectedRuleId}
                      onValueChange={setSelectedRuleId}
                      disabled={isLoadingRules}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings.selectRule')} />
                      </SelectTrigger>
                      <SelectContent>
                        {applicableRules.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            {t('settings.noRulesAvailable')}
                          </div>
                        ) : (
                          applicableRules.map((rule) => (
                            <SelectItem key={rule.id} value={rule.id}>
                              <div className="flex flex-col">
                                <span>{isRTL ? rule.name_ar : rule.name_en}</span>
                                <span className="text-xs text-muted-foreground">
                                  {rule.default_expiration_days} days
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{t('settings.expirationDate')}</Label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                <Button
                  onClick={handleSetExpiration}
                  disabled={
                    isSettingExpiration ||
                    (expirationMode === 'rule' && !selectedRuleId) ||
                    (expirationMode === 'custom' && !customDate)
                  }
                  className="w-full"
                >
                  {isSettingExpiration && <RefreshCw className="h-4 w-4 animate-spin me-2" />}
                  {t('actions.setExpiration')}
                </Button>
              </div>
            </TabsContent>

            {/* Extend Expiration Tab */}
            <TabsContent value="extend" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('extend.extensionPeriod')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXTENSION_PRESETS.map((preset) => (
                      <Button
                        key={preset.days}
                        variant={extensionDays === preset.days ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExtensionDays(preset.days)}
                      >
                        {t(`extend.presets.${preset.label.replace(' ', '').toLowerCase()}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('extend.customDays')}</Label>
                  <Input
                    type="number"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value, 10) || 0)}
                    min={1}
                    max={3650}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('extend.reason')}</Label>
                  <Textarea
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder={t('extend.reasonPlaceholder')}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleExtendExpiration}
                  disabled={isExtending || extensionDays <= 0}
                  className="w-full"
                >
                  {isExtending && <RefreshCw className="h-4 w-4 animate-spin me-2" />}
                  {t('extend.confirm')}
                </Button>
              </div>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('review.notes')}</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('review.notesPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleMarkReviewed} disabled={isMarking} className="flex-1">
                    {isMarking && <RefreshCw className="h-4 w-4 animate-spin me-2" />}
                    {t('review.confirm')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRequestReview}
                    disabled={isRequesting}
                    className="flex-1"
                  >
                    {isRequesting && <RefreshCw className="h-4 w-4 animate-spin me-2" />}
                    {t('actions.requestReview')}
                  </Button>
                </div>

                {status?.last_reviewed_at && (
                  <p className="text-sm text-muted-foreground">
                    {t('review.lastReviewed')}:{' '}
                    {new Date(status.last_reviewed_at).toLocaleDateString(
                      isRTL ? 'ar-SA' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact inline version for detail pages
export function ExpirationInlineDisplay({
  entityType,
  entityId,
  onUpdate,
  className,
}: Omit<ExpirationSettingsProps, 'entityName' | 'currentExpiration'>) {
  const { expirationStatus, isLoadingStatus } = useEntityExpiration(entityType, entityId)

  if (isLoadingStatus) {
    return <div className={cn('animate-pulse h-6 w-32 bg-muted rounded', className)} />
  }

  if (!expirationStatus) {
    return (
      <ExpirationSettings
        entityType={entityType}
        entityId={entityId}
        onUpdate={onUpdate}
        className={className}
      />
    )
  }

  return (
    <ExpirationSettings
      entityType={entityType}
      entityId={entityId}
      currentExpiration={expirationStatus}
      onUpdate={onUpdate}
      className={className}
    />
  )
}

export default ExpirationSettings
