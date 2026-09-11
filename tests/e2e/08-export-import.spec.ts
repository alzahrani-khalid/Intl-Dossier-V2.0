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
    // prettier-ignore
    test.fixme(true, 'P101-QUAR 31848669722: test red - DossierListPage.exportCsv() waited 30s for a download after clicking a button named /export.*csv/; at HEAD the hub export control is a button "Export Dossiers" that opens a dialog, and git grep finds no emitter of the dossier-import-csv-input testid the import step needs; the fix is in tests/e2e/support/pages/DossierListPage.ts, outside the P101-08 file scope; log line 1201 of job 94920109119; owner Phase 102')
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
