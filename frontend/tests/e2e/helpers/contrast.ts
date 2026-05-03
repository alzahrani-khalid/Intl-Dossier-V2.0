/**
 * Phase 43 — OKLCH-aware WCAG contrast utility.
 *
 * Used by `qa-sweep-focus-outline.spec.ts` to assert that the resolved
 * `--focus-ring` token clears the WCAG 1.4.11 3:1 non-text contrast
 * threshold against its rendered background. Handles `oklch()`, `rgb()`,
 * `rgba()`, and named CSS colors via `culori`.
 */

import { parse, converter } from 'culori'

const toRgb = converter('rgb')

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const f = (v: number): number => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b)
}

export function computeContrastRatio(foreground: string, background: string): number {
  const fg = toRgb(parse(foreground))
  const bg = toRgb(parse(background))
  if (!fg || !bg) return 0
  const lf = relativeLuminance({ r: fg.r, g: fg.g, b: fg.b })
  const lb = relativeLuminance({ r: bg.r, g: bg.g, b: bg.b })
  const [a, b] = lf > lb ? [lf, lb] : [lb, lf]
  return (a + 0.05) / (b + 0.05)
}

export function parseOklch(
  input: string,
): { l: number; c: number; h: number; alpha: number } | null {
  const parsed = parse(input)
  if (!parsed || parsed.mode !== 'oklch') return null
  return { l: parsed.l ?? 0, c: parsed.c ?? 0, h: parsed.h ?? 0, alpha: parsed.alpha ?? 1 }
}
