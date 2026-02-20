/**
 * MouPartiesList Component
 *
 * Displays MoU signatory parties with their status and signing details.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Flag,
  User,
  PenTool,
  Clock,
  XCircle,
  Shield,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMouParties, useRemoveMouParty } from '@/hooks/useMouLifecycle'
import type {
  MouPartyWithEntity,
  MouPartyRole,
  MouPartyStatus,
  MouPartyType,
} from '@/types/mou-extended.types'

interface MouPartiesListProps {
  mouId: string
  onAddParty?: () => void
  onEditParty?: (party: MouPartyWithEntity) => void
}

export function MouPartiesList({ mouId, onAddParty, onEditParty }: MouPartiesListProps) {
  const { t, i18n } = useTranslation('mou-lifecycle')
  const isRTL = i18n.language === 'ar'

  const [expandedParty, setExpandedParty] = useState<string | null>(null)

  // Fetch parties
  const { data: partiesData, isLoading, error, refetch } = useMouParties(mouId)
  const deleteParty = useRemoveMouParty()

  const parties =
    (Array.isArray(partiesData)
      ? partiesData
      : (((partiesData as unknown as Record<string, unknown>)?.data as MouPartyWithEntity[]) ??
        [])) || []

  // Group by role
  const signatories = parties.filter((p) => p.role === 'signatory')
  const others = parties.filter((p) => p.role !== 'signatory')

  // Handle delete
  const handleDelete = async (party: MouPartyWithEntity) => {
    if (window.confirm(t('actions.removeParty', 'Remove this party?'))) {
      await deleteParty.mutateAsync({ id: party.id, mouId })
    }
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">{t('parties.title', 'MoU Parties')}</h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('parties.description', 'Manage signatory parties and their status')}
          </p>
        </div>

        {onAddParty && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={onAddParty}
          >
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('parties.create', 'Add Party')}
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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

      {/* Parties List */}
      {!isLoading && !error && (
        <>
          {/* Signatories Section */}
          {signatories.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                {t('partyRoles.signatory', 'Signatories')}
                <Badge variant="secondary" className="text-xs">
                  {signatories.length}
                </Badge>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {signatories.map((party) => (
                  <PartyCard
                    key={party.id}
                    party={party}
                    isRTL={isRTL}
                    isExpanded={expandedParty === party.id}
                    onToggleExpand={() =>
                      setExpandedParty(expandedParty === party.id ? null : party.id)
                    }
                    onEdit={onEditParty}
                    onDelete={handleDelete}
                    t={t}
                    i18n={i18n}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Parties Section */}
          {others.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {t('parties.title', 'Other Parties')}
                <Badge variant="outline" className="text-xs">
                  {others.length}
                </Badge>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {others.map((party) => (
                  <PartyCard
                    key={party.id}
                    party={party}
                    isRTL={isRTL}
                    isExpanded={expandedParty === party.id}
                    onToggleExpand={() =>
                      setExpandedParty(expandedParty === party.id ? null : party.id)
                    }
                    onEdit={onEditParty}
                    onDelete={handleDelete}
                    t={t}
                    i18n={i18n}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {parties.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">{t('parties.empty', 'No parties added')}</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {t('parties.emptyDescription', 'Add signatory parties to this MoU')}
              </p>
              {onAddParty && (
                <Button variant="default" onClick={onAddParty} className="gap-2 min-h-11">
                  <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                  {t('parties.create', 'Add Party')}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Party Card Component
interface PartyCardProps {
  party: MouPartyWithEntity
  isRTL: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit?: (party: MouPartyWithEntity) => void
  onDelete?: (party: MouPartyWithEntity) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function PartyCard({
  party,
  isRTL,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  t,
  i18n,
}: PartyCardProps) {
  const entityName = isRTL
    ? party.entity_name_ar || party.entity_name_en
    : party.entity_name_en || party.entity_name_ar

  const signedByTitle = isRTL
    ? party.signed_by_title_ar || party.signed_by_title_en
    : party.signed_by_title_en || party.signed_by_title_ar

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get party type icon
  const getPartyTypeIcon = (type: MouPartyType) => {
    switch (type) {
      case 'country':
        return <Flag className="h-5 w-5" />
      case 'organization':
        return <Building2 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Get status config
  const getStatusConfig = (status: MouPartyStatus) => {
    switch (status) {
      case 'signed':
        return {
          icon: <PenTool className="h-3 w-3" />,
          variant: 'default' as const,
          color: 'text-blue-600 bg-blue-100',
        }
      case 'ratified':
        return {
          icon: <Shield className="h-3 w-3" />,
          variant: 'default' as const,
          color: 'text-green-600 bg-green-100',
        }
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: 'secondary' as const,
          color: 'text-amber-600 bg-amber-100',
        }
      case 'withdrawn':
        return {
          icon: <XCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
          color: 'text-red-600 bg-red-100',
        }
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: 'outline' as const,
          color: 'text-muted-foreground bg-muted',
        }
    }
  }

  // Get role badge variant
  const getRoleVariant = (
    role: MouPartyRole,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'signatory':
        return 'default'
      case 'witness':
        return 'secondary'
      case 'guarantor':
        return 'default'
      case 'implementing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const statusConfig = getStatusConfig(party.party_status)

  return (
    <div className="rounded-lg border bg-card hover:border-muted-foreground/30 transition-colors">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'rounded-full p-2 shrink-0',
              party.party_status === 'ratified' && 'bg-green-100 text-green-600',
              party.party_status === 'signed' && 'bg-blue-100 text-blue-600',
              party.party_status === 'pending' && 'bg-amber-100 text-amber-600',
              party.party_status === 'withdrawn' && 'bg-red-100 text-red-600',
            )}
          >
            {getPartyTypeIcon(party.party_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h4 className="font-medium text-card-foreground text-start">
                  {entityName || t('common.unknown', 'Unknown')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t(`partyTypes.${party.party_type}`, party.party_type)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getRoleVariant(party.role)} className="text-xs">
                  {t(`partyRoles.${party.role}`, party.role)}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-xs gap-1">
                  {statusConfig.icon}
                  {t(`partyStatus.${party.party_status}`, party.party_status)}
                </Badge>
              </div>
            </div>

            {/* Quick Info */}
            {party.signed_at && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('parties.signedAt', 'Signed')}: {formatDate(party.signed_at)}
                {party.signed_by_name && ` • ${party.signed_by_name}`}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Signed By */}
            {party.signed_by_name && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t('parties.signedBy', 'Signed By')}
                </p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{party.signed_by_name}</span>
                </div>
                {signedByTitle && (
                  <p className="text-xs text-muted-foreground ms-6">{signedByTitle}</p>
                )}
              </div>
            )}

            {/* Signed At */}
            {party.signed_at && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t('parties.signedAt', 'Signed At')}
                </p>
                <p>{formatDate(party.signed_at)}</p>
                {party.signed_at_hijri && (
                  <p className="text-xs text-muted-foreground">
                    {t('parties.signedAtHijri', 'Hijri')}: {party.signed_at_hijri}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {party.notes && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs mb-1">{t('common.notes', 'Notes')}</p>
                <p className="text-sm">{party.notes}</p>
              </div>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(party)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('parties.edit', 'Edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(party)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('parties.delete', 'Remove')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MouPartiesList
