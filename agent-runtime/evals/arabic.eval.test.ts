/**
 * EVAL-03 — Arabic quality rubric (Phase 74, Plan 74-09).
 *
 * D4 (LOCKED): graded by the on-prem gemma-4-12B judge (`getCopilotModel()` via
 * evals/lib/judge.ts) — zero-egress. This rubric scores Arabic output on arabic_fluency /
 * terminology / rtl_correctness against a fluent golden Arabic reference. Gate: average
 * rubric score >= 0.75 (ARABIC_MIN) on every golden case; the `_degraded.json` case (Latin
 * digits, machine-literal phrasing, mixed Latin script) MUST fall below the gate.
 *
 * D6 (LOCKED) CI split: the live judge scoring is DEPLOY-GATED behind isJudgeConfigured()
 * (EVAL_AI_URL / VLLM_BASE_URL); when the GPU/gemma host is absent it SKIPS. The always-run
 * part is structural + positive-failure (golden + candidate parse to the brief shape; the
 * degraded case carries Latin-digit + mixed-script markers proving it is KNOWN-bad), so CI
 * stays green now.
 *
 * Requirement: EVAL-03. Subject: Arabic output of the supported propose-brief path.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { judgeRubric, isJudgeConfigured } from './lib/judge.js'

// EVAL-03 threshold (D4). Named constant — no magic number in the assertions.
const ARABIC_MIN = 0.75

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'arabic')

interface BriefSection {
  title: string
  content: string
}
interface BriefLang {
  summary: string
  sections: BriefSection[]
}
interface ArabicCase {
  id: string
  topic?: string
  golden: BriefLang
  candidate: BriefLang
}
interface ArabicFixture {
  degraded?: boolean
  cases: ArabicCase[]
}

// Arabic-Indic digits ٠-٩ vs ASCII digits 0-9; Latin letters used to flag mixed-script.
const ARABIC_INDIC_DIGIT = /[٠-٩]/
const ASCII_DIGIT = /[0-9]/
const LATIN_LETTER = /[A-Za-z]/

const DIMENSIONS: ReadonlyArray<{ dimension: string; rubricInstruction: string }> = [
  {
    dimension: 'arabic_fluency',
    rubricInstruction:
      'Is the candidate natural, idiomatic Modern Standard Arabic (not word-for-word machine translation) compared to the reference?',
  },
  {
    dimension: 'terminology',
    rubricInstruction:
      'Does the candidate use correct, consistent diplomatic/economic Arabic terminology matching the reference?',
  },
  {
    dimension: 'rtl_correctness',
    rubricInstruction:
      'Is the candidate written entirely in Arabic script with Arabic-Indic numerals, with no stray Latin-script words or Latin digits?',
  },
]

function loadFixture(file: string): ArabicFixture {
  return JSON.parse(readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as ArabicFixture
}

function isBriefLang(value: unknown): value is BriefLang {
  if (value === null || typeof value !== 'object') return false
  const v = value as { summary?: unknown; sections?: unknown }
  if (typeof v.summary !== 'string') return false
  if (!Array.isArray(v.sections)) return false
  return v.sections.every(
    (s) =>
      s !== null &&
      typeof s === 'object' &&
      typeof (s as BriefSection).title === 'string' &&
      typeof (s as BriefSection).content === 'string',
  )
}

/** Flatten a case's candidate (summary + every section) into one string for marker checks / the judge. */
function flattenCandidate(c: ArabicCase): string {
  return [c.candidate.summary, ...c.candidate.sections.flatMap((s) => [s.title, s.content])].join('\n')
}

function renderBrief(brief: BriefLang): string {
  const body = brief.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n')
  return `SUMMARY: ${brief.summary}\n\n${body}`
}

const goldenCases = loadFixture('fluency-cases.json').cases

describe('EVAL-03 Arabic quality (fluency / terminology / RTL, D4)', () => {
  // ── CI-mode (always runs, no judge needed) — structural + script sanity ───────────────
  it('authored at least one golden Arabic case', () => {
    expect(goldenCases.length).toBeGreaterThan(0)
  })

  it.each(goldenCases.map((c) => [c.id, c] as const))(
    'golden case %s is well-formed Arabic (structural + Arabic-Indic numerals, no Latin)',
    (_id, c) => {
      expect(isBriefLang(c.golden)).toBe(true)
      expect(isBriefLang(c.candidate)).toBe(true)
      const text = flattenCandidate(c)
      // A passing Arabic candidate uses Arabic-Indic digits and no Latin letters or ASCII digits.
      expect(LATIN_LETTER.test(text)).toBe(false)
      expect(ASCII_DIGIT.test(text)).toBe(false)
      if (/\d|[٠-٩]/.test(text)) {
        expect(ARABIC_INDIC_DIGIT.test(text)).toBe(true)
      }
    },
  )

  it('the degraded fixture is structurally KNOWN-bad (Latin digits + mixed script, CI-runnable)', () => {
    const fx = loadFixture('_degraded.json')
    expect(fx.degraded).toBe(true)
    const text = fx.cases.map(flattenCandidate).join('\n')
    // KNOWN-bad markers: ASCII digits where Arabic-Indic are expected AND Latin-script words.
    expect(ASCII_DIGIT.test(text)).toBe(true)
    expect(LATIN_LETTER.test(text)).toBe(true)
  })

  // ── Live-mode (DEPLOY-GATED, D6) — generative judge scoring, skipped when host absent ──
  it.skipIf(!isJudgeConfigured()).each(goldenCases.map((c) => [c.id, c] as const))(
    'golden case %s scores >= ARABIC_MIN on the on-prem judge (deploy-gated)',
    async (_id, c) => {
      const reference = renderBrief(c.golden)
      const candidate = renderBrief(c.candidate)
      const scores = await Promise.all(
        DIMENSIONS.map((d) =>
          judgeRubric({
            dimension: d.dimension,
            rubricInstruction: d.rubricInstruction,
            candidate,
            reference,
          }),
        ),
      )
      const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      expect(avg).toBeGreaterThanOrEqual(ARABIC_MIN)
    },
  )

  it.skipIf(!isJudgeConfigured())(
    'REJECTS the degraded Arabic on the on-prem judge (deploy-gated positive-failure)',
    async () => {
      const fx = loadFixture('_degraded.json')
      const c = fx.cases[0]
      const reference = renderBrief(c.golden)
      const candidate = renderBrief(c.candidate)
      const scores = await Promise.all(
        DIMENSIONS.map((d) =>
          judgeRubric({
            dimension: d.dimension,
            rubricInstruction: d.rubricInstruction,
            candidate,
            reference,
          }),
        ),
      )
      const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      expect(avg).toBeLessThan(ARABIC_MIN)
    },
  )
})
