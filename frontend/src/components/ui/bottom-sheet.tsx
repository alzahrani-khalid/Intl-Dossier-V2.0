/**
 * BottomSheet Component
 *
 * A mobile-friendly bottom sheet component with:
 * - Drag-to-dismiss gestures
 * - Partial expansion states (half/full)
 * - Automatic keyboard avoidance
 * - Visual handle indicator
 * - RTL support
 *
 * Built on top of Vaul (shadcn/ui drawer)
 */

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// Snap point presets for common use cases
export const BOTTOM_SHEET_SNAP_POINTS = {
  /** Small sheet - good for simple actions */
  small: ['180px', '400px'],
  /** Medium sheet - good for forms */
  medium: ['300px', '600px', 1],
  /** Large sheet - good for detail views */
  large: ['400px', 0.75, 1],
  /** Full sheet - expands to full height */
  full: [0.5, 1],
  /** Single snap - simple bottom sheet */
  single: ['auto'],
} as const

export type BottomSheetSnapPreset = keyof typeof BOTTOM_SHEET_SNAP_POINTS

interface BottomSheetContextValue {
  isRTL: boolean
  snapPoints: (number | string)[] | undefined
  activeSnapPoint: number | string | null
  setActiveSnapPoint: (point: number | string | null) => void
}

const BottomSheetContext = React.createContext<BottomSheetContextValue | null>(null)

function useBottomSheetContext() {
  const context = React.useContext(BottomSheetContext)
  if (!context) {
    throw new Error('BottomSheet components must be used within a BottomSheet')
  }
  return context
}

// ============================================================================
// BottomSheet Root
// ============================================================================

export interface BottomSheetProps extends React.ComponentProps<typeof DrawerPrimitive.Root> {
  /** Preset snap points or custom array */
  snapPreset?: BottomSheetSnapPreset
  /** Custom snap points (overrides preset) */
  snapPoints?: (number | string)[]
  /** Default snap point index */
  defaultSnapPoint?: number
  /** Callback when snap point changes */
  onSnapPointChange?: (point: number | string | null) => void
  /** Whether to scale the background when open */
  shouldScaleBackground?: boolean
}

const BottomSheet = ({
  snapPreset = 'medium',
  snapPoints: customSnapPoints,
  defaultSnapPoint = 0,
  onSnapPointChange,
  shouldScaleBackground = true,
  children,
  ...props
}: BottomSheetProps) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const snapPoints = customSnapPoints ?? BOTTOM_SHEET_SNAP_POINTS[snapPreset]
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(
    snapPoints?.[defaultSnapPoint] ?? null,
  )

  const handleSnapPointChange = React.useCallback(
    (point: number | string | null) => {
      setActiveSnapPoint(point)
      onSnapPointChange?.(point)
    },
    [onSnapPointChange],
  )

  const contextValue = React.useMemo(
    () => ({
      isRTL,
      snapPoints,
      activeSnapPoint,
      setActiveSnapPoint: handleSnapPointChange,
    }),
    [isRTL, snapPoints, activeSnapPoint, handleSnapPointChange],
  )

  return (
    <BottomSheetContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        shouldScaleBackground={shouldScaleBackground}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={handleSnapPointChange}
        {...props}
      >
        {children}
      </DrawerPrimitive.Root>
    </BottomSheetContext.Provider>
  )
}
BottomSheet.displayName = 'BottomSheet'

// ============================================================================
// BottomSheet Trigger
// ============================================================================

const BottomSheetTrigger = DrawerPrimitive.Trigger
BottomSheetTrigger.displayName = 'BottomSheetTrigger'

// ============================================================================
// BottomSheet Portal
// ============================================================================

const BottomSheetPortal = DrawerPrimitive.Portal

// ============================================================================
// BottomSheet Close
// ============================================================================

const BottomSheetClose = DrawerPrimitive.Close
BottomSheetClose.displayName = 'BottomSheetClose'

// ============================================================================
// BottomSheet Overlay
// ============================================================================

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

// ============================================================================
// BottomSheet Handle
// ============================================================================

interface BottomSheetHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show visual cue text */
  showHint?: boolean
  /** Hint text */
  hint?: string
}

