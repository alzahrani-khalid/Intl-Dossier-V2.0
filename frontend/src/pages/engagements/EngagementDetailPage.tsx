/**
 * Engagement Detail Page
 * Feature: engagements-entity-management
 *
 * Detailed view of an engagement dossier with:
 * - Engagement information (dates, location, type)
 * - Participants list
 * - Agenda items
 * - Outcomes
 *
 * Mobile-first design with RTL support.
 */

import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
  Globe,
  Building2,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  ShieldAlert,
  Check,
  X as CloseIcon,
  User,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useEngagement, useArchiveEngagement } from '@/hooks/useEngagements'
import { useEngagementNavigation } from '@/hooks/useEntityNavigation'
import { EngagementBriefsSection } from '@/components/engagements/EngagementBriefsSection'
import { InteractiveTimeline } from '@/components/timeline'
import type {
  EngagementStatus,
  EngagementType,
  EngagementCategory,
  DelegationLevel,
  ParticipantRole,
  AttendanceStatus,
  AgendaItemStatus,
} from '@/types/engagement.types'
import {
  ENGAGEMENT_TYPE_LABELS,
  ENGAGEMENT_CATEGORY_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  DELEGATION_LEVEL_LABELS,
  PARTICIPANT_ROLE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  AGENDA_ITEM_STATUS_LABELS,
} from '@/types/engagement.types'

