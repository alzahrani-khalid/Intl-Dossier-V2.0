/**
 * Tenant Switcher Component
 *
 * Allows users to switch between organizations they have access to.
 * Mobile-first, RTL-compatible design.
 *
 * @module TenantSwitcher
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTenant, OrganizationMembership } from '@/contexts/TenantContext'

/**
 * Props for TenantSwitcher
 */
export interface TenantSwitcherProps {
  /** Additional className */
  className?: string
  /** Compact mode (icon only) */
  compact?: boolean
  /** Callback when tenant changes */
  onTenantChange?: (tenantId: string) => void
}

/**
 * TenantSwitcher component
 */
export function TenantSwitcher({
  className,
  compact = false,
  onTenantChange,
}: TenantSwitcherProps) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'
  const [open, setOpen] = useState(false)

  const {
    currentTenantId,
    currentTenantName,
    memberships,
    hasMultipleTenants,
    switchTenant,
    isLoading,
  } = useTenant()

  // Don't show if only one tenant
  if (!hasMultipleTenants && !isLoading) {
    return null
  }

  const handleSelect = async (tenantId: string) => {
    if (tenantId === currentTenantId) {
      setOpen(false)
      return
    }

    try {
      await switchTenant(tenantId)
      onTenantChange?.(tenantId)
    } catch (error) {
      console.error('Failed to switch tenant:', error)
    }

    setOpen(false)
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn(
          'h-10 min-w-10 justify-between',
          compact ? 'w-10 p-0' : 'w-full sm:w-[200px]',
          className,
        )}
        disabled
      >
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4 animate-pulse" />
          {!compact && (
            <span className="truncate text-muted-foreground">{t('loading', 'Loading...')}</span>
          )}
        </span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('switchOrganization', 'Switch organization')}
          className={cn(
            'h-10 min-w-10 justify-between',
            compact ? 'w-10 p-0' : 'w-full sm:w-[200px]',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            {!compact && (
              <span className="truncate">
                {currentTenantName || t('selectOrganization', 'Select organization')}
              </span>
            )}
          </span>
          {!compact && <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[250px] p-0"
        align={isRTL ? 'end' : 'start'}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Command>
          <CommandInput
            placeholder={t('searchOrganization', 'Search organization...')}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{t('noOrganizationFound', 'No organization found.')}</CommandEmpty>
            <CommandGroup heading={t('organizations', 'Organizations')}>
              {memberships.map((membership: OrganizationMembership) => (
                <CommandItem
                  key={membership.organizationId}
                  value={membership.organizationName}
                  onSelect={() => handleSelect(membership.organizationId)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{membership.organizationName}</span>
                    {membership.isPrimary && (
                      <span className="text-xs text-muted-foreground">
                        ({t('primary', 'Primary')})
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      membership.organizationId === currentTenantId ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Tenant badge showing current organization
 */
export function TenantBadge({ className }: { className?: string }) {
  const { currentTenantName, isLoading } = useTenant()
  const { t } = useTranslation('common')

  if (isLoading) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {t('loading', 'Loading...')}
      </span>
    )
  }

  if (!currentTenantName) {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs',
        className,
      )}
    >
      <Building2 className="h-3 w-3" />
      {currentTenantName}
    </span>
  )
}

export default TenantSwitcher
