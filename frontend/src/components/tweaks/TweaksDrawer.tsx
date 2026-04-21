/**
 * TweaksDrawer — Phase 34 Plan 34-04 (THEME-01).
 *
 * Central UX surface for the Phase 33/34 design system. Renders six sections
 * in the UI-SPEC copywriting order (Direction, Mode, Hue, Density,
 * Classification, Locale) backed by DesignProvider hooks.
 *
 * HeroUI v3 Drawer compound primitives are used. Note: HeroUI's Drawer does
 * NOT take `isOpen`/`onOpenChange` as top-level props — it consumes a React
 * Stately overlay-state object via the `state` prop. We bridge the
 * TweaksDisclosureContext (plain boolean + callbacks) into that shape using
 * `useOverlayState({ isOpen, onOpenChange })`.
 *
 * RTL placement: HeroUI Drawer `placement` is a PHYSICAL edge
 * (`'left' | 'right' | 'top' | 'bottom'`). To keep the drawer on the inline-end
 * (reading-end) edge in both LTR and RTL we flip the physical side based on
 * `i18n.dir()` — this is Pitfall 1 in RESEARCH.md.
 *
 * Direction-button click applies D-16 defaults atomically by firing
 * `setDirection` + `setMode` + `setHue` in a single synchronous React event
 * handler. React 18+ batches all three into one commit so no intermediate
 * state is ever rendered.
 */

import { Drawer, DrawerContent, DrawerHeader, DrawerBody, useOverlayState } from '@heroui/react'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useDesignDirection,
  useMode,
  useHue,
  useDensity,
  useClassification,
  useLocale,
} from '@/design-system/hooks'
import { DIRECTION_DEFAULTS } from '@/design-system/directionDefaults'
import { cn } from '@/lib/utils'

import { useTweaksOpen } from './use-tweaks-open'

type Direction = keyof typeof DIRECTION_DEFAULTS

const DIRECTIONS: readonly Direction[] = ['chancery', 'situation', 'ministerial', 'bureau']
const HUE_PRESETS: readonly number[] = [22, 158, 190, 258, 330]

