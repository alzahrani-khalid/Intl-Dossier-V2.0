import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Settings2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from '@/components/ui/sidebar'
import { NotificationPanel } from '@/components/notifications'
import { useTweaksOpen } from '@/components/tweaks'
import { HeaderSearch } from './header/Search'
import { UserMenu } from './header/UserMenu'
import { useDirection } from '@/hooks/useDirection'

export function SiteHeader() {
  const { isRTL, direction } = useDirection()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const { t } = useTranslation('common')
  const { isOpen: isTweaksOpen, toggle: toggleTweaks } = useTweaksOpen()

  const isExpanded = isMobile ? openMobile : open
  const ToggleIcon = isRTL
    ? isExpanded
      ? PanelRightCloseIcon
      : PanelRightOpenIcon
    : isExpanded
      ? PanelLeftCloseIcon
      : PanelLeftOpenIcon
  const toggleLabel = isExpanded ? 'Collapse sidebar' : 'Expand sidebar'

  return (
    <header
      dir={direction}
      className="bg-background/40 sticky top-0 z-50 flex h-14 sm:h-[var(--header-height)] w-full shrink-0 items-center gap-2 border-b backdrop-blur-md md:rounded-ss-xl md:rounded-se-xl"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        {/* Sidebar trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 border border-border/60 bg-background/70 text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
              onClick={toggleSidebar}
              aria-label={toggleLabel}
              aria-expanded={isExpanded}
            >
              <ToggleIcon className="size-4" />
              <span className="sr-only">{toggleLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'} sideOffset={8}>
            <p className="text-xs">{toggleLabel}</p>
            <p className="text-[10px] text-muted-foreground">Ctrl/Cmd + B</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Search */}
        <HeaderSearch />

        {/* Spacer */}
        <div className="ms-auto flex items-center gap-1">
          {/* Notification panel */}
          <NotificationPanel className="size-8" />

          {/* Tweaks drawer trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 min-h-11 min-w-11 text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                onClick={toggleTweaks}
                aria-label={t('tweaks.open')}
                aria-expanded={isTweaksOpen}
              >
                <Settings2 className="size-5" />
                <span className="sr-only">{t('tweaks.open')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} sideOffset={8}>
              <p className="text-xs">{t('tweaks.open')}</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-2 hidden h-4 md:block" />

          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
