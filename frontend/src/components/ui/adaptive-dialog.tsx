/**
 * AdaptiveDialog Component
 *
 * Renders a bottom sheet on mobile viewports and a modal dialog on desktop.
 * Uses useResponsive() for breakpoint detection and supports RTL via useDirection().
 *
 * Mobile (<768px): BottomSheet with snap presets and drag handle
 * Desktop (768px+): HeroUI Modal with title and close button
 */

import * as React from 'react'
import { useResponsive } from '@/hooks/use-responsive'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetBody,
  BottomSheetFooter,
  type BottomSheetSnapPreset,
} from '@/components/ui/bottom-sheet'
import {
  HeroUIModal,
  HeroUIModalContent,
  HeroUIModalHeader,
  HeroUIModalTitle,
  HeroUIModalBody,
  HeroUIModalFooter,
} from '@/components/ui/heroui-modal'

export interface AdaptiveDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title?: string
  /** Dialog content */
  children: React.ReactNode
  /** Footer content (actions, buttons) */
  footer?: React.ReactNode
  /** Snap preset for mobile bottom sheet (default: 'medium') */
  snapPreset?: BottomSheetSnapPreset
  /** Modal size for desktop (default: 'md') */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full'
  /** Additional className for content */
  className?: string
}

export function AdaptiveDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  snapPreset = 'medium',
  size = 'md',
  className,
}: AdaptiveDialogProps): JSX.Element {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPreset={snapPreset}
      >
        <BottomSheetContent showHandle className={className}>
          {title != null && (
            <BottomSheetHeader>
              <BottomSheetTitle>{title}</BottomSheetTitle>
            </BottomSheetHeader>
          )}
          <BottomSheetBody>{children}</BottomSheetBody>
          {footer != null && <BottomSheetFooter>{footer}</BottomSheetFooter>}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <HeroUIModal open={open} onOpenChange={onOpenChange}>
      <HeroUIModalContent
        size={size}
        className={className}
        placement="center"
      >
        {title != null && (
          <HeroUIModalHeader>
            <HeroUIModalTitle>{title}</HeroUIModalTitle>
          </HeroUIModalHeader>
        )}
        <HeroUIModalBody>{children}</HeroUIModalBody>
        {footer != null && (
          <HeroUIModalFooter thumbZone>{footer}</HeroUIModalFooter>
        )}
      </HeroUIModalContent>
    </HeroUIModal>
  )
}
