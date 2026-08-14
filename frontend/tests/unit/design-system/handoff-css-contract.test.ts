import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const readCss = (relativePath: string): string =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')

const cssBlock = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`, 'm').exec(css)
  return match?.groups?.body ?? ''
}

describe('handoff CSS contract', () => {
  it('keeps Linear labels and table headers on body typography, not mono', () => {
    const css = readCss('src/styles/list-pages.css')

    const label = cssBlock(css, '.dir-linear .label')
    const tableHeader = cssBlock(css, '.dir-linear .tbl th')

    expect(label).toContain('font-family: var(--font-body)')
    expect(label).not.toContain('font-family: var(--font-mono)')
    expect(tableHeader).toContain('font-family: var(--font-body)')
    expect(tableHeader).not.toContain('font-family: var(--font-mono)')
  })

  it('does not put default shadows on base cards', () => {
    const css = readCss('src/styles/list-pages.css')
    const baseCard = cssBlock(css, '.card')

    expect(baseCard).not.toMatch(/box-shadow\s*:/)
  })

  it('keeps drawer and dialog overlays blur-free', () => {
    const css = readCss('src/styles/list-pages.css')
    const sheetSource = readCss('src/components/ui/sheet.tsx')
    const bottomSheetSource = readCss('src/components/ui/bottom-sheet.tsx')
    const overlayBlock = cssBlock(css, '.id-dialog-content')

    expect(css).not.toContain('backdrop-filter: blur')
    expect(overlayBlock).not.toContain('backdrop-filter')
    expect(sheetSource).not.toContain('backdrop-blur')
    expect(bottomSheetSource).not.toContain('backdrop-blur')
  })

  it('exposes legacy semantic Tailwind aliases through handoff tokens', () => {
    const css = readCss('src/index.css')

    for (const alias of [
      '--color-accent-foreground: var(--accent-fg)',
      '--color-success: var(--ok)',
      '--color-success-foreground: var(--accent-fg)',
      '--color-warning: var(--warn)',
      '--color-warning-foreground: var(--accent-fg)',
      '--color-info-foreground: var(--accent-fg)',
    ]) {
      expect(css).toContain(alias)
    }
  })

  it('bridges older literal Tailwind color utilities to handoff semantic tokens', () => {
    const css = readCss('src/styles/list-pages.css')

    expect(css).toContain('legacy-tailwind-token-bridge')
    expect(css).toContain("[class~='text-red-600']")
    expect(css).toContain("[class~='bg-blue-50']")
    expect(css).toContain("[class~='border-gray-200']")
  })

  it('keeps dossier table rows on the desktop five-column grid with fitted chips', () => {
    const css = readCss('src/styles/list-pages.css')

    // 87-06 made the desktop column count driven by DossierTable's computed
    // `--dossier-cols` (F24 column visibility). The five-column template survives
    // as the fallback, so every consumer that sets no columns stays byte-identical.
    expect(css).toContain(
      'grid-template-columns: var(--dossier-cols, auto minmax(0, 1fr) auto auto auto);',
    )
    expect(cssBlock(css, '.dossier-row > .chip')).toContain('width: fit-content')
  })
})
