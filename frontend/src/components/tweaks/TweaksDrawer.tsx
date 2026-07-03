/**
 * TweaksDrawer — Phase 34 Plan 34-04 (THEME-01).
 *
 * Central UX surface for the Phase 33/34 design system. Renders the live
 * prototype controls in the handoff order backed by DesignProvider hooks.
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
 */

import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerBody,
  useOverlayState,
} from '@heroui/react'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

import { useMode, useDensity, useClassification, useLocale } from '@/design-system/hooks'

import { useTweaksOpen } from './use-tweaks-open'
import './tweaks-drawer.css'

type GlobeLoaderWindow = Window & { __showGlobeLoader?: (durationMs: number) => void }

const MODES = ['light', 'dark'] as const
const DENSITIES = ['comfortable', 'compact', 'dense'] as const
const LOCALES = ['en', 'ar'] as const
const CLASSIFICATION_OPTIONS = [true, false] as const

export function TweaksDrawer(): ReactElement {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const { isOpen, close } = useTweaksOpen()
  const { mode, setMode } = useMode()
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

  const handlePreviewLoader = (): void => {
    close()
    window.setTimeout(() => {
      ;(window as GlobeLoaderWindow).__showGlobeLoader?.(2200)
    }, 150)
  }

  // Memoise label computations for ARIA so screen readers see the final state
  // string, not the intermediate react-i18next lookup.
  const titleLabel = useMemo<string>(() => t('tweaks.title'), [t])

  return (
    <Drawer state={overlayState}>
      <DrawerBackdrop>
        <DrawerContent className="id-tweaks-content" placement={isRTL ? 'left' : 'right'}>
          <DrawerDialog aria-label={titleLabel} className="id-tweaks-dialog">
            <DrawerHeader className="id-tweaks-header">
              <div>
                <h2 className="id-tweaks-title">{titleLabel}</h2>
                <p className="id-tweaks-subtitle">{t('tweaks.subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t('tweaks.close')}
                className="id-tweaks-close"
              >
                <X size={20} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </DrawerHeader>
            <DrawerBody className="id-tweaks-body">
              {/* Section 1: Theme */}
              <section aria-labelledby="tweaks-mode">
                <h3 id="tweaks-mode" className="id-tweaks-section-title">
                  {t('tweaks.mode.label')}
                </h3>
                <div className="id-tweaks-row">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={(): void => setMode(m)}
                      aria-pressed={mode === m}
                    >
                      {t(`tweaks.mode.${m}`)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Section 3: Density */}
              <section aria-labelledby="tweaks-density">
                <h3 id="tweaks-density" className="id-tweaks-section-title">
                  {t('tweaks.density.label')}
                </h3>
                <div className="id-tweaks-row">
                  {DENSITIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={(): void => setDensity(d)}
                      aria-pressed={density === d}
                    >
                      {t(`tweaks.density.${d}`)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Section 4: Reading direction */}
              <section aria-labelledby="tweaks-locale">
                <h3 id="tweaks-locale" className="id-tweaks-section-title">
                  {t('tweaks.locale.label')}
                </h3>
                <div className="id-tweaks-row">
                  {LOCALES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={(): void => setLocale(l)}
                      aria-pressed={locale === l}
                    >
                      {t(`tweaks.locale.${l}`)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Section 5: Classification */}
              <section aria-labelledby="tweaks-classif">
                <h3 id="tweaks-classif" className="id-tweaks-section-title">
                  {t('tweaks.classification.label')}
                </h3>
                <div className="id-tweaks-row">
                  {CLASSIFICATION_OPTIONS.map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={(): void => setClassif(value)}
                      aria-pressed={classif === value}
                    >
                      {value ? t('tweaks.classification.on') : t('tweaks.classification.off')}
                    </button>
                  ))}
                </div>
              </section>

              {/* Section 6: Shortcuts */}
              <section aria-labelledby="tweaks-shortcuts">
                <h3 id="tweaks-shortcuts" className="id-tweaks-section-title">
                  {t('tweaks.shortcuts.label')}
                </h3>
                <div className="id-tweaks-shortcuts">
                  <div>
                    <span className="id-tweaks-kbd" dir="ltr">
                      ⌘K
                    </span>{' '}
                    {t('tweaks.shortcuts.searchAny')}
                  </div>
                  <div>
                    <span className="id-tweaks-kbd">C</span> {t('tweaks.shortcuts.newEngagement')}
                  </div>
                  <div>
                    <span className="id-tweaks-kbd">B</span> {t('tweaks.shortcuts.newBrief')}
                  </div>
                </div>
              </section>

              {/* Section 7: Loading state */}
              <section aria-labelledby="tweaks-loader">
                <h3 id="tweaks-loader" className="id-tweaks-section-title">
                  {t('tweaks.loader.label')}
                </h3>
                <button type="button" onClick={handlePreviewLoader} className="id-tweaks-primary">
                  {t('tweaks.loader.preview')}
                </button>
              </section>
            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </Drawer>
  )
}
