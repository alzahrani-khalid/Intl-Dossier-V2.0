import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ChecklistItemRow } from './ChecklistItemRow';
import { ChecklistTemplateSelector } from './ChecklistTemplateSelector';
import { ListChecks, Plus, FileText } from 'lucide-react';
import type { Database } from '@/types/database';

type ChecklistItem = Database['public']['Tables']['assignment_checklist_items']['Row'];

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string, completed: boolean) => void;
  onAddItem: (text: string) => void;
  onImportTemplate: (templateId: string) => void;
  disabled?: boolean;
  getUserName?: (userId: string) => string;
}

export function ChecklistSection({
  items,
  onToggleItem,
  onAddItem,
  onImportTemplate,
  disabled = false,
  getUserName,
}: ChecklistSectionProps): JSX.Element {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Calculate progress
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleAddItem = (): void => {
    if (newItemText.trim()) {
      onAddItem(newItemText.trim());
      setNewItemText('');
      setShowAddItem(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleAddItem();
    } else if (e.key === 'Escape') {
      setShowAddItem(false);
      setNewItemText('');
    }
  };

  const handleTemplateImport = (templateId: string): void => {
    onImportTemplate(templateId);
    setShowTemplateSelector(false);
  };

  // Sort items by sequence
  const sortedItems = [...items].sort((a, b) => a.sequence - b.sequence);

  return (
    <>
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              {t('checklist.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
                disabled={disabled}
              >
                <FileText className="h-4 w-4 me-2" />
                {t('checklist.importTemplate')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddItem(true)}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 me-2" />
                {t('checklist.addItem')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('checklist.progress')}:</span>
              <span className="font-medium">
                {Math.round(progressPercentage)}% ({completedItems}/{totalItems})
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Add New Item Input */}
          {showAddItem && (
            <div className="flex gap-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('checklist.addItemPlaceholder')}
                maxLength={500}
                autoFocus
              />
              <Button size="sm" onClick={handleAddItem} disabled={!newItemText.trim()}>
                {t('checklist.add')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddItem(false);
                  setNewItemText('');
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}

          {/* Checklist Items */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('checklist.empty')}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedItems.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  disabled={disabled}
                  completedByName={
                    item.completed_by && getUserName
                      ? getUserName(item.completed_by)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <ChecklistTemplateSelector
          onSelect={handleTemplateImport}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  );
}
