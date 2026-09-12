// @covers COPY-06 (criterion 6)
//
// Phase 98 — criterion 6 oracle. Cloned from `96-calendar-family.spec.ts`: header discipline,
// inline auth, `--no-deps`, DOM assertions.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 6 / D-11): the default mutation success toast is
// produced via `t()` and renders LOCALIZED in both locales on a REAL mutation. The hardcoded
// `toast.success('Operation completed successfully')` at `frontend/src/lib/query-client.ts:69-72`
// is gone. Generic-but-localized is the accepted end state; per-mutation specific copy is
// explicitly OUT (D-11, `RULING-P98A2-01-SCOPE` F1-b).
//
// ORACLE POPULATION DEFINITION. ONE real mutation per locale, observed through sonner's own DOM
// (`[data-sonner-toast]`; the single `SonnerToaster` mounts at `App.tsx:51`). The mutation is a
// KANBAN STAGE MOVE ON A TASK CARD, driven at /kanban by the proven @dnd-kit pointer sequence.
//
// WHY THIS MUTATION AND NOT ANOTHER — the derivation, because a windowed scan produced a false
// negative once already and the re-derivation instrument is "grep the WHOLE hook file":
//   - `useUnifiedKanbanStatusUpdate` (`hooks/useUnifiedKanban.ts` ~:388) declares `onError` (~:547)
//     and `onSettled` and NO `onSuccess` anywhere in the file (`command grep -n "onSuccess"` over
//     the whole file returns exactly ONE line, :574, and that line is a COMMENT). TanStack
//     shallow-merges `{...defaultOptions.mutations, ...options}`, so the missing key lets the
//     global default toast fire. That is the property this oracle depends on.
//   - The ~:574 comment ("no global onSuccess") describes the D-33 REFUSAL path for COMMITMENT
//     drops. A refusal never creates a mutation, so a commitment drop would prove nothing — and it
//     carries the `aa_commitments` no-`review` constraint hazard besides. This spec drives
//     `source === 'task'` ONLY, and picks its target stage from {todo, in_progress, review} so a
//     completion stamp is never written.
//   - The entity-link mutations are DISQUALIFIED: `hooks/useEntityLinks.ts` defines its OWN
//     `onSuccess` at :123, :181, :219, :369, and a per-mutation `onSuccess` REPLACES the global
//     default — it never merges.
//
// IDEMPOTENCE. The card is moved to an adjacent stage and then moved back, so repeated runs do not
// walk a real work item across the board.
//
// STATED EXCLUSIONS. This oracle asserts nothing about per-mutation copy, toast position, timing,
// colors or the close button — all inherited sonner chrome, untouched by this phase. It also
// asserts nothing about the error toast; `onError` was already localized before this phase.
//
// LOCALE AND ROLE: both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL). The HEAD negative
// control is the `ar` leg: pre-repair the English literal renders under Arabic, which is what
// proves this probe watches the right toast rather than any toast.
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import enKanban from '../../frontend/src/i18n/en/unified-kanban.json'
import arKanban from '../../frontend/src/i18n/ar/unified-kanban.json'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000
const TOAST_TIMEOUT = 20_000

/** 98-UI-SPEC C6, ratified by D-30. */
const EXPECTED_TOAST = { en: 'Changes saved', ar: 'تم حفظ التغييرات' } as const
/** The literal criterion 6 removes. It must appear in NEITHER leg after the repair. */
const BANNED_LITERAL = 'Operation completed successfully'

/** Stages safe to move a task between: none of them writes a completion stamp. */
const SAFE_STAGES: readonly string[] = ['todo', 'in_progress', 'review']

const TASK_LABEL = {
  en: (enKanban as { sources: { task: string } }).sources.task,
  ar: (arKanban as { sources: { task: string } }).sources.task,
} as const

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

