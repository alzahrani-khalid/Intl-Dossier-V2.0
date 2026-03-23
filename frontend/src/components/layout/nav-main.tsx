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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import type { NavigationSection } from './navigation-config'

interface NavMainProps {
  sections: NavigationSection[]
}

export function NavMain({ sections }: NavMainProps) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'
  const location = useLocation()
  const pathname = location.pathname

  return (
    <>
      {sections.map((section) => {
        // Admin section is collapsible
        if (section.id === 'admin') {
          return (
            <Collapsible key={section.id} defaultOpen={false} className="group/collapsible">
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md">
                    <span>{t(section.label, section.label)}</span>
                    <ChevronRight
                      className={`ms-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${isRTL ? 'rotate-180 group-data-[state=open]/collapsible:rotate-90' : ''}`}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.path
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link to={item.path as string}>
                                <Icon className="size-4" />
                                <span>{t(item.label, item.label)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        }

        return (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel>{t(section.label, section.label)}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
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
          </SidebarGroup>
        )
      })}
    </>
  )
}
