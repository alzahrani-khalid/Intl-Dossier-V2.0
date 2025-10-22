import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Calendar,
  MessageSquare,
  Lightbulb,
  Upload,
  UserPlus,
  FileText,
} from 'lucide-react';

interface DossierActionsProps {
  dossierId: string;
  onAddEngagement?: () => void;
  onAddPosition?: () => void;
  onLogIntelligence?: () => void;
  onUploadDocument?: () => void;
  onAddContact?: () => void;
  onGenerateBrief?: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'outline',
  disabled = false,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      className="h-auto w-full justify-start gap-2 px-4 py-3"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <div className="shrink-0" aria-hidden="true">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}

export function DossierActions({
  onAddEngagement,
  onAddPosition,
  onLogIntelligence,
  onUploadDocument,
  onAddContact,
  onGenerateBrief,
}: DossierActionsProps) {
  const { t } = useTranslation('dossiers');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Primary Action - Generate Brief */}
        {onGenerateBrief && (
          <ActionButton
            icon={<FileText className="size-5" />}
            label={t('generateBrief')}
            onClick={onGenerateBrief}
            variant="default"
          />
        )}

        {/* Secondary Actions */}
        {onAddEngagement && (
          <ActionButton
            icon={<Calendar className="size-5" />}
            label={t('actions.addEngagement')}
            onClick={onAddEngagement}
          />
        )}

        {onAddPosition && (
          <ActionButton
            icon={<MessageSquare className="size-5" />}
            label={t('actions.addPosition')}
            onClick={onAddPosition}
          />
        )}

        {onLogIntelligence && (
          <ActionButton
            icon={<Lightbulb className="size-5" />}
            label={t('actions.logIntelligence')}
            onClick={onLogIntelligence}
          />
        )}

        {onUploadDocument && (
          <ActionButton
            icon={<Upload className="size-5" />}
            label={t('actions.uploadDocument')}
            onClick={onUploadDocument}
          />
        )}

        {onAddContact && (
          <ActionButton
            icon={<UserPlus className="size-5" />}
            label={t('actions.addContact')}
            onClick={onAddContact}
          />
        )}
      </CardContent>
    </Card>
  );
}