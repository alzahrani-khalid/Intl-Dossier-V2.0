import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Cross2Icon } from '@radix-ui/react-icons'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'id-dialog-overlay fixed inset-0 z-50 bg-[rgba(0,0,0,0.2)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'id-dialog-content fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-[var(--gap)] border border-[var(--line)] bg-[var(--surface)] p-[var(--pad)] text-[var(--ink)] shadow-[var(--shadow)] duration-[var(--dur)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:w-full sm:rounded-[var(--radius)]',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="tb-icon-btn absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-mute)] transition-colors hover:bg-[var(--line-soft)] hover:text-[var(--ink)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none">
        <Cross2Icon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-start', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Position footer actions for mobile thumb-zone accessibility
   * When true, adds extra bottom padding and stacks buttons for easier reach
   * @default false
   */
  thumbZone?: boolean
}

const DialogFooter = ({ className, thumbZone = false, ...props }: DialogFooterProps) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      // Thumb-zone optimization: sticky bottom with safe area on mobile
      thumbZone && [
        'sticky bottom-0 -mx-6 -mb-6 px-6 py-4 mt-4',
        'bg-[var(--surface)] border-t border-[var(--line)]',
        'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
      ],
      // Add spacing for RTL layouts
      '[&>button]:w-full [&>button]:min-h-11 [&>button]:sm:w-auto',
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('drawer-title text-start text-[22px] leading-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('card-sub text-start', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
