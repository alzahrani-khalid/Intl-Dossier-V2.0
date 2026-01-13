/**
 * SampleDataBanner Component
 * Displays a prominent banner when sample data is active in the workspace
 * Mobile-first, RTL-compatible
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Calendar,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

import type { SampleDataInstance } from '@/types/sample-data.types'
import { templateBannerColors } from '@/types/sample-data.types'

interface SampleDataBannerProps {
  instances: SampleDataInstance[]
  onRemove: (instanceId?: string) => void
  isRemoving?: boolean
}

export function SampleDataBanner({
  instances,
  onRemove,
  isRemoving = false,
}: SampleDataBannerProps) {
  const { t, i18n } = useTranslation('sample-data')
  const isRTL = i18n.language === 'ar'

  const [isExpanded, setIsExpanded] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [instanceToRemove, setInstanceToRemove] = useState<string | undefined>()

  if (!instances || instances.length === 0) {
    return null
  }

  const primaryInstance = instances[0]
  const templateName = isRTL ? primaryInstance.template.name_ar : primaryInstance.template.name_en
  const bannerColor =
    templateBannerColors[primaryInstance.template.color] || templateBannerColors.blue

  // Calculate totals
  const totals = instances.reduce(
    (acc, instance) => ({
      dossiers: acc.dossiers + instance.counts.dossiers,
      relationships: acc.relationships + instance.counts.relationships,
      events: acc.events + instance.counts.events,
      contacts: acc.contacts + instance.counts.contacts,
    }),
    { dossiers: 0, relationships: 0, events: 0, contacts: 0 },
  )

  const handleRemoveClick = (instanceId?: string) => {
    setInstanceToRemove(instanceId)
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = () => {
    onRemove(instanceToRemove)
    setShowRemoveDialog(false)
    setInstanceToRemove(undefined)
  }

  return (
    <>
      <div
        className={`
          w-full border rounded-lg mb-4 overflow-hidden transition-all
          ${bannerColor}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="polite"
      >
        {/* Main banner row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                {t('banner.title')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {instances.length === 1
                  ? t('banner.description', { templateName })
                  : t('banner.descriptionMultiple', { count: instances.length })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                  <span className="hidden sm:inline">{t('banner.viewDetails')}</span>
                </>
              ) : (
                <>
                  <ChevronDown className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                  <span className="hidden sm:inline">{t('banner.viewDetails')}</span>
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
              onClick={() => handleRemoveClick()}
              disabled={isRemoving}
            >
              <Trash2 className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
              <span className="hidden sm:inline">
                {instances.length === 1 ? t('banner.removeButton') : t('banner.removeAll')}
              </span>
              <span className="sm:hidden">
                <X className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t px-3 sm:px-4 py-3 bg-background/50">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
              <StatCard
                icon={FileText}
                label={t('stats.dossiers', { count: totals.dossiers })}
                isRTL={isRTL}
              />
              <StatCard
                icon={Link2}
                label={t('stats.relationships', { count: totals.relationships })}
                isRTL={isRTL}
              />
              <StatCard
                icon={Calendar}
                label={t('stats.events', { count: totals.events })}
                isRTL={isRTL}
              />
              <StatCard
                icon={Users}
                label={t('stats.contacts', { count: totals.contacts })}
                isRTL={isRTL}
              />
            </div>

            {/* Instance list (if multiple) */}
            {instances.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('templates.title')}
                </p>
                {instances.map((instance) => (
                  <div
                    key={instance.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {isRTL ? instance.template.name_ar : instance.template.name_en}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {instance.counts.dossiers} dossiers
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveClick(instance.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.removeDescription', {
                dossierCount: totals.dossiers,
                relationshipCount: totals.relationships,
                eventCount: totals.events,
                contactCount: totals.contacts,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <AlertDialogCancel disabled={isRemoving}>{t('dialog.removeCancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('loading.removing')}
                </span>
              ) : (
                t('dialog.removeConfirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Helper component for stats
function StatCard({
  icon: Icon,
  label,
  isRTL,
}: {
  icon: React.ElementType
  label: string
  isRTL: boolean
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
    </div>
  )
}

export default SampleDataBanner
