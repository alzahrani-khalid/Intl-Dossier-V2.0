/**
 * Phase 42 — Plan 08 — `<ActivityList>` presentation component.
 *
 * Renders the IntelDossier handoff `.act-list` 3-col timeline:
 *
 *   ┌────────┬────┬────────────────────────────────────────────┐
 *   │ time   │ ic │ <who> <what> <strong>{entity}</strong>     │
 *   │ (mono) │ on │ in <span class="act-where">{where}</span>  │
 *   └────────┴────┴────────────────────────────────────────────┘
 *
 * - Sentence template comes from i18n `activity-feed.events.{action_type}`
 *   so RTL grammar (subject/object inversion in Arabic) lives in the
 *   translation, not the component (D-14).
 * - Color of `.act-where` is owned by the `.act-where` rule in
 *   `frontend/src/index.css` (var(--accent-ink)) — keeps tokens in CSS,
 *   not inline.
 * - Logical properties only — no left/right anywhere.
 * - R-05 open-redirect guard: only `metadata.navigation_url` values that
 *   start with `/` are treated as in-app paths and make the row
 *   interactive. Everything else (https:, //, javascript:, mailto:, '')
 *   renders the row fully non-interactive.
 */

import type { ReactElement } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Icon, type IconName } from '@/components/signature-visuals'
import { toArDigits } from '@/lib/i18n/toArDigits'
import type { ActivityActionType, ActivityItem } from '@/types/activity-feed.types'

interface ActivityListProps {
  activities: ActivityItem[]
}

/**
 * Maps the 15-value `ActivityActionType` union plus unknown strings to one
 * of the 6 stroked glyphs from the Wave 0 `<Icon>` component.
 *
 *   approval         → check
 *   rejection/delete → alert
 *   comment/mention  → chat
 *   create           → plus
 *   upload/download  → file
 *   share            → link
 *   everything else  → dot (default)
 */
function iconForAction(t: ActivityActionType | string): IconName {
  switch (t) {
    case 'approval':
      return 'check'
    case 'rejection':
    case 'delete':
      return 'alert'
    case 'comment':
    case 'mention':
      return 'chat'
    case 'create':
      return 'plus'
    case 'upload':
    case 'download':
      return 'file'
    case 'share':
      return 'link'
    default:
      return 'dot'
  }
}

/**
 * Compact relative-time formatter for the .act-t mono column.
 *
 * Returns short suffixed forms (e.g. `5m`, `2h`, `3d`) using EN suffixes;
 * AR locale gets compact Arabic suffixes (`ث`/`د`/`س`/`ي`). Numeric
 * digits are converted via `toArDigits` at the call site so this function
 * stays pure and locale-suffix-only.
 */
function formatRelativeTime(iso: string, locale: 'en' | 'ar'): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return locale === 'ar' ? `${diffSec}ث` : `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return locale === 'ar' ? `${diffMin}د` : `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return locale === 'ar' ? `${diffH}س` : `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return locale === 'ar' ? `${diffD}ي` : `${diffD}d`
}

export function ActivityList({ activities }: ActivityListProps): ReactElement {
  const { i18n } = useTranslation('activity-feed')
  const locale: 'en' | 'ar' = i18n.language === 'ar' ? 'ar' : 'en'
  const navigate = useNavigate()

  return (
    <ul className="act-list">
      {activities.map((a) => {
        // R-05 open-redirect guard. ONLY relative in-app paths (`/...`) are
        // interactive. Absolute URLs (`https://...`), protocol-relative
        // (`//...`) — note: `'//evil'.startsWith('/')` is TRUE so we must
        // also reject the second-char `/`), `javascript:`/`data:`/`mailto:`
        // schemes, and empty strings all fail the guard and the row stays
        // fully non-interactive (no role/tabIndex/onClick/onKeyDown).
        // WR-01: also reject backslash variants (`/\evil.example`,
        // `\\evil.example`). Some browsers normalise `\` → `/` in URL
        // parsing, which would turn `/\evil.example` into `//evil.example`.
        const navUrl = a.metadata?.navigation_url
        const safeNavUrl =
          typeof navUrl === 'string' &&
          navUrl.startsWith('/') &&
          !navUrl.startsWith('//') &&
          !navUrl.includes('\\')
            ? navUrl
            : null
        const interactive = safeNavUrl !== null

        const entity =
          locale === 'ar'
            ? (a.entity_name_ar ?? a.entity_name_en ?? '—')
            : (a.entity_name_en ?? a.entity_name_ar ?? '—')
        const where =
          locale === 'ar'
            ? (a.related_entity_name_ar ?? a.related_entity_name_en ?? '—')
            : (a.related_entity_name_en ?? a.related_entity_name_ar ?? '—')

        const onClickHandler = interactive
          ? (): void => {
              void navigate({ to: safeNavUrl })
            }
          : undefined

        const onKeyDownHandler = interactive
          ? (e: React.KeyboardEvent<HTMLLIElement>): void => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void navigate({ to: safeNavUrl })
              }
            }
          : undefined

        return (
          <li
            key={a.id}
            className="act-row"
            data-testid="act-row"
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={onClickHandler}
            onKeyDown={onKeyDownHandler}
          >
            <span className="act-t" dir="ltr">
              {toArDigits(formatRelativeTime(a.created_at, locale), locale)}
            </span>
            <Icon name={iconForAction(a.action_type)} size={16} aria-hidden />
            <span>
              <span className="act-who">{a.actor_name}</span>{' '}
              <span className="act-what">
                <Trans
                  ns="activity-feed"
                  i18nKey={`events.${a.action_type}`}
                  defaults="acted on <entity>{{entity}}</entity> in <where>{{where}}</where>"
                  values={{ entity, where }}
                  components={{
                    entity: <strong style={{ color: 'var(--ink)', fontWeight: 500 }} />,
                    where: <span className="act-where" />,
                  }}
                />
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
