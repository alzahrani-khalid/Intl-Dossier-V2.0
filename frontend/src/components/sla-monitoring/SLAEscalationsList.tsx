/**
 * SLA Escalations List Component
 * Feature: sla-monitoring
 *
 * Displays and manages SLA escalation events with RTL support
 */

import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  XCircle,
  Clock,
  UserCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { SLAEscalation, SLAEscalationStatus } from '@/types/sla.types'
import { SLA_STATUS_CONFIG } from '@/types/sla.types'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SLAEscalationsListProps {
  data?: SLAEscalation[]
  isLoading?: boolean
  onAcknowledge?: (escalationId: string) => void
  onResolve?: (escalationId: string, notes?: string) => void
  onStatusFilterChange?: (status: SLAEscalationStatus | 'all') => void
  className?: string
}

export function SLAEscalationsList({
  data,
  isLoading,
  onAcknowledge,
  onResolve,
  onStatusFilterChange,
  className,
}: SLAEscalationsListProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'
  const [statusFilter, setStatusFilter] = useState<SLAEscalationStatus | 'all'>('all')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedEscalation, setSelectedEscalation] = useState<SLAEscalation | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')

  const handleStatusChange = (value: string) => {
    const newStatus = value as SLAEscalationStatus | 'all'
    setStatusFilter(newStatus)
    onStatusFilterChange?.(newStatus)
  }

  const handleResolve = () => {
    if (selectedEscalation) {
      onResolve?.(selectedEscalation.id, resolveNotes)
      setResolveDialogOpen(false)
      setSelectedEscalation(null)
      setResolveNotes('')
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatusBadge = ({ status }: { status: SLAEscalationStatus }) => {
    const config = SLA_STATUS_CONFIG[status]
    const StatusIcon =
      status === 'resolved'
        ? CheckCircle
        : status === 'triggered'
          ? AlertTriangle
          : status === 'acknowledged'
            ? Eye
            : status === 'dismissed'
              ? XCircle
              : Clock

    return (
      <Badge variant="outline" className={cn(config.color, config.bgColor)}>
        <StatusIcon className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
        {isRTL ? config.labelAr : config.label}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('escalations.title')}
          </CardTitle>
          <CardDescription>{t('escalations.description')}</CardDescription>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('escalations.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('escalations.allStatuses')}</SelectItem>
            <SelectItem value="triggered">{t('escalations.triggered')}</SelectItem>
            <SelectItem value="acknowledged">{t('escalations.acknowledged')}</SelectItem>
            <SelectItem value="resolved">{t('escalations.resolved')}</SelectItem>
            <SelectItem value="dismissed">{t('escalations.dismissed')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ScrollArea className="h-[400px] pe-4">
            <div className="space-y-4">
              {data.map((escalation) => (
                <div
                  key={escalation.id}
                  className={cn(
                    'border rounded-lg p-4',
                    escalation.status === 'triggered' && 'border-red-300 bg-red-50',
                    escalation.status === 'acknowledged' && 'border-yellow-300 bg-yellow-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={escalation.status} />
                        <Badge variant="secondary">
                          {t(`escalations.level`)} {escalation.escalation_level}
                        </Badge>
                        <Badge variant="outline">{escalation.target_type}</Badge>
                      </div>
                      {escalation.reason && (
                        <p className="text-sm text-muted-foreground mt-2">{escalation.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimestamp(escalation.triggered_at)}</span>
                    </div>
                    {escalation.escalated_to_role && (
                      <div className="flex items-center gap-1">
                        <UserCircle className="h-4 w-4" />
                        <span>{escalation.escalated_to_role}</span>
                      </div>
                    )}
                  </div>

                  {escalation.status === 'triggered' && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcknowledge?.(escalation.id)}
                      >
                        <Eye className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        {t('escalations.acknowledge')}
                      </Button>
                      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedEscalation(escalation)}>
                            <CheckCircle className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('escalations.resolve')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                          <DialogHeader>
                            <DialogTitle>{t('escalations.resolveTitle')}</DialogTitle>
                            <DialogDescription>
                              {t('escalations.resolveDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="notes">{t('escalations.notes')}</Label>
                            <Textarea
                              id="notes"
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder={t('escalations.notesPlaceholder')}
                              className="mt-2"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={handleResolve}>
                              {t('escalations.confirmResolve')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {escalation.status === 'acknowledged' && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedEscalation(escalation)}>
                            <CheckCircle className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('escalations.resolve')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                          <DialogHeader>
                            <DialogTitle>{t('escalations.resolveTitle')}</DialogTitle>
                            <DialogDescription>
                              {t('escalations.resolveDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="notes">{t('escalations.notes')}</Label>
                            <Textarea
                              id="notes"
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder={t('escalations.notesPlaceholder')}
                              className="mt-2"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={handleResolve}>
                              {t('escalations.confirmResolve')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {escalation.status === 'resolved' && escalation.notes && (
                    <div className="pt-2 border-t text-sm">
                      <span className="text-muted-foreground">
                        {t('escalations.resolutionNotes')}:
                      </span>
                      <p className="mt-1">{escalation.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
            <p>{t('escalations.noEscalations')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
