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
import { supabase } from '../lib/supabase'
import { Inbox, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'

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

  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

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

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {t('navigation.intakeQueue', 'Intake Queue')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('intake.description', 'Review and classify incoming requests')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-9">
                {t('common.filter', 'Filter')}
              </Button>
              {selectedTickets.length > 0 && (
                <Button size="sm" className="min-h-9">
                  {t('intake.classifySelected', 'Classify')} ({selectedTickets.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!tickets || tickets.length === 0) && (
          <Card className="p-8 sm:p-12 text-center">
            <Inbox className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
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
                  className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start gap-3 flex-1">
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
                        className="mt-1 h-4 w-4 rounded border-border"
                      />

                      {/* Ticket Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground">
                            {displayTitle}
                          </h3>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.ticket_number}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {displayDescription}
                        </p>

                        {/* AI Suggestion */}
                        {ticket.ai_suggestion && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                            <p className="text-sm font-medium text-foreground mb-1">
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
                            <WaitingIcon className="h-3 w-3" />
                            <span>{waitingStatus.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-h-9">
                        {t('intake.classify', 'Classify')}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none min-h-9">
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
    </div>
  )
}
