/**
 * Topbar.tsx — Phase 36 SHELL-02 implementation.
 *
 * 56px horizontal row with 7 slots in LTR JSX order (forceRTL via `<html dir>`
 * flips the visual row at render time — see CLAUDE.md RTL rule 1):
 *
 *   1. Hamburger         (.tb-menu) — hidden ≥1024px via `lg:hidden`
 *   2. Search pill       (.tb-search) — includes inner ⌘K kbd hint (hidden ≤1024px)
 *   3. Direction switch  (.tb-dir) — segmented radio group, 4 buttons
 *   4. Notification bell (.tb-icon-btn) — Phase-42 will wire real count; here hardcoded
 *   5. Theme toggle      (.tb-icon-btn) — Sun/Moon swap driven by useMode()
 *   6. Locale switcher   (.tb-locale) — segmented radio group, EN/ع
 *   7. Tweaks button     (.tb-tweaks) — opens the Phase-34 drawer via useTweaksOpen()
 *
 * Responsive contract (UI-SPEC §"Responsive Contracts", lines 383-395):
 *   - Hamburger: `lg:hidden`     — visible ≤1024px, hidden above
 *   - ⌘K hint:  `hidden lg:inline` — hidden ≤1024px (Pitfall 4 mitigation)
 *   - Tweaks label text: `max-sm:hidden` — collapses to icon-only ≤640px
 *   - Topbar:   `max-sm:flex-wrap` + search `max-sm:order-10 max-sm:basis-full`
 *     so search wraps to a second row on phones
 *
 * RTL contract (CLAUDE.md rule 1 + rule 2):
 *   - Inline-end cluster uses `ms-auto` (logical margin-inline-start)
 *   - Notification badge uses `end-0.5` (logical inset)
 *   - `<kbd dir="ltr">` isolates the ⌘K glyph inside Arabic topbar so it reads
 *     per Pitfall 6 in LTR order
 *
 * Deviation from 36-03 PLAN interfaces (Rule 3 — plan hook names are stale):
 *   - Plan referenced `useDirection` → actual hook is `useDesignDirection`
 *     (Phase 33 renamed to avoid collision with the DOM-level `@/hooks/useDirection`
 *     which reads document.dir — Comment in useDesignDirection.ts confirms).
 */

import type { JSX } from 'react'
import { Menu, Search, Bell, Sun, Moon, Sliders } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { useTweaksOpen } from '@/components/tweaks'
import { useDesignDirection, useMode, useLocale } from '@/design-system/hooks'
import type { Direction } from '@/design-system/tokens/types'

export interface TopbarProps {
  onOpenDrawer: () => void
}

const DIRECTIONS: readonly Direction[] = ['chancery', 'situation', 'ministerial', 'bureau'] as const
const DIRECTION_SHORT_LABELS: Record<Direction, { en: string; ar: string }> = {
  chancery: { en: 'C', ar: 'د' },
  situation: { en: 'S', ar: 'ع' },
  ministerial: { en: 'M', ar: 'و' },
  bureau: { en: 'B', ar: 'م' },
}

// Phase-42 will swap this for a real notification feed; design-handoff stub.
const NOTIFICATION_COUNT = 3

