import { useTranslation } from 'react-i18next'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import type { NavigationGroup } from './navigation-config'
import { useDirection } from '@/hooks/useDirection'

interface NavMainProps {
  groups: NavigationGroup[]
}

export function NavMain({ groups }: NavMainProps): React.ReactElement {
  const { t } = useTranslation('common')
  const { isRTL } = useDirection()
  const location = useLocation()
  const pathname = location.pathname

  return (
    <>
      {groups.map((group) => {
        // Collapsible groups (e.g., Administration)
        if (group.collapsible === true) {
          return (
            <Collapsible
              key={group.id}
              defaultOpen={group.defaultOpen ?? false}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md">
                    <span>{t(group.label, group.label)}</span>
                    <ChevronRight
                      className={`ms-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${isRTL ? 'rotate-180 group-data-[state=open]/collapsible:rotate-90' : ''}`}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive =
                        pathname === item.path || pathname.startsWith(item.path + '/')
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={t(item.label, item.label)}
                          >
                            <Link to={item.path as string}>
                              <Icon className="size-4" />
                              <span>{t(item.label, item.label)}</span>
                            </Link>
                          </SidebarMenuButton>
                          {item.badgeCount != null && item.badgeCount > 0 && (
                            <SidebarMenuBadge>
                              {item.badgeCount > 99 ? '99+' : item.badgeCount}
                            </SidebarMenuBadge>
                          )}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        }

        // Non-collapsible groups (Operations, Dossiers)
        const primaryItems = group.items.filter((item) => item.secondary !== true)
        const secondaryItems = group.items.filter((item) => item.secondary === true)

        return (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{t(group.label, group.label)}</SidebarGroupLabel>
            <SidebarMenu>
              {primaryItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.path || pathname.startsWith(item.path + '/')
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t(item.label, item.label)}
                    >
                      <Link to={item.path as string}>
                        <Icon className="size-4" />
                        <span>{t(item.label, item.label)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badgeCount != null && item.badgeCount > 0 && (
                      <SidebarMenuBadge>
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}

              {/* Secondary items with muted sub-item styling */}
              {secondaryItems.length > 0 && (
                <>
                  <SidebarSeparator className="my-1" />
                  <SidebarMenuSub>
                    {secondaryItems.map((item) => {
                      const Icon = item.icon
                      const isActive =
                        pathname === item.path || pathname.startsWith(item.path + '/')
                      return (
                        <SidebarMenuSubItem key={item.id}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link to={item.path as string}>
                              <Icon className="size-3.5" />
                              <span>{t(item.label, item.label)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
