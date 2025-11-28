/**
 * WorkCreationProvider Component
 * Feature: 033-unified-work-creation-hub
 *
 * Provides global work creation functionality via context.
 * Wraps the app and handles ⌘K shortcut registration.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { WorkCreationPalette, type WorkItemType } from './WorkCreationPalette';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface WorkCreationContextValue {
  /** Open the creation palette */
  openPalette: (defaultType?: WorkItemType) => void;
  /** Close the creation palette */
  closePalette: () => void;
  /** Whether the palette is open */
  isOpen: boolean;
}

const WorkCreationContext = createContext<WorkCreationContextValue | null>(null);

export interface WorkCreationProviderProps {
  children: ReactNode;
  /** Disable the ⌘K shortcut */
  disableShortcut?: boolean;
}

export function WorkCreationProvider({
  children,
  disableShortcut = false,
}: WorkCreationProviderProps) {
  const { t } = useTranslation('work-creation');
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<WorkItemType | undefined>();

  const openPalette = useCallback((type?: WorkItemType) => {
    setDefaultType(type);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setDefaultType(undefined);
  }, []);

  const handleSuccess = useCallback(
    (type: WorkItemType, _item: unknown) => {
      const messages: Record<WorkItemType, string> = {
        commitment: t('success.commitmentCreated', 'Commitment created successfully'),
        task: t('success.taskCreated', 'Task created successfully'),
        intake: t('success.intakeCreated', 'Intake request submitted successfully'),
      };
      toast.success(messages[type]);
    },
    [t]
  );

  // Register ⌘K shortcut
  useGlobalKeyboard({
    onCreateNew: () => openPalette(),
    enabled: !disableShortcut,
  });

  return (
    <WorkCreationContext.Provider value={{ openPalette, closePalette, isOpen }}>
      {children}
      <WorkCreationPalette
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultType={defaultType}
        onSuccess={handleSuccess}
      />
    </WorkCreationContext.Provider>
  );
}

/**
 * Hook to access work creation functionality
 */
export function useWorkCreation() {
  const context = useContext(WorkCreationContext);
  if (!context) {
    throw new Error('useWorkCreation must be used within a WorkCreationProvider');
  }
  return context;
}

export default WorkCreationProvider;
