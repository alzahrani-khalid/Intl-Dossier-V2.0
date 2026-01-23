// T097: CalendarPage with month/week/day views
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { UnifiedCalendar } from '@/components/Calendar/UnifiedCalendar'
import { EventCard } from '@/components/Calendar/EventCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarEntryForm } from '@/components/Calendar/CalendarEntryForm'
import { useCalendarEvents, type CalendarEvent } from '@/hooks/useCalendar'

export function CalendarPage() {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Fetch calendar events
  const { events, isLoading, refetch } = useCalendarEvents()

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsViewDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    refetch() // Refresh calendar events
  }

  const handleUpdateSuccess = () => {
    setIsViewDialogOpen(false)
    setSelectedEvent(null)
    refetch() // Refresh calendar events
  }

  return (
    <div
      className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-start text-2xl font-bold sm:text-3xl md:text-4xl">{t('title')}</h1>
          <p className="mt-1 text-start text-sm text-muted-foreground sm:text-base">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="h-11 px-4 sm:px-6">
          <Plus className="me-2 size-4" />
          {t('create_event')}
        </Button>
      </div>

      {/* Calendar View */}
      <UnifiedCalendar events={events} onEventClick={handleEventClick} isLoading={isLoading} />

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create_event')}</DialogTitle>
            <DialogDescription>{t('create_event_description')}</DialogDescription>
          </DialogHeader>
          <CalendarEntryForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('event_details')}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <EventCard event={selectedEvent} />
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    setSelectedEvent(null)
                  }}
                >
                  {t('close')}
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Open edit mode with CalendarEntryForm
                    setIsViewDialogOpen(false)
                  }}
                >
                  {t('edit')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
