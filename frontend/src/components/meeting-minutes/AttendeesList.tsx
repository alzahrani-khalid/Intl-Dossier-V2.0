/**
 * Attendees List
 * Feature: meeting-minutes-capture
 *
 * Displays and manages attendees for meeting minutes.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  Plus,
  User,
  Building2,
  UserCircle,
  Users,
  Crown,
  Shield,
  Presentation,
  Eye,
  MoreVertical,
  Trash2,
  Edit,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { MeetingAttendee, AttendeeRole, AttendanceStatus } from '@/types/meeting-minutes.types'
import { ATTENDANCE_STATUS_COLORS } from '@/types/meeting-minutes.types'

interface AttendeesListProps {
  attendees: MeetingAttendee[]
  minutesId: string
  onAddAttendee?: () => void
  onEditAttendee?: (attendee: MeetingAttendee) => void
  onRemoveAttendee?: (attendee: MeetingAttendee) => void
  onUpdateAttendance?: (attendee: MeetingAttendee, status: AttendanceStatus) => void
  isLoading?: boolean
  className?: string
}

const roleIcons: Record<AttendeeRole, React.ComponentType<{ className?: string }>> = {
  chair: Crown,
  co_chair: Shield,
  secretary: UserCircle,
  presenter: Presentation,
  attendee: User,
  observer: Eye,
  guest: Users,
}

const roleOrder: AttendeeRole[] = [
  'chair',
  'co_chair',
  'secretary',
  'presenter',
  'attendee',
  'observer',
  'guest',
]

export function AttendeesList({
  attendees,
  minutesId,
  onAddAttendee,
  onEditAttendee,
  onRemoveAttendee,
  onUpdateAttendance,
  isLoading,
  className,
}: AttendeesListProps) {
  const { t, i18n } = useTranslation('meeting-minutes')
  const isRTL = i18n.language === 'ar'

  // Sort attendees by role
  const sortedAttendees = [...attendees].sort((a, b) => {
    const aIndex = roleOrder.indexOf(a.role)
    const bIndex = roleOrder.indexOf(b.role)
    return aIndex - bIndex
  })

  // Group by role for desktop view
  const attendeesByRole = sortedAttendees.reduce(
    (acc, attendee) => {
      if (!acc[attendee.role]) {
        acc[attendee.role] = []
      }
      acc[attendee.role].push(attendee)
      return acc
    },
    {} as Record<AttendeeRole, MeetingAttendee[]>,
  )

  const getAttendanceColor = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_COLORS[status] || ATTENDANCE_STATUS_COLORS.present
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return '??'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const presentCount = attendees.filter((a) => a.attendance_status === 'present').length
  const totalCount = attendees.length

  if (attendees.length === 0 && !onAddAttendee) {
    return (
      <div className={cn('text-center py-8', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="text-sm text-muted-foreground">{t('attendees.noAttendees')}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {t('attendees.title')}
          </h3>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('attendees.presentCount', { count: presentCount })} /{' '}
              {t('attendees.totalCount', { count: totalCount })}
            </p>
          )}
        </div>
        {onAddAttendee && (
          <Button variant="outline" size="sm" onClick={onAddAttendee} className="min-h-9">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
            {t('attendees.addAttendee')}
          </Button>
        )}
      </div>

      {/* Attendees List */}
      <div className="space-y-2">
        {sortedAttendees.map((attendee) => {
          const RoleIcon = roleIcons[attendee.role] || User
          const attendanceColor = getAttendanceColor(attendee.attendance_status)
          const displayName = isRTL
            ? attendee.name_ar || attendee.name_en
            : attendee.name_en || attendee.name_ar

          return (
            <div
              key={attendee.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-sm">{getInitials(displayName)}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm sm:text-base text-foreground truncate">
                    {displayName || t('attendees.name')}
                  </span>
                  {/* Role Icon */}
                  <RoleIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {/* Role Badge */}
                  <Badge variant="secondary" className="text-xs">
                    {t(`attendees.roles.${attendee.role}`)}
                  </Badge>

                  {/* Attendance Status */}
                  <Badge
                    variant="outline"
                    className={cn('text-xs', attendanceColor.bg, attendanceColor.text)}
                  >
                    {t(`attendees.attendanceStatus.${attendee.attendance_status}`)}
                  </Badge>

                  {/* Organization */}
                  {(attendee.organization_name_en || attendee.organization_name_ar) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">
                        {isRTL
                          ? attendee.organization_name_ar || attendee.organization_name_en
                          : attendee.organization_name_en}
                      </span>
                    </span>
                  )}

                  {/* Email */}
                  {attendee.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{attendee.email}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(onEditAttendee || onRemoveAttendee || onUpdateAttendance) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    {onUpdateAttendance && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onUpdateAttendance(attendee, 'present')}
                          disabled={attendee.attendance_status === 'present'}
                        >
                          {t('attendees.attendanceStatus.present')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateAttendance(attendee, 'remote')}
                          disabled={attendee.attendance_status === 'remote'}
                        >
                          {t('attendees.attendanceStatus.remote')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateAttendance(attendee, 'absent')}
                          disabled={attendee.attendance_status === 'absent'}
                        >
                          {t('attendees.attendanceStatus.absent')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateAttendance(attendee, 'excused')}
                          disabled={attendee.attendance_status === 'excused'}
                        >
                          {t('attendees.attendanceStatus.excused')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {onEditAttendee && (
                      <DropdownMenuItem onClick={() => onEditAttendee(attendee)}>
                        <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                    )}

                    {onRemoveAttendee && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onRemoveAttendee(attendee)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State with Add Button */}
      {attendees.length === 0 && onAddAttendee && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{t('attendees.noAttendees')}</p>
          <Button variant="outline" size="sm" onClick={onAddAttendee} className="min-h-9">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
            {t('attendees.addAttendee')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default AttendeesList
