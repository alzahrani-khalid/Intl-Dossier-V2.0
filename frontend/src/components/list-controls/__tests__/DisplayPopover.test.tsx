/**
 * DisplayPopover — Phase 87 F24 (AFF-02)
 *
 * Verifies sections render/omit per config shape and that the display handlers fire.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DisplayPopover, type DisplayPopoverProps } from '../DisplayPopover'
import type { ListControlsConfig } from '../useListControls'

const baseHandlers = {
  onSetSort: vi.fn(),
  onSetDir: vi.fn(),
  onToggleProperty: vi.fn(),
  onSetGroup: vi.fn(),
  onReset: vi.fn(),
}

function renderPopover(
  config: ListControlsConfig,
  overrides: Partial<DisplayPopoverProps> = {},
): void {
  render(
    <DisplayPopover
      config={config}
      visibleProperties={[]}
      open
      onOpenChange={() => {}}
      {...baseHandlers}
      {...overrides}
    />,
  )
}

describe('DisplayPopover', () => {
  it('omits the Display properties section with < 2 properties, renders it with ≥ 2', () => {
    const oneProp: ListControlsConfig = {
      filters: [],
      properties: [{ id: 'name', labelKey: 'Name', defaultVisible: true }],
    }
    const { unmount } = render(
      <DisplayPopover
        config={oneProp}
        visibleProperties={['name']}
        open
        onOpenChange={() => {}}
        {...baseHandlers}
      />,
    )
    expect(screen.queryByText('Display properties')).not.toBeInTheDocument()
    unmount()

    renderPopover(
      {
        filters: [],
        properties: [
          { id: 'name', labelKey: 'Name', defaultVisible: true },
          { id: 'engagements', labelKey: 'Engagements', defaultVisible: true },
        ],
      },
      { visibleProperties: ['name', 'engagements'] },
    )
    expect(screen.getByText('Display properties')).toBeInTheDocument()
  })

  it('omits the Group by section for a flat-list config', () => {
    renderPopover({ filters: [], sortFields: [{ id: 'name', labelKey: 'Name' }] })
    expect(screen.queryByText('Group by')).not.toBeInTheDocument()
  })

  it('invokes onReset exactly once', async () => {
    const onReset = vi.fn()
    renderPopover({ filters: [], sortFields: [{ id: 'name', labelKey: 'Name' }] }, { onReset })

    await userEvent.click(screen.getByText('Reset to default'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('toggles a property through onToggleProperty', async () => {
    const onToggleProperty = vi.fn()
    renderPopover(
      {
        filters: [],
        properties: [
          { id: 'name', labelKey: 'Name', defaultVisible: true },
          { id: 'engagements', labelKey: 'Engagements', defaultVisible: true },
        ],
      },
      { visibleProperties: ['name', 'engagements'], onToggleProperty },
    )

    await userEvent.click(screen.getByText('Engagements'))
    expect(onToggleProperty).toHaveBeenCalledWith('engagements')
  })
})
