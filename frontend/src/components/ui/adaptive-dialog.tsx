/**
 * AdaptiveDialog Component
 *
 * Renders as a BottomSheet on mobile and a Dialog on desktop.
 * Automatically detects viewport size via useResponsive hook.
 * Mobile-first, RTL-compatible.
 *
 * Usage:
 * ```tsx
 * <AdaptiveDialog open={open} onOpenChange={setOpen} title="Edit Task" snapPreset="medium">
 *   <form>...</form>
 * </AdaptiveDialog>
 * ```
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '@/hooks/use-responsive'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import type { BottomSheetSnapPreset } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

// ============================================================================
// AdaptiveDialog - Root component
// ============================================================================

export interface AdaptiveDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title?: React.ReactNode
  /** Dialog description */
  description?: React.ReactNode
  /** Snap preset for mobile bottom sheet */
  snapPreset?: BottomSheetSnapPreset
  /** Max width for desktop dialog */
  maxWidth?: string
  /** Additional className for content */
  className?: string
  /** Dialog content */
  children: React.ReactNode
  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode
  /** Whether footer should be sticky on mobile */
  stickyFooter?: boolean
}

export function AdaptiveDialog({
  open,
  onOpenChange,
  title,
  description,
  snapPreset = 'medium',
  maxWidth = 'sm:max-w-[640px]',
  className,
  children,
  footer,
  stickyFooter = true,
}: AdaptiveDialogProps): React.ReactElement {
  const { isMobile } = useResponsive()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPreset={snapPreset}
      >
        <BottomSheetContent showHandle showHandleHint={false}>
          {(title !== undefined || description !== undefined) && (
            <BottomSheetHeader>
              {title !== undefined && <BottomSheetTitle>{title}</BottomSheetTitle>}
              {description !== undefined && (
                <BottomSheetDescription>{description}</BottomSheetDescription>
              )}
            </BottomSheetHeader>
          )}
          <BottomSheetBody className={className}>{children}</BottomSheetBody>
          {footer !== undefined && (
            <BottomSheetFooter sticky={stickyFooter}>{footer}</BottomSheetFooter>
          )}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('w-full max-w-full', maxWidth, className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {(title !== undefined || description !== undefined) && (
          <DialogHeader>
            {title !== undefined && (
              <DialogTitle className="text-start text-lg sm:text-xl">
                {title}
              </DialogTitle>
            )}
            {description !== undefined && (
              <DialogDescription className="text-start">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer !== undefined && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// AdaptiveDialogBody - For wrapping form content with consistent padding
// ============================================================================

export interface AdaptiveDialogBodyProps {
  children: React.ReactNode
  className?: string
}

export function AdaptiveDialogBody({
  children,
  className,
}: AdaptiveDialogBodyProps): React.ReactElement {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>
}

// ============================================================================
// StickyFormFooter - Sticky save button pattern for forms
// ============================================================================

export interface StickyFormFooterProps {
  children: React.ReactNode
  className?: string
}

export function StickyFormFooter({
  children,
  className,
}: StickyFormFooterProps): React.ReactElement {
  return (
    <div
      className={cn(
        'sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mx-0 sm:mt-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default AdaptiveDialog
