import { useResponsive } from '@/hooks/use-responsive'
import { useDirection } from '@/hooks/use-theme'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ResponsiveCard } from '@/components/responsive/responsive-card'
import { Button } from '@/components/ui/button'

interface TemplateComponentProps {
  title: string
  description?: string
  className?: string
  showOnMobile?: boolean
  mobileLayout?: 'stack' | 'inline'
}

/**
 * Template Component - Mobile-first, RTL-compatible
 * 
 * This is a template showing best practices for Kibo UI components.
 * Copy and modify for your needs.
 * 
 * @example
 * <TemplateComponent title="My Component" />
 */
export function TemplateComponent({
  title,
  description,
  className,
  showOnMobile = true,
  mobileLayout = 'stack'
}: TemplateComponentProps) {
  // ✅ Required hooks for mobile-first + RTL
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { isRTL } = useDirection()
  const { t } = useTranslation()
  
  // ✅ Hide on mobile if requested
  if (isMobile && !showOnMobile) {
    return null
  }
  
  return (
    <ResponsiveCard
      title={title}
      description={description}
      collapsible={isMobile}
      mobileLayout={mobileLayout}
      className={className}
    >
      <div className={cn(
        // ✅ Mobile-first Tailwind classes
        'flex flex-col gap-2 p-3',      // Base (mobile)
        'sm:flex-row sm:gap-4 sm:p-4',  // Tablet
        'md:gap-6 md:p-6'                // Desktop
      )}>
        {/* ✅ Progressive disclosure */}
        <div className="flex-1 space-y-2">
          {/* Always show essential content */}
          <p className={cn(
            'text-sm',         // Mobile
            'sm:text-base',    // Tablet
            'md:text-lg'       // Desktop
          )}>
            {t('content.essential')}
          </p>
          
          {/* Show more on tablet+ */}
          {!isMobile && (
            <p className="text-sm text-muted-foreground">
              {t('content.additional')}
            </p>
          )}
          
          {/* Show even more on desktop+ */}
          {isDesktop && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('content.detailed')}
              </p>
            </div>
          )}
        </div>
        
        {/* ✅ Touch-friendly button */}
        <Button
          className={cn(
            'min-h-[44px] min-w-[44px]',    // Mobile (44px touch target)
            'sm:min-h-[40px] sm:min-w-[40px]', // Desktop (can be smaller)
            isMobile && 'w-full'             // Full width on mobile
          )}
        >
          {t('actions.submit')}
        </Button>
      </div>
    </ResponsiveCard>
  )
}
