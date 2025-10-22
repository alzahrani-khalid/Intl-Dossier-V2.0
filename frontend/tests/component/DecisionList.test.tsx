import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DecisionList, Decision } from '@/components/after-action/DecisionList';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

// i18n mock is global in tests/setup.ts

describe('DecisionList', () => {
  const mockOnChange = vi.fn();

  const mockDecisions: Decision[] = [
    {
      id: '1',
      description: 'Proceed with project',
      rationale: 'Budget approved',
      decision_maker: 'John Doe',
      decision_date: new Date('2025-01-15'),
      ai_confidence: 0.85,
    },
    {
      id: '2',
      description: 'Delay launch date',
      decision_maker: 'Jane Smith',
      decision_date: new Date('2025-01-16'),
      ai_confidence: 0.6,
    },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders title and add button', () => {
      render(
        <DecisionList decisions={[]} onChange={mockOnChange} />
      );

      expect(screen.getByText('Decisions')).toBeInTheDocument();
      expect(screen.getByText('Add Decision')).toBeInTheDocument();
    });

    it('shows empty state when no decisions', () => {
      render(
        <DecisionList decisions={[]} onChange={mockOnChange} />
      );

      expect(screen.getByText('No decisions yet')).toBeInTheDocument();
    });

    it('renders all decisions with correct data', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      expect(screen.getByText('Decision 1')).toBeInTheDocument();
      expect(screen.getByText('Decision 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Proceed with project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Delay launch date')).toBeInTheDocument();
    });
  });

  describe('AI Confidence Display', () => {
    it('shows confidence badge for AI-extracted decisions', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      expect(screen.getByText('85% confidence')).toBeInTheDocument();
      expect(screen.getByText('60% confidence')).toBeInTheDocument();
    });

    it('uses correct badge variant based on confidence level', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const highConfidenceBadge = screen.getByText('85% confidence').parentElement;
      const mediumConfidenceBadge = screen.getByText('60% confidence').parentElement;

      // High confidence (≥0.8) should use default variant
      expect(highConfidenceBadge).toHaveClass('badge-default');

      // Medium confidence (0.5-0.8) should use secondary variant
      expect(mediumConfidenceBadge).toHaveClass('badge-secondary');
    });

    it('does not show confidence badge for manually entered decisions', () => {
      const manualDecision: Decision[] = [
        {
          description: 'Manual decision',
          decision_maker: 'User',
          decision_date: new Date(),
        },
      ];

      render(
        <DecisionList decisions={manualDecision} onChange={mockOnChange} />
      );

      expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
    });
  });

  describe('Add Decision', () => {
    it('calls onChange with new decision when add button clicked', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={[]} onChange={mockOnChange} />
      );

      await user.click(screen.getByText('Add Decision'));

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          description: '',
          decision_maker: '',
          decision_date: expect.any(Date),
        },
      ]);
    });

    it('preserves existing decisions when adding new one', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      await user.click(screen.getByText('Add Decision'));

      expect(mockOnChange).toHaveBeenCalledWith([
        ...mockDecisions,
        {
          description: '',
          decision_maker: '',
          decision_date: expect.any(Date),
        },
      ]);
    });
  });

  describe('Edit Decision', () => {
    it('updates description when textarea changes', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const descriptionInput = screen.getByDisplayValue('Proceed with project');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated decision');

      expect(mockOnChange).toHaveBeenLastCalledWith([
        {
          ...mockDecisions[0],
          description: 'Updated decision',
        },
        mockDecisions[1],
      ]);
    });

    it('enforces 2000 character limit on description', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const descriptionInput = screen.getByDisplayValue('Proceed with project') as HTMLTextAreaElement;
      expect(descriptionInput).toHaveAttribute('maxLength', '2000');
      expect(screen.getByText('21/2000')).toBeInTheDocument(); // "Proceed with project" is 21 chars
    });

    it('updates rationale when textarea changes', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const rationaleInput = screen.getByDisplayValue('Budget approved');
      await user.clear(rationaleInput);
      await user.type(rationaleInput, 'New rationale');

      expect(mockOnChange).toHaveBeenLastCalledWith([
        {
          ...mockDecisions[0],
          rationale: 'New rationale',
        },
        mockDecisions[1],
      ]);
    });

    it('updates decision maker when input changes', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const makerInput = screen.getByDisplayValue('John Doe');
      await user.clear(makerInput);
      await user.type(makerInput, 'New Maker');

      expect(mockOnChange).toHaveBeenLastCalledWith([
        {
          ...mockDecisions[0],
          decision_maker: 'New Maker',
        },
        mockDecisions[1],
      ]);
    });
  });

  describe('Remove Decision', () => {
    it('removes decision when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      const firstDeleteButton = deleteButtons.find(btn =>
        btn.querySelector('.text-destructive')
      );

      if (firstDeleteButton) {
        await user.click(firstDeleteButton);
      }

      expect(mockOnChange).toHaveBeenCalledWith([mockDecisions[1]]);
    });

    it('removes correct decision from middle of list', async () => {
      const user = userEvent.setup();
      const threeDecisions = [...mockDecisions, {
        id: '3',
        description: 'Third decision',
        decision_maker: 'Bob',
        decision_date: new Date(),
      }];

      render(
        <DecisionList decisions={threeDecisions} onChange={mockOnChange} />
      );

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      const secondDeleteButton = deleteButtons.filter(btn =>
        btn.querySelector('.text-destructive')
      )[1];

      if (secondDeleteButton) {
        await user.click(secondDeleteButton);
      }

      expect(mockOnChange).toHaveBeenCalledWith([
        threeDecisions[0],
        threeDecisions[2],
      ]);
    });
  });

  describe('Read-Only Mode', () => {
    it('hides add button in read-only mode', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} readOnly />
      );

      expect(screen.queryByText('Add Decision')).not.toBeInTheDocument();
    });

    it('hides delete buttons in read-only mode', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} readOnly />
      );

      const deleteButtons = screen.queryAllByRole('button', { name: '' })
        .filter(btn => btn.querySelector('.text-destructive'));

      expect(deleteButtons).toHaveLength(0);
    });

    it('disables all inputs in read-only mode', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} readOnly />
      );

      const descriptionInput = screen.getByDisplayValue('Proceed with project') as HTMLTextAreaElement;
      const makerInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;

      expect(descriptionInput).toBeDisabled();
      expect(makerInput).toBeDisabled();
    });

    it('still shows AI confidence badges in read-only mode', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} readOnly />
      );

      expect(screen.getByText('85% confidence')).toBeInTheDocument();
      expect(screen.getByText('60% confidence')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('applies RTL direction when language is Arabic', () => {
      // Mock Arabic language
      vi.mock('react-i18next', async () => {
        const actual = await vi.importActual('react-i18next');
        return {
          ...actual,
          useTranslation: () => ({
            t: (key: string) => key,
            i18n: {
              language: 'ar',
            },
          }),
        };
      });

      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const descriptionInput = screen.getByDisplayValue('Proceed with project') as HTMLTextAreaElement;
      expect(descriptionInput).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Validation', () => {
    it('marks required fields with asterisk', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      expect(screen.getByText(/Description \*/)).toBeInTheDocument();
      expect(screen.getByText(/Decision Maker \*/)).toBeInTheDocument();
      expect(screen.getByText(/Decision Date \*/)).toBeInTheDocument();
    });

    it('sets required attribute on mandatory fields', () => {
      render(
        <DecisionList decisions={mockDecisions} onChange={mockOnChange} />
      );

      const descriptionInput = screen.getByDisplayValue('Proceed with project') as HTMLTextAreaElement;
      const makerInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;

      expect(descriptionInput).toHaveAttribute('required');
      expect(makerInput).toHaveAttribute('required');
    });
  });
});
