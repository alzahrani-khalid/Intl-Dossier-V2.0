/**
 * BottomSheetDetailExample Component
 *
 * Demonstrates using BottomSheet for detail views with:
 * - Partial expansion states (snap points)
 * - Scrollable content
 * - Action buttons
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  BottomSheetFooter,
  BottomSheetClose,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, MapPin, Clock, Edit, Trash2, Share2, ChevronRight } from 'lucide-react'

interface DetailItem {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  status: 'active' | 'pending' | 'completed'
  date: string
  assignee: string
  location: string
}

interface BottomSheetDetailExampleProps {
  item: DetailItem
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}

export function BottomSheetDetailExample({
  item,
  onEdit,
  onDelete,
  onShare,
}: BottomSheetDetailExampleProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const title = isRTL ? item.titleAr : item.title
  const description = isRTL ? item.descriptionAr : item.description

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const statusLabels = {
    active: isRTL ? 'نشط' : 'Active',
    pending: isRTL ? 'معلق' : 'Pending',
    completed: isRTL ? 'مكتمل' : 'Completed',
  }

  return (
    <BottomSheet snapPreset="large">
      <BottomSheetTrigger asChild>
        <button className="w-full text-start p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-h-11">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{title}</h3>
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            </div>
            <ChevronRight
              className={`size-5 text-muted-foreground shrink-0 ${isRTL ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent showHandle padding="none">
        <div className="px-4 sm:px-6">
          <BottomSheetHeader>
            <div className="flex items-start justify-between gap-3">
              <BottomSheetTitle className="text-start">{title}</BottomSheetTitle>
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
            </div>
            <BottomSheetDescription className="text-start">{description}</BottomSheetDescription>
          </BottomSheetHeader>
        </div>

        <Separator className="my-4" />

        <BottomSheetBody className="px-4 sm:px-6">
          {/* Detail cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{isRTL ? 'التاريخ' : 'Date'}</p>
                <p className="font-medium">{item.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{isRTL ? 'المسؤول' : 'Assignee'}</p>
                <p className="font-medium">{item.assignee}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{isRTL ? 'الموقع' : 'Location'}</p>
                <p className="font-medium">{item.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'آخر تحديث' : 'Last Updated'}
                </p>
                <p className="font-medium">{isRTL ? 'منذ ساعتين' : '2 hours ago'}</p>
              </div>
            </div>
          </div>
        </BottomSheetBody>

        <BottomSheetFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="icon" onClick={onShare} className="min-h-11 min-w-11">
              <Share2 className="size-4" />
              <span className="sr-only">{isRTL ? 'مشاركة' : 'Share'}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="min-h-11 min-w-11 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{isRTL ? 'حذف' : 'Delete'}</span>
            </Button>
            <Button onClick={onEdit} className="min-h-11 flex-1 gap-2">
              <Edit className="size-4" />
              {isRTL ? 'تعديل' : 'Edit'}
            </Button>
          </div>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  )
}

export default BottomSheetDetailExample
