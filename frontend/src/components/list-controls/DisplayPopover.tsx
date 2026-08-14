/**
 * DisplayPopover — Phase 87 F24 (AFF-02, locked decision 3: Display = how arranged)
 *
 * The second, separate popover: grouping + ordering + property visibility + reset.
 * Presentational + controlled — all state is read/written through useListControls
 * handlers passed as props. Sections render only when their config slice exists:
 * Group by (config.grouping non-empty), Sort by (config.sortFields present),
 * Display properties (config.properties has ≥ 2 entries, Open Q3). Toggle/checked
 * states use accent per the UI-SPEC reserved-for list; only working options render
 * (no dead 'Coming soon' stubs — Pitfall 6).
 */

import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type { ListControlsConfig } from './useListControls'

export interface DisplayPopoverProps {
  config: ListControlsConfig
  sort?: string
  dir?: 'asc' | 'desc'
  visibleProperties: string[]
  group?: string
  onSetSort: (id: string) => void
  onSetDir: (dir: 'asc' | 'desc') => void
  onToggleProperty: (id: string) => void
  onSetGroup: (id: string | undefined) => void
  onReset: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const rowStyle = { minBlockSize: 'var(--row-h)' } as const

function SectionTitle({ children }: { children: string }): ReactElement {
  return <p className="mb-1 text-sm text-ink-faint">{children}</p>
}

export function DisplayPopover({
  config,
  sort,
  dir,
  visibleProperties,
  group,
  onSetSort,
  onSetDir,
  onToggleProperty,
  onSetGroup,
  onReset,
  open: controlledOpen,
  onOpenChange,
}: DisplayPopoverProps): ReactElement {
  const { t } = useTranslation('list-controls')
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const handleOpenChange = (next: boolean): void => {
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  const activeDir = dir ?? 'asc'
  const showGrouping = (config.grouping?.length ?? 0) > 0
  const showSort = (config.sortFields?.length ?? 0) > 0
  const showProperties = (config.properties?.length ?? 0) >= 2

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="btn-ghost inline-flex items-center gap-2">
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>{t('display.trigger', { defaultValue: 'Display' })}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="bg-surface-3 shadow-none w-72">
        <div className="flex flex-col">
          {showGrouping ? (
            <section className="border-t border-[var(--line)] pb-3 pt-3 first:border-t-0 first:pt-0">
              <SectionTitle>{t('display.grouping', { defaultValue: 'Group by' })}</SectionTitle>
              <button
                type="button"
                aria-pressed={group === undefined}
                onClick={() => onSetGroup(undefined)}
                style={rowStyle}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-start text-sm hover:bg-[var(--line-soft)]"
              >
                <span className="flex size-4 items-center justify-center">
                  {group === undefined ? <Check size={14} className="text-accent" /> : null}
                </span>
                {t('display.grouping_none', { defaultValue: 'No grouping' })}
              </button>
              {config.grouping?.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={group === g.id}
                  onClick={() => onSetGroup(g.id)}
                  style={rowStyle}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-start text-sm hover:bg-[var(--line-soft)]"
                >
                  <span className="flex size-4 items-center justify-center">
                    {group === g.id ? <Check size={14} className="text-accent" /> : null}
                  </span>
                  {t(g.labelKey)}
                </button>
              ))}
            </section>
          ) : null}

          {showSort ? (
            <section className="border-t border-[var(--line)] pb-3 pt-3 first:border-t-0 first:pt-0">
              <SectionTitle>{t('display.ordering', { defaultValue: 'Sort by' })}</SectionTitle>
              {config.sortFields?.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={sort === f.id}
                  onClick={() => onSetSort(f.id)}
                  style={rowStyle}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-start text-sm hover:bg-[var(--line-soft)]"
                >
                  <span className="flex size-4 items-center justify-center">
                    {sort === f.id ? <Check size={14} className="text-accent" /> : null}
                  </span>
                  {t(f.labelKey)}
                </button>
              ))}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  aria-pressed={activeDir === 'asc'}
                  onClick={() => onSetDir('asc')}
                  className={`rounded-[var(--radius-sm)] border px-2 py-1 text-sm ${
                    activeDir === 'asc'
                      ? 'border-accent text-accent'
                      : 'border-[var(--line)] text-ink-mute'
                  }`}
                >
                  {t('display.asc', { defaultValue: 'Ascending' })}
                </button>
                <button
                  type="button"
                  aria-pressed={activeDir === 'desc'}
                  onClick={() => onSetDir('desc')}
                  className={`rounded-[var(--radius-sm)] border px-2 py-1 text-sm ${
                    activeDir === 'desc'
                      ? 'border-accent text-accent'
                      : 'border-[var(--line)] text-ink-mute'
                  }`}
                >
                  {t('display.desc', { defaultValue: 'Descending' })}
                </button>
              </div>
            </section>
          ) : null}

          {showProperties ? (
            <section className="border-t border-[var(--line)] pb-3 pt-3 first:border-t-0 first:pt-0">
              <SectionTitle>
                {t('display.properties', { defaultValue: 'Display properties' })}
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {config.properties?.map((p) => {
                  const visible = visibleProperties.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={visible}
                      onClick={() => onToggleProperty(p.id)}
                      className={`rounded-[var(--radius-sm)] border px-2 py-1 text-sm ${
                        visible ? 'border-accent text-accent' : 'border-[var(--line)] text-ink-mute'
                      }`}
                    >
                      {t(p.labelKey)}
                    </button>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
            <button type="button" className="btn-ghost text-sm" onClick={onReset}>
              {t('display.reset', { defaultValue: 'Reset to default' })}
            </button>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  )
}
