// Phase 71 (GRAPH-01 / D-01, D-02) — AnalyticQueryPicker
//
// The "Idle / picker" state of the Analyze experience (71-UI-SPEC). Exposes the
// four query templates, 1 or 2 typed entity inputs depending on the template, an
// optional "over the last N days" window for engagement chains, and a single
// primary "Run analysis" CTA. A `defaultEntityId` pre-fills the primary entity
// when launched from a dossier anchor (D-02).
//
// Visual layer = IntelDossier Design System (Bureau). Token-bound chrome only:
// 1px solid var(--line) borders, no card shadows, no raw hex / color literals,
// logical properties (ms-*/pe-*/text-start), dir/Tajawal handled globally for AR.
import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { AnalyticQueryType } from '@/hooks/useAnalyticGraph'

/** Whether a template needs a second entity (intersection / path). */
const TWO_ENTITY_TYPES: ReadonlySet<AnalyticQueryType> = new Set<AnalyticQueryType>([
  'shared_committees',
  'shortest_path',
])

/** Whether a template exposes the time-window control (chains only). */
function usesWindow(queryType: AnalyticQueryType): boolean {
  return queryType === 'engagement_chain'
}

interface TemplateDef {
  queryType: AnalyticQueryType
  labelKey: string
  labelDefault: string
}

// Labels keyed under the registered `graph` namespace (extend, do not create).
const TEMPLATES: readonly TemplateDef[] = [
  {
    queryType: 'forum_membership',
    labelKey: 'analyze.template.forumMembership',
    labelDefault: 'Who sits on which forum',
  },
  {
    queryType: 'shared_committees',
    labelKey: 'analyze.template.sharedCommittees',
    labelDefault: 'Shared committees',
  },
  {
    queryType: 'engagement_chain',
    labelKey: 'analyze.template.engagementChain',
    labelDefault: 'Engagement chains',
  },
  {
    queryType: 'shortest_path',
    labelKey: 'analyze.template.shortestPath',
    labelDefault: 'How are these connected',
  },
]

const DEFAULT_WINDOW_DAYS = 90

export interface AnalyticRunParams {
  queryType: AnalyticQueryType
  entityId: string
  entityId2?: string
  windowDays?: number
}

export interface AnalyticQueryPickerProps {
  /** Pre-fills the primary entity when launched from a dossier anchor (D-02). */
  defaultEntityId?: string
  /** Fired with the typed params when "Run analysis" is pressed. */
  onRun: (params: AnalyticRunParams) => void
}

export function AnalyticQueryPicker({
  defaultEntityId,
  onRun,
}: AnalyticQueryPickerProps): ReactElement {
  const { t } = useTranslation('graph')

  const [queryType, setQueryType] = useState<AnalyticQueryType>('forum_membership')
  const [entityId, setEntityId] = useState<string>(defaultEntityId ?? '')
  const [entityId2, setEntityId2] = useState<string>('')
  const [windowDays, setWindowDays] = useState<number>(DEFAULT_WINDOW_DAYS)

  const needsSecondEntity = TWO_ENTITY_TYPES.has(queryType)
  const showWindow = usesWindow(queryType)
  const canRun = entityId.trim().length > 0 && (!needsSecondEntity || entityId2.trim().length > 0)

  const handleRun = (): void => {
    if (!canRun) return
    onRun({
      queryType,
      entityId: entityId.trim(),
      entityId2: needsSecondEntity ? entityId2.trim() : undefined,
      windowDays: showWindow ? windowDays : undefined,
    })
  }

  return (
    <Card style={{ border: '1px solid var(--line)', boxShadow: 'none' }}>
      <CardContent className="pt-6">
        {/* Heading */}
        <h2
          className="t-card-title text-start"
          style={{ color: 'var(--ink)', marginBottom: 'var(--space-4)' }}
        >
          {t('analyze.pickerHeading', 'Choose an analysis')}
        </h2>

        {/* Template selector — selectable chips (active = accent hairline). */}
        <div
          role="radiogroup"
          aria-label={t('analyze.pickerHeading', 'Choose an analysis')}
          className="flex flex-wrap gap-2"
          style={{ marginBottom: 'var(--space-6)' }}
        >
          {TEMPLATES.map((tpl) => {
            const active = tpl.queryType === queryType
            return (
              <button
                key={tpl.queryType}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setQueryType(tpl.queryType)}
                className="t-body text-start"
                style={{
                  minHeight: 'var(--row-h)',
                  paddingInline: 'var(--space-4)',
                  paddingBlock: 'var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                  color: active ? 'var(--accent-ink)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {t(tpl.labelKey, tpl.labelDefault)}
              </button>
            )
          })}
        </div>

        {/* Typed inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="analytic-entity-1" className="mb-2 block text-start">
              {needsSecondEntity
                ? t('analyze.entityPrimary', 'First entity')
                : t('analyze.entity', 'Entity')}
            </Label>
            <Input
              id="analytic-entity-1"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder={t('analyze.entityPlaceholder', 'Dossier id')}
            />
          </div>

          {needsSecondEntity && (
            <div>
              <Label htmlFor="analytic-entity-2" className="mb-2 block text-start">
                {t('analyze.entitySecondary', 'Second entity')}
              </Label>
              <Input
                id="analytic-entity-2"
                value={entityId2}
                onChange={(e) => setEntityId2(e.target.value)}
                placeholder={t('analyze.entityPlaceholder', 'Dossier id')}
              />
            </div>
          )}

          {showWindow && (
            <div>
              <Label htmlFor="analytic-window" className="mb-2 block text-start">
                {t('analyze.window', 'Over the last {{count}} days', { count: windowDays })}
              </Label>
              <Input
                id="analytic-window"
                type="number"
                min={1}
                max={365}
                value={windowDays}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10)
                  setWindowDays(Number.isNaN(next) ? DEFAULT_WINDOW_DAYS : next)
                }}
              />
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <div className="flex" style={{ marginTop: 'var(--space-6)' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={!canRun}
            onClick={handleRun}
            style={{ opacity: canRun ? 1 : 0.5 }}
          >
            {t('analyze.run', 'Run analysis')}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
