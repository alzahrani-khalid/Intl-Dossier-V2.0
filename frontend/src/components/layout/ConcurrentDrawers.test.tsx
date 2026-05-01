/**
 * ConcurrentDrawers.test.tsx — Phase 36 Plan 36-01 (SHELL-05) Wave 0 RED scaffold.
 *
 * Pitfall 3 mitigation (36-RESEARCH.md): when Tweaks drawer + Sidebar drawer both
 * mount at the same time, focus-trap scopes must NOT conflict. HeroUI v3 Drawer
 * relies on React Aria `FocusScope contain` — tabbing inside one drawer should
 * not leak focus into the other.
 *
 * This test is RED until Wave 1/2 lands the Sidebar drawer alongside the existing
 * TweaksDrawer. The assertions exercise the concurrent-mount contract so a future
 * regression (focus leak, double-trap) surfaces here.
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from '@heroui/react'
import { useOverlayTriggerState } from 'react-stately'

type DrawerHarnessProps = {
  label: string
  initialOpen?: boolean
}

function DrawerHarness({ label, initialOpen = true }: DrawerHarnessProps): JSX.Element {
  const state = useOverlayTriggerState({ defaultOpen: initialOpen })
  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog aria-label={label}>
            <Drawer.Header>{label}</Drawer.Header>
            <Drawer.Body>
              <button type="button" data-testid={`${label}-first`}>
                {label} first
              </button>
              <button type="button" data-testid={`${label}-second`}>
                {label} second
              </button>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}

describe('ConcurrentDrawers — Pitfall 3 focus isolation', () => {
  it('two HeroUI Drawers mount without throwing', () => {
    const { container } = render(
      <>
        <DrawerHarness label="Tweaks" />
        <DrawerHarness label="Sidebar" />
      </>,
    )
    expect(container).toBeTruthy()
  })

  it('focus stays inside the last-opened drawer when Tab is pressed', async () => {
    render(
      <>
        <DrawerHarness label="Tweaks" />
        <DrawerHarness label="Sidebar" />
      </>,
    )
    const sidebarFirst = await screen.findByTestId('Sidebar-first')
    sidebarFirst.focus()
    const user = userEvent.setup()
    await user.tab()
    const focused = document.activeElement
    expect(focused?.getAttribute('data-testid')).toMatch(/^Sidebar-/)
  })

  it('each drawer renders a FocusScope contain boundary', () => {
    render(
      <>
        <DrawerHarness label="Tweaks" />
        <DrawerHarness label="Sidebar" />
      </>,
    )
    const dialogs = document.querySelectorAll('[role="dialog"]')
    expect(dialogs.length).toBeGreaterThanOrEqual(2)
  })
})
