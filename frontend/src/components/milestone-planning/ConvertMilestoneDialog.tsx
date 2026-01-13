/**
 * ConvertMilestoneDialog Component
 *
 * Dialog for converting a planned milestone to an actual timeline event.
 * Mobile-first responsive design with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, Calendar, FileCheck2, ClipboardList } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PlannedMilestone } from '@/types/milestone-planning.types'

interface ConvertMilestoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone: PlannedMilestone
  onConvert: (eventType: string) => Promise<void>
}

const eventTypes = [
  {
    value: 'calendar',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    value: 'commitment',
    icon: FileCheck2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    value: 'decision',
    icon: ClipboardList,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
]

export function ConvertMilestoneDialog({
  open,
  onOpenChange,
  milestone,
  onConvert,
}: ConvertMilestoneDialogProps) {
  const { t, i18n } = useTranslation('milestone-planning')
  const isRTL = i18n.language === 'ar'

  const [selectedType, setSelectedType] = useState('calendar')
  const [isConverting, setIsConverting] = useState(false)

  const title = isRTL ? milestone.title_ar : milestone.title_en

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      await onConvert(selectedType)
      onOpenChange(false)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            {t('convert.title')}
          </DialogTitle>
          <DialogDescription>{t('convert.description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Milestone being converted */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {t('types.' + milestone.milestone_type)}
            </p>
            <p className="font-medium text-sm">{title}</p>
          </div>

          {/* Event Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('convert.selectEventType')}</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={setSelectedType}
              className="grid grid-cols-1 gap-2"
            >
              {eventTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30',
                    )}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        type.bgColor,
                      )}
                    >
                      <Icon className={cn('h-5 w-5', type.color)} />
                    </div>
                    <span className="font-medium text-sm">
                      {t(`convert.eventTypes.${type.value}`)}
                    </span>
                    {selectedType === type.value && (
                      <div className="ms-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Label>
                )
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
            className="w-full sm:w-auto"
          >
            {t('form.cancel')}
          </Button>
          <Button onClick={handleConvert} disabled={isConverting} className="w-full sm:w-auto">
            {isConverting ? t('common:converting', 'Converting...') : t('convert.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
