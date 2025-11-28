/**
 * WorkCreationPalette Component
 * Feature: 033-unified-work-creation-hub
 *
 * Main command palette for creating work items.
 * Supports commitments, tasks, and intake tickets with
 * progressive context capture.
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  ClipboardList,
  Inbox,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useCreationContext, type CreationContext } from './hooks/useCreationContext';
import { DossierPicker, type DossierOption } from './DossierPicker';
import { CommitmentQuickForm } from './forms/CommitmentQuickForm';
import { TaskQuickForm } from './forms/TaskQuickForm';
import { IntakeQuickForm } from './forms/IntakeQuickForm';

export type WorkItemType = 'commitment' | 'task' | 'intake';

type PaletteStep = 'type-select' | 'context-select' | 'form';

export interface WorkCreationPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: WorkItemType;
  /** Override automatic context detection */
  contextOverride?: Partial<CreationContext>;
  onSuccess?: (type: WorkItemType, item: any) => void;
}

interface WorkTypeOption {
  type: WorkItemType;
  icon: typeof CheckSquare;
  labelKey: string;
  descriptionKey: string;
  requiresDossier: boolean;
}

const WORK_TYPE_OPTIONS: WorkTypeOption[] = [
  {
    type: 'commitment',
    icon: CheckSquare,
    labelKey: 'palette.createCommitment',
    descriptionKey: 'palette.commitmentDescription',
    requiresDossier: true,
  },
  {
    type: 'task',
    icon: ClipboardList,
    labelKey: 'palette.createTask',
    descriptionKey: 'palette.taskDescription',
    requiresDossier: false,
  },
  {
    type: 'intake',
    icon: Inbox,
    labelKey: 'palette.createIntake',
    descriptionKey: 'palette.intakeDescription',
    requiresDossier: false,
  },
];

export function WorkCreationPalette({
  open,
  onOpenChange,
  defaultType,
  contextOverride,
  onSuccess,
}: WorkCreationPaletteProps) {
  const { t, i18n } = useTranslation('work-creation');
  const isRTL = i18n.language === 'ar';

  // Auto-capture context from route
  const autoContext = useCreationContext();
  const context: CreationContext = {
    ...autoContext,
    ...contextOverride,
  };

  // State
  const [step, setStep] = useState<PaletteStep>('type-select');
  const [selectedType, setSelectedType] = useState<WorkItemType | null>(defaultType ?? null);
  const [selectedDossier, setSelectedDossier] = useState<DossierOption | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Delay reset to allow close animation
      const timeout = setTimeout(() => {
        setStep('type-select');
        setSelectedType(defaultType ?? null);
        setSelectedDossier(undefined);
        setSearchQuery('');
      }, 200);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [open, defaultType]);

  // Auto-advance if context is available
  useEffect(() => {
    if (open && defaultType) {
      const option = WORK_TYPE_OPTIONS.find((o) => o.type === defaultType);
      if (option) {
        if (option.requiresDossier && !context.dossierId) {
          setStep('context-select');
        } else {
          setStep('form');
        }
      }
    }
  }, [open, defaultType, context.dossierId]);

  const handleTypeSelect = useCallback(
    (type: WorkItemType) => {
      setSelectedType(type);
      const option = WORK_TYPE_OPTIONS.find((o) => o.type === type);

      if (option?.requiresDossier && !context.dossierId) {
        // Need to select dossier first
        setStep('context-select');
      } else {
        // Can proceed directly to form
        setStep('form');
      }
    },
    [context.dossierId]
  );

  const handleDossierSelect = useCallback((dossierId: string | null, dossier?: DossierOption) => {
    if (dossierId && dossier) {
      setSelectedDossier(dossier);
    }
  }, []);

  const handleDossierContinue = useCallback(() => {
    if (selectedDossier) {
      setStep('form');
    }
  }, [selectedDossier]);

  const handleBack = useCallback(() => {
    if (step === 'form') {
      const option = WORK_TYPE_OPTIONS.find((o) => o.type === selectedType);
      if (option?.requiresDossier && !context.dossierId) {
        setStep('context-select');
      } else {
        setStep('type-select');
      }
    } else if (step === 'context-select') {
      setStep('type-select');
      setSelectedType(null);
    }
  }, [step, selectedType, context.dossierId]);

  const handleSuccess = useCallback(
    (item: any) => {
      onSuccess?.(selectedType!, item);
      onOpenChange(false);
    },
    [selectedType, onSuccess, onOpenChange]
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Determine final dossier ID
  const finalDossierId = selectedDossier?.id ?? context.dossierId;

  // Filter work types by search
  const filteredTypes = WORK_TYPE_OPTIONS.filter((option) => {
    if (!searchQuery) return true;
    const label = t(option.labelKey).toLowerCase();
    const desc = t(option.descriptionKey).toLowerCase();
    const query = searchQuery.toLowerCase();
    return label.includes(query) || desc.includes(query) || option.type.includes(query);
  });

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      preventCloseOnOutsideClick={step !== 'type-select'}
    >
      <div className="flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header with back button */}
        {step !== 'type-select' && (
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={handleBack}
            >
              <ArrowLeft className={cn('size-4', isRTL && 'rotate-180')} />
              <span className="sr-only">{t('actions.back', 'Back')}</span>
            </Button>
            <span className="text-sm font-medium">
              {step === 'context-select'
                ? t('palette.selectDossier', 'Select Dossier')
                : selectedType && t(WORK_TYPE_OPTIONS.find((o) => o.type === selectedType)!.labelKey)}
            </span>
          </div>
        )}

        {/* Step: Type Selection */}
        {step === 'type-select' && (
          <Command shouldFilter={false} className="rounded-lg">
            <CommandInput
              placeholder={t('palette.placeholder', 'What would you like to create?')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{t('palette.noResults', 'No results found')}</CommandEmpty>
              <CommandGroup heading={t('palette.workTypes', 'Work Item Types')}>
                {filteredTypes.map((option) => {
                  const Icon = option.icon;
                  return (
                    <CommandItem
                      key={option.type}
                      value={option.type}
                      onSelect={() => handleTypeSelect(option.type)}
                      className="min-h-14 flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {t(option.labelKey)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(option.descriptionKey)}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn('size-4 text-muted-foreground', isRTL && 'rotate-180')}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        {/* Step: Context Selection (Dossier Picker) */}
        {step === 'context-select' && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t(
                'palette.dossierRequired',
                'Commitments must be linked to a dossier. Please select one:'
              )}
            </p>
            <DossierPicker
              value={selectedDossier?.id}
              onChange={handleDossierSelect}
              selectedDossier={selectedDossier}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 min-h-11"
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleDossierContinue}
                disabled={!selectedDossier}
                className="flex-1 min-h-11"
              >
                {t('actions.continue', 'Continue')}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && selectedType && (
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {selectedType === 'commitment' && finalDossierId && (
              <CommitmentQuickForm
                dossierId={finalDossierId}
                creationContext={context}
                selectedDossier={selectedDossier}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
            {selectedType === 'task' && (
              <TaskQuickForm
                creationContext={context}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
            {selectedType === 'intake' && (
              <IntakeQuickForm
                dossierId={finalDossierId}
                creationContext={context}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        )}
      </div>
    </CommandDialog>
  );
}

export default WorkCreationPalette;
