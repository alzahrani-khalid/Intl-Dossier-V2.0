import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../../src/components/Forms/FormInput';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn()
    }))
  })
}));

// Mock i18n
vi.mock('../../src/i18n', () => ({
  default: {
    language: 'en',
    dir: vi.fn(() => 'ltr'),
    t: vi.fn((key: string) => key)
  }
}));

describe('FormInput', () => {
  const defaultProps = {
    label: 'Test Label',
    name: 'testField',
    register: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form input with label', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render required indicator when required', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} required />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-label', 'validation.required');
  });

  it('should not render required indicator when not required', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} required={false} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should render help text when provided', () => {
    // Arrange
    const helpText = 'This is help text';

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} helpText={helpText} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByText(helpText)).toBeInTheDocument();
    expect(screen.getByText(helpText)).toHaveAttribute('id', 'testField-help');
  });

  it('should render error message when error is provided', () => {
    // Arrange
    const error = { message: 'This field is required' };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} error={error} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveAttribute('id', 'testField-error');
  });

  it('should not render help text when error is present', () => {
    // Arrange
    const helpText = 'This is help text';
    const error = { message: 'This field is required' };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} helpText={helpText} error={error} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.queryByText(helpText)).not.toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    // Arrange
    const icon = <span data-testid="test-icon">🔍</span>;

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} icon={icon} />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for LTR layout', () => {
    // Arrange
    i18n.dir.mockReturnValue('ltr');
    const icon = <span data-testid="test-icon">🔍</span>;

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} icon={icon} />
      </I18nextProvider>
    );

    // Assert
    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('start-3');
    expect(iconContainer).not.toHaveClass('end-3');

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('ps-12');
    expect(input).not.toHaveClass('pe-12');
  });

  it('should apply correct CSS classes for RTL layout', () => {
    // Arrange
    i18n.dir.mockReturnValue('rtl');
    const icon = <span data-testid="test-icon">🔍</span>;

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} icon={icon} />
      </I18nextProvider>
    );

    // Assert
    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('end-3');
    expect(iconContainer).not.toHaveClass('start-3');

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pe-12');
    expect(input).not.toHaveClass('ps-12');
  });

  it('should apply error styling when error is present', () => {
    // Arrange
    const error = { message: 'This field is required' };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} error={error} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should apply normal styling when no error', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-300');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should set correct input type', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} type="email" />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should set default input type to text', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should pass through additional props to input', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} placeholder="Enter text" disabled />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toBeDisabled();
  });

  it('should set correct aria-describedby when error is present', () => {
    // Arrange
    const error = { message: 'This field is required' };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} error={error} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'testField-error');
  });

  it('should set correct aria-describedby when help text is present', () => {
    // Arrange
    const helpText = 'This is help text';

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} helpText={helpText} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'testField-help');
  });

  it('should set correct aria-describedby when both error and help text are present', () => {
    // Arrange
    const helpText = 'This is help text';
    const error = { message: 'This field is required' };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} helpText={helpText} error={error} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'testField-error');
  });

  it('should not set aria-describedby when neither error nor help text are present', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} />
      </I18nextProvider>
    );

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('should handle register function correctly', () => {
    // Arrange
    const register = vi.fn().mockReturnValue({
      name: 'testField',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn()
    });

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} register={register} />
      </I18nextProvider>
    );

    // Assert
    expect(register).toHaveBeenCalledWith('testField');
  });

  it('should work without register function', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput label="Test Label" name="testField" />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('should handle error message translation', () => {
    // Arrange
    const error = { message: 'validation.required' };
    i18n.t.mockReturnValue('This field is required');

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} error={error} />
      </I18nextProvider>
    );

    // Assert
    expect(i18n.t).toHaveBeenCalledWith('validation.required');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should handle missing error message', () => {
    // Arrange
    const error = { message: undefined };

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <FormInput {...defaultProps} error={error} />
      </I18nextProvider>
    );

    // Assert
    expect(i18n.t).toHaveBeenCalledWith('validation.required');
  });
});
