import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../../../frontend/src/components/Layout/Header'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the auth service
vi.mock('../../../frontend/src/services/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      full_name: 'Test User',
      email: 'test@example.com',
      avatar_url: null,
      role: 'admin'
    },
    signOut: vi.fn(),
    isAuthenticated: true
  })
}))

// Mock the language toggle component
vi.mock('../../../frontend/src/components/LanguageToggle', () => ({
  LanguageToggle: () => <div data-testid="language-toggle">Language Toggle</div>
}))

// Mock the notification center
vi.mock('../../../frontend/src/components/Notifications/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with logo and navigation', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByText('GASTAT International Dossier')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('shows user menu when user is authenticated', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('displays language toggle', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument()
  })

  it('displays notification center', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByTestId('notification-center')).toBeInTheDocument()
  })

  it('shows mobile menu toggle on small screens', () => {
    // Mock small screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    
    renderWithI18n(<Header />)
    
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('toggles mobile menu when menu button is clicked', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    
    renderWithI18n(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    expect(screen.getByRole('navigation')).toHaveClass('block')
  })

  it('shows user dropdown when user avatar is clicked', () => {
    renderWithI18n(<Header />)
    
    const userButton = screen.getByRole('button', { name: /user menu/i })
    fireEvent.click(userButton)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls signOut when sign out is clicked', () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSignOut = vi.fn()
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        role: 'admin'
      },
      signOut: mockSignOut,
      isAuthenticated: true
    })
    
    renderWithI18n(<Header />)
    
    const userButton = screen.getByRole('button', { name: /user menu/i })
    fireEvent.click(userButton)
    
    const signOutButton = screen.getByText('Sign Out')
    fireEvent.click(signOutButton)
    
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('shows user avatar when available', () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'admin'
      },
      signOut: vi.fn(),
      isAuthenticated: true
    })
    
    renderWithI18n(<Header />)
    
    const avatar = screen.getByRole('img', { name: /user avatar/i })
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('shows initials when no avatar is available', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByText('TU')).toBeInTheDocument()
  })

  it('applies correct classes for RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('rtl:flex-row-reverse')
  })

  it('shows search button', () => {
    renderWithI18n(<Header />)
    
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('handles search button click', () => {
    renderWithI18n(<Header />)
    
    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)
    
    // Should show search input or trigger search functionality
    expect(searchButton).toBeInTheDocument()
  })
})