const BottomSheetHandle = React.forwardRef<HTMLDivElement, BottomSheetHandleProps>(
  ({ className, showHint = false, hint, ...props }, ref) => {
    const { t } = useTranslation('bottom-sheet')

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center pt-4 pb-2',
          'touch-none select-none',
          className,
        )}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {/* Visual handle indicator */}
        <div
          className={cn(
            'h-1.5 w-12 rounded-full bg-muted-foreground/30',
            'transition-colors duration-200',
            'group-hover:bg-muted-foreground/50',
            'active:bg-muted-foreground/70',
          )}
        />
        {/* Optional hint text */}
        {showHint && (
          <span className="mt-2 text-xs text-muted-foreground">{hint ?? t('dragHint')}</span>
        )}
      </div>
    )
  },
)
BottomSheetHandle.displayName = 'BottomSheetHandle'

// ============================================================================
// BottomSheet Content
// ============================================================================

interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  /** Show the handle indicator */
  showHandle?: boolean
  /** Show drag hint text */
  showHandleHint?: boolean
  /** Custom handle hint text */
  handleHint?: string
  /** Padding variant */
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  BottomSheetContentProps
>(
  (
    {
      className,
      children,
      showHandle = true,
      showHandleHint = false,
      handleHint,
      padding = 'default',
      ...props
    },
    ref,
  ) => {
    const { isRTL, snapPoints } = useBottomSheetContext()
    const hasSnapPoints = snapPoints && snapPoints.length > 0

    const paddingClasses = {
      none: '',
      sm: 'px-3 pb-3',
      default: 'px-4 pb-4 sm:px-6 sm:pb-6',
      lg: 'px-6 pb-6 sm:px-8 sm:pb-8',
    }

    return (
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <DrawerPrimitive.Content
          ref={ref}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={cn(
            // Base styles
            'group fixed inset-x-0 bottom-0 z-50',
            'flex flex-col',
            'bg-background',
            'border-t border-border',
            // Rounded corners
            'rounded-t-2xl sm:rounded-t-3xl',
            // Shadow for depth
            'shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
            // Height constraints
            hasSnapPoints ? 'h-full' : 'max-h-[96vh]',
            // Safe area padding for iOS
            'pb-safe',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'duration-300 ease-out',
            className,
          )}
          {...props}
        >
          {/* Handle */}
          {showHandle && <BottomSheetHandle showHint={showHandleHint} hint={handleHint} />}
          {/* Content container with keyboard avoidance */}
          <div
            className={cn(
              'flex-1 overflow-y-auto overscroll-contain',
              // Smooth scrolling
              'scroll-smooth',
              // Hide scrollbar on mobile
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
              paddingClasses[padding],
            )}
            // Prevent body scroll when scrolling inside
            onTouchMove={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </DrawerPrimitive.Content>
      </BottomSheetPortal>
    )
  },
)
BottomSheetContent.displayName = 'BottomSheetContent'

// ============================================================================
// BottomSheet Header
// ============================================================================

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isRTL } = useBottomSheetContext()

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn('grid gap-1.5 px-4 sm:px-6', 'text-center sm:text-start', className)}
      {...props}
    />
  )
}
BottomSheetHeader.displayName = 'BottomSheetHeader'

// ============================================================================
// BottomSheet Footer
// ============================================================================

interface BottomSheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stick to bottom when content is shorter */
  sticky?: boolean
}

const BottomSheetFooter = ({ className, sticky = true, ...props }: BottomSheetFooterProps) => {
  const { isRTL } = useBottomSheetContext()

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'flex flex-col gap-2 px-4 sm:px-6 py-4',
        'border-t border-border bg-background',
        // Sticky footer
        sticky && 'mt-auto sticky bottom-0',
        // Safe area for iOS home indicator
        'pb-safe',
        className,
      )}
      {...props}
    />
  )
}
BottomSheetFooter.displayName = 'BottomSheetFooter'

// ============================================================================
// BottomSheet Title
// ============================================================================

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = 'BottomSheetTitle'

// ============================================================================
// BottomSheet Description
// ============================================================================

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
BottomSheetDescription.displayName = 'BottomSheetDescription'

// ============================================================================
// BottomSheet Body (convenience component for form content)
// ============================================================================

const BottomSheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isRTL } = useBottomSheetContext()

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn('flex-1 py-4 space-y-4', className)}
      {...props}
    />
  )
}
BottomSheetBody.displayName = 'BottomSheetBody'

// ============================================================================
// Exports
// ============================================================================

export {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  useBottomSheetContext,
}
