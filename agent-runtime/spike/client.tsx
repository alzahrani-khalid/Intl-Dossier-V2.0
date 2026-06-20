/**
 * THROWAWAY spike (Plan 72-01) — GATE 2 runnable AR render for the orchestrator's
 * 1024px visual confirmation.
 *
 * Renders ONE assistant message + one citation chip through a token-bound surface
 * (the copilot-tokens.css remap), under dir="rtl" with Tajawal, EN and AR side by
 * side. This is the minimal render the shell_decision hinges on. The executor cannot
 * screenshot; the orchestrator opens this at 1024px in Arabic and confirms:
 *   - dir="rtl" flips the layout (role label leads at inline-start = right)
 *   - Tajawal font applies to Arabic text
 *   - zero raw hex / zero card shadow on the message + citation surfaces
 *
 * RUN: see README.md "GATE 2 — run the render".
 */
import React from 'react'
import { createRoot } from 'react-dom/client'

interface RenderProps {
  dir: 'rtl' | 'ltr'
  role: string
  body: string
  citationTitle: string
  citationId: string
}

// One assistant message + one citation chip — the CopilotKit message/citation slot
// shape, re-skinned to tokens. (Production renders the real CopilotChat message slot
// OR the assistant-ui MessagePrimitive — same token contract either way.)
function CopilotRender({ dir, role, body, citationTitle, citationId }: RenderProps): React.ReactElement {
  return (
    <div dir={dir} className="copilot-surface" style={{ padding: 16, minWidth: 360 }}>
      <div className="copilot-message">
        <div className="copilot-message__role">{role}</div>
        <p style={{ margin: '4px 0 8px' }}>{body}</p>
        <span className="copilot-citation" data-selected="true">
          {citationTitle} · <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{citationId}</code>
        </span>
      </div>
    </div>
  )
}

export function SpikeGate2(): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 32, padding: 24, background: 'var(--bg)', minHeight: '100vh' }}>
      <section>
        <h2 style={{ fontSize: 'var(--t-card-title)' }}>EN (ltr)</h2>
        <CopilotRender
          dir="ltr"
          role="Assistant"
          body="Two signals match this dossier. The most recent flags an escalation in the trade working group."
          citationTitle="Signal · trade working group"
          citationId="sig-4f2a"
        />
      </section>
      <section>
        <h2 style={{ fontSize: 'var(--t-card-title)' }}>AR (rtl) — Tajawal</h2>
        <CopilotRender
          dir="rtl"
          role="المساعد"
          body="هناك إشارتان تطابقان هذا الملف. تشير الأحدث إلى تصعيد في مجموعة عمل التجارة."
          citationTitle="إشارة · مجموعة عمل التجارة"
          citationId="sig-4f2a"
        />
      </section>
    </div>
  )
}

const el = typeof document !== 'undefined' ? document.getElementById('root') : null
if (el) {
  createRoot(el).render(<SpikeGate2 />)
}
