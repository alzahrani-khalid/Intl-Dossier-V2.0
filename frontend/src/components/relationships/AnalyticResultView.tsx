// Phase 71 (GRAPH-01 / GRAPH-03 / D-03) — AnalyticResultView
//
// The structured-primary result of the Analyze experience, keyed to query type:
//   forum_membership → a list (rows at var(--row-h))
//   shared_committees → an intersection table
//   engagement_chain  → an ordered timeline (day-first dates, newest-first per RF-2)
//   shortest_path     → an ordered hop sequence with a mono hop count
//
// LOCKED indistinguishable-empty contract (P68 D-09 / GRAPH-03): a lower-tier
// caller silently sees fewer rows. The empty/reduced state renders the SAME
// neutral "No results" chrome — this component emits NO copy that reveals the
// existence of above-tier data (see the UI-SPEC copywriting contract).
//
// Token-bound chrome only: 1px solid var(--line), no card shadows, no raw hex /
// color literals, logical properties (text-start), dir/Tajawal handled globally.
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { formatDayFirst } from '@/lib/format-date'
import { GlobeSpinner } from '@/components/signature-visuals/GlobeSpinner'

interface ResultNode {
  id: string
  type?: string
  name_en?: string
  name_ar?: string
  status?: string
  start_date?: string
  [key: string]: unknown
}

export interface AnalyticResult {
  query_type: 'forum_membership' | 'shared_committees' | 'engagement_chain' | 'shortest_path'
  nodes: ResultNode[]
  edges: unknown[]
  /** shortest_path only */
  path?: string[]
  relationship_path?: string[]
  path_length?: number
}

export interface AnalyticResultViewProps {
  result: AnalyticResult | undefined
  isLoading?: boolean
  isError?: boolean
  /** Type-aware navigation (getDossierDetailPath); the bare /dossiers/$id route does not exist. */
  onNodeSelect?: (nodeId: string) => void
}

const ROW_STYLE = {
  minHeight: 'var(--row-h)',
  borderBottom: '1px solid var(--line)',
  paddingInline: 'var(--space-4)',
} as const

export function AnalyticResultView({
  result,
  isLoading = false,
  isError = false,
  onNodeSelect,
}: AnalyticResultViewProps): ReactElement {
  const { t } = useTranslation('graph')
  const { isRTL } = useDirection()
  const locale = isRTL ? 'ar' : 'en'

  const nameOf = (node: ResultNode): string => {
    const name = isRTL ? node.name_ar : node.name_en
    return name ?? node.name_en ?? node.id
  }

  // Loading — the brand's signature motion (GlobeSpinner, not a skeleton).
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ paddingBlock: 'var(--space-12)', color: 'var(--ink-mute)' }}
      >
        <GlobeSpinner size={28} aria-label={t('analyze.loading', 'Running analysis…')} />
        <p className="t-meta" style={{ marginTop: 'var(--space-4)' }}>
          {t('analyze.loading', 'Running analysis…')}
        </p>
      </div>
    )
  }

  // Error — --danger banner (read-only queries; no destructive actions).
  if (isError) {
    return (
      <div
        role="alert"
        className="t-body text-start"
        style={{
          border: '1px solid var(--danger)',
          background: 'var(--danger-soft)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-4)',
        }}
      >
        {t('analyze.error', 'Could not run this analysis. Check your selection and try again.')}
      </div>
    )
  }

  const isPath = result?.query_type === 'shortest_path'
  const hasPath = isPath && (result?.path_length ?? 0) > 0 && (result?.path?.length ?? 0) > 0
  const nodes = result?.nodes ?? []
  const isEmpty = isPath ? !hasPath : nodes.length === 0

  // Empty / reduced — identical neutral chrome. NO tier-revealing messaging (LOCKED).
  if (result == null || isEmpty) {
    const body = isPath
      ? t('analyze.empty.path', 'No connection found between these entities.')
      : t('analyze.empty.body', 'This entity has no matching records for this analysis.')
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ paddingBlock: 'var(--space-12)', color: 'var(--ink-mute)' }}
      >
        <p className="t-card-title" style={{ color: 'var(--ink)' }}>
          {t('analyze.empty.heading', 'No results')}
        </p>
        <p className="t-meta" style={{ marginTop: 'var(--space-2)', maxWidth: '36ch' }}>
          {body}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Result-region heading + count line */}
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--line)' }}>
        <h3 className="t-card-title text-start" style={{ color: 'var(--ink)' }}>
          {t('analyze.resultHeading', 'Result')}
        </h3>
        <p className="t-meta text-start" style={{ color: 'var(--ink-mute)' }}>
          {renderCountLine(result, t)}
        </p>
      </div>

      {renderBody(result, { t, locale, nameOf, onNodeSelect })}
    </div>
  )
}

type TFn = ReturnType<typeof useTranslation>['t']

/**
 * Resolves a count-bearing string. i18next interpolates `{{count}}` in production;
 * the fallback `.replace` guarantees the numeral is present even when interpolation
 * is unavailable (e.g. mocked `t` in unit tests) so the count line never leaks a
 * literal `{{count}}`.
 */
