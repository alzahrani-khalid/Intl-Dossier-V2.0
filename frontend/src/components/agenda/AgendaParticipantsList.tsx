/**
 * AgendaParticipantsList Component
 * Feature: meeting-agenda-builder
 *
 * Participant management for meeting agendas with:
 * - Add/remove participants
 * - Role assignment (chair, presenter, required, optional)
 * - RSVP status tracking
 * - Participant notifications
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Crown,
  Mic,
  Eye,
  Check,
  X,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAddParticipant,
  useUpdateParticipantRsvp,
  useRemoveParticipant,
} from '@/hooks/useMeetingAgenda'
import type { AgendaParticipant, ParticipantRole, RsvpStatus } from '@/types/meeting-agenda.types'
import { RSVP_STATUS_COLORS, PARTICIPANT_ROLES } from '@/types/meeting-agenda.types'
import { cn } from '@/lib/utils'

interface AgendaParticipantsListProps {
  agendaId: string
  participants: AgendaParticipant[]
  canEdit: boolean
}

// Role icons
const ROLE_ICONS: Record<ParticipantRole, React.ReactNode> = {
  chair: <Crown className="h-4 w-4 text-amber-500" />,
  co_chair: <Crown className="h-4 w-4 text-amber-400" />,
  secretary: <Mail className="h-4 w-4 text-blue-500" />,
  presenter: <Mic className="h-4 w-4 text-purple-500" />,
  required: <Users className="h-4 w-4 text-green-500" />,
  optional: <Users className="h-4 w-4 text-gray-400" />,
  observer: <Eye className="h-4 w-4 text-gray-400" />,
}

// RSVP icons
const RSVP_ICONS: Record<RsvpStatus, React.ReactNode> = {
  pending: <HelpCircle className="h-4 w-4" />,
  accepted: <Check className="h-4 w-4" />,
  declined: <X className="h-4 w-4" />,
  tentative: <HelpCircle className="h-4 w-4" />,
}

export function AgendaParticipantsList({
  agendaId,
  participants,
  canEdit,
}: AgendaParticipantsListProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    title_en: '',
    organization_name_en: '',
    role: 'required' as ParticipantRole,
  })

  // Mutations
  const addParticipant = useAddParticipant()
  const updateRsvp = useUpdateParticipantRsvp()
  const removeParticipant = useRemoveParticipant()

  // Group participants by role
  const groupedParticipants = participants.reduce(
    (acc, p) => {
      const group =
        p.role === 'chair' || p.role === 'co_chair'
          ? 'leadership'
          : p.role === 'presenter'
            ? 'presenters'
            : p.role === 'secretary'
              ? 'secretariat'
              : p.role === 'observer'
                ? 'observers'
                : 'attendees'
      acc[group].push(p)
      return acc
    },
    {
      leadership: [] as AgendaParticipant[],
      secretariat: [] as AgendaParticipant[],
      presenters: [] as AgendaParticipant[],
      attendees: [] as AgendaParticipant[],
      observers: [] as AgendaParticipant[],
    },
  )

  // RSVP counts
  const rsvpCounts = participants.reduce(
    (acc, p) => {
      acc[p.rsvp_status]++
      return acc
    },
    { pending: 0, accepted: 0, declined: 0, tentative: 0 },
  )

  // Handle add participant
  const handleAdd = async () => {
    await addParticipant.mutateAsync({
      agendaId,
      input: {
        agenda_id: agendaId,
        participant_type: 'external_contact',
        name_en: newParticipant.name_en,
        name_ar: newParticipant.name_ar || undefined,
        email: newParticipant.email || undefined,
        title_en: newParticipant.title_en || undefined,
        organization_name_en: newParticipant.organization_name_en || undefined,
        role: newParticipant.role,
      },
    })
    setShowAddDialog(false)
    setNewParticipant({
      name_en: '',
      name_ar: '',
      email: '',
      title_en: '',
      organization_name_en: '',
      role: 'required',
    })
  }

  // Handle remove
  const handleRemove = async (participantId: string) => {
    if (confirm(t('confirmRemoveParticipant'))) {
      await removeParticipant.mutateAsync({ agendaId, participantId })
    }
  }

  // Get display name
  const getDisplayName = (p: AgendaParticipant) => {
    return isRTL ? p.name_ar || p.name_en : p.name_en || p.name_ar
  }

  // Get initials
  const getInitials = (p: AgendaParticipant) => {
    const name = getDisplayName(p) || ''
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Render participant card
  const renderParticipant = (p: AgendaParticipant) => {
    const rsvpColors = RSVP_STATUS_COLORS[p.rsvp_status]

    return (
      <div
        key={p.id}
        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={undefined} />
          <AvatarFallback>{getInitials(p)}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{getDisplayName(p)}</span>
            {ROLE_ICONS[p.role]}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {p.title_en && <span>{isRTL ? p.title_ar || p.title_en : p.title_en}</span>}
            {p.organization_name_en && (
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {isRTL ? p.organization_name_ar || p.organization_name_en : p.organization_name_en}
              </span>
            )}
          </div>
        </div>

        {/* RSVP status */}
        <Badge variant="outline" className={cn(rsvpColors.bg, rsvpColors.text, 'gap-1')}>
          {RSVP_ICONS[p.rsvp_status]}
          {t(`rsvpStatuses.${p.rsvp_status}`)}
        </Badge>

        {/* Actions */}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="min-h-9 min-w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              <DropdownMenuItem
                onClick={() =>
                  updateRsvp.mutateAsync({
                    agendaId,
                    participantId: p.id,
                    input: { rsvp_status: 'accepted' },
                  })
                }
              >
                <Check className={cn('h-4 w-4 text-green-500', isRTL ? 'ms-2' : 'me-2')} />
                {t('markAccepted')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateRsvp.mutateAsync({
                    agendaId,
                    participantId: p.id,
                    input: { rsvp_status: 'declined' },
                  })
                }
              >
                <X className={cn('h-4 w-4 text-red-500', isRTL ? 'ms-2' : 'me-2')} />
                {t('markDeclined')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateRsvp.mutateAsync({
                    agendaId,
                    participantId: p.id,
                    input: { rsvp_status: 'tentative' },
                  })
                }
              >
                <HelpCircle className={cn('h-4 w-4 text-yellow-500', isRTL ? 'ms-2' : 'me-2')} />
                {t('markTentative')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRemove(p.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('remove')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  // Render group section
  const renderGroup = (title: string, items: AgendaParticipant[]) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="space-y-2">{items.map(renderParticipant)}</div>
      </div>
    )
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            {t('participants')}
            <Badge variant="secondary">{participants.length}</Badge>
          </CardTitle>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="min-h-10"
            >
              <UserPlus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('addParticipant')}
            </Button>
          )}
        </div>

        {/* RSVP summary */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {rsvpCounts.accepted} {t('accepted')}
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <HelpCircle className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {rsvpCounts.tentative} {t('tentative')}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <X className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {rsvpCounts.declined} {t('declined')}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <HelpCircle className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {rsvpCounts.pending} {t('pending')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('noParticipants')}</p>
            {canEdit && (
              <Button
                variant="outline"
                className="mt-4 min-h-11"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('addFirstParticipant')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {renderGroup(t('leadership'), groupedParticipants.leadership)}
            {renderGroup(t('secretariat'), groupedParticipants.secretariat)}
            {renderGroup(t('presenters'), groupedParticipants.presenters)}
            {renderGroup(t('attendees'), groupedParticipants.attendees)}
            {renderGroup(t('observers'), groupedParticipants.observers)}
          </div>
        )}
      </CardContent>

      {/* Add Participant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('addParticipant')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('nameEn')} *</Label>
              <Input
                value={newParticipant.name_en}
                onChange={(e) => setNewParticipant({ ...newParticipant, name_en: e.target.value })}
                placeholder={t('enterNameEn')}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('nameAr')}</Label>
              <Input
                value={newParticipant.name_ar}
                onChange={(e) => setNewParticipant({ ...newParticipant, name_ar: e.target.value })}
                placeholder={t('enterNameAr')}
                dir="rtl"
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input
                type="email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                placeholder={t('enterEmail')}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('title')}</Label>
              <Input
                value={newParticipant.title_en}
                onChange={(e) => setNewParticipant({ ...newParticipant, title_en: e.target.value })}
                placeholder={t('enterTitle')}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('organization')}</Label>
              <Input
                value={newParticipant.organization_name_en}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, organization_name_en: e.target.value })
                }
                placeholder={t('enterOrganization')}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('role')}</Label>
              <Select
                value={newParticipant.role}
                onValueChange={(v) =>
                  setNewParticipant({ ...newParticipant, role: v as ParticipantRole })
                }
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTICIPANT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      <span className="flex items-center gap-2">
                        {ROLE_ICONS[role]}
                        {t(`roles.${role}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="min-h-11">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newParticipant.name_en || addParticipant.isPending}
              className="min-h-11"
            >
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default AgendaParticipantsList
