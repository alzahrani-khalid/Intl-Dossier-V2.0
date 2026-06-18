import { test, expect } from '@playwright/test'

/**
 * Wave-0 E2E SCAFFOLD (Plan 72-01) — copilot drawer flows. SKIPPED until the drawer
 * lands (Wave 6, Plan 72-08). Authored now so the Nyquist sampling rate has concrete
 * targets per 72-VALIDATION.md Per-Requirement Verification Map.
 *
 * Verification reality (MEMORY / 72-VALIDATION): RLS denial returns an EMPTY 200, not
 * an error status. Force errors via CDP `Network.setBlockedURLs` and assert
 * `role="alert"` / neutral empty copy — NEVER assert on HTTP status. Screenshots can
 * wedge; prefer DOM assertions. Language persists under localStorage['id.locale']
 * (NOT i18nextLng); switch to AR via the ع topbar button.
 *
 * These stay RED/skipped until 72-08 wires the drawer, FAB, and Cmd+K copilot entry.
 */

// AGENT-01 — converse from the primary surface AND via Cmd+K.
test.describe.skip('AGENT-01: copilot drawer + Cmd+K entry (RED until 72-08)', () => {
  test('opens the drawer from the topbar FAB and streams a reply', async ({ page }) => {
    await page.goto('/')
    // Topbar copilot FAB — aria-label from the copilot namespace ("Ask the copilot").
    await page.getByRole('button', { name: /Ask the copilot|اسأل المساعد/ }).click()
    const composer = page.getByRole('textbox', { name: /Send message|إرسال الرسالة|message/i })
    await expect(composer).toBeVisible()
    await composer.fill('What signals are on this dossier?')
    await page.getByRole('button', { name: /Send message|إرسال الرسالة/ }).click()
    // Assert a streamed assistant turn appears (DOM, not screenshot).
    await expect(page.locator('[data-role="assistant"], .copilot-message').first()).toBeVisible({
      timeout: 30000,
    })
  })

  test('Cmd+K on a dossier pre-fills dossier context', async ({ page }) => {
    await page.goto('/dossiers/countries/__SEED_DOSSIER_ID__')
    await page.keyboard.press('Meta+k')
    // The copilot command row that pre-fills the current dossier (D-05).
    await page
      .getByRole('option', { name: /Ask the copilot about this dossier|اسأل المساعد عن هذا الملف/ })
      .click()
    // Drawer opens with the dossier as readable context.
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

// AGENT-06 — EN + AR reply with correct RTL at analyst-workstation widths.
test.describe.skip('AGENT-06: bilingual EN/AR + dir=rtl (RED until 72-08)', () => {
  for (const width of [1024, 1400]) {
    test(`Arabic drawer renders dir="rtl" + Tajawal at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => window.localStorage.setItem('id.locale', 'ar'))
      await page.goto('/')
      await page.getByRole('button', { name: /اسأل المساعد/ }).click()
      const drawer = page.getByRole('dialog')
      await expect(drawer).toHaveAttribute('dir', 'rtl')
      // Tajawal applies under html[dir="rtl"]; assert the computed font-family.
      const fontFamily = await drawer.evaluate((el) => getComputedStyle(el).fontFamily)
      expect(fontFamily.toLowerCase()).toContain('tajawal')
    })
  }
})

// AGENT-03 (forced-error) — RLS denial → neutral empty, never a clearance leak.
test.describe.skip('AGENT-03: forced-error neutral empty via CDP (RED until 72-08)', () => {
  test('blocked RAG/tool call surfaces role="alert" neutral copy, no leak', async ({ page }) => {
    // CDP session to block the copilot tool/RAG endpoint at the network layer.
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    // Block the agent-runtime copilot route (nginx-proxied). '*' globs cross '/'.
    await client.send('Network.setBlockedURLs', {
      urls: ['*/api/copilot/*', '*hybrid_rag_search*', '*read_signals*'],
    })

    await page.goto('/')
    await page.getByRole('button', { name: /Ask the copilot|اسأل المساعد/ }).click()
    const composer = page.getByRole('textbox', { name: /Send message|message/i })
    await composer.fill('Find restricted intelligence')
    await page.getByRole('button', { name: /Send message|إرسال الرسالة/ }).click()

    // Wait through TanStack retries, then assert the neutral error/empty state (DOM).
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 30000 })

    // INDISTINGUISHABLE-EMPTY: the rendered drawer must NEVER reveal clearance filtering.
    const drawerText = await page.getByRole('dialog').innerText()
    expect(drawerText).not.toMatch(/clearance|filtered|restricted/i)

    await client.send('Network.setBlockedURLs', { urls: [] })
  })
})
