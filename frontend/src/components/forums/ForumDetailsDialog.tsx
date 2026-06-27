import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  CalendarPlus,
  MapPin,
  Users,
  Globe2,
  Building2,
  Clock,
  Video,
  Info,
  Edit,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/auth.context'
import { useDirection } from '@/hooks/useDirection'
import { workItemDossierKeys } from '@/hooks/useCreateWorkItemDossierLinks'

interface Forum {
  id: string
  title_en?: string
  title_ar?: string
  name_en?: string
  name_ar?: string
  description_en?: string | null
  description_ar?: string | null
  start_datetime?: string
  end_datetime?: string
  location_en?: string
  location_ar?: string
  venue_en?: string
  venue_ar?: string
  is_virtual?: boolean
  max_participants?: number
  number_of_sessions?: number
  status: string
  organizer?: {
    name_en: string
    name_ar: string
  }
  extension?: {
    number_of_sessions?: number
  }
}

interface Country {
  id: string
  name_en: string
  name_ar: string
}

interface Organization {
  id: string
  name_en: string
  name_ar: string
}

interface ForumDetailsDialogProps {
  forumId: string | null
  forum: Forum | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ForumEditForm {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  number_of_sessions: string
}

function getForumNameEn(forum: Forum): string {
  return forum.title_en || forum.name_en || ''
}

function getForumNameAr(forum: Forum): string {
  return forum.title_ar || forum.name_ar || forum.title_en || forum.name_en || ''
}

function getForumSessionCount(forum: Forum): number {
  return forum.number_of_sessions ?? forum.extension?.number_of_sessions ?? 1
}

export function ForumDetailsDialog({
  forumId,
  forum,
  open,
  onOpenChange,
}: ForumDetailsDialogProps) {
  const { t } = useTranslation('forums')
  const { user } = useAuth()
  const { isRTL } = useDirection()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<ForumEditForm>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    number_of_sessions: '1',
  })
  // Check if user has edit permissions (admin or manager roles)
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const handleEdit = () => {
    setEditOpen(true)
  }

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!forum) return
    setEditForm({
      name_en: getForumNameEn(forum),
      name_ar: getForumNameAr(forum),
      description_en: forum.description_en ?? '',
      description_ar: forum.description_ar ?? '',
      number_of_sessions: String(getForumSessionCount(forum)),
    })
  }, [forum])

  const updateForumMutation = useMutation({
    mutationFn: async () => {
      if (!forum) throw new Error('Missing forum data')

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !authUser) throw new Error('Not authenticated')

      const { error: dossierError } = await supabase
        .from('dossiers')
        .update({
          name_en: editForm.name_en.trim(),
          name_ar: editForm.name_ar.trim(),
          description_en: editForm.description_en.trim() || null,
          description_ar: editForm.description_ar.trim() || null,
          updated_by: authUser.id,
        })
        .eq('id', forum.id)
        .eq('type', 'forum')

      if (dossierError) throw dossierError

      const sessionCount = Math.max(1, Number.parseInt(editForm.number_of_sessions, 10) || 1)
      const { error: forumError } = await supabase.from('forums').upsert({
        id: forum.id,
        number_of_sessions: sessionCount,
      })

      if (forumError) throw forumError

      return { id: forum.id }
    },
    onSuccess: ({ id }) => {
      toast.success(t('common:common.success', 'Success'), {
        description: t('editSuccess', 'Forum updated successfully'),
      })
      queryClient.invalidateQueries({ queryKey: ['forums'] })
      queryClient.invalidateQueries({ queryKey: ['forum', id] })
      queryClient.invalidateQueries({ queryKey: workItemDossierKeys.timeline(id) })
      setEditOpen(false)
    },
    onError: (error) => {
      toast.error(t('common:common.error', 'Error'), {
        description:
          error instanceof Error ? error.message : t('editFailed', 'Failed to update forum'),
      })
    },
  })

  // Mutation to add forum to calendar
  const addToCalendarMutation = useMutation({
    mutationFn: async () => {
      if (!forum) throw new Error('Missing forum data')
      if (!forum.start_datetime) throw new Error('Missing forum date')

      // Get authenticated user from Supabase
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !authUser) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('calendar_entries')
        .insert({
          title_en: getForumNameEn(forum),
          title_ar: getForumNameAr(forum),
          description_en: forum.description_en,
          description_ar: forum.description_ar,
          entry_type: 'forum',
          event_date: forum.start_datetime.split('T')[0],
          event_time: forum.start_datetime.split('T')[1]?.split('.')[0] || '00:00:00',
          all_day: false,
          location: isRTL ? forum.location_ar : forum.location_en,
          is_virtual: forum.is_virtual ?? false,
          linked_item_type: 'forum',
          linked_item_id: forum.id,
          organizer_id: authUser.id,
          status: 'scheduled',
          created_by: authUser.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success(t('common:common.success', 'Success'), {
        description: 'Forum added to calendar successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
    onError: (error) => {
      toast.error(t('common:common.error', 'Error'), {
        description: error instanceof Error ? error.message : 'Failed to add forum to calendar',
      })
    },
  })

  const handleAddToCalendar = () => {
    addToCalendarMutation.mutate()
  }

  const { data: participants } = useQuery({
    queryKey: ['forum-participants', forumId],
    queryFn: async () => {
      if (!forumId) return { countries: [], organizations: [] }

      // Get all participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('forum_participants')
        .select('entity_id, entity_type, participation_type')
        .eq('forum_id', forumId)

      if (participantsError) throw participantsError
      if (!participantsData || participantsData.length === 0) {
        return { countries: [], organizations: [] }
      }

      // Separate country and organization IDs
      const countryIds = participantsData
        .filter((p) => p.entity_type === 'country')
        .map((p) => p.entity_id)
      const orgIds = participantsData
        .filter((p) => p.entity_type === 'organization')
        .map((p) => p.entity_id)

      // Fetch countries
      let countries: Array<Country & { participation_type: string }> = []
      if (countryIds.length > 0) {
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_en, name_ar')
          .in('id', countryIds)

        if (countriesError) throw countriesError
        countries = (countriesData || []).map((country) => ({
          ...country,
          participation_type:
            participantsData.find((p) => p.entity_id === country.id && p.entity_type === 'country')
              ?.participation_type || 'member',
        }))
      }

      // Fetch organizations
      let organizations: Array<Organization & { participation_type: string }> = []
      if (orgIds.length > 0) {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name_en, name_ar')
          .in('id', orgIds)

        if (orgsError) throw orgsError
        organizations = (orgsData || []).map((org) => ({
          ...org,
          participation_type:
            participantsData.find((p) => p.entity_id === org.id && p.entity_type === 'organization')
              ?.participation_type || 'member',
        }))
      }

      return { countries, organizations }
    },
    enabled: !!forumId && open,
  })

  if (!forum) return null

  const title = isRTL ? getForumNameAr(forum) : getForumNameEn(forum)
  const description = isRTL ? forum.description_ar : forum.description_en
  const location = isRTL ? forum.location_ar : forum.location_en
  const venue = isRTL ? forum.venue_ar : forum.venue_en
  const organizerName = forum.organizer
    ? isRTL
      ? forum.organizer.name_ar
      : forum.organizer.name_en
    : '-'

  const countries = participants?.countries || []
  const organizations = participants?.organizations || []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) ? format(date, 'dd MMM yyyy') : '-'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        // D-58-03-02: blue-100/800 → bg-info/10 text-info (scheduled-state informational badge)
        return 'bg-info/10 text-info'
      case 'ongoing':
        return 'bg-success/10 text-success'
      case 'completed':
        return 'bg-muted text-ink-mute'
      case 'cancelled':
        return 'bg-danger/10 text-danger'
      default:
        return 'bg-muted text-ink-mute'
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl sm:text-2xl flex items-start gap-3 flex-1">
                <Users className="h-6 w-6 mt-1 shrink-0" />
                <div className="flex-1">
                  <div>{title}</div>
                  <Badge className={`mt-2 ${getStatusColor(forum.status)}`}>
                    {t(`statuses.${forum.status}`)}
                  </Badge>
                </div>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToCalendar}
                  disabled={addToCalendarMutation.isPending || !forum.start_datetime}
                  className="shrink-0"
                >
                  <CalendarPlus className="h-4 w-4 me-2" />
                  {addToCalendarMutation.isPending ? 'Adding...' : 'Add to Calendar'}
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleEdit} className="shrink-0">
                    <Edit className="h-4 w-4 me-2" />
                    {t('common:common.edit')}
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription className="sr-only">
              {t('common:common.view')} {title}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <ScrollArea className="px-6 pb-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t('common:common.about')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('common:common.about')}
                      </p>
                      <p className="text-sm">{description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dates */}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{t('dates')}</p>
                        <p className="text-sm text-muted-foreground">
                          {forum.start_datetime ? formatDate(forum.start_datetime) : '-'}
                          {forum.end_datetime && ` - ${formatDate(forum.end_datetime)}`}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{t('location')}</p>
                        <p className="text-sm text-muted-foreground">{location || '-'}</p>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="flex items-start gap-2">
                      {forum.is_virtual ? (
                        <Video className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{t('venue')}</p>
                        <p className="text-sm text-muted-foreground">
                          {forum.is_virtual ? t('virtual') : venue || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{t('sessions')}</p>
                        <p className="text-sm text-muted-foreground">
                          {getForumSessionCount(forum)} {t('sessions').toLowerCase()}
                        </p>
                      </div>
                    </div>

                    {/* Max Participants */}
                    {forum.max_participants && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{t('participants')}</p>
                          <p className="text-sm text-muted-foreground">
                            {forum.max_participants} max
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Organizer */}
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{t('organizer', 'Organizer')}</p>
                        <p className="text-sm text-muted-foreground">{organizerName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participating Countries */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    {t('countries')} ({countries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {countries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {countries.map((country) => (
                        <div
                          key={country.id}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <span className="text-sm">
                            {isRTL ? country.name_ar : country.name_en}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {t(`participationType.${country.participation_type}`)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('noCountries')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Participating Organizations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('organizations')} ({organizations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organizations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {organizations.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <span className="text-sm">{isRTL ? org.name_ar : org.name_en}</span>
                          <Badge variant="outline" className="text-xs">
                            {t(`participationType.${org.participation_type}`)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('noOrganizations')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editForum')}</DialogTitle>
            <DialogDescription>
              {t('editDescription', 'Update forum dossier details.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="forum-name-en">{t('form.nameEn')}</Label>
              <Input
                id="forum-name-en"
                value={editForm.name_en}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name_en: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forum-name-ar">{t('form.nameAr')}</Label>
              <Input
                id="forum-name-ar"
                value={editForm.name_ar}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forum-description-en">{t('form.descriptionEn')}</Label>
              <Textarea
                id="forum-description-en"
                value={editForm.description_en}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description_en: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forum-description-ar">{t('form.descriptionAr')}</Label>
              <Textarea
                id="forum-description-ar"
                value={editForm.description_ar}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description_ar: e.target.value }))
                }
                dir="rtl"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forum-sessions">{t('sessions')}</Label>
              <Input
                id="forum-sessions"
                type="number"
                min={1}
                value={editForm.number_of_sessions}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, number_of_sessions: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateForumMutation.isPending}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={() => updateForumMutation.mutate()}
              disabled={
                updateForumMutation.isPending ||
                editForm.name_en.trim().length === 0 ||
                editForm.name_ar.trim().length === 0
              }
            >
              {updateForumMutation.isPending
                ? t('common:common.saving', 'Saving...')
                : t('common:common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
