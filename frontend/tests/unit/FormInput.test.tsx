import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@tests/utils/render'
import { FormInput } from '../../src/components/forms/FormInput'

describe('FormInput', () => {
  const defaultProps = {
    label: 'Test Label',
    name: 'testField',
    register: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('id.locale')
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })

  it('should render form input with label', () => {
    render(<FormInput {...defaultProps} />)

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should render required indicator when required', () => {
    render(<FormInput {...defaultProps} required />)

    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('*')).toHaveAttribute('aria-label', 'Required')
  })

  it('should not render required indicator when not required', () => {
    render(<FormInput {...defaultProps} required={false} />)

    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('should render help text when provided', () => {
    const helpText = 'This is help text'

    render(<FormInput {...defaultProps} helpText={helpText} />)

    expect(screen.getByText(helpText)).toBeInTheDocument()
    expect(screen.getByText(helpText)).toHaveAttribute('id', 'testField-help')
  })

  it('should render error message when error is provided', () => {
    const error = { message: 'This field is required' }

    render(<FormInput {...defaultProps} error={error} />)

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByText('This field is required')).toHaveAttribute('id', 'testField-error')
  })

  it('should not render help text when error is present', () => {
    const helpText = 'This is help text'
    const error = { message: 'This field is required' }

    render(<FormInput {...defaultProps} helpText={helpText} error={error} />)

    expect(screen.queryByText(helpText)).not.toBeInTheDocument()
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    const icon = <span data-testid="test-icon">search</span>

    render(<FormInput {...defaultProps} icon={icon} />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for LTR layout', () => {
    const icon = <span data-testid="test-icon">search</span>

    render(<FormInput {...defaultProps} icon={icon} />)

    const iconContainer = screen.getByTestId('test-icon').parentElement
    expect(iconContainer).toHaveClass('start-3')
    expect(iconContainer).not.toHaveClass('end-3')

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('ps-12')
    expect(input).not.toHaveClass('pe-12')
  })

  it('should apply correct CSS classes for RTL layout', () => {
    document.documentElement.dir = 'rtl'
    localStorage.setItem('id.locale', 'ar')
    const icon = <span data-testid="test-icon">search</span>

    render(<FormInput {...defaultProps} icon={icon} />)

    const iconContainer = screen.getByTestId('test-icon').parentElement
    expect(iconContainer).toHaveClass('end-3')
    expect(iconContainer).not.toHaveClass('start-3')

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('pe-12')
    expect(input).not.toHaveClass('ps-12')
  })

  it('should apply error styling when error is present', () => {
    const error = { message: 'This field is required' }

    render(<FormInput {...defaultProps} error={error} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should apply normal styling when no error', () => {
    render(<FormInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-gray-300')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('should set correct input type', () => {
    render(<FormInput {...defaultProps} type="email" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('should set default input type to text', () => {
    render(<FormInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should pass through additional props to input', () => {
    render(<FormInput {...defaultProps} placeholder="Enter text" disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter text')
    expect(input).toBeDisabled()
  })

  it('should set correct aria-describedby when error is present', () => {
    const error = { message: 'This field is required' }

    render(<FormInput {...defaultProps} error={error} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'testField-error')
  })

  it('should set correct aria-describedby when help text is present', () => {
    const helpText = 'This is help text'

    render(<FormInput {...defaultProps} helpText={helpText} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'testField-help')
  })

  it('should set correct aria-describedby when both error and help text are present', () => {
    const helpText = 'This is help text'
    const error = { message: 'This field is required' }

    render(<FormInput {...defaultProps} helpText={helpText} error={error} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'testField-error')
  })

  it('should not set aria-describedby when neither error nor help text are present', () => {
    render(<FormInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('should handle register function correctly', () => {
    const register = vi.fn().mockReturnValue({
      name: 'testField',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })

    render(<FormInput {...defaultProps} register={register} />)

    expect(register).toHaveBeenCalledWith('testField')
  })

  it('should work without register function', () => {
    render(<FormInput label="Test Label" name="testField" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('should handle error message translation', () => {
    const error = { message: 'validation.required' }

    render(<FormInput {...defaultProps} error={error} />)

    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('should handle missing error message', () => {
    const error = { message: undefined }

    render(<FormInput {...defaultProps} error={error} />)

    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})
