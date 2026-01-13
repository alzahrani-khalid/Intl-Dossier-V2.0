/**
 * BottomSheetFormExample Component
 *
 * Demonstrates using BottomSheet for form input with:
 * - Drag-to-dismiss gestures
 * - Keyboard avoidance
 * - RTL support
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

interface BottomSheetFormExampleProps {
  /** Callback when form is submitted */
  onSubmit?: (data: { title: string; description: string }) => void
}

export function BottomSheetFormExample({ onSubmit }: BottomSheetFormExampleProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ title, description })
    setTitle('')
    setDescription('')
    setOpen(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={setOpen} snapPreset="medium">
      <BottomSheetTrigger asChild>
        <Button size="lg" className="min-h-11 gap-2">
          <Plus className={isRTL ? 'rotate-0' : ''} />
          {t('common.create')}
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent showHandle showHandleHint>
        <form onSubmit={handleSubmit}>
          <BottomSheetHeader>
            <BottomSheetTitle>{isRTL ? 'إضافة عنصر جديد' : 'Add New Item'}</BottomSheetTitle>
            <BottomSheetDescription>
              {isRTL
                ? 'أدخل التفاصيل أدناه لإنشاء عنصر جديد.'
                : 'Enter the details below to create a new item.'}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{isRTL ? 'العنوان' : 'Title'}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'أدخل العنوان...' : 'Enter title...'}
                  className="min-h-11"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{isRTL ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isRTL ? 'أدخل الوصف...' : 'Enter description...'}
                  rows={4}
                />
              </div>
            </div>
          </BottomSheetBody>

          <BottomSheetFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
              <BottomSheetClose asChild>
                <Button type="button" variant="outline" className="min-h-11 flex-1">
                  {t('common.cancel')}
                </Button>
              </BottomSheetClose>
              <Button type="submit" className="min-h-11 flex-1" disabled={!title.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </BottomSheetFooter>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  )
}

export default BottomSheetFormExample
