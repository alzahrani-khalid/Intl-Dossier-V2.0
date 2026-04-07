// @covers TEST-02
import { test, expect } from './support/fixtures'
import EngagementPage, { type EngagementStage } from './support/pages/EngagementPage'

const SEED_DOSSIER_ID = process.env.E2E_SEED_DOSSIER_ID ?? ''

test.describe('TEST-02 engagement lifecycle', () => {
  test('creates engagement and transitions through lifecycle @mobile', async ({
    analystPage,
    uniqueId,
  }) => {
    test.skip(SEED_DOSSIER_ID === '', 'E2E_SEED_DOSSIER_ID env var not set')
    const engagements = new EngagementPage(analystPage)
    const title = uniqueId('engagement')

    await engagements.goto()
    await engagements.create({ title, dossierId: SEED_DOSSIER_ID, type: 'consultation' })

    const row = analystPage.getByRole('row', { name: new RegExp(title, 'i') })
    await expect(row).toBeVisible()
    await expect(row.getByText(/planning|التخطيط/i)).toBeVisible()

    await row.getByRole('link', { name: new RegExp(title, 'i') }).click()

    const stages: readonly EngagementStage[] = ['active', 'completed']
    for (const stage of stages) {
      await engagements.transitionTo(stage)
      await expect(
        analystPage.getByTestId('engagement-status-badge').or(
          analystPage.getByRole('status', { name: new RegExp(stage, 'i') }),
        ),
      ).toContainText(new RegExp(stage, 'i'))
    }
  })
})
