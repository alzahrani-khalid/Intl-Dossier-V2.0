// @covers TEST-08
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { test, expect } from './support/fixtures'
import DossierListPage from './support/pages/DossierListPage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'

test.describe('TEST-08 dossier export/import', () => {
  test('exports dossier list to CSV and re-imports a modified copy', async ({
    adminPage,
    uniqueId,
  }) => {
    const list = new DossierListPage(adminPage)
    await list.goto()

    // --- Export ---
    const download = await list.exportCsv()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-dossier-csv-'))
    const exportPath = path.join(tmpDir, 'export.csv')
    await download.saveAs(exportPath)

    expect(fs.existsSync(exportPath)).toBe(true)
    const csv = fs.readFileSync(exportPath, 'utf8')
    const lines = csv.split(/\r?\n/).filter((line) => line.length > 0)
    // Header row plus at least one seed dossier row.
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[0]).toMatch(/name/i)
    expect(csv).toContain(SEED_DOSSIER_NAME)

    // --- Re-import with a unique rename on the first data row ---
    const importedName = uniqueId('imp')
    const header = lines[0]
    const dataRows = lines.slice(1)
    // Rename the first seed row to a unique e2e- identifier so cleanup
    // can pick it up via cleanupE2eEntities('e2e-').
    const firstRow = dataRows[0].replace(/"?[^",]+"?/, `"${importedName}"`)
    const importPath = path.join(tmpDir, 'import.csv')
    fs.writeFileSync(importPath, [header, firstRow].join('\n'), 'utf8')

    await list.importCsv(importPath)
    await expect(
      adminPage.getByRole('status').filter({ hasText: /import|success|نجح/i }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
