import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormSelect } from '../../../frontend/src/components/Forms/FormSelect'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
]

describe('FormSelect', () => {
  const defaultProps = {
    name: 'test-select',
    label: 'Test Select',
    options: mockOptions,
    placeholder: 'Select an option...'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with label and select', () => {
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows placeholder text', () => {
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    expect(screen.getByText('Select an option...')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('selects option when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        onChange={onChange} 
      />
    )
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const option1 = screen.getByText('Option 1')
    await user.click(option1)
    
    expect(onChange).toHaveBeenCalledWith('option1')
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('closes dropdown when option is selected', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const option1 = screen.getByText('Option 1')
    await user.click(option1)
    
    await waitFor(() => {
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('handles escape key to close dropdown', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    await user.keyboard('{Escape}')
    
    await waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })

  it('shows error message when provided', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        error="This field is required" 
      />
    )
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500')
  })

  it('shows helper text when provided', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        helperText="Choose an option from the list" 
      />
    )
    
    expect(screen.getByText('Choose an option from the list')).toBeInTheDocument()
  })

  it('handles required field', () => {
    renderWithI18n(<FormSelect {...defaultProps} required />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeRequired()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    renderWithI18n(<FormSelect {...defaultProps} disabled />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('handles controlled value', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        value="option2" 
      />
    )
    
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('handles multiple selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        multiple
        onChange={onChange}
      />
    )
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const option1 = screen.getByText('Option 1')
    const option2 = screen.getByText('Option 2')
    
    await user.click(option1)
    await user.click(option2)
    
    expect(onChange).toHaveBeenCalledWith(['option1', 'option2'])
  })

  it('shows selected count for multiple selection', async () => {
    const user = userEvent.setup()
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        multiple
        value={['option1', 'option2']}
      />
    )
    
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    const user = userEvent.setup()
    renderWithI18n(<FormSelect {...defaultProps} searchable />)
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const searchInput = screen.getByPlaceholderText('Search options...')
    await user.type(searchInput, 'Option 1')
    
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
  })

  it('handles grouped options', () => {
    const groupedOptions = [
      {
        label: 'Group 1',
        options: [
          { value: 'g1o1', label: 'Group 1 Option 1' },
          { value: 'g1o2', label: 'Group 1 Option 2' }
        ]
      },
      {
        label: 'Group 2',
        options: [
          { value: 'g2o1', label: 'Group 2 Option 1' }
        ]
      }
    ]
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        options={groupedOptions}
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    expect(screen.getByText('Group 1')).toBeInTheDocument()
    expect(screen.getByText('Group 1 Option 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2')).toBeInTheDocument()
  })

  it('handles custom option rendering', () => {
    const customOptions = [
      { 
        value: 'option1', 
        label: 'Option 1',
        icon: '📁',
        description: 'First option'
      }
    ]
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        options={customOptions}
        renderOption={(option) => (
          <div>
            <span>{option.icon}</span>
            <span>{option.label}</span>
            <small>{option.description}</small>
          </div>
        )}
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    expect(screen.getByText('📁')).toBeInTheDocument()
    expect(screen.getByText('First option')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    renderWithI18n(<FormSelect {...defaultProps} loading />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows no options message when empty', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        options={[]}
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    expect(screen.getByText('No options available')).toBeInTheDocument()
  })

  it('handles custom no options message', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        options={[]}
        noOptionsMessage="No data found"
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<FormSelect {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('rtl:text-right')
  })

  it('handles different sizes', () => {
    const { rerender } = renderWithI18n(<FormSelect {...defaultProps} size="sm" />)
    expect(screen.getByRole('combobox')).toHaveClass('h-8')
    
    rerender(<FormSelect {...defaultProps} size="lg" />)
    expect(screen.getByRole('combobox')).toHaveClass('h-12')
  })

  it('handles clear button', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        value="option1"
        clearable
        onClear={onClear}
      />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    expect(onClear).toHaveBeenCalled()
  })

  it('handles focus and blur events', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        onFocus={onFocus} 
        onBlur={onBlur} 
      />
    )
    
    const select = screen.getByRole('combobox')
    
    fireEvent.focus(select)
    expect(onFocus).toHaveBeenCalled()
    
    fireEvent.blur(select)
    expect(onBlur).toHaveBeenCalled()
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    renderWithI18n(<FormSelect {...defaultProps} ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('handles custom className', () => {
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        className="custom-class" 
      />
    )
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })

  it('handles option disabled state', async () => {
    const user = userEvent.setup()
    const disabledOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' }
    ]
    
    renderWithI18n(
      <FormSelect 
        {...defaultProps} 
        options={disabledOptions}
      />
    )
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const disabledOption = screen.getByText('Option 2')
    expect(disabledOption).toHaveClass('opacity-50', 'cursor-not-allowed')
  })
})
