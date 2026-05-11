import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const FRONTEND_ROOT = resolve(__dirname, '../../..')
const INDEX_CSS = resolve(FRONTEND_ROOT, 'src/index.css')
const HANDOFF_CSS = '/tmp/inteldossier-handoff/inteldossier/project/src/app.css'

describe('Phase 35 — Tajawal RTL cascade drift guard (TYPO-03)', () => {
  it('index.css contains the verbatim Tajawal cascade header', () => {
    const css = readFileSync(INDEX_CSS, 'utf8')
    expect(css).toContain('/* ============ Arabic typography override: Tajawal ============ */')
  })

  it('index.css contains the [style*="--font-display"] defeat rule (TYPO-03)', () => {
    const css = readFileSync(INDEX_CSS, 'utf8')
    expect(css).toMatch(
      /html\[dir='rtl'\]\s*\[style\*='--font-display'\]\s*\{[^}]*'Tajawal'[^}]*!important/,
    )
  })

  it('index.css contains the [dir="ltr"].mono JetBrains Mono carve-out (TYPO-04)', () => {
    const css = readFileSync(INDEX_CSS, 'utf8')
    expect(css).toMatch(/html\[dir='rtl'\]\s*\[dir='ltr'\]\.mono[\s\S]*?'JetBrains Mono'/)
  })

  it('index.css contains the !important chip/label/tag Tajawal override block', () => {
    const css = readFileSync(INDEX_CSS, 'utf8')
    expect(css).toMatch(/html\[dir='rtl'\]\s*\.chip[\s\S]*?'Tajawal'[\s\S]*?!important/)
  })

  it('index.css block matches handoff source byte-for-byte (when handoff available)', () => {
    if (!existsSync(HANDOFF_CSS)) {
      console.warn('handoff app.css not mounted — skipping byte-for-byte check')
      return
    }
    const handoff = readFileSync(HANDOFF_CSS, 'utf8')
    // Extract lines 129-176 (inclusive) from handoff source.
    const handoffLines = handoff.split('\n').slice(128, 176).join('\n').trim()
    const css = readFileSync(INDEX_CSS, 'utf8')
    expect(css).toContain(handoffLines)
  })
})
