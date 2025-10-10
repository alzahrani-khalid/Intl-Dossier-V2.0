/**
 * Waiting Queue Page (FR-033)
 *
 * Work-Queue-First: Priority page for blocked/waiting items
 * Features:
 * - List of assignments waiting for dependencies
 * - Categorized by waiting reason (approval, response, capacity)
 * - Aging indicators
 * - Escalation actions
 * - Follow-up reminders
 *
 * Mobile-first responsive design with RTL support
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Clock, AlertTriangle, Mail, UserCheck, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

interface WaitingItem {
  id: string
  title: string
  work_item_type: string
  dossier_name: string
  assignee_name: string
  waiting_reason: 'approval' | 'external_response' | 'capacity' | 'dependency'
  waiting_since: string
  last_action: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export function WaitingQueuePage() {
  const { t, i18n } = useTranslation(['common', 'waiting'])
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState<string>('all')

  // Fetch waiting items
  const { data: items, isLoading } = useQuery<WaitingItem[]>({
    queryKey: ['waiting-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          work_item_type,
          dossier:dossiers(name_en),
          assignee:staff(name),
          waiting_reason,
          waiting_since,
          last_action,
          priority
        `)
        .eq('status', 'waiting')
        .order('waiting_since', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        ...item,
        dossier_name: item.dossier?.name_en || 'Unknown',
        assignee_name: item.assignee?.name || 'Unassigned',
      }))
    },
    staleTime: 1 * 60 * 1000,
  })

  const getAgingStatus = (waitingSince: string) => {
    const now = new Date()
    const since = new Date(waitingSince)
    const daysWaiting = Math.floor((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24))

    if (daysWaiting >= 7) return { color: 'text-red-600', severity: 'critical', days: daysWaiting }
    if (daysWaiting >= 3) return { color: 'text-orange-600', severity: 'warning', days: daysWaiting }
    return { color: 'text-yellow-600', severity: 'normal', days: daysWaiting }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'approval':
        return UserCheck
      case 'external_response':
        return Mail
      case 'capacity':
        return Zap
      default:
        return Clock
    }
  }

  const filteredItems =
    activeTab === 'all' ? items : items?.filter((item) => item.waiting_reason === activeTab)

  const groupedCounts = items?.reduce(
    (acc, item) => {
      acc[item.waiting_reason] = (acc[item.waiting_reason] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {t('navigation.waitingQueue', 'Waiting Queue')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('waiting.description', 'Items blocked or awaiting dependencies')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-9">
                {t('waiting.sendReminder', 'Send Reminder')}
              </Button>
              <Button variant="outline" size="sm" className="min-h-9">
                {t('waiting.escalate', 'Escalate')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="all" className="min-h-9 text-xs sm:text-sm">
              {t('common.all', 'All')} ({items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="approval" className="min-h-9 text-xs sm:text-sm">
              {t('waiting.approval', 'Approval')} ({groupedCounts['approval'] || 0})
            </TabsTrigger>
            <TabsTrigger value="external_response" className="min-h-9 text-xs sm:text-sm">
              {t('waiting.externalResponse', 'Response')} ({groupedCounts['external_response'] || 0})
            </TabsTrigger>
            <TabsTrigger value="capacity" className="min-h-9 text-xs sm:text-sm">
              {t('waiting.capacity', 'Capacity')} ({groupedCounts['capacity'] || 0})
            </TabsTrigger>
            <TabsTrigger value="dependency" className="min-h-9 text-xs sm:text-sm">
              {t('waiting.dependency', 'Other')} ({groupedCounts['dependency'] || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="space-y-3 mt-4">
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
            {!isLoading && (!filteredItems || filteredItems.length === 0) && (
              <Card className="p-8 sm:p-12 text-center">
                <Clock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {t('waiting.empty', 'No waiting items')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all'
                    ? t('waiting.emptyDescription', 'All work items are progressing')
                    : t('waiting.emptyCategory', 'No items waiting for this reason')}
                </p>
              </Card>
            )}

            {/* Items List */}
            {!isLoading && filteredItems && filteredItems.length > 0 && (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const agingStatus = getAgingStatus(item.waiting_since)
                  const ReasonIcon = getReasonIcon(item.waiting_reason)

                  return (
                    <Card
                      key={item.id}
                      className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Main Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                              {item.title}
                            </h3>
                            <Badge variant="outline">{item.work_item_type}</Badge>
                            {agingStatus.severity === 'critical' && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {agingStatus.days}d
                              </Badge>
                            )}
                          </div>

                          {/* Waiting Reason */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ReasonIcon className="h-4 w-4" />
                            <span>
                              {t(`waiting.reasons.${item.waiting_reason}`, item.waiting_reason)}
                            </span>
                            <span>•</span>
                            <span className={agingStatus.color}>
                              {t('waiting.waitingFor', 'Waiting for')} {agingStatus.days}{' '}
                              {t('waiting.days', 'days')}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {t('waiting.dossier', 'Dossier')}: {item.dossier_name}
                            </span>
                            <span>•</span>
                            <span>
                              {t('waiting.assignee', 'Assignee')}: {item.assignee_name}
                            </span>
                            <span>•</span>
                            <span>{item.last_action}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none min-h-9"
                          >
                            {t('waiting.followUp', 'Follow Up')}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
