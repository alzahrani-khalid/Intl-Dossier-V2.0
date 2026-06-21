/**
 * EVAL-01 — bilingual briefing quality rubric (Phase 74, Plan 74-09).
 *
 * D4 (LOCKED): graded by the on-prem gemma-4-12B judge (`getCopilotModel()` via
 * evals/lib/judge.ts) — zero-egress, self-grading bias accepted. D5 (LOCKED): authored
 * golden EN+AR fixtures targeting the SUPPORTED `persist_brief`/propose-brief content shape
 * (`BriefLang = { summary, sections:[{title,content}] }`), NOT the retired backend
 * generator. Gate: average rubric score >= 0.80 (BRIEF_MIN) on every golden fixture; the
 * `_degraded.json` fixture MUST fall below the gate (positive-failure proof).
 *
 * D6 (LOCKED) CI split: the live judge scoring is DEPLOY-GATED behind isJudgeConfigured()
 * (EVAL_AI_URL / VLLM_BASE_URL). When the GPU/gemma host is absent those assertions SKIP —
 * the always-run part is a structural + positive-failure check (golden + candidate parse to
 * the brief shape; the degraded fixture is structurally KNOWN-bad), so CI stays green now.
 *
 * Requirement: EVAL-01. Subject: agent-runtime/src/mastra/tools/propose-brief.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { judgeRubric, isJudgeConfigured } from './lib/judge.js'

// EVAL-01 threshold (D4/D5). Named constant — no magic number in the assertions.
const BRIEF_MIN = 0.8

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'briefs')

// One language of the propose-brief BriefContent envelope (BriefLang).
interface BriefSection {
  title: string
  content: string
}
interface BriefLang {
  summary: string
  sections: BriefSection[]
}
interface BriefFixture {
  lang: 'en' | 'ar'
  dossierType: string
  degraded?: boolean
  golden: BriefLang
  candidate: BriefLang
}

// The rubric dimensions the judge scores each brief on.
const DIMENSIONS: ReadonlyArray<{ dimension: string; rubricInstruction: string }> = [
  {
    dimension: 'completeness',
    rubricInstruction:
      'Does the candidate cover every key fact and section present in the reference (no major omission)?',
  },
  {
    dimension: 'accuracy',
    rubricInstruction:
      'Are the candidate facts and figures consistent with the reference, with no contradictions or invented claims?',
  },
  {
    dimension: 'language_quality',
    rubricInstruction:
      'Is the candidate written fluently and entirely in the SAME language as the reference, in a neutral diplomatic register?',
  },
]

function loadFixture(file: string): BriefFixture {
  return JSON.parse(readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as BriefFixture
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

/** Deterministic plain-text rendering of a brief language for the judge's candidate/reference. */
function renderBrief(brief: BriefLang): string {
  const body = brief.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n')
  return `SUMMARY: ${brief.summary}\n\n${body}`
}

// Golden fixtures = every *.json under fixtures/briefs EXCEPT leading-underscore ones.
// Dropping a new EN/AR brief JSON in this dir auto-extends coverage (toward the D5 ~15-30).
const goldenFixtureFiles = readdirSync(FIXTURE_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .sort()

describe('EVAL-01 bilingual briefing quality (propose-brief content shape, D4/D5)', () => {
  // ── CI-mode (always runs, no judge needed) — structural + bilingual coverage ──────────
  it('authored golden EN and AR brief fixtures (bilingual coverage)', () => {
    const langs = new Set(goldenFixtureFiles.map((f) => loadFixture(f).lang))
    expect(langs.has('en')).toBe(true)
    expect(langs.has('ar')).toBe(true)
  })

  it.each(goldenFixtureFiles)(
    'golden fixture %s has a well-formed golden + candidate brief (structural)',
    (file) => {
      const fx = loadFixture(file)
      expect(isBriefLang(fx.golden)).toBe(true)
      expect(isBriefLang(fx.candidate)).toBe(true)
      // A passing candidate must carry real content (non-empty summary + at least one section).
      expect(fx.candidate.summary.trim().length).toBeGreaterThan(0)
      expect(fx.candidate.sections.length).toBeGreaterThan(0)
    },
  )

  it('the degraded fixture is structurally KNOWN-bad (positive-failure, CI-runnable)', () => {
    const fx = loadFixture('_degraded.json')
    expect(fx.degraded).toBe(true)
    // KNOWN-bad: empty summary OR no sections OR wrong-language sections vs the EN golden.
    const emptySummary = fx.candidate.summary.trim().length === 0
    const noSections = fx.candidate.sections.length === 0
    const wrongLanguage =
      fx.lang === 'en' &&
      fx.candidate.sections.some((s) => /[؀-ۿ]/.test(s.title) || /[؀-ۿ]/.test(s.content))
    expect(emptySummary || noSections || wrongLanguage).toBe(true)
  })

  // ── Live-mode (DEPLOY-GATED, D6) — generative judge scoring, skipped when host absent ──
  it.skipIf(!isJudgeConfigured()).each(goldenFixtureFiles)(
    'golden fixture %s scores >= BRIEF_MIN on the on-prem judge (deploy-gated)',
    async (file) => {
      const fx = loadFixture(file)
      const reference = renderBrief(fx.golden)
      const candidate = renderBrief(fx.candidate)
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
      expect(avg).toBeGreaterThanOrEqual(BRIEF_MIN)
    },
  )

  it.skipIf(!isJudgeConfigured())(
    'REJECTS the degraded fixture on the on-prem judge (deploy-gated positive-failure)',
    async () => {
      const fx = loadFixture('_degraded.json')
      const reference = renderBrief(fx.golden)
      const candidate = renderBrief(fx.candidate)
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
      expect(avg).toBeLessThan(BRIEF_MIN)
    },
  )
})
