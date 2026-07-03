/**
 * heroui-forms.test.tsx — Phase 78 Plan 78-02 (HEROUI-02) Wave 0 behavioral oracle.
 *
 * The v3.2.0 toggles refactor moved Checkbox/Switch to explicit `*.Content`
 * composition: the root is now a Field wrapper and the clickable `<label>` is
 * `*.Content`. Under the old (pre-migration) markup on 3.2.1 the control was
 * rendered without `*.Content`, so no accessible `checkbox`/`switch` control
 * with the label as its accessible name exists, and the visible label loses its
 * click-to-toggle association — a behavioral/a11y regression tsc is blind to
 * (children are `ReactNode`, so it still compiles). These tests encode the
 * migrated behavior: they are RED against the old markup and GREEN once the
 * wrappers adopt the `*.Content` anatomy.
 *
 * Note on the toggle assertions: HeroUI's `*.Content` label is a react-aria
 * *pressable* (`data-react-aria-pressable`), not a native `<label for>`. jsdom
 * cannot drive react-aria's pointer-press lifecycle, so a raw click on the
 * `<label>` element is a no-op here (it works in a real browser). We instead
 * locate the control BY ITS VISIBLE LABEL — `getByRole('checkbox', { name })` —
 * which only resolves when the label text is the control's accessible name via
 * the Content wrapper, then toggle it. That resolution + toggle proves the
 * label→control association the migration restores. The structural proof
 * (label wraps the control) is covered separately below.
 *
 * Protocol integrity: imports come ONLY from the wrapper module
 * (`./heroui-forms`) — never from `@heroui/react` directly — so the Phase 75
 * import-site count stays at 8.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroUIFormCheckbox, HeroUIFormSwitch } from './heroui-forms'

describe('HeroUIFormCheckbox — v3.2 *.Content composition', () => {
  it('toggles selection when the control resolved by its visible label is clicked', async () => {
    const onChange = vi.fn()
    render(<HeroUIFormCheckbox name="terms" label="Accept terms" onChange={onChange} />)

    // Resolved by accessible name === the visible label text (Content association).
    const control = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(control).not.toBeChecked()

    await userEvent.click(control)

    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeChecked()
  })

  it('wraps the label text and the control in one clickable <label> (Content)', () => {
    render(<HeroUIFormCheckbox name="terms" label="Accept terms" />)

    // react-aria renders `Checkbox.Content` as the clickable <label>; the control
    // (hidden input) lives inside it. The old markup kept the text and the control
    // in separate siblings, so they shared no <label> ancestor.
    const clickableLabel = screen.getByText('Accept terms').closest('label')
    expect(clickableLabel).not.toBeNull()
    expect(clickableLabel?.querySelector('input[type="checkbox"]')).not.toBeNull()
  })

  it('renders the description as a sibling of Content, outside the clickable label', () => {
    render(
      <HeroUIFormCheckbox name="terms" label="Accept terms" description="Read the fine print" />,
    )

    const description = screen.getByText('Read the fine print')
    expect(description).toBeInTheDocument()
    expect(description.closest('label')).toBeNull()
  })
})

describe('HeroUIFormSwitch — v3.2 *.Content composition', () => {
  it('toggles selection when the control resolved by its visible label is clicked', async () => {
    const onChange = vi.fn()
    render(<HeroUIFormSwitch name="alerts" label="Enable alerts" onChange={onChange} />)

    const control = screen.getByRole('switch', { name: 'Enable alerts' })
    expect(control).not.toBeChecked()

    await userEvent.click(control)

    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch', { name: 'Enable alerts' })).toBeChecked()
  })
})