export function TweaksDrawer(): ReactElement {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const { isOpen, close } = useTweaksOpen()
  const { direction, setDirection } = useDesignDirection()
  const { mode, setMode } = useMode()
  const { hue, setHue } = useHue()
  const { density, setDensity } = useDensity()
  const { classif, setClassif } = useClassification()
  const { locale, setLocale } = useLocale()

  // Bridge our plain boolean disclosure into HeroUI's UseOverlayStateReturn.
  // React Aria's `<Modal>` reads from this object; pushing `close` through
  // `onOpenChange` keeps the backdrop/ESC/close-button gestures wired.
  const overlayState = useOverlayState({
    isOpen,
    onOpenChange: (open: boolean): void => {
      if (!open) close()
    },
  })

  // D-16 silent reset: one event handler = one React commit = no intermediate
  // render. Direction button click flips direction + mode + hue together.
  const handleDirection = (dir: Direction): void => {
    const defaults = DIRECTION_DEFAULTS[dir]
    setDirection(dir)
    setMode(defaults.mode)
    setHue(defaults.hue)
  }

  // Memoise label computations for ARIA so screen readers see the final state
  // string, not the intermediate react-i18next lookup.
  const titleLabel = useMemo<string>(() => t('tweaks.title'), [t])

  return (
    <Drawer state={overlayState}>
      <DrawerContent
        placement={isRTL ? 'left' : 'right'}
        aria-label={titleLabel}
        className="w-full sm:!w-[360px]"
      >
        <DrawerHeader className="flex items-center justify-between px-lg py-xl">
          <span className="text-[16px] font-semibold leading-tight">{titleLabel}</span>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-6 px-lg pb-xl">
          {/* Section 1: Direction */}
          <section aria-labelledby="tweaks-direction">
            <h3
              id="tweaks-direction"
              className="text-[13px] font-semibold leading-tight text-start mb-sm"
            >
              {t('tweaks.direction.label')}
            </h3>
            <div className="grid grid-cols-2 gap-sm">
              {DIRECTIONS.map((d) => {
                const active = direction === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={(): void => handleDirection(d)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-start gap-xs p-[10px] rounded-[var(--radius-sm)] border text-start min-h-11',
                      active
                        ? 'bg-accent-soft border-accent text-accent-ink'
                        : 'bg-surface border-line text-ink',
                    )}
                  >
                    <span className="text-[13px] font-semibold leading-tight">
                      {t(`tweaks.direction.${d}.name`)}
                    </span>
                    <span className="text-[11px] font-normal text-ink-mute leading-tight">
                      {t(`tweaks.direction.${d}.tagline`)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 2: Mode */}
          <section aria-labelledby="tweaks-mode">
            <h3
              id="tweaks-mode"
              className="text-[13px] font-semibold leading-tight text-start mb-sm"
            >
              {t('tweaks.mode.label')}
            </h3>
            <div className="flex gap-sm">
              {(['light', 'dark'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={(): void => setMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    'flex-1 min-h-11 rounded-[var(--radius-sm)] border text-[14px]',
                    mode === m
                      ? 'bg-accent-soft border-accent text-accent-ink'
                      : 'bg-surface border-line text-ink',
                  )}
                >
                  {t(`tweaks.mode.${m}`)}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Hue */}
          <section aria-labelledby="tweaks-hue">
            <h3
              id="tweaks-hue"
              className="text-[13px] font-semibold leading-tight text-start mb-sm"
            >
              {t('tweaks.hue.label')}
            </h3>
            <div className="flex items-center gap-sm">
              {/*
               * Native `<input type="range">` rather than HeroUI Slider: the
               * HeroUI v3.0.3 Slider is a compound (Track/Fill/Thumb) + passes
               * props through to React Aria's `<Slider>`, which doesn't accept
               * `size` / `classNames` / top-level `aria-label`. A native range
               * input covers the same behavior and is accessible by default.
               */}
              <input
                type="range"
                aria-label={t('tweaks.hue.label')}
                min={0}
                max={360}
                step={1}
                value={hue}
                onChange={(e): void => setHue(Number(e.target.value))}
                className="flex-1 accent-accent min-h-11"
              />
              <span
                dir="ltr"
                className="text-[13px] font-semibold leading-tight font-mono min-w-[3ch] text-end"
              >
                {hue}°
              </span>
            </div>
            <div className="flex gap-sm mt-sm">
              {HUE_PRESETS.map((h) => {
                const active = Math.abs(hue - h) < 4
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={(): void => setHue(h)}
                    aria-label={`${h}°`}
                    aria-pressed={active}
                    className={cn(
                      'flex-1 h-6 rounded-[var(--radius-sm)]',
                      active && 'ring-2 ring-ink',
                    )}
                    style={{ background: `oklch(58% 0.14 ${h})` }}
                  />
                )
              })}
            </div>
          </section>

          {/* Section 4: Density */}
          <section aria-labelledby="tweaks-density">
            <h3
              id="tweaks-density"
              className="text-[13px] font-semibold leading-tight text-start mb-sm"
            >
              {t('tweaks.density.label')}
            </h3>
            <div className="flex gap-sm">
              {(['comfortable', 'compact'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={(): void => setDensity(d)}
                  aria-pressed={density === d}
                  className={cn(
                    'flex-1 min-h-11 rounded-[var(--radius-sm)] border text-[14px]',
                    density === d
                      ? 'bg-accent-soft border-accent text-accent-ink'
                      : 'bg-surface border-line text-ink',
                  )}
                >
                  {t(`tweaks.density.${d}`)}
                </button>
              ))}
            </div>
          </section>

          {/* Section 5: Classification */}
          <section
            aria-labelledby="tweaks-classif"
            className="flex items-center justify-between gap-sm"
          >
            <h3 id="tweaks-classif" className="text-[13px] font-semibold leading-tight text-start">
              {t('tweaks.classification.label')}
            </h3>
            {/*
             * Native `role="switch"` checkbox rather than HeroUI Switch: the
             * HeroUI v3.0.3 Switch uses `children` as visual content + doesn't
             * accept `isSelected`/`onChange` at the root level. A semantic
             * switch-role input gives us the same a11y contract with strict
             * TypeScript compatibility.
             */}
            <label className="flex items-center gap-sm min-h-11 cursor-pointer">
              <input
                type="checkbox"
                role="switch"
                checked={classif}
                onChange={(e): void => setClassif(e.target.checked)}
                aria-label={
                  classif ? t('tweaks.classification.show') : t('tweaks.classification.hide')
                }
                className="min-h-11 min-w-11 accent-accent"
              />
              <span className="text-[14px]">
                {classif ? t('tweaks.classification.show') : t('tweaks.classification.hide')}
              </span>
            </label>
          </section>

          {/* Section 6: Locale */}
          <section aria-labelledby="tweaks-locale">
            <h3
              id="tweaks-locale"
              className="text-[13px] font-semibold leading-tight text-start mb-sm"
            >
              {t('tweaks.locale.label')}
            </h3>
            <div className="flex gap-sm">
              {(['en', 'ar'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={(): void => setLocale(l)}
                  aria-pressed={locale === l}
                  className={cn(
                    'flex-1 min-h-11 rounded-[var(--radius-sm)] border text-[14px]',
                    locale === l
                      ? 'bg-accent-soft border-accent text-accent-ink'
                      : 'bg-surface border-line text-ink',
                  )}
                >
                  {t(`tweaks.locale.${l}`)}
                </button>
              ))}
            </div>
          </section>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
