/**
 * Intake Queue Page (FR-033)
 *
 * Work-Queue-First: Priority page for new incoming requests
 * Features:
 * - List of pending tickets awaiting triage
 * - AI triage suggestions
 * - Quick classification actions
 * - Batch operations
 * - SLA countdown indicators
 *
 * Mobile-first responsive design with RTL support
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { Inbox, Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { TriagePanel } from '../components/TriagePanel'

interface Ticket {
  id: string
  ticket_number: string
  title: string
  title_ar: string
  description: string
  description_ar: string
  source: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  created_at: string
  submitted_at: string | null
  triaged_at: string | null
  ai_suggestion?: {
    classification: string
    confidence: number
    dossier_id?: string
  }
}

export function IntakeQueuePage() {
  const { t, i18n } = useTranslation(['common', 'intake'])
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [classifyDialogOpen, setClassifyDialogOpen] = useState(false)
  const [selectedTicketForClassify, setSelectedTicketForClassify] = useState<string | null>(null)

  // Fetch pending tickets awaiting triage
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['intake-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intake_tickets')
        .select('*')
        .eq('status', 'submitted')
        .is('triaged_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    staleTime: 1 * 60 * 1000,
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getWaitingTime = (submittedAt: string | null) => {
    if (!submittedAt) return { color: 'text-muted-foreground', icon: Clock, label: 'Not submitted' }

    const now = new Date()
    const submitted = new Date(submittedAt)
    const hoursWaiting = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60)

    if (hoursWaiting > 8) return { color: 'text-red-600', icon: AlertCircle, label: `${Math.floor(hoursWaiting)}h waiting` }
    if (hoursWaiting > 4) return { color: 'text-orange-600', icon: Clock, label: `${Math.floor(hoursWaiting)}h waiting` }
    return { color: 'text-green-600', icon: CheckCircle2, label: `${Math.floor(hoursWaiting)}h waiting` }
  }

  const handleOpenClassifyDialog = (ticketId: string) => {
    setSelectedTicketForClassify(ticketId)
    setClassifyDialogOpen(true)
  }

  const handleCloseClassifyDialog = () => {
    setClassifyDialogOpen(false)
    setSelectedTicketForClassify(null)
  }

  const handleTriageSuccess = () => {
    // Close the dialog
    handleCloseClassifyDialog()
    // Clear selected tickets
    setSelectedTickets([])
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto p-4 sm:p-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 sm:size-12">
                <Inbox className="size-5 text-primary sm:size-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  {t('navigation.intakeQueue', 'Intake Queue')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('intake.description', 'Review and classify incoming requests')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => navigate({ to: '/intake/new' })}
                size="sm"
                className="min-h-9 gap-2"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{t('intake.createNew', 'New Request')}</span>
                <span className="sm:hidden">+</span>
              </Button>
              <Button variant="outline" size="sm" className="min-h-9">
                {t('common.filter', 'Filter')}
              </Button>
              {selectedTickets.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-9"
                  onClick={() => handleOpenClassifyDialog(selectedTickets[0])}
                >
                  {t('intake.classifySelected', 'Classify')} ({selectedTickets.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="mb-3 h-6 w-3/4 rounded bg-muted" />
                <div className="mb-2 h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!tickets || tickets.length === 0) && (
          <Card className="p-8 text-center sm:p-12">
            <Inbox className="mx-auto mb-4 size-12 text-muted-foreground sm:size-16" />
            <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl">
              {t('intake.empty', 'No pending tickets')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('intake.emptyDescription', 'All incoming requests have been processed')}
            </p>
          </Card>
        )}

        {/* Tickets List */}
        {!isLoading && tickets && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const waitingStatus = getWaitingTime(ticket.submitted_at)
              const WaitingIcon = waitingStatus.icon
              const displayTitle = isRTL ? ticket.title_ar : ticket.title
              const displayDescription = isRTL ? ticket.description_ar : ticket.description

              return (
                <Card
                  key={ticket.id}
                  className="group cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6"
                  onClick={() => navigate({ to: `/intake/tickets/${ticket.id}` })}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Checkbox */}
                    <div className="flex flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets([...selectedTickets, ticket.id])
                          } else {
                            setSelectedTickets(selectedTickets.filter((id) => id !== ticket.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 size-4 rounded border-border"
                      />

                      {/* Ticket Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                            {displayTitle}
                          </h3>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.ticket_number}
                          </Badge>
                        </div>

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {displayDescription}
                        </p>

                        {/* AI Suggestion */}
                        {ticket.ai_suggestion && (
                          <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="mb-1 text-sm font-medium text-foreground">
                              🤖 {t('intake.aiSuggestion', 'AI Suggestion')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.ai_suggestion.classification} (
                              {Math.round(ticket.ai_suggestion.confidence * 100)}% confidence)
                            </p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{ticket.source}</span>
                          <span>•</span>
                          <span>
                            {new Date(ticket.created_at).toLocaleDateString(
                              isRTL ? 'ar-SA' : 'en-US'
                            )}
                          </span>
                          <span>•</span>
                          <div className={`flex items-center gap-1 ${waitingStatus.color}`}>
                            <WaitingIcon className="size-3" />
                            <span>{waitingStatus.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 sm:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-9 flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenClassifyDialog(ticket.id)
                        }}
                      >
                        {t('intake.classify', 'Classify')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-9 flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({ to: `/intake/tickets/${ticket.id}` })
                        }}
                      >
                        {t('common.view', 'View')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Classify Dialog */}
      <Dialog open={classifyDialogOpen} onOpenChange={setClassifyDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {t('intake.classifyTicket', 'Classify Ticket')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'intake.classifyDescription',
                'Review AI suggestions or manually classify this ticket'
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTicketForClassify && (
            <TriagePanel ticketId={selectedTicketForClassify} onSuccess={handleTriageSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
