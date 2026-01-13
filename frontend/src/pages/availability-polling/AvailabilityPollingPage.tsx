/**
 * Availability Polling Page
 * Feature: participant-availability-polling
 *
 * Main page for managing and participating in availability polls
 * Mobile-first, RTL-compatible
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isAfter } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  Vote,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { usePolls, useMyPolls } from '@/hooks/useAvailabilityPolling'
import {
  AvailabilityPollCreator,
  AvailabilityPollVoter,
  AvailabilityPollResults,
} from '@/components/availability-polling'
import type { AvailabilityPoll, PollStatus } from '@/types/availability-polling.types'
import { POLL_STATUS_COLORS } from '@/types/availability-polling.types'

type ViewMode = 'grid' | 'list'
type TabValue = 'my-polls' | 'invited' | 'all'

export function AvailabilityPollingPage() {
  const { t, i18n } = useTranslation('availability-polling')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabValue>('my-polls')
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isVoteSheetOpen, setIsVoteSheetOpen] = useState(false)
  const [isResultsSheetOpen, setIsResultsSheetOpen] = useState(false)

  // Data fetching
  const { data: myPollsData, isLoading: isLoadingMyPolls } = useMyPolls()
  const { data: allPollsData, isLoading: isLoadingAllPolls } = usePolls({})

  // Derive invited polls (polls where user is participant but not creator)
  const invitedPolls = useMemo(() => {
    if (!allPollsData?.polls) return []
    // Filter polls where user is invited (this logic would need user ID comparison)
    // For now, showing all polls user has access to that they didn't create
    return allPollsData.polls.filter((poll) => !myPollsData?.polls?.some((mp) => mp.id === poll.id))
  }, [allPollsData, myPollsData])

  // Get polls for current tab
  const displayPolls = useMemo(() => {
    switch (activeTab) {
      case 'my-polls':
        return myPollsData?.polls || []
      case 'invited':
        return invitedPolls
      case 'all':
        return allPollsData?.polls || []
      default:
        return []
    }
  }, [activeTab, myPollsData, allPollsData, invitedPolls])

  const isLoading = activeTab === 'my-polls' ? isLoadingMyPolls : isLoadingAllPolls

  // Handlers
  const handlePollCreated = () => {
    setIsCreateDialogOpen(false)
  }

  const handleOpenVote = (pollId: string) => {
    setSelectedPollId(pollId)
    setIsVoteSheetOpen(true)
  }

  const handleOpenResults = (pollId: string) => {
    setSelectedPollId(pollId)
    setIsResultsSheetOpen(true)
  }

  const handleVoteSuccess = () => {
    setIsVoteSheetOpen(false)
    setSelectedPollId(null)
  }

  // Render poll card
  const renderPollCard = (poll: AvailabilityPoll) => {
    const deadlinePassed = isAfter(new Date(), parseISO(poll.deadline))
    const canVote = poll.status === 'active' && !deadlinePassed
    const isMyPoll = activeTab === 'my-polls'

    return (
      <Card
        key={poll.id}
        className={cn(
          'transition-all hover:shadow-md cursor-pointer',
          viewMode === 'list' && 'flex flex-row items-center',
        )}
      >
        <CardHeader className={cn(viewMode === 'list' && 'flex-1 py-3')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                {isRTL ? poll.meeting_title_ar || poll.meeting_title_en : poll.meeting_title_en}
              </CardTitle>
              {viewMode === 'grid' && (poll.description_en || poll.description_ar) && (
                <CardDescription className="line-clamp-2 mt-1">
                  {isRTL ? poll.description_ar || poll.description_en : poll.description_en}
                </CardDescription>
              )}
            </div>
            <Badge
              className={cn(
                'shrink-0',
                POLL_STATUS_COLORS[poll.status].bg,
                POLL_STATUS_COLORS[poll.status].text,
              )}
            >
              {t(`status.${poll.status}`)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={cn(viewMode === 'list' ? 'py-3' : 'pt-0')}>
          <div
            className={cn(
              'flex gap-4 text-sm text-muted-foreground',
              viewMode === 'grid' ? 'flex-col' : 'flex-row items-center',
            )}
          >
            {/* Meta info */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {poll.meeting_duration_minutes} {t('form.minutes')}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(poll.deadline), 'PP', { locale: dateLocale })}
              </span>
              {poll.slots && (
                <span className="flex items-center gap-1">
                  <LayoutGrid className="h-4 w-4" />
                  {poll.slots.length} {t('slots.title')}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className={cn('flex items-center gap-2', viewMode === 'grid' && 'mt-3')}>
              {canVote && !isMyPoll && (
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenVote(poll.id)
                  }}
                >
                  <Vote className="h-4 w-4" />
                  {t('voting.vote')}
                </Button>
              )}
              <Button
                size="sm"
                variant={isMyPoll ? 'default' : 'outline'}
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenResults(poll.id)
                }}
              >
                {isMyPoll ? (
                  <>
                    <Users className="h-4 w-4" />
                    {t('results.manage')}
                  </>
                ) : (
                  <>
                    <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                    {t('results.view')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              {t('create.title')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('create.title')}</DialogTitle>
            </DialogHeader>
            <AvailabilityPollCreator onSuccess={handlePollCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="my-polls" className="gap-1">
              <Users className="h-4 w-4 hidden sm:inline" />
              {t('tabs.myPolls')}
            </TabsTrigger>
            <TabsTrigger value="invited" className="gap-1">
              <Vote className="h-4 w-4 hidden sm:inline" />
              {t('tabs.invited')}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1">
              <LayoutGrid className="h-4 w-4 hidden sm:inline" />
              {t('tabs.all')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Poll List */}
      {isLoading ? (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col',
          )}
        >
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayPolls.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
            {activeTab === 'my-polls' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('create.title')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col',
          )}
        >
          {displayPolls.map(renderPollCard)}
        </div>
      )}

      {/* Vote Sheet */}
      <Sheet open={isVoteSheetOpen} onOpenChange={setIsVoteSheetOpen}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t('voting.title')}</SheetTitle>
          </SheetHeader>
          {selectedPollId && (
            <div className="mt-6">
              <AvailabilityPollVoter pollId={selectedPollId} onVoteSuccess={handleVoteSuccess} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Results Sheet */}
      <Sheet open={isResultsSheetOpen} onOpenChange={setIsResultsSheetOpen}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t('results.title')}</SheetTitle>
          </SheetHeader>
          {selectedPollId && (
            <div className="mt-6">
              <AvailabilityPollResults
                pollId={selectedPollId}
                isOrganizer={activeTab === 'my-polls'}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default AvailabilityPollingPage
