import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type LucideIcon,
  Activity,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleUser,
  ClipboardList,
  Clock,
  Database,
  Download,
  FileText,
  Folder,
  Globe2,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PenTool,
  Plus,
  ScrollText,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useResponsive } from '@/hooks/use-responsive'

type NavSubItem = {
  id: string
  label: string
}

type NavSectionItem = {
  id: string
  label: string
  icon: LucideIcon
  count?: number
  status?: 'beta' | 'new'
  subItems?: NavSubItem[]
}

type NavFooterGroup = {
  id: string
  label: string
  items: NavSectionItem[]
}

type NavSection = {
  id: string
  icon: LucideIcon
  label: string
  headline: string
  description: string
  actionLabel: string
  badge?: string
  items: NavSectionItem[]
  footerGroups?: NavFooterGroup[]
}

export function DossierSidebar() {
  const { t, i18n } = useTranslation()
  const direction = i18n.dir()
  const isRTL = direction === 'rtl'

  const navSections = useMemo<NavSection[]>(
    () => [
      {
        id: 'my-work',
        icon: CheckSquare,
        label: t('navigation.myWork', 'My Work'),
        headline: t('navigation.myWork', 'My Work'),
        description: t(
          'prototype.sidebar.myWorkDescription',
          'Stay on top of your priority queues and missions.'
        ),
        actionLabel: t('prototype.sidebar.myWorkAction', 'View assignments'),
        badge: '3',
        items: [
          {
            id: 'my-assignments',
            label: t('navigation.myAssignments', 'My Assignments'),
            icon: CheckSquare,
            count: 12,
          },
          {
            id: 'intake-queue',
            label: t('navigation.intakeQueue', 'Intake Queue'),
            icon: Inbox,
            count: 5,
          },
          {
            id: 'waiting-queue',
            label: t('navigation.waitingQueue', 'Waiting Queue'),
            icon: Clock,
            count: 2,
          },
        ],
      },
      {
        id: 'main',
        icon: LayoutDashboard,
        label: t('navigation.mainWork', 'Main'),
        headline: t('navigation.mainWork', 'Main Workstreams'),
        description: t(
          'prototype.sidebar.mainDescription',
          'Jump into the core collaboration surfaces for dossiers and engagements.'
        ),
        actionLabel: t('prototype.sidebar.mainAction', 'Create dossier'),
        items: [
          {
            id: 'dashboard',
            label: t('navigation.dashboard', 'Dashboard'),
            icon: LayoutDashboard,
          },
          {
            id: 'approvals',
            label: t('navigation.approvals', 'Approvals'),
            icon: CheckSquare,
            count: 4,
          },
          {
            id: 'dossiers',
            label: t('navigation.dossiers', 'Dossiers'),
            icon: Folder,
          },
          {
            id: 'engagements',
            label: t('navigation.engagements', 'Engagements'),
            icon: Briefcase,
          },
          {
            id: 'positions',
            label: t('navigation.positions', 'Positions'),
            icon: MessageSquare,
          },
          {
            id: 'after-actions',
            label: t('navigation.afterActions', 'After Actions'),
            icon: ClipboardList,
          },
        ],
      },
      {
        id: 'browse',
        icon: Globe2,
        label: t('navigation.browse', 'Browse'),
        headline: t('navigation.browse', 'Browse Entities'),
        description: t(
          'prototype.sidebar.browseDescription',
          'Explore country portfolios, partner organizations, and formal agreements.'
        ),
        actionLabel: t('prototype.sidebar.browseAction', 'Add entity'),
        items: [
          {
            id: 'countries',
            label: t('navigation.countries', 'Countries'),
            icon: Globe2,
            count: 64,
          },
          {
            id: 'organizations',
            label: t('navigation.organizations', 'Organizations'),
            icon: Building2,
            count: 28,
          },
          {
            id: 'forums',
            label: t('navigation.forums', 'Forums'),
            icon: Users,
            count: 11,
          },
          {
            id: 'mous',
            label: t('navigation.mous', 'MoUs'),
            icon: FileText,
            count: 37,
          },
        ],
      },
      {
        id: 'tools',
        icon: BarChart3,
        label: t('navigation.tools', 'Tools'),
        headline: t('navigation.reports', 'Reports'),
        description: t(
          'prototype.sidebar.toolsDescription',
          'Dive into analytics, intelligence, and operational reporting.'
        ),
        actionLabel: t('prototype.sidebar.toolsAction', 'Create report'),
        badge: '23',
        items: [
          {
            id: 'calendar',
            label: t('navigation.calendar', 'Calendar'),
            icon: CalendarDays,
          },
          {
            id: 'briefs',
            label: t('navigation.briefs', 'Briefs'),
            icon: ScrollText,
          },
          {
            id: 'intelligence',
            label: t('navigation.intelligence', 'Intelligence'),
            icon: Brain,
            status: 'beta',
          },
          {
            id: 'analytics',
            label: t('navigation.analytics', 'Analytics'),
            icon: TrendingUp,
          },
          {
            id: 'reports',
            label: t('navigation.reports', 'Reports'),
            icon: BarChart3,
            count: 23,
            subItems: [
              {
                id: 'executive-dashboards',
                label: t('prototype.sidebar.executiveDashboards', 'Executive dashboards'),
              },
              {
                id: 'export-center',
                label: t('prototype.sidebar.exportCenter', 'Export center'),
              },
            ],
          },
        ],
        footerGroups: [
          {
            id: 'documents',
            label: t('navigation.documents', 'Documents'),
            items: [
              {
                id: 'data-library',
                label: t('navigation.dataLibrary', 'Data Library'),
                icon: Database,
              },
              {
                id: 'word-assistant',
                label: t('navigation.wordAssistant', 'Word Assistant'),
                icon: PenTool,
              },
            ],
          },
          {
            id: 'admin',
            label: t('navigation.admin', 'Administration'),
            items: [
              {
                id: 'users',
                label: t('navigation.users', 'User Management'),
                icon: UserCog,
              },
              {
                id: 'monitoring',
                label: t('navigation.monitoring', 'Monitoring'),
                icon: Activity,
              },
              {
                id: 'export',
                label: t('navigation.export', 'Export'),
                icon: Download,
              },
            ],
          },
        ],
      },
    ],
    [t]
  )

  const fallbackSection = navSections[3] ?? navSections[0]
  const fallbackItem = fallbackSection?.items[0]

  const [activeSectionId, setActiveSectionId] = useState<string>(fallbackSection?.id ?? '')
  const [activeItemId, setActiveItemId] = useState<string>(fallbackItem?.id ?? '')
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({ reports: true })
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const responsive = useResponsive()
  const isCompact = responsive.isMobile || responsive.isTablet

  useEffect(() => {
    // Close the sheet when transitioning to desktop layout
    if (!isCompact && isSheetOpen) {
      setIsSheetOpen(false)
    }
  }, [isCompact, isSheetOpen])

  useEffect(() => {
    // Keep the active selections valid when translations or data change
    const sectionExists = navSections.some((section) => section.id === activeSectionId)
    if (!sectionExists) {
      setActiveSectionId(fallbackSection?.id ?? '')
      setActiveItemId(fallbackSection?.items[0]?.id ?? '')
      return
    }

    const current = navSections.find((section) => section.id === activeSectionId)
    if (!current) return

    const itemExists = current.items.some((item) => item.id === activeItemId)
    if (!itemExists) {
      setActiveItemId(current.items[0]?.id ?? '')
    }
  }, [navSections, activeSectionId, activeItemId, fallbackSection])

  const currentSection = useMemo<NavSection | undefined>(
    () => navSections.find((section) => section.id === activeSectionId) ?? fallbackSection,
    [navSections, activeSectionId, fallbackSection]
  )

  const handleSelectSection = (sectionId: string) => {
    setActiveSectionId(sectionId)
    const selected = navSections.find((section) => section.id === sectionId)
    if (selected) {
      setActiveItemId(selected.items[0]?.id ?? '')
    }
  }

  const handleToggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const renderSectionItems = (section: NavSection, variant: 'desktop' | 'compact') => {
    return section.items.map((item) => {
      const ItemIcon = item.icon
      const isActiveItem = activeItemId === item.id
      const isExpanded = !!expandedItems[item.id]
      const showDisclosure = Boolean(item.subItems?.length)

      if (variant === 'compact') {
        return (
          <div key={`${section.id}-${item.id}`} className="space-y-1">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'w-full justify-between rounded-2xl px-4 py-3 text-base font-semibold shadow-none',
                'transition-all duration-200 hover:bg-neutral-100 hover:shadow-[0_16px_28px_-24px_rgba(15,23,42,0.55)]',
                isActiveItem
                  ? 'bg-neutral-900 text-white shadow-[0_24px_40px_-30px_rgba(15,23,42,0.65)] hover:bg-neutral-900'
                  : 'bg-white/60 text-neutral-600'
              )}
              onClick={() => {
                if (showDisclosure) {
                  handleToggleItem(item.id)
                }
                setActiveItemId(item.id)
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-neutral-900/5 text-neutral-600 transition-colors duration-200',
                    isActiveItem && 'bg-white/10 text-white'
                  )}
                >
                  <ItemIcon className={cn('h-4 w-4', isActiveItem && 'text-white')} />
                </span>
                {item.label}
              </span>
              <span className="flex items-center gap-2">
                {item.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full border-neutral-300 text-[10px] uppercase tracking-wide',
                      isActiveItem && 'border-white/40 text-white'
                    )}
                  >
                    {item.status === 'beta' ? t('common.beta', 'Beta') : t('common.new', 'New')}
                  </Badge>
                )}
                {typeof item.count === 'number' && (
                  <Badge
                    className={cn(
                      'rounded-full bg-neutral-100 text-neutral-700 shadow-sm',
                      isActiveItem && 'bg-white/20 text-white'
                    )}
                  >
                    {item.count}
                  </Badge>
                )}
                {showDisclosure && (
                  isExpanded ? (
                    <ChevronDown className={cn('h-4 w-4', isActiveItem ? 'text-white' : 'text-neutral-400')} />
                  ) : (
                    <ChevronRight className={cn('h-4 w-4', isActiveItem ? 'text-white' : 'text-neutral-400')} />
                  )
                )}
              </span>
            </Button>

            {showDisclosure && isExpanded && (
              <div className={cn(isRTL ? 'pr-12' : 'pl-12')}>
                {item.subItems?.map((subItem) => {
                  const isSubActive = activeItemId === subItem.id
                  return (
                    <Button
                      key={subItem.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start rounded-xl px-3 py-2 text-sm font-medium text-neutral-600',
                        'transition-all duration-200 hover:bg-neutral-100',
                        isSubActive && 'bg-neutral-100 text-neutral-900'
                      )}
                      onClick={() => setActiveItemId(subItem.id)}
                    >
                      {subItem.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      }

      return (
        <div key={`${section.id}-${item.id}`} className="group relative">
          <button
            type="button"
            onClick={() => {
              if (showDisclosure) {
                handleToggleItem(item.id)
              }
              setActiveItemId(item.id)
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition-all duration-200',
              isActiveItem
                ? 'bg-neutral-950 text-white shadow-[0_28px_44px_-28px_rgba(15,23,42,0.7)]'
                : 'bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900 hover:shadow-[0_18px_30px_-26px_rgba(15,23,42,0.45)]'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-neutral-900/5 transition-colors duration-200 text-neutral-500',
                  isActiveItem && 'bg-white/10 border-white/15 text-white'
                )}
              >
                <ItemIcon className={cn('h-4 w-4', isActiveItem ? 'text-white' : 'text-neutral-500')} />
              </span>
              <span className="flex flex-col">
                <span className="text-[15px] font-medium leading-snug">{item.label}</span>
                {showDisclosure && (
                  <span className="text-xs text-neutral-400">
                    {t('prototype.sidebar.expandLabel', 'View details')}
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.status && (
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-full border-neutral-300 text-[10px] uppercase tracking-wide',
                    isActiveItem && 'border-white/30 text-white'
                  )}
                >
                  {item.status === 'beta' ? t('common.beta', 'Beta') : t('common.new', 'New')}
                </Badge>
              )}
              {typeof item.count === 'number' && (
                <Badge
                  className={cn(
                    'h-6 min-w-[1.75rem] rounded-full px-2 text-xs font-semibold backdrop-blur',
                    isActiveItem ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {item.count}
                </Badge>
              )}
              {showDisclosure && (
                isExpanded ? (
                  <ChevronDown className={cn('h-4 w-4', isActiveItem ? 'text-white' : 'text-neutral-400')} />
                ) : (
                  <ChevronRight className={cn('h-4 w-4', isActiveItem ? 'text-white' : 'text-neutral-400')} />
                )
              )}
            </div>
          </button>

          {showDisclosure && isExpanded && (
            <div className={cn('mt-2 space-y-1', isRTL ? 'pr-14' : 'pl-14')}>
              {item.subItems?.map((subItem) => {
                const isSubActive = activeItemId === subItem.id
                return (
                  <button
                    key={subItem.id}
                    type="button"
                    onClick={() => setActiveItemId(subItem.id)}
                    className={cn(
                      'relative w-full rounded-xl px-3 py-2 text-sm transition-all duration-200',
                      isSubActive
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'
                    )}
                  >
                    {isSubActive && (
                      <span
                        className={cn(
                          'absolute h-4 w-[3px] -translate-y-1/2 rounded-full bg-neutral-900',
                          isRTL ? 'right-2 top-1/2' : 'left-2 top-1/2'
                        )}
                      />
                    )}
                    <span className={cn(isRTL ? 'mr-3' : 'ml-3')}>{subItem.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile & tablet: Kibo UI responsive sheet pattern */}
      <div dir={direction} className="lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-[28px] border border-white/60 bg-white/80 px-4 py-4 shadow-[0_24px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {t('dossier.reports.title', 'Reports')}
            </p>
            <p className="truncate text-base font-semibold text-neutral-900">
              {currentSection?.headline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentSection?.badge && (
              <Badge className="rounded-full border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {currentSection.badge}
              </Badge>
            )}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 rounded-2xl border border-neutral-200/70 bg-white shadow-sm"
                  aria-label={t('prototype.sidebar.openNavigation', 'Open dossier navigation')}
                >
                  <Menu className="h-5 w-5 text-neutral-700" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isRTL ? 'right' : 'left'}
                className="w-[320px] sm:w-[360px]"
                dir={direction}
              >
                <SheetHeader className="text-start">
                  <SheetTitle className="text-lg font-semibold text-neutral-900">
                    {t('prototype.sidebar.navigationTitle', 'Workspace navigation')}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-neutral-500">
                    {t(
                      'prototype.sidebar.navigationDescription',
                      'Switch between workstreams, browse entities, and access tooling.'
                    )}
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className={cn('mt-6 h-[calc(100vh-160px)]', isRTL ? 'pl-2' : 'pr-2')}>
                  <div className="space-y-8 pb-24">
                    {navSections.map((section) => (
                      <div key={section.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleSelectSection(section.id)}
                            className={cn(
                              'flex items-center gap-3 text-left text-sm font-semibold text-neutral-500',
                              activeSectionId === section.id && 'text-neutral-900'
                            )}
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-700">
                              <section.icon className="h-4 w-4" />
                            </span>
                            <span>{section.label}</span>
                          </button>
                          {section.badge && (
                            <Badge className="rounded-full bg-neutral-100 text-xs text-neutral-600">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-3">
                          {renderSectionItems(section, 'compact')}
                        </div>
                        {section.footerGroups?.map((group) => (
                          <div key={group.id} className="space-y-3">
                            <Separator className="bg-neutral-200/80" />
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              {group.label}
                            </p>
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <Button
                                  key={item.id}
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-between rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                                  onClick={() => setActiveItemId(item.id)}
                                >
                                  <span className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200/70">
                                      <item.icon className="h-4 w-4 text-neutral-600" />
                                    </span>
                                    {item.label}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-neutral-300" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop: detailed glass navigation inspired by Kibo UI rail pattern */}
      <aside
        dir={direction}
        className={cn(
          'relative hidden h-full min-h-[640px] lg:flex',
          isRTL ? 'flex-row-reverse' : 'flex-row'
        )}
        role="complementary"
        aria-label={t('dossier.reports.title', 'Reports')}
      >
        <div
          className={cn(
            'flex w-[92px] flex-col items-center justify-between bg-neutral-950 px-3 py-6',
            'shadow-[0_30px_65px_-40px_rgba(0,0,0,0.65)]',
            isRTL ? 'rounded-r-[32px]' : 'rounded-l-[32px]'
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-lg">
              <span className="text-lg font-semibold">G</span>
            </div>

            <nav className="mt-2 flex flex-col items-center gap-3">
              {navSections.map((section) => {
                const SectionIcon = section.icon
                const isActive = section.id === currentSection?.id
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleSelectSection(section.id)}
                        className={cn(
                          'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                          'text-neutral-400 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white',
                          isActive && 'bg-white text-neutral-950 shadow-[0_18px_40px_-24px_rgba(255,255,255,0.8)]'
                        )}
                      >
                        {isActive && (
                          <span
                            className={cn(
                              'absolute top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-white',
                              isRTL ? '-right-3' : '-left-3'
                            )}
                          />
                        )}
                        <SectionIcon className={cn('h-5 w-5', isActive && 'text-neutral-900')} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? 'left' : 'right'} className="font-medium">
                      {section.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-all duration-200 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'} className="font-medium">
                {t('common.notifications', 'Notifications')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-all duration-200 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white"
                >
                  <CircleUser className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'} className="font-medium">
                {t('common.profile', 'Profile')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div
          className={cn(
            'flex w-[404px] flex-col border-white/30 bg-white/90 px-7 py-8 backdrop-blur-xl',
            isRTL ? 'border-r' : 'border-l'
          )}
        >
          {currentSection && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[1.7rem] font-semibold leading-tight text-neutral-900">
                      {currentSection.headline}
                    </h2>
                    {currentSection.badge && (
                      <Badge className="rounded-full border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        {currentSection.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 max-w-[260px] text-sm leading-6 text-neutral-500">
                    {currentSection.description}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full border border-neutral-200/70 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-100"
                      aria-label={currentSection.actionLabel}
                    >
                      <Plus className="h-4 w-4 text-neutral-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={isRTL ? 'right' : 'left'} className="font-medium">
                    {currentSection.actionLabel}
                  </TooltipContent>
                </Tooltip>
              </div>

              <nav className="mt-6 space-y-2 pb-16">
                {renderSectionItems(currentSection, 'desktop')}
              </nav>

              {currentSection.footerGroups?.map((group, index) => (
                <div key={group.id} className={cn('mt-8', index === 0 && 'pt-2')}>
                  <Separator className="mb-3 bg-neutral-200/80" />
                  <span className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {group.label}
                  </span>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveItemId(item.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200',
                          activeItemId === item.id
                            ? 'bg-neutral-100 text-neutral-900 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]'
                            : 'bg-white/60 text-neutral-500 hover:bg-white hover:text-neutral-800'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200/70 text-neutral-600">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-neutral-300" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