function countLine(t: TFn, key: string, fallback: string, count: number): string {
  return t(key, fallback, { count }).replace('{{count}}', String(count))
}

function renderCountLine(result: AnalyticResult, t: TFn): string {
  switch (result.query_type) {
    case 'forum_membership':
      return countLine(
        t,
        'analyze.count.membership',
        '{{count}} forums and working groups',
        result.nodes.length,
      )
    case 'shared_committees':
      return countLine(
        t,
        'analyze.count.intersection',
        '{{count}} shared committees',
        result.nodes.length,
      )
    case 'engagement_chain':
      return countLine(t, 'analyze.count.chain', '{{count}} engagements', result.nodes.length)
    case 'shortest_path':
      return countLine(
        t,
        'analyze.count.path',
        'Connected in {{count}} hops',
        result.path_length ?? 0,
      )
    default:
      return ''
  }
}

function renderBody(
  result: AnalyticResult,
  ctx: {
    t: TFn
    locale: string
    nameOf: (node: ResultNode) => string
    onNodeSelect?: (nodeId: string) => void
  },
): ReactElement {
  const { t, locale, nameOf, onNodeSelect } = ctx

  // Engagement chain — ordered timeline, newest-first (RF-2).
  if (result.query_type === 'engagement_chain') {
    const ordered = [...result.nodes].sort((a, b) => {
      const da = a.start_date != null ? new Date(a.start_date).getTime() : 0
      const db = b.start_date != null ? new Date(b.start_date).getTime() : 0
      return db - da
    })
    return (
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {ordered.map((node) => (
          <li key={node.id} className="flex items-center gap-3" style={ROW_STYLE}>
            <span className="t-mono" style={{ color: 'var(--ink-mute)', minWidth: '8ch' }}>
              {node.start_date != null ? formatDayFirst(node.start_date, locale) : '—'}
            </span>
            <RowName name={nameOf(node)} nodeId={node.id} onNodeSelect={onNodeSelect} />
          </li>
        ))}
      </ol>
    )
  }

  // Shared committees — intersection table.
  if (result.query_type === 'shared_committees') {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              className="t-label text-start"
              style={{ padding: 'var(--space-2) var(--space-4)', color: 'var(--ink-mute)' }}
            >
              {t('analyze.col.committee', 'Committee')}
            </th>
            <th
              className="t-label text-start"
              style={{ padding: 'var(--space-2) var(--space-4)', color: 'var(--ink-mute)' }}
            >
              {t('analyze.col.type', 'Type')}
            </th>
          </tr>
        </thead>
        <tbody>
          {result.nodes.map((node) => (
            <tr
              key={node.id}
              style={{ height: 'var(--row-h)', borderTop: '1px solid var(--line)' }}
            >
              <td style={{ padding: 'var(--space-2) var(--space-4)' }}>
                <RowName name={nameOf(node)} nodeId={node.id} onNodeSelect={onNodeSelect} />
              </td>
              <td
                className="t-meta text-start"
                style={{ padding: 'var(--space-2) var(--space-4)', color: 'var(--ink-mute)' }}
              >
                {node.type != null ? t(`dossier.type.${node.type}`, node.type) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // Shortest path — ordered hop sequence (the path nodes, in order).
  if (result.query_type === 'shortest_path') {
    const orderById = new Map(result.nodes.map((n) => [n.id, n]))
    const ordered = (result.path ?? []).map((id) => orderById.get(id) ?? { id })
    return (
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {ordered.map((node, i) => (
          <li key={`${node.id}-${i}`} className="flex items-center gap-3" style={ROW_STYLE}>
            <span className="t-mono" style={{ color: 'var(--ink-mute)', minWidth: '3ch' }}>
              {i + 1}
            </span>
            <RowName
              name={nameOf(node as ResultNode)}
              nodeId={node.id}
              onNodeSelect={onNodeSelect}
            />
          </li>
        ))}
      </ol>
    )
  }

  // forum_membership (default) — a list.
  return (
    <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {result.nodes.map((node) => (
        <li key={node.id} className="flex items-center gap-3" style={ROW_STYLE}>
          <RowName name={nameOf(node)} nodeId={node.id} onNodeSelect={onNodeSelect} />
          {node.type != null && (
            <span className="t-meta" style={{ color: 'var(--ink-mute)' }}>
              {t(`dossier.type.${node.type}`, node.type)}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

interface RowNameProps {
  name: string
  nodeId: string
  onNodeSelect?: (nodeId: string) => void
}

/** A clickable name when navigation is wired; plain text otherwise. */
function RowName({ name, nodeId, onNodeSelect }: RowNameProps): ReactElement {
  if (onNodeSelect == null) {
    return (
      <span className="t-body text-start" style={{ color: 'var(--ink)' }}>
        {name}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onNodeSelect(nodeId)}
      className="t-body text-start"
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: 'var(--ink)',
        cursor: 'pointer',
        textAlign: 'start',
      }}
    >
      {name}
    </button>
  )
}
