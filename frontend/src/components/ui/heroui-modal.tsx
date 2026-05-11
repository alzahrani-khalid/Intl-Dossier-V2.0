/**
 * HeroUI Modal Wrapper
 *
 * Provides HeroUI v3 Modal with convenient wrapper components
 * for common dialog patterns. Mobile-first, RTL-compatible.
 *
 * Usage:
 * - For new dialogs, use HeroUI Modal directly
 * - For migration, gradually replace Dialog imports with this module
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Modal, Button, useOverlayState } from '@heroui/react'
import { cn } from '@/lib/utils'
import { useDomDirection } from '@/hooks/useDomDirection'

// Re-export HeroUI hooks for convenience
export { useOverlayState }

// ============================================================================
// Modal Context for managing open state
// ============================================================================
interface ModalContextValue {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

// ============================================================================
// HeroUIModal - Root component with state management
// ============================================================================
export interface HeroUIModalProps {
  children: React.ReactNode
  /** Controlled open state */
  open?: boolean
  /** Open state change callback */
  onOpenChange?: (open: boolean) => void
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
}

export function HeroUIModal({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
}: HeroUIModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  const onOpenChange = isControlled ? (controlledOnOpenChange ?? (() => {})) : setUncontrolledOpen

  return (
    <ModalContext.Provider value={{ isOpen, onOpenChange }}>
      <Modal>{children}</Modal>
    </ModalContext.Provider>
  )
}

// ============================================================================
// HeroUIModalTrigger - Button/element that opens the modal
// ============================================================================
export interface HeroUIModalTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export function HeroUIModalTrigger({ children, className }: HeroUIModalTriggerProps) {
  // HeroUI Modal uses first child as trigger automatically
  return <div className={className}>{children}</div>
}

// ============================================================================
// HeroUIModalContent - Main content wrapper
// ============================================================================
export interface HeroUIModalContentProps {
  children: React.ReactNode
  className?: string
  /** Modal size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full'
  /** Backdrop variant */
  backdrop?: 'opaque' | 'blur' | 'transparent'
  /** Placement on screen */
  placement?: 'auto' | 'center' | 'top' | 'bottom'
  /** Allow dismiss on backdrop click */
  isDismissable?: boolean
  /** Disable ESC key dismiss */
  isKeyboardDismissDisabled?: boolean
  /** Show close button */
  showCloseButton?: boolean
}

export function HeroUIModalContent({
  children,
  className,
  size = 'md',
  backdrop = 'opaque',
  placement = 'auto',
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  showCloseButton = true,
}: HeroUIModalContentProps) {
  const { isRTL } = useDomDirection()
  return (
    <Modal.Backdrop
      variant={backdrop}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
    >
      <Modal.Container size={size} placement={placement}>
        <Modal.Dialog
          className={cn(
            // Base styles
            'bg-background border border-border',
            // RTL support
            isRTL && 'text-end',
            className,
          )}
        >
          {showCloseButton && <Modal.CloseTrigger />}
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

// ============================================================================
// HeroUIModalHeader - Header section
// ============================================================================
export interface HeroUIModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export function HeroUIModalHeader({ children, className }: HeroUIModalHeaderProps) {
  return (
    <Modal.Header className={cn('flex flex-col space-y-1.5', className)}>{children}</Modal.Header>
  )
}

// ============================================================================
// HeroUIModalTitle - Title text
// ============================================================================
export interface HeroUIModalTitleProps {
  children: React.ReactNode
  className?: string
}

export function HeroUIModalTitle({ children, className }: HeroUIModalTitleProps) {
  return (
    <Modal.Heading className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </Modal.Heading>
  )
}

// ============================================================================
// HeroUIModalDescription - Description text
// ============================================================================
export interface HeroUIModalDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function HeroUIModalDescription({ children, className }: HeroUIModalDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground mt-1.5', className)}>{children}</p>
}

// ============================================================================
// HeroUIModalBody - Main content area
// ============================================================================
export interface HeroUIModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function HeroUIModalBody({ children, className }: HeroUIModalBodyProps) {
  return <Modal.Body className={cn('py-4', className)}>{children}</Modal.Body>
}

// ============================================================================
// HeroUIModalFooter - Footer with actions
// ============================================================================
export interface HeroUIModalFooterProps {
  children: React.ReactNode
  className?: string
  /** Mobile thumb-zone optimization */
  thumbZone?: boolean
}

export function HeroUIModalFooter({
  children,
  className,
  thumbZone = false,
}: HeroUIModalFooterProps) {
  return (
    <Modal.Footer
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
        // Thumb-zone optimization for mobile
        thumbZone && [
          'sticky bottom-0 -mx-6 -mb-6 px-6 py-4 mt-4',
          'bg-background/95 backdrop-blur-sm border-t',
          'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
        ],
        // Button sizing
        '[&>button]:min-h-11 [&>button]:sm:min-h-10',
        className,
      )}
    >
      {children}
    </Modal.Footer>
  )
}

// ============================================================================
// HeroUIModalClose - Close button
// ============================================================================
export interface HeroUIModalCloseProps {
  children?: React.ReactNode
  className?: string
  /** Use asChild to render custom element */
  asChild?: boolean
}

export function HeroUIModalClose({ children, className }: HeroUIModalCloseProps) {
  const { t } = useTranslation()
  if (children) {
    return (
      <Button slot="close" className={className}>
        {children}
      </Button>
    )
  }

  return (
    <Button
      slot="close"
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={t('common.actions.closeDialog')}
      className={cn(
        'absolute end-4 top-4 rounded-sm opacity-70',
        'hover:opacity-100 transition-opacity',
        className,
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">{t('common.actions.closeDialog')}</span>
    </Button>
  )
}

// ============================================================================
// Convenience exports
// ============================================================================

// Export Modal primitive for advanced usage
export { Modal as HeroUIModalPrimitive }

// Default export for simple usage
export default HeroUIModal