export function EngagementDetailPage() {
  const { engagementId } = useParams({ from: '/_protected/engagements/$engagementId' })
  const { t, i18n } = useTranslation('engagements')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    participants: true,
    agenda: true,
    outcomes: true,
  })

  // Fetch engagement data
  const { data: engagementData, isLoading, isError, error } = useEngagement(engagementId)
  const archiveEngagement = useArchiveEngagement()

  // Track this engagement in navigation history
  useEngagementNavigation(engagementId, engagementData?.engagement, { skip: isLoading })

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Navigation handlers
  const handleBack = () => {
    navigate({ to: '/engagements' })
  }

  const handleEdit = () => {
    navigate({ to: '/engagements/$engagementId/edit', params: { engagementId } })
  }

  const handleArchive = async () => {
    await archiveEngagement.mutateAsync(engagementId)
    navigate({ to: '/engagements' })
  }

  // Get status badge color
  const getStatusColor = (status: EngagementStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-200'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
      case 'planned':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 'postponed':
        return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Get agenda item status color
  const getAgendaStatusColor = (status: AgendaItemStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-200'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'planned':
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
      case 'skipped':
        return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'postponed':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Get attendance status color
  const getAttendanceColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'attended':
        return 'bg-green-500/10 text-green-600'
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-600'
      case 'expected':
        return 'bg-blue-500/10 text-blue-600'
      case 'tentative':
        return 'bg-yellow-500/10 text-yellow-600'
      case 'no_show':
        return 'bg-red-500/10 text-red-600'
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600'
      default:
        return 'bg-gray-500/10 text-gray-600'
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate)
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError || !engagementData) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('error.notFound', 'Engagement not found')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message ||
              t('error.notFoundDescription', 'The engagement you are looking for does not exist')}
          </p>
        </div>
        <Button onClick={handleBack}>
          <ArrowLeft className="me-2 size-4" />
          {t('actions.backToList', 'Back to List')}
        </Button>
      </div>
    )
  }

  const engagement = engagementData.engagement
  const name = isRTL ? engagement.name_ar : engagement.name_en
  const description = isRTL ? engagement.description_ar : engagement.description_en
  const location = isRTL ? engagement.location_ar : engagement.location_en
  const venue = isRTL ? engagement.venue_ar : engagement.venue_en
  const objectives = isRTL ? engagement.objectives_ar : engagement.objectives_en
  const outcomes = isRTL ? engagement.outcomes_ar : engagement.outcomes_en
  const notes = isRTL ? engagement.notes_ar : engagement.notes_en

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container mx-auto p-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="size-10">
                <ArrowLeft className={`size-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold sm:text-2xl">{name}</h1>
                  <Badge variant="outline" className={getStatusColor(engagement.engagement_status)}>
                    {isRTL
                      ? ENGAGEMENT_STATUS_LABELS[engagement.engagement_status].ar
                      : ENGAGEMENT_STATUS_LABELS[engagement.engagement_status].en}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].ar
                    : ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].en}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="size-4 sm:me-2" />
                <span className="hidden sm:inline">{t('actions.edit', 'Edit')}</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('archive.title', 'Archive Engagement?')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        'archive.description',
                        'This will archive the engagement and hide it from the list. This action can be undone.',
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel', 'Cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleArchive}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {archiveEngagement.isPending && (
                        <Loader2 className="me-2 size-4 animate-spin" />
                      )}
                      {t('actions.archive', 'Archive')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">
              {t('tabs.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex-1 sm:flex-none">
              {t('tabs.participants', 'Participants')}
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex-1 sm:flex-none">
              {t('tabs.agenda', 'Agenda')}
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="flex-1 sm:flex-none">
              {t('tabs.outcomes', 'Outcomes')}
            </TabsTrigger>
            <TabsTrigger value="briefs" className="flex-1 sm:flex-none">
              {t('tabs.briefs', 'Briefs')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 sm:flex-none">
              {t('tabs.timeline', 'Timeline')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Details Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">{t('sections.details', 'Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type & Category */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {isRTL
                          ? ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].ar
                          : ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].en}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {isRTL
                        ? ENGAGEMENT_CATEGORY_LABELS[engagement.engagement_category].ar
                        : ENGAGEMENT_CATEGORY_LABELS[engagement.engagement_category].en}
                    </Badge>
                  </div>

                  {/* Dates */}
                  <div className="border-t pt-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Clock className="size-4 text-muted-foreground" />
                      {t('sections.schedule', 'Schedule')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(engagement.start_date, engagement.end_date)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(engagement.start_date)} - {formatTime(engagement.end_date)}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="border-t pt-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      {engagement.is_virtual ? (
                        <Video className="size-4 text-muted-foreground" />
                      ) : (
                        <MapPin className="size-4 text-muted-foreground" />
                      )}
                      {t('sections.location', 'Location')}
                    </h4>
                    {engagement.is_virtual ? (
                      <div>
                        <Badge variant="outline" className="mb-2">
                          <Video className="me-1 size-3" />
                          {t('card.virtual', 'Virtual')}
                        </Badge>
                        {engagement.virtual_link && (
                          <a
                            href={engagement.virtual_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-sm text-primary hover:underline"
                          >
                            {engagement.virtual_link}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {location && <p className="text-sm">{location}</p>}
                        {venue && <p className="text-xs text-muted-foreground">{venue}</p>}
                      </div>
                    )}
                  </div>

                  {/* Host Info */}
                  {(engagementData.host_country || engagementData.host_organization) && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Building2 className="size-4 text-muted-foreground" />
                        {t('form.hostOrganization', 'Host')}
                      </h4>
                      {engagementData.host_country && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="size-3 text-muted-foreground" />
                          {isRTL
                            ? engagementData.host_country.name_ar
                            : engagementData.host_country.name_en}
                        </div>
                      )}
                      {engagementData.host_organization && (
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <Building2 className="size-3 text-muted-foreground" />
                          {isRTL
                            ? engagementData.host_organization.name_ar
                            : engagementData.host_organization.name_en}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delegation Info */}
                  {(engagement.delegation_level || engagement.delegation_size) && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4 text-muted-foreground" />
                        {t('sections.delegation', 'Delegation')}
                      </h4>
                      {engagement.delegation_level && (
                        <p className="text-sm">
                          {isRTL
                            ? DELEGATION_LEVEL_LABELS[engagement.delegation_level].ar
                            : DELEGATION_LEVEL_LABELS[engagement.delegation_level].en}
                        </p>
                      )}
                      {engagement.delegation_size && (
                        <p className="text-xs text-muted-foreground">
                          {t('form.delegationSize', 'Delegation Size')}:{' '}
                          {engagement.delegation_size}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Description */}
                {description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('form.descriptionEn', 'Description')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Objectives */}
                {objectives && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="size-5 text-primary" />
                        {t('sections.objectives', 'Objectives')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {objectives}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">
                        {engagementData.participants?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('stats.participants', 'Participants')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">{engagementData.agenda?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('stats.agendaItems', 'Agenda Items')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle2 className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">
                        {engagementData.agenda?.filter((a) => a.item_status === 'completed')
                          .length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('stats.completed', 'Completed')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="size-5 text-primary" />
                    {t('sections.participants', 'Participants')}
                    <Badge variant="secondary" className="ms-2">
                      {engagementData.participants?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="me-2 size-4" />
                    {t('actions.addParticipant', 'Add Participant')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {engagementData.participants && engagementData.participants.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {engagementData.participants.map((item) => {
                      const participant = item.participant
                      const participantName =
                        participant.participant_dossier_id && item.dossier_info
                          ? isRTL
                            ? item.dossier_info.name_ar
                            : item.dossier_info.name_en
                          : (isRTL ? participant.external_name_ar : participant.external_name_en) ||
                            ''

                      return (
                        <Card key={participant.id} className="transition-shadow hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                  {participantName ? (
                                    getInitials(participantName)
                                  ) : (
                                    <User className="size-4" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{participantName}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {isRTL
                                      ? PARTICIPANT_ROLE_LABELS[participant.role].ar
                                      : PARTICIPANT_ROLE_LABELS[participant.role].en}
                                  </Badge>
                                  <Badge
                                    className={`text-xs ${getAttendanceColor(participant.attendance_status)}`}
                                  >
                                    {isRTL
                                      ? ATTENDANCE_STATUS_LABELS[participant.attendance_status].ar
                                      : ATTENDANCE_STATUS_LABELS[participant.attendance_status].en}
                                  </Badge>
                                </div>
                                {participant.external_title_en && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {isRTL
                                      ? participant.external_title_ar
                                      : participant.external_title_en}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('empty.participants', 'No participants added')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('empty.participantsDescription', 'Add participants to this engagement')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agenda Tab */}
          <TabsContent value="agenda" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-primary" />
                    {t('sections.agenda', 'Agenda')}
                    <Badge variant="secondary" className="ms-2">
                      {engagementData.agenda?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="me-2 size-4" />
                    {t('actions.addAgendaItem', 'Add Agenda Item')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {engagementData.agenda && engagementData.agenda.length > 0 ? (
                  <div className="space-y-4">
                    {engagementData.agenda
                      .sort((a, b) => a.order_number - b.order_number)
                      .map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex gap-4 ${idx < engagementData.agenda.length - 1 ? 'border-b pb-4' : ''}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {item.order_number}
                            </div>
                            {idx < engagementData.agenda.length - 1 && (
                              <div className="mt-2 w-0.5 flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium">
                                  {isRTL ? item.title_ar || item.title_en : item.title_en}
                                </h4>
                                {(item.description_en || item.description_ar) && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {isRTL ? item.description_ar : item.description_en}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={getAgendaStatusColor(item.item_status)}
                              >
                                {isRTL
                                  ? AGENDA_ITEM_STATUS_LABELS[item.item_status].ar
                                  : AGENDA_ITEM_STATUS_LABELS[item.item_status].en}
                              </Badge>
                            </div>
                            {(item.start_time || item.duration_minutes) && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {item.start_time && <span>{formatTime(item.start_time)}</span>}
                                {item.duration_minutes && (
                                  <span>
                                    ({item.duration_minutes} {t('form.agenda.duration', 'min')})
                                  </span>
                                )}
                              </div>
                            )}
                            {(item.outcome_en || item.outcome_ar) && (
                              <div className="mt-2 rounded-lg bg-muted/50 p-2">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                  {t('form.agenda.outcomeEn', 'Outcome')}:
                                </p>
                                <p className="text-sm">
                                  {isRTL ? item.outcome_ar : item.outcome_en}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('empty.agenda', 'No agenda items')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('empty.agendaDescription', 'Add agenda items to organize this engagement')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="size-5 text-primary" />
                  {t('sections.outcomes', 'Outcomes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outcomes ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{outcomes}</p>
                ) : (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto mb-4 size-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('empty.outcomes', 'No outcomes recorded yet')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-primary" />
                    {t('sections.notes', 'Notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Briefs Tab */}
          <TabsContent value="briefs" className="space-y-6">
            <EngagementBriefsSection engagementId={engagementId} engagementName={name} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <InteractiveTimeline
              dossierId={engagementId}
              dossierType="Engagement"
              title={t('sections.eventTimeline', 'Event Timeline')}
              showFilters={true}
              showZoomControls={true}
              showAnnotations={true}
              initialZoom="month"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default EngagementDetailPage
