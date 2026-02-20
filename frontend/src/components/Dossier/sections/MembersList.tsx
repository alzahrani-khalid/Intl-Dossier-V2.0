/**
 * MembersList Component
 *
 * Displays committee members with roles, terms, and attendance tracking.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Users,
  Calendar,
  Building2,
  Flag,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Pause,
  LogOut,
  UserMinus,
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Crown,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useCommitteeMembers, useRemoveCommitteeMember } from '@/hooks/useCommittees'
import type {
  MemberWithDetails,
  MemberRole,
  MemberStatus,
  RepresentingType,
} from '@/types/committee.types'

interface MembersListProps {
  committeeId: string
  onAddMember?: () => void
  onEditMember?: (member: MemberWithDetails) => void
}

export function MembersList({ committeeId, onAddMember, onEditMember }: MembersListProps) {
  const { t, i18n } = useTranslation('committees')
  const isRTL = i18n.language === 'ar'

  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    role?: MemberRole
    status?: MemberStatus
    is_current?: boolean
  }>({ is_current: true })

  // Fetch members
  const { data: membersData, isLoading, error, refetch } = useCommitteeMembers(committeeId, filters)
  const removeMember = useRemoveCommitteeMember()

  const members =
    (Array.isArray(membersData)
      ? membersData
      : (((membersData as unknown as Record<string, unknown>)?.data as MemberWithDetails[]) ??
        [])) || []

  // Filter by search
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const name = isRTL ? member.member_name_ar : member.member_name_en
    return name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Group by role
  const leadership = filteredMembers.filter((m) =>
    ['chair', 'vice_chair', 'secretary'].includes(m.role),
  )
  const regularMembers = filteredMembers.filter(
    (m) => !['chair', 'vice_chair', 'secretary'].includes(m.role),
  )

  // Handle remove
  const handleRemove = async (member: MemberWithDetails) => {
    if (window.confirm(t('actions.removeMember', 'Remove this member?'))) {
      await removeMember.mutateAsync({ id: member.id, committeeId })
    }
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({ is_current: true })
    setSearchQuery('')
  }

  const hasActiveFilters =
    Object.keys(filters).filter((k) => k !== 'is_current').length > 0 || searchQuery.length > 0

  // Role options
  const roleOptions: MemberRole[] = [
    'chair',
    'vice_chair',
    'member',
    'alternate',
    'observer',
    'secretary',
    'rapporteur',
  ]

  // Status options
  const statusOptions: MemberStatus[] = [
    'active',
    'on_leave',
    'suspended',
    'resigned',
    'removed',
    'term_ended',
  ]

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">{t('members.title', 'Members')}</h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('members.description', 'Manage committee members')}
          </p>
        </div>

        {onAddMember && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={onAddMember}
          >
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('members.create', 'Add Member')}
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', 'Search...')}
            className={cn(
              'w-full h-10 rounded-md border border-input bg-background ps-9 pe-3',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            )}
          />
        </div>

        {/* Toggle Filters */}
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 min-h-10', hasActiveFilters && 'border-primary text-primary')}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          {t('common.filters', 'Filters')}
        </Button>

        {/* Current/Past Toggle */}
        <div className="flex rounded-md border">
          <button
            className={cn(
              'px-3 h-10 text-sm transition-colors',
              filters.is_current === true ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
            onClick={() => setFilters((f) => ({ ...f, is_current: true }))}
          >
            {t('members.isCurrent', 'Current')}
          </button>
          <button
            className={cn(
              'px-3 h-10 text-sm border-s transition-colors',
              filters.is_current === false
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
            onClick={() => setFilters((f) => ({ ...f, is_current: false }))}
          >
            {t('common.past', 'Past')}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.memberRole', 'Role')}
              </label>
              <select
                value={filters.role || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    role: (e.target.value as MemberRole) || undefined,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {t(`memberRoles.${role}`, role)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.memberStatus', 'Status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: (e.target.value as MemberStatus) || undefined,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`memberStatus.${status}`, status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('common.error', 'Failed to load data')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Members List */}
      {!isLoading && !error && (
        <>
          {/* Leadership Section */}
          {leadership.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4" />
                {t('common.leadership', 'Leadership')}
                <Badge variant="secondary" className="text-xs">
                  {leadership.length}
                </Badge>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leadership.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isRTL={isRTL}
                    isExpanded={expandedMember === member.id}
                    onToggleExpand={() =>
                      setExpandedMember(expandedMember === member.id ? null : member.id)
                    }
                    onEdit={onEditMember}
                    onRemove={handleRemove}
                    t={t}
                    i18n={i18n}
                    isLeadership
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Members Section */}
          {regularMembers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('members.title', 'Members')}
                <Badge variant="outline" className="text-xs">
                  {regularMembers.length}
                </Badge>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regularMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isRTL={isRTL}
                    isExpanded={expandedMember === member.id}
                    onToggleExpand={() =>
                      setExpandedMember(expandedMember === member.id ? null : member.id)
                    }
                    onEdit={onEditMember}
                    onRemove={handleRemove}
                    t={t}
                    i18n={i18n}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">{t('members.empty', 'No members')}</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {t('members.emptyDescription', 'Add members to this committee')}
              </p>
              {onAddMember && (
                <Button variant="default" onClick={onAddMember} className="gap-2 min-h-11">
                  <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                  {t('members.create', 'Add Member')}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Member Card Component
interface MemberCardProps {
  member: MemberWithDetails
  isRTL: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit?: (member: MemberWithDetails) => void
  onRemove?: (member: MemberWithDetails) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
  isLeadership?: boolean
}

function MemberCard({
  member,
  isRTL,
  isExpanded,
  onToggleExpand,
  onEdit,
  onRemove,
  t,
  i18n,
  isLeadership,
}: MemberCardProps) {
  const name = isRTL ? member.member_name_ar : member.member_name_en
  const title = isRTL
    ? member.member_title_ar || member.member_title_en
    : member.member_title_en || member.member_title_ar
  const representingName = isRTL
    ? member.representing_name_ar || member.representing_name_en
    : member.representing_name_en || member.representing_name_ar

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
    })
  }

  // Get status config
  const getStatusConfig = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return { icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default' as const }
      case 'on_leave':
        return { icon: <Pause className="h-3 w-3" />, variant: 'secondary' as const }
      case 'suspended':
        return { icon: <AlertCircle className="h-3 w-3" />, variant: 'destructive' as const }
      case 'resigned':
        return { icon: <LogOut className="h-3 w-3" />, variant: 'outline' as const }
      case 'removed':
        return { icon: <UserMinus className="h-3 w-3" />, variant: 'destructive' as const }
      case 'term_ended':
        return { icon: <Clock className="h-3 w-3" />, variant: 'outline' as const }
      default:
        return { icon: <Clock className="h-3 w-3" />, variant: 'outline' as const }
    }
  }

  // Get role icon
  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'chair':
        return <Crown className="h-4 w-4 text-amber-500" />
      case 'vice_chair':
        return <Star className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  // Get representing icon
  const getRepresentingIcon = (type: RepresentingType | undefined | null) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-3 w-3" />
      case 'country':
        return <Flag className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  // Calculate attendance rate
  const attendanceRate =
    member.meetings_total > 0
      ? Math.round((member.meetings_attended / member.meetings_total) * 100)
      : null

  const statusConfig = getStatusConfig(member.status)

  return (
    <div
      className={cn(
        'rounded-lg border bg-card transition-colors',
        isLeadership && 'border-primary/30 bg-primary/5',
      )}
    >
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {getRoleIcon(member.role) && (
              <div className="absolute -top-1 -end-1">{getRoleIcon(member.role)}</div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <div>
                <h4 className="font-medium text-card-foreground text-start line-clamp-1">{name}</h4>
                {title && <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>}
              </div>

              <Badge variant={statusConfig.variant} className="text-xs gap-1 shrink-0 w-fit">
                {statusConfig.icon}
                {t(`memberStatus.${member.status}`, member.status)}
              </Badge>
            </div>

            {/* Meta Row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {/* Role */}
              <Badge variant="outline" className="text-xs">
                {t(`memberRoles.${member.role}`, member.role)}
              </Badge>

              {/* Representing */}
              {representingName && (
                <span className="flex items-center gap-1">
                  {getRepresentingIcon(member.representing_type)}
                  {representingName}
                </span>
              )}

              {/* Term */}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(member.term_start)}
                {member.term_end && ` - ${formatDate(member.term_end)}`}
              </span>
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-3">
          {/* Attendance */}
          {attendanceRate !== null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('members.attendanceRate', 'Attendance Rate')}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      attendanceRate >= 75 && 'bg-green-500',
                      attendanceRate >= 50 && attendanceRate < 75 && 'bg-amber-500',
                      attendanceRate < 50 && 'bg-red-500',
                    )}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{attendanceRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {member.meetings_attended}/{member.meetings_total}{' '}
                {t('members.meetingsAttended', 'meetings')}
              </p>
            </div>
          )}

          {/* Email */}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {member.email}
            </a>
          )}

          {/* Status Reason */}
          {member.status_reason && (
            <div className="p-2 rounded bg-muted">
              <p className="text-xs text-muted-foreground mb-1">
                {t('members.statusReason', 'Status Reason')}
              </p>
              <p className="text-sm">{member.status_reason}</p>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(member)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('members.edit', 'Edit')}
              </Button>
            )}
            {onRemove && member.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(member)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('members.delete', 'Remove')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MembersList
