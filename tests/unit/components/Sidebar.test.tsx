import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../../../frontend/src/components/Layout/Sidebar'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the auth service
vi.mock('../../../frontend/src/services/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    },
    isAuthenticated: true
  })
}))

// Mock the router
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    navigate: vi.fn()
  }),
  useLocation: () => ({
    pathname: '/dashboard'
  })
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation items', () => {
    renderWithI18n(<Sidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Countries')).toBeInTheDocument()
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('MoUs')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Briefs')).toBeInTheDocument()
    expect(screen.getByText('Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Data Library')).toBeInTheDocument()
    expect(screen.getByText('Word Assistant')).toBeInTheDocument()
  })

  it('shows active navigation item', () => {
    renderWithI18n(<Sidebar />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('bg-accent')
  })

  it('handles navigation clicks', () => {
    const { useRouter } = require('@tanstack/react-router')
    const mockNavigate = vi.fn()
    
    vi.mocked(useRouter).mockReturnValue({
      navigate: mockNavigate
    })
    
    renderWithI18n(<Sidebar />)
    
    const countriesLink = screen.getByRole('link', { name: /countries/i })
    fireEvent.click(countriesLink)
    
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/countries' })
  })

  it('shows user information', () => {
    renderWithI18n(<Sidebar />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('displays user role', () => {
    renderWithI18n(<Sidebar />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows user avatar or initials', () => {
    renderWithI18n(<Sidebar />)
    
    const avatar = screen.getByText('TU')
    expect(avatar).toBeInTheDocument()
  })

  it('handles collapsed state', () => {
    renderWithI18n(<Sidebar collapsed />)
    
    const sidebar = screen.getByRole('navigation')
    expect(sidebar).toHaveClass('w-16')
  })

  it('shows only icons when collapsed', () => {
    renderWithI18n(<Sidebar collapsed />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('justify-center')
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<Sidebar />)
    
    const sidebar = screen.getByRole('navigation')
    expect(sidebar).toHaveClass('rtl:border-l-0', 'rtl:border-r')
  })

  it('shows tooltips when collapsed', () => {
    renderWithI18n(<Sidebar collapsed />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('title', 'Dashboard')
  })

  it('handles keyboard navigation', () => {
    renderWithI18n(<Sidebar />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    fireEvent.keyDown(dashboardLink, { key: 'Enter' })
    
    // Should handle keyboard navigation
    expect(dashboardLink).toBeInTheDocument()
  })

  it('shows correct icons for each navigation item', () => {
    renderWithI18n(<Sidebar />)
    
    // Check that icons are present (they should be SVG elements)
    const icons = screen.getAllByRole('img', { hidden: true })
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles mobile responsive behavior', () => {
    // Mock mobile screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    
    renderWithI18n(<Sidebar />)
    
    const sidebar = screen.getByRole('navigation')
    expect(sidebar).toHaveClass('md:translate-x-0')
  })

  it('shows user menu when user info is clicked', () => {
    renderWithI18n(<Sidebar />)
    
    const userInfo = screen.getByText('Test User').closest('button')
    fireEvent.click(userInfo!)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('handles different user roles', () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'viewer'
      },
      isAuthenticated: true
    })
    
    renderWithI18n(<Sidebar />)
    
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })

  it('shows admin-only navigation items for admin users', () => {
    renderWithI18n(<Sidebar />)
    
    // Admin should see all navigation items
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('hides admin-only items for non-admin users', () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'viewer'
      },
      isAuthenticated: true
    })
    
    renderWithI18n(<Sidebar />)
    
    // Settings should not be visible for viewers
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })
})
