import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Clock,
  User,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

// Types based on API spec
interface Conflict {
  conflict_position_id: string;
  conflict_type: 'contradiction' | 'ambiguity' | 'overlap';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggested_resolution: string;
  affected_sections: string[];
}

interface ConsistencyCheck {
  id: string;
  position_id: string;
  check_trigger: 'manual' | 'automatic_on_submit';
  consistency_score: number;
  ai_service_available: boolean;
  conflicts: Conflict[];
  checked_at: string;
  checked_by: string;
}

interface ConsistencyPanelProps {
  consistencyCheck: ConsistencyCheck | null;
  onResolveConflict?: (
    conflictPositionId: string,
    action: 'modify' | 'accept' | 'escalate'
  ) => void;
  onViewConflictingPosition?: (positionId: string) => void;
  loading?: boolean;
}

export function ConsistencyPanel({
  consistencyCheck,
  onResolveConflict,
  onViewConflictingPosition,
  loading = false,
}: ConsistencyPanelProps) {
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';
  const [expandedConflicts, setExpandedConflicts] = useState<Set<number>>(new Set());

  // Toggle conflict expansion
  const toggleConflict = (index: number) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedConflicts(newExpanded);
  };

  // Get consistency score color and label
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number): string => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 75) return 'bg-blue-50';
    if (score >= 60) return 'bg-amber-50';
    if (score >= 40) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return t('consistency.scoreLabels.excellent');
    if (score >= 75) return t('consistency.scoreLabels.good');
    if (score >= 60) return t('consistency.scoreLabels.fair');
    if (score >= 40) return t('consistency.scoreLabels.poor');
    return t('consistency.scoreLabels.critical');
  };

  // Get severity badge variant and icon
  const getSeverityVariant = (
    severity: 'high' | 'medium' | 'low'
  ): 'destructive' | 'default' | 'secondary' => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="size-3" />;
      case 'medium':
        return <AlertCircle className="size-3" />;
      case 'low':
        return <Info className="size-3" />;
    }
  };

  // Get conflict type badge and icon
  const getConflictTypeBadge = (type: 'contradiction' | 'ambiguity' | 'overlap') => {
    const icons = {
      contradiction: <AlertTriangle className="size-3" />,
      ambiguity: <AlertCircle className="size-3" />,
      overlap: <Info className="size-3" />,
    };

    return (
      <Badge variant="outline" className="gap-1">
        {icons[type]}
        {t(`consistency.conflictTypes.${type}`)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Empty state
  if (!consistencyCheck) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-5 text-muted-foreground" />
            {t('consistency.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 py-8 text-center">
            <Shield className="mx-auto size-12 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('consistency.emptyState.title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('consistency.emptyState.description')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConflicts = consistencyCheck.conflicts.length > 0;
  const score = consistencyCheck.consistency_score;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Shield className="size-5" />
            {t('consistency.title')}
          </div>
          {/* AI Service Status Badge */}
          <Badge
            variant={consistencyCheck.ai_service_available ? 'default' : 'secondary'}
            className="gap-1"
          >
            <Zap className="size-3" />
            {consistencyCheck.ai_service_available
              ? t('consistency.aiAvailable')
              : t('consistency.aiUnavailable')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consistency Score Gauge */}
        <div
          className={`rounded-lg border p-4 ${getScoreBackgroundColor(score)}`}
          role="region"
          aria-label={t('consistency.score')}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t('consistency.score')}
            </span>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
          <Progress
            value={score}
            className="mb-2 h-2"
            aria-label={`${t('consistency.score')}: ${score} out of 100`}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">0</span>
            <span className={`text-sm font-medium ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </span>
            <span className="text-xs text-muted-foreground">100</span>
          </div>
        </div>

        {/* Check Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="size-4" />
            <div>
              <p className="text-xs">{t('consistency.checkTrigger')}</p>
              <p className="font-medium text-foreground">
                {consistencyCheck.check_trigger === 'manual'
                  ? t('consistency.manual')
                  : t('consistency.automaticOnSubmit')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <div>
              <p className="text-xs">{t('consistency.checkedAt')}</p>
              <p className="font-medium text-foreground">
                {formatDate(consistencyCheck.checked_at)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conflicts Section */}
        {!hasConflicts ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="size-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {t('consistency.noConflicts')}
              </p>
              <p className="text-xs text-green-700">
                {t('consistency.noConflictsDescription')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Conflicts Header */}
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {t('consistency.conflictsFound')} ({consistencyCheck.conflicts.length})
                </p>
                <p className="text-xs text-amber-700">
                  {t('consistency.conflictsFoundDescription')}
                </p>
              </div>
            </div>

            {/* Conflicts List */}
            <div className="space-y-2">
              {consistencyCheck.conflicts.map((conflict, index) => {
                const isExpanded = expandedConflicts.has(index);

                return (
                  <div
                    key={`${conflict.conflict_position_id}-${index}`}
                    className="overflow-hidden rounded-lg border"
                  >
                    {/* Conflict Header */}
                    <button
                      onClick={() => toggleConflict(index)}
                      className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-start transition-colors hover:bg-muted"
                      aria-expanded={isExpanded}
                      aria-controls={`conflict-${index}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {getSeverityIcon(conflict.severity)}
                        <span className="truncate text-sm font-medium">
                          {conflict.description}
                        </span>
                      </div>
                      <div className="ms-2 flex shrink-0 items-center gap-2">
                        <Badge variant={getSeverityVariant(conflict.severity)} className="gap-1">
                          {t(`consistency.severityLevels.${conflict.severity}`)}
                        </Badge>
                        {getConflictTypeBadge(conflict.conflict_type)}
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Conflict Details (Expandable) */}
                    {isExpanded && (
                      <div id={`conflict-${index}`} className="space-y-3 bg-background p-4">
                        {/* Affected Sections */}
                        {conflict.affected_sections.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                              {t('consistency.conflict.affectedSections')}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {conflict.affected_sections.map((section, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {section}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Resolution */}
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                          <p className="mb-1 text-xs font-medium text-blue-900">
                            {t('consistency.conflict.suggestedResolution')}
                          </p>
                          <p className="text-sm text-blue-800">{conflict.suggested_resolution}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              onResolveConflict?.(conflict.conflict_position_id, 'modify')
                            }
                            className="flex-1 sm:flex-initial"
                          >
                            {t('consistency.actions.modify')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onViewConflictingPosition?.(conflict.conflict_position_id)
                            }
                            className="gap-1"
                          >
                            {t('consistency.actions.viewPosition')}
                            <ExternalLink className="size-3" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              onResolveConflict?.(conflict.conflict_position_id, 'accept')
                            }
                          >
                            {t('consistency.actions.accept')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              onResolveConflict?.(conflict.conflict_position_id, 'escalate')
                            }
                          >
                            {t('consistency.actions.escalate')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
