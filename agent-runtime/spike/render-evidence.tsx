/**
 * THROWAWAY spike (Plan 72-01) — GATE 2 NON-VISUAL evidence.
 *
 * The executor cannot screenshot, so this produces machine-checkable evidence that
 * the render + token-remap contract holds, leaving only the human/orchestrator
 * pixel confirmation:
 *
 *   1. renderToString the AR (dir="rtl") render → assert dir="rtl" is present and
 *      the token classes (.copilot-surface / .copilot-message / .copilot-citation)
 *      are in the output.
 *   2. Parse copilot-tokens.css and assert the --copilot-kit-* remap contract:
 *        - background/foreground/primary/border remapped to IntelDossier var() tokens
 *        - every --copilot-kit-shadow-* neutralized to `none`
 *        - Tajawal applied under [dir='rtl']
 *        - message + citation surfaces carry `box-shadow: none` (no card shadows)
 *        - NO raw hex on the message/citation surface rules (token-only)
 *
 * Writes gate2-dom-result.json.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { SpikeGate2 } from './client.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const css = readFileSync(path.join(here, 'copilot-tokens.css'), 'utf8')

// --- 1. SSR the render and inspect the markup ---
const html = renderToString(React.createElement(SpikeGate2))
const hasRtl = /dir="rtl"/.test(html)
const hasSurfaceClass = /copilot-surface/.test(html)
const hasMessageClass = /copilot-message/.test(html)
const hasCitationClass = /copilot-citation/.test(html)
const hasArabicText = /[؀-ۿ]/.test(html) // contains Arabic script

// --- 2. token-remap contract checks over the CSS artifact ---
const remap = {
  background: /--copilot-kit-background-color:\s*var\(--surface\)/.test(css),
  foreground: /--copilot-kit-foreground-color:\s*var\(--ink\)/.test(css),
  primary: /--copilot-kit-primary-color:\s*var\(--accent\)/.test(css),
  border: /--copilot-kit-input-border-color:\s*var\(--line\)/.test(css),
  separator: /--copilot-kit-separator-color:\s*var\(--line-soft\)/.test(css),
  muted: /--copilot-kit-muted-color:\s*var\(--ink-mute\)/.test(css),
}
const shadowsNeutralized =
  /--copilot-kit-shadow-sm:\s*none/.test(css) &&
  /--copilot-kit-shadow-md:\s*none/.test(css) &&
  /--copilot-kit-shadow-lg:\s*none/.test(css)
const tajawalUnderRtl = /\[dir='rtl'\][^{]*\{[^}]*--font-arabic|\[dir='rtl'\][\s\S]*?font-family:\s*var\(--font-arabic\)/.test(css)

// message + citation surfaces must declare box-shadow:none (no card shadows)
const messageNoShadow = /\.copilot-message\s*\{[^}]*box-shadow:\s*none/.test(css)
const citationNoShadow = /\.copilot-citation\s*\{[^}]*box-shadow:\s*none/.test(css)

// no raw hex inside the .copilot-message / .copilot-citation rule bodies (token-only)
function ruleBody(selector: string): string {
  const re = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`)
  const m = css.match(re)
  return m?.[1] ?? ''
}
const hexInMessage = /#[0-9a-fA-F]{3,8}\b/.test(ruleBody('.copilot-message'))
const hexInCitation = /#[0-9a-fA-F]{3,8}\b/.test(ruleBody('.copilot-citation'))
const tokenOnlySurfaces = !hexInMessage && !hexInCitation

const renderPass = hasRtl && hasSurfaceClass && hasMessageClass && hasCitationClass && hasArabicText
const remapPass = Object.values(remap).every(Boolean)
const contractPass = remapPass && shadowsNeutralized && tajawalUnderRtl && messageNoShadow && citationNoShadow && tokenOnlySurfaces

const result = {
  gate: 'GATE 2 — RTL + token fidelity (non-visual evidence; visual confirmation pending orchestrator)',
  timestamp: new Date().toISOString(),
  renderEvidence: {
    dirRtlPresent: hasRtl,
    arabicScriptPresent: hasArabicText,
    surfaceClassPresent: hasSurfaceClass,
    messageClassPresent: hasMessageClass,
    citationClassPresent: hasCitationClass,
    pass: renderPass,
  },
  tokenRemapContract: {
    copilotKitVarsRemappedToTokens: remap,
    shadowVarsNeutralizedToNone: shadowsNeutralized,
    tajawalAppliedUnderRtl: tajawalUnderRtl,
    messageSurfaceNoCardShadow: messageNoShadow,
    citationSurfaceNoCardShadow: citationNoShadow,
    surfacesTokenOnlyNoRawHex: tokenOnlySurfaces,
    pass: contractPass,
  },
  overallNonVisualPass: renderPass && contractPass,
  pendingHumanVisual:
    'Orchestrator MUST open the runnable render at 1024px in Arabic and confirm: RTL layout flip, Tajawal face, zero visible card shadow. See README.md.',
}

writeFileSync(path.join(here, 'gate2-dom-result.json'), JSON.stringify(result, null, 2))
// eslint-disable-next-line no-console
console.log(JSON.stringify(result, null, 2))
if (!(renderPass && contractPass)) process.exitCode = 1
