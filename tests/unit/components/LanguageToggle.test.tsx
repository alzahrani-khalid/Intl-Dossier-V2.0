import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageToggle } from '../../../frontend/src/components/LanguageToggle'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the i18n module
vi.mock('../../../frontend/src/i18n', () => ({
  switchLanguage: vi.fn(),
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
  }
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with current language', () => {
    renderWithI18n(<LanguageToggle />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('shows language dropdown when clicked', async () => {
    renderWithI18n(<LanguageToggle />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('🇺🇸 English')).toBeInTheDocument()
      expect(screen.getByText('🇸🇦 العربية')).toBeInTheDocument()
    })
  })

  it('calls switchLanguage when language is selected', async () => {
    const { switchLanguage } = await import('../../../frontend/src/i18n')
    
    renderWithI18n(<LanguageToggle />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      const arabicOption = screen.getByText('🇸🇦 العربية')
      fireEvent.click(arabicOption)
    })
    
    expect(switchLanguage).toHaveBeenCalledWith('ar')
  })

  it('highlights current language in dropdown', async () => {
    renderWithI18n(<LanguageToggle />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      const englishOption = screen.getByText('🇺🇸 English')
      expect(englishOption).toHaveClass('bg-accent')
    })
  })

  it('shows globe icon', () => {
    renderWithI18n(<LanguageToggle />)
    
    const button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('hides language name on small screens', () => {
    // Mock small screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    
    renderWithI18n(<LanguageToggle />)
    
    const button = screen.getByRole('button')
    const languageSpan = button.querySelector('span')
    expect(languageSpan).toHaveClass('hidden', 'sm:inline')
  })
})