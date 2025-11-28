/**
 * Work Creation Hub - Public Exports
 * Feature: 033-unified-work-creation-hub
 */

// Main components
export { WorkCreationPalette, type WorkCreationPaletteProps, type WorkItemType } from './WorkCreationPalette';
export { WorkCreationProvider, useWorkCreation, type WorkCreationProviderProps } from './WorkCreationProvider';
export { DossierPicker, type DossierPickerProps, type DossierOption } from './DossierPicker';

// Forms
export { CommitmentQuickForm, type CommitmentQuickFormProps } from './forms/CommitmentQuickForm';
export { TaskQuickForm, type TaskQuickFormProps } from './forms/TaskQuickForm';
export { IntakeQuickForm, type IntakeQuickFormProps } from './forms/IntakeQuickForm';

// Hooks
export { useCreationContext, type CreationContext, type EntityType } from './hooks/useCreationContext';
export { useGlobalKeyboard, getShortcutText, type GlobalKeyboardOptions } from './hooks/useGlobalKeyboard';
