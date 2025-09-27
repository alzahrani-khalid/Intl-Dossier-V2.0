import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MFASetup } from '../../../frontend/src/components/MFASetup'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the auth service
vi.mock('../../../frontend/src/services/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      full_name: 'Test User',
      email: 'test@example.com'
    },
    setupMFA: vi.fn(),
    verifyMFASetup: vi.fn()
  })
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('MFASetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders setup form', () => {
    renderWithI18n(<MFASetup />)
    
    expect(screen.getByText('Set up Two-Factor Authentication')).toBeInTheDocument()
    expect(screen.getByText('Scan QR code with your authenticator app')).toBeInTheDocument()
  })

  it('shows QR code when setup is initiated', async () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      expect(screen.getByAltText('QR Code for MFA setup')).toBeInTheDocument()
      expect(screen.getByText('TEST-SECRET-KEY')).toBeInTheDocument()
    })
  })

  it('shows manual entry option', async () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      expect(screen.getByText('Manual Entry')).toBeInTheDocument()
      expect(screen.getByText('TEST-SECRET-KEY')).toBeInTheDocument()
    })
  })

  it('handles verification code input', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    const mockVerifyMFASetup = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: mockVerifyMFASetup
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    expect(codeInput).toHaveValue('123456')
  })

  it('verifies MFA setup with correct code', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    const mockVerifyMFASetup = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: mockVerifyMFASetup
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockVerifyMFASetup).toHaveBeenCalledWith('123456')
      expect(screen.getByText('MFA setup successful!')).toBeInTheDocument()
    })
  })

  it('shows error for invalid verification code', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    const mockVerifyMFASetup = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid verification code' 
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: mockVerifyMFASetup
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '000000')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
    })
  })

  it('handles setup errors', async () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockRejectedValue(new Error('Setup failed'))
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to setup MFA. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during setup', async () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        qrCode: 'data:image/png;base64,test-qr-code',
        secret: 'TEST-SECRET-KEY'
      }), 100))
    )
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    expect(screen.getByText('Setting up MFA...')).toBeInTheDocument()
  })

  it('shows loading state during verification', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    const mockVerifyMFASetup = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: mockVerifyMFASetup
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    expect(screen.getByText('Verifying...')).toBeInTheDocument()
  })

  it('allows canceling setup', async () => {
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)
    
    expect(screen.getByText('Set up Two-Factor Authentication')).toBeInTheDocument()
  })

  it('shows recovery codes after successful setup', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    const mockVerifyMFASetup = vi.fn().mockResolvedValue({ 
      success: true,
      recoveryCodes: ['code1', 'code2', 'code3', 'code4', 'code5', 'code6', 'code7', 'code8']
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: mockVerifyMFASetup
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Recovery Codes')).toBeInTheDocument()
      expect(screen.getByText('code1')).toBeInTheDocument()
      expect(screen.getByText('code2')).toBeInTheDocument()
    })
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<MFASetup />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveClass('rtl:text-right')
  })

  it('validates verification code format', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockSetupMFA = vi.fn().mockResolvedValue({
      qrCode: 'data:image/png;base64,test-qr-code',
      secret: 'TEST-SECRET-KEY'
    })
    
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com'
      },
      setupMFA: mockSetupMFA,
      verifyMFASetup: vi.fn()
    })
    
    renderWithI18n(<MFASetup />)
    
    const setupButton = screen.getByRole('button', { name: /start setup/i })
    await userEvent.click(setupButton)
    
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123') // Too short
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    expect(verifyButton).toBeDisabled()
  })
})