/**
 * The @dnd-kit pointer sequence. `locator.dragTo()` emits HTML5 drag events, which @dnd-kit does
 * not listen for; the documented workaround is mouse.down → a nudge past the 8px activation
 * distance → a stepped move → mouse.up. Mirrors `tests/e2e/support/pages/WorkItemKanbanPage.ts`.
 */
const dragTo = async (page: Page, card: Locator, target: Locator): Promise<void> => {
  await card.scrollIntoViewIfNeeded()
  const cardBox = await card.boundingBox()
  const targetBox = await target.boundingBox()
  if (cardBox === null || targetBox === null) {
    throw new Error('drag: missing bounding box — the board did not render a draggable card')
  }
  const startX = cardBox.x + cardBox.width / 2
  const startY = cardBox.y + cardBox.height / 2
  const endX = targetBox.x + targetBox.width / 2
  const endY = targetBox.y + Math.min(120, targetBox.height / 2)

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 12, startY + 12, { steps: 5 })
  await page.mouse.move(endX, endY, { steps: 25 })
  // A second settling move over the target: @dnd-kit resolves the `over` droppable from
  // pointermove collision detection, and a drop on the first frame at a new position can land
  // before the collision is computed. Observed as a silent no-op drop.
  await page.mouse.move(endX, endY + 4, { steps: 5 })
  await page.waitForTimeout(400)
  await page.mouse.up()
  await page.waitForTimeout(400)
}

test.describe('criterion 6 — the default success toast is localized on a real mutation', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  // Inline auth + board load + two drags with settle pauses. Under the 30s default this test
  // timed out before the toast could be read — a red that names the clock, not the copy.
  test.beforeEach(() => {
    test.setTimeout(180_000)
  })

  for (const lng of ['en', 'ar'] as const) {
    test(`a real task stage move raises the localized toast [${lng}]`, async ({ page }) => {
      await signInInline(page)
      await page.goto(`/kanban?lng=${lng}`)

      const columns = page.locator('[data-droppable-id]')
      await expect(columns.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

      // PRECONDITION, asserted rather than assumed: a TASK card must exist. Its kind chip carries
      // `unified-kanban:sources.task` in the session language — read from the bundle, never
      // hardcoded, so the ar leg does not depend on a translation this spec guessed.
      const taskCard = page
        .locator('[data-card-id]')
        .filter({ hasText: TASK_LABEL[lng] })
        .first()
      await expect(
        taskCard,
        `no task card on /kanban under ${lng} — the mutation could not be driven`,
      ).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const originStage = await taskCard.evaluate(
        (el) => el.closest('[data-droppable-id]')?.getAttribute('data-droppable-id') ?? '',
      )
      expect(originStage, 'task card is not inside a droppable column').not.toBe('')
      const targetStage = SAFE_STAGES.find((stage) => stage !== originStage)
      expect(targetStage, 'no safe target stage available').toBeDefined()

      await dragTo(page, taskCard, page.locator(`[data-droppable-id="${targetStage ?? ''}"]`))

      const toast = page.locator('[data-sonner-toast]').first()
      await expect(toast, `no toast raised by the stage move under ${lng}`).toBeVisible({
        timeout: TOAST_TIMEOUT,
      })
      const toastText = (await toast.innerText()).trim()

      expect(toastText, `toast copy under ${lng}`).toContain(EXPECTED_TOAST[lng])
      expect(toastText, `the hardcoded English literal reached the toast under ${lng}`).not.toContain(
        BANNED_LITERAL,
      )

      const body = (await page.locator('body').innerText()) ?? ''
      expect(body, `the hardcoded English literal reached the page under ${lng}`).not.toContain(
        BANNED_LITERAL,
      )

      // Idempotence: put the item back where it was found.
      const movedCard = page.locator('[data-card-id]').filter({ hasText: TASK_LABEL[lng] }).first()
      await dragTo(page, movedCard, page.locator(`[data-droppable-id="${originStage}"]`))
    })
  }
})
