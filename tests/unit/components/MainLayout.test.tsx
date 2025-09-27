import { render, screen } from '@testing-library/react'
import { MainLayout } from '../../../frontend/src/components/Layout/MainLayout'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the Header component
vi.mock('../../../frontend/src/components/Layout/Header', () => ({
  Header: () => <header data-testid="header">Header</header>
}))

// Mock the Sidebar component
vi.mock('../../../frontend/src/components/Layout/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>
}))

// Mock the offline indicator
vi.mock('../../../frontend/src/components/OfflineIndicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline</div>
}))

// Mock the error boundary
vi.mock('../../../frontend/src/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('MainLayout', () => {
  it('renders with header, sidebar, and main content', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  it('wraps content in error boundary', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  })

  it('shows offline indicator', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
  })

  it('applies correct layout classes', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    const layout = screen.getByTestId('main-content').closest('div')
    expect(layout).toHaveClass('flex', 'min-h-screen')
  })

  it('handles RTL layout correctly', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    const layout = screen.getByTestId('main-content').closest('div')
    expect(layout).toHaveClass('rtl:flex-row-reverse')
  })

  it('renders children correctly', () => {
    const customContent = <div data-testid="custom-content">Custom Content</div>
    
    renderWithI18n(
      <MainLayout>
        {customContent}
      </MainLayout>
    )
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  it('applies responsive classes', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    const main = screen.getByTestId('main-content').closest('main')
    expect(main).toHaveClass('flex-1', 'overflow-auto')
  })

  it('handles multiple children', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </MainLayout>
    )
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
  })

  it('applies correct z-index for header', () => {
    renderWithI18n(
      <MainLayout>
        <div data-testid="main-content">Main Content</div>
      </MainLayout>
    )
    
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('z-50')
  })

  it('handles empty children gracefully', () => {
    renderWithI18n(<MainLayout />)
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })
})
