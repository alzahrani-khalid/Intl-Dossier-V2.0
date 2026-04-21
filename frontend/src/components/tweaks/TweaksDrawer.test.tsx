import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/i18n'
import { DesignProvider } from '@/design-system/DesignProvider'
import { TweaksDisclosureProvider } from './TweaksDisclosureProvider'
import { TweaksDrawer } from './TweaksDrawer'
import { useTweaksOpen } from './use-tweaks-open'

function Harness({ children }: { children: ReactNode }): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <DesignProvider>
        <TweaksDisclosureProvider>{children}</TweaksDisclosureProvider>
      </DesignProvider>
    </I18nextProvider>
  )
}

function OpenButton(): ReactElement {
  const { open } = useTweaksOpen()
  return (
    <button type="button" onClick={open}>
      open
    </button>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('TweaksDrawer (THEME-01)', () => {
  it('renders 6 section headings in English once opened', async () => {
    const user = userEvent.setup()
    render(
      <Harness>
        <OpenButton />
        <TweaksDrawer />
      </Harness>,
    )
    await user.click(screen.getByText('open'))
    expect(await screen.findByText('Direction')).toBeInTheDocument()
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Hue')).toBeInTheDocument()
    expect(screen.getByText('Density')).toBeInTheDocument()
    expect(screen.getByText('Classification')).toBeInTheDocument()
    expect(screen.getByText('Locale')).toBeInTheDocument()
  })

  it('renders 6 section headings in Arabic once opened', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    render(
      <Harness>
        <OpenButton />
        <TweaksDrawer />
      </Harness>,
    )
    await user.click(screen.getByText('open'))
    expect(await screen.findByText('الاتجاه')).toBeInTheDocument()
    expect(screen.getByText('المظهر')).toBeInTheDocument()
    expect(screen.getByText('الدرجة')).toBeInTheDocument()
    expect(screen.getByText('الكثافة')).toBeInTheDocument()
    expect(screen.getByText('التصنيف')).toBeInTheDocument()
    expect(screen.getByText('اللغة')).toBeInTheDocument()
  })
})
