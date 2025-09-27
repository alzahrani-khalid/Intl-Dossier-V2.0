import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../../../frontend/src/components/error-boundary/ErrorBoundary'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error fallback when there is an error', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
  })

  it('shows retry button', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('handles retry action', () => {
    const { rerender } = renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)
    
    // Rerender with no error
    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </I18nextProvider>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('shows error details when in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('shows custom error message', () => {
    renderWithI18n(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()
    
    renderWithI18n(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('shows error ID for reporting', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const errorContainer = screen.getByText('Something went wrong').closest('div')
    expect(errorContainer).toHaveClass('rtl:text-right')
  })

  it('shows contact support information', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('If the problem persists, please contact support')).toBeInTheDocument()
  })

  it('handles different error types', () => {
    const TypeErrorComponent = () => {
      throw new TypeError('Type error')
    }
    
    renderWithI18n(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('resets error state when children change', () => {
    const { rerender } = renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Change the key to force remount
    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary key="new">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </I18nextProvider>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('shows loading state during retry', () => {
    const { rerender } = renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument()
  })

  it('handles multiple errors', () => {
    const MultipleErrorComponent = () => {
      throw new Error('First error')
    }
    
    const { rerender } = renderWithI18n(
      <ErrorBoundary>
        <MultipleErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Simulate another error
    const AnotherErrorComponent = () => {
      throw new Error('Second error')
    }
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <AnotherErrorComponent />
        </ErrorBoundary>
      </I18nextProvider>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows error boundary info in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Error Boundary Info')).toBeInTheDocument()
    expect(screen.getByText('Component Stack:')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('handles custom fallback with error info', () => {
    const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
      <div>
        <h2>Custom Error: {error.message}</h2>
        <button onClick={resetError}>Reset</button>
      </div>
    )
    
    renderWithI18n(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })
})
