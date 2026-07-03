/**
 * SearchableSelect.a11y.test.tsx — Phase 79 Wave 0 accessibility contract test.
 *
 * Written against the CURRENT (pre-rebuild) SearchableSelect so plan 79-04 can
 * prove the Phase 75 ARIA/validation contract is PRESERVED, not merely present.
 * Each assertion maps to the 12-attribute ARIA contract + keyboard/focus contract
 * captured in 79-RESEARCH.md ("The ARIA/Validation Contract Checklist").
 *
 * WAVE-0 EVIDENCE (2026-07-03) — recorded here + in 79-01-SUMMARY.md so 79-04
 * branches on it:
 *   - T-79-01 (nested-interactive): NOT flagged. axe is CLEAN on the selected-
 *     value render (see the green "selected value + error" test): the clear
 *     `<span role="button">` has no tabindex, so axe does not treat it as a
 *     nested focusable control (79-RESEARCH Pitfall 1's own note). The clear
 *     affordance can be preserved verbatim in 79-04.
 *   - T-79-02 (NEW): the post-Phase-78 trigger is a HeroUI v3 React Aria Button,
 *     which STRIPS role="combobox", aria-invalid and aria-required from the
 *     rendered <button> (written in JSX at SearchableSelect lines 434/440/441 but
 *     never reaching the DOM). cmdk also overrides the CommandList id with its own
 *     `listId`, so the trigger's aria-controls references a non-existent element.
 *     This is a live a11y regression. The skipped T-79-02 test is the executable
 *     checklist 79-04 MUST restore + unskip.
 *   - T-79-03 (NEW): the OPEN state carries a pre-existing SERIOUS axe violation
 *     `aria-dialog-name` — the Radix PopoverContent renders role="dialog" with no
 *     accessible name (`region` is jsdom-only moderate noise). The skipped
 *     open-state axe test is owned by 79-04 (name the popover or drop the dialog
 *     role, then unskip).
 *
 * Pattern sources:
 *   - frontend/src/components/layout/AppShell.a11y.test.tsx (jest-axe matrix)
 *   - frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx (useDirection mock)
 *
 * IMPORTANT: this file renders the REAL cmdk + Radix Popover primitives — the
 * listbox / option / role semantics ARE the contract under test. Do NOT mock
 * @/components/ui/command or @/components/ui/popover here (79-RESEARCH Pitfall 3).
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// jsdom gaps for real cmdk + Radix Popover (tests/setup.ts covers only
// ResizeObserver / matchMedia). 79-RESEARCH Pitfall 3.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
})

// Direction matrix — mutable so the C1 bilingual rows flip RTL per row.
// Only @/hooks/useDirection is mocked; react-i18next stays globally mocked
// (tests/setup.ts) and returns RAW KEYS for unmapped smart-input:* keys
// (79-RESEARCH Pitfall 2) — the aria-label assertions below assert those raw
// keys deliberately.
const directionMock = { isRTL: false }
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({
    direction: directionMock.isRTL ? 'rtl' : 'ltr',
    isRTL: directionMock.isRTL,
  }),
}))

afterEach(() => {
  directionMock.isRTL = false
})

import { SearchableSelect } from '../SearchableSelect'

// Inline fixture — no UserPicker render, no supabase (avoids MSW
// onUnhandledRequest: 'error', 79-RESEARCH Pitfall 4).
const options = [
  { value: 'u1', label: 'Alia Hassan', description: 'alia@example.com' },
  { value: 'u2', label: 'Badr Khalid', description: 'badr@example.com' },
]

// The trigger's current runtime role is `button` (T-79-02: React Aria Button
// strips the JSX role="combobox"). Locate it by its label-derived accessible
// name. 79-04's rebuild will make `getByRole('combobox')` resolve here (unskip
// the T-79-02 test below).
const getTrigger = (): HTMLElement => screen.getByRole('button', { name: /assignee/i })

describe('SearchableSelect — Phase 75 contract (Wave 0 baseline)', () => {
  // ---- Group A: trigger contract attrs 2–6 that survive today (closed → open) ----
  it('exposes the surviving trigger + listbox contract (attrs 2,3,4,5,6)', async () => {
    const user = userEvent.setup()
    render(<SearchableSelect options={options} label="Assignee" required error="Required" />)

    const trigger = getTrigger()
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox') // attr 4
    expect(trigger).toHaveAttribute('aria-expanded', 'false') // attr 3 (closed)
    expect(trigger).toHaveAttribute('aria-labelledby') // attr 5 (label set)
    expect(trigger.getAttribute('aria-describedby')).toContain('-error') // attr 6 → errorId
    // attr 2: aria-controls is present today, but cmdk overrides the CommandList
    // id with its own `listId`, so the strict trigger↔listbox id equality is
    // BROKEN at runtime — the T-79-02 restore test owns that assertion for 79-04.
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true') // attr 3 (open)
    expect(await screen.findByRole('listbox')).toBeInTheDocument() // cmdk-supplied
  })

  // ---- T-79-02 (NEW Wave-0 finding): the trigger contract the HeroUI v3 React
  //      Aria Button strips at runtime. 79-04's rebuild MUST restore role=combobox
  //      + aria-invalid + aria-required on the trigger AND wire aria-controls to
  //      the real listbox id, then unskip this test. ----
  it.skip('T-79-02 (79-04 must restore + unskip): full combobox trigger contract (attrs 1,2,7,8)', async () => {
    const user = userEvent.setup()
    render(<SearchableSelect options={options} label="Assignee" required error="Required" />)
    const trigger = screen.getByRole('combobox') // attr 1 (role=combobox)
    expect(trigger).toHaveAttribute('aria-invalid', 'true') // attr 7
    expect(trigger).toHaveAttribute('aria-required', 'true') // attr 8
    const controls = trigger.getAttribute('aria-controls') // attr 2
    await user.click(trigger)
    expect(await screen.findByRole('listbox')).toHaveAttribute('id', controls as string)
  })

  // ---- Group B: clear / required-marker / alert contract, attrs 9–12 ----
  it('exposes the clear, required-marker, and alert contract (attrs 9–12)', () => {
    render(
      <SearchableSelect options={options} label="Assignee" value="u1" error="Required" required />,
    )

    // attr 9 + 10: clear affordance queryable by its (raw-key) accessible name
    const clear = screen.getByRole('button', { name: 'smart-input:select.clear' })
    expect(clear).toBeInTheDocument()
    // attr 11: required marker's aria-label resolves to the raw key (Pitfall 2)
    expect(screen.getByText('*')).toHaveAttribute('aria-label', 'common:validation.required')
    // attr 12: role=alert live region, id linked back from the trigger's describedby
    const alert = screen.getByRole('alert')
    const trigger = getTrigger()
    expect(alert.id).toBeTruthy()
    expect(trigger.getAttribute('aria-describedby')).toContain(alert.id)
  })

  // ---- Group C: C1 bilingual role="alert" (error is a caller-resolved string) ----
  it.each([
    ['en', 'This field is required', false],
    ['ar', 'هذا الحقل مطلوب', true],
  ])('announces the validation error via role="alert" (%s)', (_lng, message, rtl) => {
    directionMock.isRTL = rtl as boolean
    render(
      <div dir={rtl ? 'rtl' : 'ltr'}>
        <SearchableSelect options={options} label="Assignee" error={message as string} />
      </div>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(message as string)
  })

  // ---- Group D: C2a keyboard focus order ----
  it('keyboard: open moves focus to the search input, Arrow+Enter selects', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SearchableSelect
        options={options}
        label="Assignee"
        onChange={onChange}
        searchPlaceholder="Search users"
      />,
    )

    const trigger = getTrigger()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('listbox')).toBeInTheDocument()

    // 0ms-timeout focus effect (SearchableSelect lines 287–293) — flush, don't
    // assert synchronously.
    const searchInput = screen.getByPlaceholderText('Search users')
    await waitFor(() => expect(searchInput).toHaveFocus())

    // cmdk auto-highlights the first item; ArrowDown advances the active option,
    // Enter selects it. The exact index is a cmdk internal, so assert a valid
    // option value was selected and onChange fired exactly once.
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toMatch(/^u[12]$/)
  })

  it('keyboard: Escape closes the popover and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<SearchableSelect options={options} label="Assignee" />)

    const trigger = getTrigger()
    await user.click(trigger)
    expect(await screen.findByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  // ---- Group E: C2b axe (zero serious/critical) ----
  // Closed + selected + error is axe-clean today — this is the T-79-01 evidence
  // (nested-interactive NOT flagged on the clear affordance).
  it('has no axe violations — selected value + error (closed)', async () => {
    const { container } = render(
      <SearchableSelect options={options} label="Assignee" value="u1" error="Required" required />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  // Open state — plan Task 1 point 8(b). Evidence run (2026-07-03): the Radix
  // PopoverContent renders role="dialog" with no accessible name → SERIOUS axe
  // `aria-dialog-name`. Pre-existing (Phase-78 primitive), not introduced here.
  // T-79-03: 79-04 must name the popover (or drop the dialog role) and unskip.
  // T-79-03 (79-04 must fix + unskip): the open Radix PopoverContent renders
  // role="dialog" with NO accessible name → SERIOUS axe `aria-dialog-name`.
  // Evidence run (2026-07-03, document scope so the portaled popover is scanned):
  // fails on aria-dialog-name. Pre-existing Phase-78 primitive defect, not
  // introduced here. `region` is disabled — it is a page-level landmark rule that
  // is inapplicable to an isolated component render (harness noise, not a defect).
  // 79-04 names the popover (or drops the dialog role) and unskips this test.
  it.skip('T-79-03 (79-04 must fix + unskip): no axe violations — open state', async () => {
    const user = userEvent.setup()
    render(<SearchableSelect options={options} label="Assignee" value="u1" required />)
    await user.click(getTrigger())
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    // Radix PopoverContent portals to document.body — scan the whole document so
    // the open popover is actually included (container scope would miss it).
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations()
  })
})
