/**
 * Sidebar — Phase 36 SHELL-01 / SHELL-05.
 *
 * 256px sidebar composing brand mark + app name + workspace + user card +
 * 3 nav sections (Operations / Dossiers / Administration) + footer, with a
 * 2px accent bar on the active nav item anchored at `inset-inline-start:0`
 * so LTR and RTL both land the indicator on the reading start edge.
 *
 * Consumes `createNavigationGroups(counts, isAdmin)` from navigation-config.ts
 * (D-03: discriminator + admin gate preserved, audit verdict Case A).
 *
 * Security: T-36-06 mitigation — the `administration` group is rendered only
 * when `useAuthStore().user?.role === 'admin'`. Defense-in-depth over the
 * backend RLS + route `beforeLoad` auth guards.
 *
 * RTL: CLAUDE.md mandate — only logical Tailwind properties
 * (`ps-*` / `pe-*` / `ms-*` / `me-*` / `start-*` / `end-*` / `text-start`).
 * The active-bar uses `before:start-0` so the accent stripe hugs the reading
 * start edge in both directions.
 *
 * i18n contract (keys resolved via `group.label` on NavigationGroup):
 *   - 'navigation.operations'     → Operations group header
 *   - 'navigation.dossiers'       → Dossiers group header
 *   - 'navigation.administration' → Administration group header (admin-only)
 *   - 'shell.appName' / 'shell.workspace' / 'shell.footer.sync' — brand & footer
 */

import type { ReactElement } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { GastatLogo } from '@/components/brand/GastatLogo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

import {
  createNavigationGroups,
  type NavigationGroup,
  type NavigationItem,
} from './navigation-config'

export interface SidebarProps {
  className?: string
}

const SECTION_BADGE_COUNTS = { tasks: 0, approvals: 0, engagements: 0 }

function getInitials(name: string | undefined, email: string | undefined): string {
  const source = (name ?? email ?? '').trim()
  if (source.length === 0) return '·'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function Sidebar({ className }: SidebarProps = {}): ReactElement {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const location = useLocation()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const groups: NavigationGroup[] = createNavigationGroups(SECTION_BADGE_COUNTS, isAdmin)
  const pathname = location.pathname

  const isRTL = i18n.language === 'ar'
  const localizedJobTitle = isRTL ? user?.jobTitleAr : user?.jobTitleEn
  const roleLabel = localizedJobTitle ?? user?.role ?? t('shell.user.noRole')
  const displayName = user?.name ?? user?.email ?? t('shell.user.noRole')
  const initials = getInitials(user?.name, user?.email)

  return (
    <aside
      role="navigation"
      aria-label={t('shell.menu.open')}
      className={cn(
        'sidebar sb flex h-full w-64 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)] pt-3.5 px-2.5 pb-2.5',
        className,
      )}
    >
      {/* 1. Brand row — GASTAT logo mark + app name + workspace */}
      <div className="sb-brand flex items-center gap-2.5 pb-3 border-b border-[color-mix(in_srgb,var(--sidebar-ink)_8%,transparent)]">
        <div
          role="img"
          aria-label={t('shell.brand.mark')}
          className="sb-mark flex h-7 w-7 items-center justify-center text-[var(--accent)]"
        >
          <GastatLogo size={22} />
        </div>
        <div className="sb-brand-text flex min-w-0 flex-col">
          <span className="sb-app font-display text-[15px] font-semibold leading-[1.2] tracking-[-0.01em] truncate">
            {t('shell.appName')}
          </span>
          <span className="sb-ws font-body text-[11px] leading-[1.3] truncate text-[var(--sidebar-ink)]/70">
            {t('shell.workspace')}
          </span>
        </div>
      </div>

      {/* 2. User card — avatar initials + name + role */}
      <div className="sb-user mt-3 flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sidebar-ink)_6%,transparent)] p-2">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] font-body text-[11px] font-semibold">
          {initials}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-body text-[13px] font-medium leading-[1.4] truncate">
            {displayName}
          </span>
          <span className="font-body text-[10.5px] leading-[1.3] truncate text-[var(--sidebar-ink)]/70">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* 3. Nav — iterate groups; admin gate via createNavigationGroups(isAdmin) */}
      <nav className="sb-nav mt-3.5 flex flex-1 flex-col gap-3.5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.id} className="sb-group-block flex flex-col gap-1">
            <div className="sb-group px-2.5 font-body text-[10px] font-semibold tracking-[0.1em] uppercase leading-[1.3] text-[var(--sidebar-ink)]/80">
              {t(group.label)}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.id} item={item} pathname={pathname} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* 4. Footer — synced/version line */}
      <div className="sb-foot mt-2.5 flex items-center gap-2 border-t border-[color-mix(in_srgb,var(--sidebar-ink)_8%,transparent)] px-2.5 pt-2.5">
        <span
          aria-hidden="true"
          className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--ok)]"
        />
        <span className="sb-foot-line font-mono text-[10.5px] leading-[1.3] text-[var(--sidebar-ink)]/70">
          {t('shell.footer.sync')}
        </span>
      </div>
    </aside>
  )
}

interface SidebarNavItemProps {
  item: NavigationItem
  pathname: string
}

function SidebarNavItem({ item, pathname }: SidebarNavItemProps): ReactElement {
  const { t } = useTranslation()
  const Icon = item.icon
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

  return (
    <li>
      <Link
        to={item.path}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'sb-item relative flex items-center gap-2 h-10 min-h-11 min-w-11 px-2.5 rounded-[var(--radius-sm)]',
          'font-body text-[13px] font-normal leading-[1.4] text-[var(--sidebar-ink)]/[.78]',
          'hover:bg-[color-mix(in_srgb,var(--sidebar-ink)_8%,transparent)] hover:opacity-100',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          isActive &&
            'active bg-[color-mix(in_srgb,var(--sidebar-ink)_10%,transparent)] font-medium opacity-100 before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-[2px] before:bg-[var(--accent)] before:content-[""]',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate text-start">{t(item.label)}</span>
        {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
          <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-semibold text-[var(--accent-fg)]">
            {item.badgeCount}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
