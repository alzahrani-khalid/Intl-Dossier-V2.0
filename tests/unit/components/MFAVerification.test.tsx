import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MFAVerification } from '../../../frontend/src/components/MFAVerification'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the auth service
vi.mock('../../../frontend/src/services/auth', () => ({
  useAuth: () => ({
    verifyMFA: vi.fn(),
    resendMFACode: vi.fn()
  })
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('MFAVerification', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verification form', () => {
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    expect(screen.getByText('Enter the verification code from your authenticator app')).toBeInTheDocument()
  })

  it('handles verification code input', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    expect(codeInput).toHaveValue('123456')
  })

  it('verifies MFA with correct code', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockVerifyMFA).toHaveBeenCalledWith('123456')
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error for invalid verification code', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid verification code' 
    })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '000000')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
    })
  })

  it('handles verification errors', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockRejectedValue(new Error('Network error'))
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during verification', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    expect(screen.getByText('Verifying...')).toBeInTheDocument()
  })

  it('handles cancel action', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)
    
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('shows resend code option', () => {
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    expect(screen.getByText('Didn\'t receive a code?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
  })

  it('handles resend code', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockResendMFACode = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: vi.fn(),
      resendMFACode: mockResendMFACode
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const resendButton = screen.getByRole('button', { name: /resend/i })
    await userEvent.click(resendButton)
    
    await waitFor(() => {
      expect(mockResendMFACode).toHaveBeenCalled()
      expect(screen.getByText('Code sent successfully')).toBeInTheDocument()
    })
  })

  it('shows resend cooldown', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockResendMFACode = vi.fn().mockResolvedValue({ 
      success: true,
      cooldown: 60 
    })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: vi.fn(),
      resendMFACode: mockResendMFACode
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const resendButton = screen.getByRole('button', { name: /resend/i })
    await userEvent.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Resend available in 60 seconds')).toBeInTheDocument()
      expect(resendButton).toBeDisabled()
    })
  })

  it('handles resend errors', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockResendMFACode = vi.fn().mockRejectedValue(new Error('Resend failed'))
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: vi.fn(),
      resendMFACode: mockResendMFACode
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const resendButton = screen.getByRole('button', { name: /resend/i })
    await userEvent.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to resend code. Please try again.')).toBeInTheDocument()
    })
  })

  it('validates verification code format', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123') // Too short
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    expect(verifyButton).toBeDisabled()
  })

  it('auto-submits when code is complete', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123456')
    
    await waitFor(() => {
      expect(mockVerifyMFA).toHaveBeenCalledWith('123456')
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    codeInput.focus()
    
    await user.keyboard('{Tab}')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    expect(verifyButton).toHaveFocus()
  })

  it('shows recovery code option', () => {
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    expect(screen.getByText('Lost your device?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use recovery code/i })).toBeInTheDocument()
  })

  it('switches to recovery code mode', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const recoveryButton = screen.getByRole('button', { name: /use recovery code/i })
    await userEvent.click(recoveryButton)
    
    expect(screen.getByText('Enter one of your recovery codes')).toBeInTheDocument()
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument()
  })

  it('handles recovery code verification', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const recoveryButton = screen.getByRole('button', { name: /use recovery code/i })
    await userEvent.click(recoveryButton)
    
    const recoveryInput = screen.getByLabelText(/recovery code/i)
    await user.type(recoveryInput, 'recovery-code-123')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockVerifyMFA).toHaveBeenCalledWith('recovery-code-123', true)
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('switches back to verification code mode', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const recoveryButton = screen.getByRole('button', { name: /use recovery code/i })
    await userEvent.click(recoveryButton)
    
    const backButton = screen.getByRole('button', { name: /back to verification code/i })
    await userEvent.click(backButton)
    
    expect(screen.getByText('Enter the verification code from your authenticator app')).toBeInTheDocument()
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveClass('rtl:text-right')
  })

  it('shows attempt counter', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid code',
      attemptsRemaining: 2
    })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '000000')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('2 attempts remaining')).toBeInTheDocument()
    })
  })

  it('locks account after max attempts', async () => {
    const user = userEvent.setup()
    const { useAuth } = require('../../../frontend/src/services/auth')
    const mockVerifyMFA = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Account locked',
      attemptsRemaining: 0
    })
    
    vi.mocked(useAuth).mockReturnValue({
      verifyMFA: mockVerifyMFA,
      resendMFACode: vi.fn()
    })
    
    renderWithI18n(<MFAVerification {...defaultProps} />)
    
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '000000')
    
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    await userEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Account locked due to too many failed attempts')).toBeInTheDocument()
      expect(verifyButton).toBeDisabled()
    })
  })
})
