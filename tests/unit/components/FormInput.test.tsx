import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormInput } from '../../../frontend/src/components/Forms/FormInput'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('FormInput', () => {
  const defaultProps = {
    name: 'test-input',
    label: 'Test Input',
    placeholder: 'Enter text...'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with label and input', () => {
    renderWithI18n(<FormInput {...defaultProps} />)
    
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormInput {...defaultProps} />)
    
    const input = screen.getByLabelText('Test Input')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('shows error message when provided', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        error="This field is required" 
      />
    )
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Input')).toHaveClass('border-red-500')
  })

  it('shows helper text when provided', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        helperText="Enter your full name" 
      />
    )
    
    expect(screen.getByText('Enter your full name')).toBeInTheDocument()
  })

  it('handles different input types', () => {
    const { rerender } = renderWithI18n(<FormInput {...defaultProps} type="email" />)
    expect(screen.getByLabelText('Test Input')).toHaveAttribute('type', 'email')
    
    rerender(<FormInput {...defaultProps} type="password" />)
    expect(screen.getByLabelText('Test Input')).toHaveAttribute('type', 'password')
    
    rerender(<FormInput {...defaultProps} type="number" />)
    expect(screen.getByLabelText('Test Input')).toHaveAttribute('type', 'number')
  })

  it('handles required field', () => {
    renderWithI18n(<FormInput {...defaultProps} required />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toBeRequired()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    renderWithI18n(<FormInput {...defaultProps} disabled />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toBeDisabled()
  })

  it('handles readonly state', () => {
    renderWithI18n(<FormInput {...defaultProps} readOnly />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveAttribute('readonly')
  })

  it('handles value changes', () => {
    const onChange = vi.fn()
    renderWithI18n(<FormInput {...defaultProps} onChange={onChange} />)
    
    const input = screen.getByLabelText('Test Input')
    fireEvent.change(input, { target: { value: 'New Value' } })
    
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'New Value' })
    }))
  })

  it('handles focus and blur events', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        onFocus={onFocus} 
        onBlur={onBlur} 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    
    fireEvent.focus(input)
    expect(onFocus).toHaveBeenCalled()
    
    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalled()
  })

  it('handles keyboard events', () => {
    const onKeyDown = vi.fn()
    const onKeyUp = vi.fn()
    
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        onKeyDown={onKeyDown} 
        onKeyUp={onKeyUp} 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onKeyDown).toHaveBeenCalled()
    
    fireEvent.keyUp(input, { key: 'Enter' })
    expect(onKeyUp).toHaveBeenCalled()
  })

  it('shows character count when maxLength is provided', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        maxLength={100} 
        value="Hello" 
      />
    )
    
    expect(screen.getByText('5/100')).toBeInTheDocument()
  })

  it('shows validation state', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        isValid={true} 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveClass('border-green-500')
  })

  it('handles different sizes', () => {
    const { rerender } = renderWithI18n(<FormInput {...defaultProps} size="sm" />)
    expect(screen.getByLabelText('Test Input')).toHaveClass('h-8')
    
    rerender(<FormInput {...defaultProps} size="lg" />)
    expect(screen.getByLabelText('Test Input')).toHaveClass('h-12')
  })

  it('handles icon prefix', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        icon={<span data-testid="prefix-icon">@</span>} 
      />
    )
    
    expect(screen.getByTestId('prefix-icon')).toBeInTheDocument()
  })

  it('handles icon suffix', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        suffix={<span data-testid="suffix-icon">✓</span>} 
      />
    )
    
    expect(screen.getByTestId('suffix-icon')).toBeInTheDocument()
  })

  it('handles password visibility toggle', async () => {
    const user = userEvent.setup()
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        type="password" 
        showPasswordToggle 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveAttribute('type', 'password')
    
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    await user.click(toggleButton)
    
    expect(input).toHaveAttribute('type', 'text')
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<FormInput {...defaultProps} />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveClass('rtl:text-right')
  })

  it('handles custom className', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        className="custom-class" 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    renderWithI18n(<FormInput {...defaultProps} ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('handles autoComplete attribute', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        autoComplete="email" 
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveAttribute('autocomplete', 'email')
  })

  it('handles autoFocus', () => {
    renderWithI18n(<FormInput {...defaultProps} autoFocus />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveFocus()
  })

  it('handles multiple attributes', () => {
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        min={0}
        max={100}
        step={1}
        pattern="[0-9]+"
      />
    )
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveAttribute('step', '1')
    expect(input).toHaveAttribute('pattern', '[0-9]+')
  })

  it('shows loading state', () => {
    renderWithI18n(<FormInput {...defaultProps} loading />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles clear button', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    
    renderWithI18n(
      <FormInput 
        {...defaultProps} 
        value="Test Value"
        clearable
        onClear={onClear}
      />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    expect(onClear).toHaveBeenCalled()
  })
})