/**
 * CitationCard — the flat token-bound source chip rendered under an assistant reply.
 *
 * Wired as assistant-ui's `Source` message-part component (MessagePrimitive.Parts
 * `components={{ Source }}`). Each source the agent emits becomes one chip:
 *   - flat --surface, 1px solid --line, --radius-sm, NO shadow (CLAUDE.md),
 *   - source line in --t-meta, mono source id in --t-mono-small,
 *   - deep-links to the dossier / signal / graph / record it cites,
 *   - the selected chip is --accent (the one accent-reserved spot for citations).
 *
 * NO rich generative dossier card here — that is Phase 73. This is a reads-only
 * deep-link chip. The source `url` is produced by the agent's tools (already-cleared
 * targets only); we navigate via TanStack Router so it stays in-app.
 */
import type { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { SourceMessagePartComponent } from '@assistant-ui/react'

/**
 * Render one citation chip. assistant-ui passes the source part: `id`, `title`,
 * optional `url`. We treat `url` as the in-app deep-link target.
 */
export const CitationCard: SourceMessagePartComponent = ({ title, url, id }): ReactElement => {
  const navigate = useNavigate()

  const label = title ?? id
  const hasLink = typeof url === 'string' && url.length > 0

  const handleActivate = (): void => {
    if (!hasLink) return
    // The agent emits in-app relative paths (dossier/signal/graph/record). Navigate
    // via the router so we stay inside the SPA; `url` is an already-accessible target.
    void navigate({ to: url as string & {} })
  }

  return (
    <button
      type="button"
      className="copilot-citation"
      onClick={handleActivate}
      disabled={!hasLink}
      data-source-id={id}
    >
      <span>{label}</span>
      {id !== label && <span className="copilot-citation__id">{id}</span>}
    </button>
  )
}