export function Topbar({ onOpenDrawer }: TopbarProps): JSX.Element {
  const { t } = useTranslation()
  const { direction, setDirection } = useDesignDirection()
  const { mode, setMode } = useMode()
  const { locale, setLocale } = useLocale()
  const { open: openTweaks } = useTweaksOpen()

  return (
    <header
      className={cn(
        'topbar tb flex items-center gap-3.5 h-14 min-h-14 py-2.5 px-5',
        'border-b border-[var(--line)] bg-[var(--surface)]',
        'sm:max-md:h-14',
        'max-sm:min-h-[52px] max-sm:h-auto max-sm:flex-wrap max-sm:py-2 max-sm:px-3 max-sm:gap-2',
      )}
    >
      {/* 1 — Hamburger (mobile only; hidden ≥1024px per Pitfall 4) */}
      <button
        type="button"
        className={cn(
          'tb-menu lg:hidden',
          'min-h-11 min-w-11 inline-flex items-center justify-center',
          'rounded-[var(--radius-sm)] text-[var(--ink-mute)]',
          'hover:bg-[var(--line-soft)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        )}
        onClick={onOpenDrawer}
        aria-label={t('shell.menu.open')}
      >
        <Menu size={18} />
      </button>

      {/* 2 — Search pill (with inner ⌘K hint) */}
      <div
        className={cn(
          'tb-search flex-1 max-w-[520px] h-9 flex items-center gap-2 px-2.5',
          'rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg)]',
          'focus-within:border-[var(--accent)] focus-within:bg-[var(--surface)]',
          'max-sm:order-10 max-sm:basis-full',
        )}
      >
        <Search size={16} className="text-[var(--ink-mute)] shrink-0" />
        <input
          id="topbar-search"
          name="topbar-search"
          type="search"
          className={cn(
            'tb-search-input flex-1 bg-transparent outline-none',
            'font-body text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-mute)]',
            'max-sm:text-[14px]',
          )}
          placeholder={t('shell.search.placeholder')}
          aria-label={t('shell.search.placeholder')}
        />
        <kbd
          dir="ltr"
          className="tb-kbd hidden lg:inline font-mono text-[10px] text-[var(--ink-faint)]"
        >
          {t('shell.search.kbd')}
        </kbd>
      </div>

      {/* Right cluster — `ms-auto` pushes it to the inline-end */}
      <div className="tb-right ms-auto flex items-center gap-2 max-sm:gap-1">
        {/* 3 — Direction switcher */}
        <div
          className="tb-dir inline-flex overflow-hidden border border-[var(--line)] rounded-[var(--radius-sm)]"
          role="radiogroup"
          aria-label={t('shell.direction.chancery')}
        >
          {DIRECTIONS.map((d) => {
            const isActive = direction === d
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setDirection(d)}
                className={cn(
                  'tb-dir-btn h-9 px-2.5 font-body text-[11.5px] font-medium',
                  'text-[var(--ink-mute)] hover:text-[var(--ink)]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                  'max-sm:w-8 max-sm:px-0 max-sm:text-[10.5px]',
                  isActive && 'active',
                  isActive && d === 'situation' && 'bg-[var(--accent)] text-[var(--accent-fg)]',
                  isActive && d !== 'situation' && 'bg-[var(--ink)] text-[var(--surface)]',
                )}
                aria-label={t(`shell.direction.${d}`)}
              >
                <span className="tb-dir-label max-sm:hidden">{t(`shell.direction.${d}`)}</span>
                <span className="tb-dir-short hidden max-sm:inline" aria-hidden="true">
                  {DIRECTION_SHORT_LABELS[d][locale]}
                </span>
              </button>
            )
          })}
        </div>

        {/* 4 — Notification bell (trigger only; dropdown lands in Phase 42) */}
        <button
          type="button"
          className={cn(
            'tb-icon-btn relative h-9 w-9 inline-flex items-center justify-center p-1.5',
            'rounded-[var(--radius-sm)] text-[var(--ink-mute)]',
            'hover:bg-[var(--line-soft)] hover:text-[var(--ink)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          )}
          aria-label={t('shell.notifications.open')}
        >
          <Bell size={16} />
          {NOTIFICATION_COUNT > 0 && (
            <span
              className={cn(
                'tb-badge absolute top-0.5 end-0.5 min-w-[14px] h-[14px] px-1',
                'rounded-full bg-[var(--danger)] text-white',
                'font-mono text-[9px] font-semibold leading-none',
                'inline-flex items-center justify-center',
              )}
              aria-label={t('shell.notifications.count', { count: NOTIFICATION_COUNT })}
            >
              {NOTIFICATION_COUNT}
            </span>
          )}
        </button>

        {/* 5 — Theme toggle */}
        <button
          type="button"
          className={cn(
            'tb-icon-btn h-9 w-9 inline-flex items-center justify-center p-1.5',
            'rounded-[var(--radius-sm)] text-[var(--ink-mute)]',
            'hover:bg-[var(--line-soft)] hover:text-[var(--ink)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          )}
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          aria-label={t('shell.theme.toggle')}
          aria-pressed={mode === 'dark'}
        >
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* 6 — Locale switcher */}
        <div
          className="tb-locale inline-flex overflow-hidden border border-[var(--line)] rounded-[var(--radius-sm)]"
          role="radiogroup"
          aria-label="Locale"
        >
          <button
            type="button"
            role="radio"
            aria-checked={locale === 'en'}
            onClick={() => setLocale('en')}
            lang="en"
            data-lang="en"
            className={cn(
              'tb-locale-btn h-9 px-2 font-mono text-[11.5px] text-[var(--ink-mute)] hover:text-[var(--ink)]',
              locale === 'en' && 'active bg-[var(--ink)] text-[var(--surface)]',
            )}
          >
            EN
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={locale === 'ar'}
            onClick={() => setLocale('ar')}
            lang="ar"
            data-lang="ar"
            className={cn(
              'tb-locale-btn h-9 px-2 font-body text-[14px] text-[var(--ink-mute)] hover:text-[var(--ink)]',
              locale === 'ar' && 'active bg-[var(--ink)] text-[var(--surface)]',
            )}
          >
            ع
          </button>
        </div>

        {/* 7 — Tweaks button (Phase-34 API re-hosted here) */}
        <button
          type="button"
          className={cn(
            'tb-tweaks h-9 inline-flex items-center gap-1.5 px-3 py-1.5',
            'rounded-[var(--radius-sm)] border border-[var(--line)]',
            'font-body text-[12px] text-[var(--ink-mute)]',
            'hover:bg-[var(--line-soft)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          )}
          onClick={openTweaks}
          aria-label={t('shell.tweaks')}
        >
          <Sliders size={14} />
          <span className="tb-tweaks-label max-sm:hidden">{t('shell.tweaks')}</span>
        </button>
      </div>
    </header>
  )
}
