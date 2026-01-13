/**
 * MobileActionBar Component
 *
 * A sticky bottom action bar optimized for thumb-zone accessibility on mobile devices.
 * Places primary CTAs within the natural thumb reach (bottom third of screen).
 *
 * Features:
 * - Sticky bottom positioning on mobile (< 640px)
 * - Safe area padding for iOS devices with bottom notch
 * - RTL support via logical properties
 * - Responsive: fixed on mobile, static on desktop
 * - Touch-friendly 44x44px minimum targets
 * - Backdrop blur for visual hierarchy
 * - WCAG AA compliant
 *
 * Usage:
 * ```tsx
 * <MobileActionBar>
 *   <MobileActionBar.SecondaryAction onClick={onCancel}>
 *     Cancel
 *   </MobileActionBar.SecondaryAction>
 *   <MobileActionBar.PrimaryAction onClick={onSave}>
 *     Save
 *   </MobileActionBar.PrimaryAction>
 * </MobileActionBar>
 * ```
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

// Context to pass RTL state and layout mode
interface MobileActionBarContextValue {
  isRTL: boolean
  variant: 'sticky' | 'static' | 'auto'
}

const MobileActionBarContext = React.createContext<MobileActionBarContextValue | null>(null)

function useMobileActionBarContext() {
  const context = React.useContext(MobileActionBarContext)
  if (!context) {
    throw new Error('MobileActionBar components must be used within MobileActionBar')
  }
  return context
}

// Types
export interface MobileActionBarProps {
  children: React.ReactNode
  className?: string
  /**
   * Controls the positioning behavior:
   * - 'sticky': Always fixed at bottom (for full-page forms)
   * - 'static': Never fixed, inline with content (for modals/dialogs)
   * - 'auto': Fixed on mobile (< 640px), static on desktop
   * @default 'auto'
   */
  variant?: 'sticky' | 'static' | 'auto'
  /**
   * Show a border/separator above the action bar
   * @default true
   */
  showBorder?: boolean
  /**
   * Add backdrop blur effect (only for sticky/auto variants)
   * @default true
   */
  blurBackground?: boolean
}

export interface ActionButtonProps extends ButtonProps {
  children: React.ReactNode
}

// Main container component
function MobileActionBarRoot({
  children,
  className,
  variant = 'auto',
  showBorder = true,
  blurBackground = true,
}: MobileActionBarProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const contextValue = React.useMemo(() => ({ isRTL, variant }), [isRTL, variant])

  // Base styles for all variants
  const baseStyles = cn(
    'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3',
    'p-4 sm:px-6',
    showBorder && 'border-t bg-background/95',
    blurBackground &&
      variant !== 'static' &&
      'backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
  )

  // Position-specific styles
  const positionStyles = cn(
    // Auto: sticky on mobile, static on desktop
    variant === 'auto' && [
      'fixed bottom-0 inset-x-0 z-40 sm:relative sm:inset-auto',
      // Safe area for iOS devices with bottom notch
      'pb-[max(1rem,env(safe-area-inset-bottom))]',
      'sm:pb-4',
    ],
    // Sticky: always fixed at bottom
    variant === 'sticky' && [
      'fixed bottom-0 inset-x-0 z-40',
      'pb-[max(1rem,env(safe-area-inset-bottom))]',
    ],
    // Static: inline with content (for modals)
    variant === 'static' && 'relative',
  )

  return (
    <MobileActionBarContext.Provider value={contextValue}>
      <div
        className={cn(baseStyles, positionStyles, className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="toolbar"
        aria-label="Action buttons"
      >
        {children}
      </div>
    </MobileActionBarContext.Provider>
  )
}

// Primary action button (Save, Submit, Create, etc.)
function PrimaryAction({ children, className, ...props }: ActionButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        'w-full sm:w-auto min-h-11',
        'order-first sm:order-last', // Primary action at bottom on mobile (column-reverse), right on desktop
        className,
      )}
    >
      {children}
    </Button>
  )
}
PrimaryAction.displayName = 'MobileActionBar.PrimaryAction'

// Secondary action button (Cancel, Back, etc.)
function SecondaryAction({
  children,
  className,
  variant = 'outline',
  ...props
}: ActionButtonProps) {
  return (
    <Button variant={variant} {...props} className={cn('w-full sm:w-auto min-h-11', className)}>
      {children}
    </Button>
  )
}
SecondaryAction.displayName = 'MobileActionBar.SecondaryAction'

// Tertiary/ghost action button (Save Draft, etc.)
function TertiaryAction({ children, className, variant = 'ghost', ...props }: ActionButtonProps) {
  return (
    <Button variant={variant} {...props} className={cn('w-full sm:w-auto min-h-11', className)}>
      {children}
    </Button>
  )
}
TertiaryAction.displayName = 'MobileActionBar.TertiaryAction'

// Group container for multiple secondary actions
function ActionGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto', className)}>
      {children}
    </div>
  )
}
ActionGroup.displayName = 'MobileActionBar.ActionGroup'

// Spacer placeholder component for page content to avoid overlap with sticky bar
export function MobileActionBarSpacer({
  className,
  show = true,
}: {
  className?: string
  show?: boolean
}) {
  if (!show) return null

  return (
    <div
      className={cn(
        // Reserve space for the action bar on mobile only
        'h-24 sm:h-0',
        // Additional space for safe area on iOS
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
      aria-hidden="true"
    />
  )
}
MobileActionBarSpacer.displayName = 'MobileActionBarSpacer'

// Compound component export
export const MobileActionBar = Object.assign(MobileActionBarRoot, {
  PrimaryAction,
  SecondaryAction,
  TertiaryAction,
  ActionGroup,
  Spacer: MobileActionBarSpacer,
})

export default MobileActionBar
