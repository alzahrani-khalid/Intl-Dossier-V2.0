import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@radix-ui/react-icons'

/**
 * Checkbox with 48x48dp touch target
 *
 * The visual checkbox remains 18x18px for aesthetics,
 * but the touch target expands to 48px minimum for
 * better mobile accessibility.
 *
 * - Visual size: 18x18px (h-4.5 w-4.5)
 * - Touch target: 48x48px (min-h-12 min-w-12)
 */

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Show visual hit area indicator on long-press */
  showHitArea?: boolean
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, showHitArea = false, ...props }, ref) => {
    const [isLongPress, setIsLongPress] = React.useState(false)
    const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleTouchStart = React.useCallback(() => {
      if (!showHitArea) return
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true)
      }, 500)
    }, [showHitArea])

    const handleTouchEnd = React.useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (isLongPress) {
        setTimeout(() => setIsLongPress(false), 300)
      }
    }, [isLongPress])

    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
      }
    }, [])

    return (
      <span
        className={cn(
          'relative inline-flex items-center justify-center',
          'min-h-12 min-w-12', // 48px touch target
          'touch-manipulation',
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Hit area indicator */}
        {showHitArea && (
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed transition-opacity duration-200',
              'border-primary/40 bg-primary/5',
              isLongPress ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden="true"
          />
        )}
        <CheckboxPrimitive.Root
          ref={ref}
          className={cn(
            'peer h-5 w-5 shrink-0 rounded-sm border border-primary shadow',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
            className,
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            className={cn('flex items-center justify-center text-current')}
          >
            <CheckIcon className="h-4 w-4" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
      </span>
    )
  },
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
