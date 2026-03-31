/**
 * RoleSwitcher Component
 * Phase 10: Operations Hub Dashboard
 *
 * Dropdown menu for switching the dashboard viewing role.
 * Role is a "viewing lens" -- not access control (D-10).
 * Persists selection via useRolePreference hook.
 */

import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DashboardRole } from '@/domains/operations-hub/types/operations-hub.types'

const ROLES: DashboardRole[] = ['leadership', 'officer', 'analyst']

interface RoleSwitcherProps {
  role: DashboardRole
  onChange: (role: DashboardRole) => void
}

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-h-11 min-w-11 gap-2"
          aria-label={t('roles.leadership', 'Role selection')}
        >
          <span className="text-sm">{t(`roles.${role}`)}</span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {ROLES.map((r) => (
          <DropdownMenuItem
            key={r}
            className="min-h-11 gap-2"
            onSelect={() => onChange(r)}
          >
            {role === r ? (
              <Check className="size-4" />
            ) : (
              <span className="size-4" />
            )}
            <span>{t(`roles.${r}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
