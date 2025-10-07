/**
 * PositionSuggestionsPanel Component (T045)
 * Displays AI-suggested positions with relevance scores
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePositionSuggestions } from '@/hooks/usePositionSuggestions';
import { useUpdateSuggestionAction } from '@/hooks/useUpdateSuggestionAction';
import type { Position } from '@/types/position';

export interface PositionSuggestionsPanelProps {
  engagementId: string;
  onAttach?: (positionId: string) => void;
  className?: string;
}

interface PositionSuggestion {
  id: string;
  position_id: string;
  position: Position;
  relevance_score: number;
  suggestion_reasoning?: {
    keywords?: string[];
    context_factors?: string[];
  };
  user_action?: 'accepted' | 'rejected' | 'ignored';
}

export const PositionSuggestionsPanel: React.FC<PositionSuggestionsPanelProps> = ({
  engagementId,
  onAttach,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch AI suggestions
  const { data, isLoading, error, refetch } = usePositionSuggestions(engagementId);
  const suggestions = data?.suggestions as PositionSuggestion[] || [];
  const isFallbackMode = data?.fallback_mode || false;

  // Mutation for updating suggestion actions
  const updateActionMutation = useUpdateSuggestionAction(engagementId);

  // Get relevance indicator
  const getRelevanceIndicator = (score: number) => {
    if (score >= 0.85) {
      return {
        label: t('positions.suggestions.relevance.high'),
        icon: TrendingUp,
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
      };
    } else if (score >= 0.75) {
      return {
        label: t('positions.suggestions.relevance.medium'),
        icon: Minus,
        variant: 'secondary' as const,
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    } else {
      return {
        label: t('positions.suggestions.relevance.low'),
        icon: TrendingDown,
        variant: 'outline' as const,
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
  };

  // Handle one-click attach
  const handleAttach = async (suggestion: PositionSuggestion) => {
    if (onAttach) {
      onAttach(suggestion.position_id);
      // Update suggestion action to 'accepted'
      await updateActionMutation.mutateAsync({
        suggestionId: suggestion.id,
        action: 'accepted',
      });
    }
  };

  // Handle reject suggestion
  const handleReject = async (suggestionId: string) => {
    await updateActionMutation.mutateAsync({
      suggestionId,
      action: 'rejected',
    });
  };

  // Get localized position title
  const getPositionTitle = (position: Position) => {
    return i18n.language === 'ar' ? position.title_ar : position.title_en;
  };

  // Get localized position content preview
  const getPositionPreview = (position: Position) => {
    const content = i18n.language === 'ar' ? position.content_ar : position.content_en;
    return content ? (content.length > 150 ? `${content.substring(0, 150)}...` : content) : '';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('positions.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{t('positions.suggestions.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('positions.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('positions.suggestions.error')}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            {t('positions.suggestions.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('positions.suggestions.title')}
        </CardTitle>
        <CardDescription>
          {t('positions.suggestions.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Fallback Mode Indicator */}
        {isFallbackMode && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('positions.suggestions.fallbackMode')}
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions List */}
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <Sparkles className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              {t('positions.suggestions.empty')}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {t('positions.suggestions.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label={t('positions.suggestions.listLabel')}>
            {suggestions.map((suggestion) => {
              const relevanceIndicator = getRelevanceIndicator(suggestion.relevance_score);
              const Icon = relevanceIndicator.icon;
              const isActioned = suggestion.user_action === 'accepted' || suggestion.user_action === 'rejected';

              return (
                <Card
                  key={suggestion.id}
                  className={`transition-opacity ${isActioned ? 'opacity-50' : ''}`}
                  role="listitem"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Position Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <h4 className="font-medium leading-tight" dir={isRTL ? 'rtl' : 'ltr'}>
                            {getPositionTitle(suggestion.position)}
                          </h4>
                          <Badge variant={relevanceIndicator.variant} className="shrink-0">
                            <Icon className={`me-1 h-3 w-3 ${relevanceIndicator.color}`} />
                            {relevanceIndicator.label}
                          </Badge>
                        </div>

                        {/* Content Preview */}
                        <p className="text-sm text-muted-foreground line-clamp-2" dir={isRTL ? 'rtl' : 'ltr'}>
                          {getPositionPreview(suggestion.position)}
                        </p>

                        {/* Relevance Score */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t('positions.suggestions.score')}:</span>
                          <span className="font-mono font-medium">
                            {(suggestion.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Reasoning Keywords */}
                        {suggestion.suggestion_reasoning?.keywords && suggestion.suggestion_reasoning.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {suggestion.suggestion_reasoning.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!isActioned && (
                        <div className="flex shrink-0 flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAttach(suggestion)}
                            disabled={!onAttach || updateActionMutation.isPending}
                            aria-label={t('positions.suggestions.attachLabel', {
                              title: getPositionTitle(suggestion.position),
                            })}
                          >
                            {t('positions.suggestions.attach')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(suggestion.id)}
                            disabled={updateActionMutation.isPending}
                            aria-label={t('positions.suggestions.rejectLabel', {
                              title: getPositionTitle(suggestion.position),
                            })}
                          >
                            {t('positions.suggestions.reject')}
                          </Button>
                        </div>
                      )}

                      {/* Action Status */}
                      {isActioned && (
                        <Badge variant={suggestion.user_action === 'accepted' ? 'default' : 'secondary'}>
                          {t(`positions.suggestions.action.${suggestion.user_action}`)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        {suggestions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 w-full"
            disabled={isLoading}
          >
            <Sparkles className="me-2 h-4 w-4" />
            {t('positions.suggestions.refresh')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
