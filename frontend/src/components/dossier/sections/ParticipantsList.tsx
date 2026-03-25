/**
 * Participants List Section (Feature 028 - User Story 3 - T030)
 *
 * Displays attendees and their roles for engagement.
 * Fetches from dossier_relationships and after-action attendees.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Users, User, Building2, Loader2, ExternalLink } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useDirection } from '@/hooks/useDirection'

interface Participant {
  id: string
  name: string
  nameAr?: string
  role?: string
  organization?: string
  type: 'person' | 'organization' | 'user'
  dossierId?: string
  avatarUrl?: string
}

interface ParticipantsListProps {
  dossierId: string
}

export function ParticipantsList({ dossierId }: ParticipantsListProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
// Fetch participants from dossier_relationships
  const { data: relationshipParticipants = [], isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['dossier-participants', dossierId],
    queryFn: async () => {
      // Fetch person dossiers linked to this engagement
      const { data, error } = await supabase
        .from('dossier_relationships')
        .select(
          `
          id,
          relationship_type,
          relationship_label,
          target_dossier_id,
          dossiers!dossier_relationships_target_dossier_id_fkey (
            id,
            name_en,
            name_ar,
            type,
            metadata
          )
        `,
        )
        .eq('source_dossier_id', dossierId)
        .in('relationship_type', [
          'engagement_participant',
          'participant',
          'attendee',
          'representative',
        ])
        .limit(50)

      if (error) {
        console.error('Failed to fetch dossier relationships:', error)
        return []
      }

      return (data || []).map((rel: any) => ({
        id: rel.id,
        name: rel.dossiers?.name_en || rel.relationship_label || 'Unknown',
        nameAr: rel.dossiers?.name_ar,
        role: rel.relationship_label,
        type: rel.dossiers?.type === 'person' ? 'person' : 'organization',
        dossierId: rel.target_dossier_id,
        organization: rel.dossiers?.metadata?.organization,
      })) as Participant[]
    },
    enabled: !!dossierId,
  })

  // Fetch attendees from after-action records
  const { data: afterActionAttendees = [], isLoading: isLoadingAfterAction } = useQuery({
    queryKey: ['after-action-attendees', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('after-actions-list', {
        body: { dossier_id: dossierId, status: 'published', limit: 10 },
      })

      if (error || !data?.data) {
        return []
      }

      // Extract unique attendees from all after-action records
      const attendeesSet = new Set<string>()
      const attendees: Participant[] = []

      for (const record of data.data) {
        if (record.attendees) {
          for (const attendee of record.attendees) {
            if (!attendeesSet.has(attendee)) {
              attendeesSet.add(attendee)
              attendees.push({
                id: `attendee-${attendees.length}`,
                name: attendee,
                type: 'user',
              })
            }
          }
        }
      }

      return attendees
    },
    enabled: !!dossierId,
  })

  // Combine participants
  const allParticipants = [...relationshipParticipants, ...afterActionAttendees]
  const isLoading = isLoadingRelationships || isLoadingAfterAction

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get participant type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <User className="h-4 w-4" />
      case 'organization':
        return <Building2 className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show empty state
  if (allParticipants.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.engagement.participantsListEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.engagement.participantsListEmptyDescription')}
        </p>
      </div>
    )
  }

  // Render participants list
  return (
    <div className="space-y-3">
      {/* Summary header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('sections.engagement.participantCount', {
              count: allParticipants.length,
              defaultValue: `${allParticipants.length} participants`,
            })}
          </span>
        </div>
      </div>

      {/* Participants grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allParticipants.map((participant) => {
          const displayName = isRTL ? participant.nameAr || participant.name : participant.name

          return (
            <Card key={participant.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={participant.avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm sm:text-base truncate text-start">
                        {displayName}
                      </h4>
                      {participant.dossierId && (
                        <Link
                          to="/dossiers/person/$dossierId"
                          params={{ dossierId: participant.dossierId } as any}
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {participant.role && (
                        <Badge variant="secondary" className="text-xs">
                          {participant.role}
                        </Badge>
                      )}
                      {participant.organization && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {participant.organization}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(participant.type)}
                        <span className="ms-1">
                          {t(`participant.type.${participant.type}`, participant.type)}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
