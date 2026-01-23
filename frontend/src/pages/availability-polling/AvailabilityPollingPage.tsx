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
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base sm:text-lg">
                {isRTL ? poll.meeting_title_ar || poll.meeting_title_en : poll.meeting_title_en}
              </CardTitle>
              {viewMode === 'grid' && (poll.description_en || poll.description_ar) && (
                <CardDescription className="mt-1 line-clamp-2">
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
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {poll.meeting_duration_minutes} {t('form.minutes')}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {format(parseISO(poll.deadline), 'PP', { locale: dateLocale })}
              </span>
              {poll.slots && (
                <span className="flex items-center gap-1">
                  <LayoutGrid className="size-4" />
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
                  <Vote className="size-4" />
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
                    <Users className="size-4" />
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
      className="container mx-auto space-y-6 p-4 sm:p-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="size-4" />
              {t('create.title')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('create.title')}</DialogTitle>
            </DialogHeader>
            <AvailabilityPollCreator onSuccess={handlePollCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="my-polls" className="gap-1">
              <Users className="hidden size-4 sm:inline" />
              {t('tabs.myPolls')}
            </TabsTrigger>
            <TabsTrigger value="invited" className="gap-1">
              <Vote className="hidden size-4 sm:inline" />
              {t('tabs.invited')}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1">
              <LayoutGrid className="hidden size-4 sm:inline" />
              {t('tabs.all')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="size-9"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="size-9"
          >
            <List className="size-4" />
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
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-3 h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayPolls.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Calendar className="mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t('empty.title')}</h3>
            <p className="mb-4 text-muted-foreground">{t('empty.description')}</p>
            {activeTab === 'my-polls' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="size-4" />
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
          className="w-full overflow-y-auto sm:max-w-lg"
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
          className="w-full overflow-y-auto sm:max-w-2xl"
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
