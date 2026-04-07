// @covers TEST-09
import { test, expect } from './support/fixtures'
import BriefingPage from './support/pages/BriefingPage'

const SEED_DOSSIER_ID = process.env.E2E_SEED_DOSSIER_ID ?? ''

test.describe('TEST-09 AI briefing generation', () => {
  test.skip(
    SEED_DOSSIER_ID.length === 0,
    'E2E_SEED_DOSSIER_ID unset — seed dossier required for briefing test',
  )

  test('generates a briefing from the Docs tab (stubbed LLM)', async ({
    analystPage,
  }) => {
    // Stub BOTH the app-level briefing API and any direct AnythingLLM call,
    // so the test never reaches a real LLM. The stub returns a deterministic
    // payload the app can render immediately.
    const stubBriefing = {
      id: 'stub-briefing-1',
      status: 'ready' as const,
      content: 'Stub briefing content for E2E',
    }
    await analystPage.route('**/api/briefings/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stubBriefing),
      })
    })
    await analystPage.route('**/api/anythingllm/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ textResponse: stubBriefing.content }),
      })
    })

    const briefing = new BriefingPage(analystPage)
    await briefing.gotoForDossier(SEED_DOSSIER_ID)
    await briefing.openDocsTab()
    await briefing.clickGenerateBriefing()
    await briefing.waitForBriefingReady()

    await expect(analystPage.getByText('Stub briefing content for E2E')).toBeVisible()
  })
})
