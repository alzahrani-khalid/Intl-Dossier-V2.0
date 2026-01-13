/**
 * DelegationList Component
 * Displays a list of delegations with filtering and empty states
 *
 * Feature: delegation-management
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { DelegationCard } from './DelegationCard'
import { RevokeDelegationDialog } from './RevokeDelegationDialog'
import { FileX2, Users, ArrowDownToLine } from 'lucide-react'
import type { Delegation } from '@/services/user-management-api'

interface DelegationListProps {
  delegations: Delegation[]
  type: 'granted' | 'received' | 'all'
  isLoading?: boolean
  onRefresh?: () => void
}

export function DelegationList({
  delegations,
  type,
  isLoading = false,
  onRefresh,
}: DelegationListProps) {
  const { t, i18n } = useTranslation('delegation')
  const isRTL = i18n.language === 'ar'

  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null)

  const handleRevoke = (delegationId: string) => {
    const delegation = delegations.find((d) => d.id === delegationId)
    if (delegation) {
      setSelectedDelegation(delegation)
      setRevokeDialogOpen(true)
    }
  }

  const handleRevokeSuccess = () => {
    setSelectedDelegation(null)
    onRefresh?.()
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (delegations.length === 0) {
    const EmptyIcon = type === 'granted' ? ArrowDownToLine : type === 'received' ? Users : FileX2

    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <EmptyIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t(`list.empty.${type}`)}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(`list.emptyDescription.${type}`)}
        </p>
      </div>
    )
  }

  // Determine card type based on list type and delegation
  const getCardType = (delegation: Delegation): 'granted' | 'received' => {
    // For 'all' type, we need to check the delegation's relationship
    if (type === 'all') {
      // If the current user is the grantor, show as 'granted'
      // This is a simplification - in real implementation, compare with current user ID
      return 'granted'
    }
    return type
  }

  return (
    <>
      <div className="space-y-4">
        {delegations.map((delegation) => (
          <DelegationCard
            key={delegation.id}
            delegation={delegation}
            type={type === 'all' ? getCardType(delegation) : type}
            onRevoke={type === 'granted' || type === 'all' ? handleRevoke : undefined}
          />
        ))}
      </div>

      {/* Revoke Dialog */}
      {selectedDelegation && (
        <RevokeDelegationDialog
          open={revokeDialogOpen}
          onOpenChange={setRevokeDialogOpen}
          delegationId={selectedDelegation.id}
          granteeEmail={selectedDelegation.grantee_email}
          onSuccess={handleRevokeSuccess}
        />
      )}
    </>
  )
}
