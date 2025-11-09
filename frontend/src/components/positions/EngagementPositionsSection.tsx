/**
 * Engagement Positions Section (T054)
 *
 * Displays AI suggestions, attached positions, and briefing pack generator
 * Features: Smart suggestions, one-click attach, PDF generation
 * Integration: Part of engagement detail page
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEngagementPositions } from '../../hooks/useEngagementPositions';
import { usePositionSuggestions } from '../../hooks/usePositionSuggestions';
import { PositionList } from './PositionList';
import { PositionSuggestionsPanel } from './PositionSuggestionsPanel';
import { BriefingPackGenerator } from './BriefingPackGenerator';
import { AttachPositionDialog } from './AttachPositionDialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Sparkles, FileText } from 'lucide-react';

interface EngagementPositionsSectionProps {
 engagementId: string;
}

export function EngagementPositionsSection({
 engagementId,
}: EngagementPositionsSectionProps) {
 const { t } = useTranslation(['positions', 'common']);
 const [showAttachDialog, setShowAttachDialog] = useState(false);
 const [activeTab, setActiveTab] = useState<'attached' | 'suggestions' | 'briefing'>(
 'attached'
 );

 // Fetch attached positions
 const {
 data: attachedData,
 isLoading: isLoadingAttached,
 error: attachedError,
 } = useEngagementPositions(engagementId, {
 sort: 'relevance_score',
 order: 'desc',
 });

 // Fetch AI suggestions
 const {
 data: suggestionsData,
 isLoading: isLoadingSuggestions,
 error: suggestionsError,
 } = usePositionSuggestions(engagementId);

 const attachedPositions = attachedData?.items || [];
 const suggestions = suggestionsData?.suggestions || [];
 const isFallbackMode = suggestionsData?.fallback_mode || false;
 const attachedCount = attachedData?.total || 0;
 const suggestionsCount = suggestions.length;

 return (
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 {t('positions:engagement_section.title')}
 </CardTitle>
 <CardDescription>
 {t('positions:engagement_section.subtitle')}
 </CardDescription>
 </div>
 <Button
 onClick={() => setShowAttachDialog(true)}
 size="sm"
 className="gap-2"
 >
 <Plus className="h-4 w-4" />
 {t('positions:engagement_section.attach_position')}
 </Button>
 </div>
 </CardHeader>

 <CardContent>
 <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="attached" className="gap-2">
 {t('positions:engagement_section.attached_tab')}
 {attachedCount > 0 && (
 <span className="ms-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
 {attachedCount}
 </span>
 )}
 </TabsTrigger>
 <TabsTrigger value="suggestions" className="gap-2">
 <Sparkles className="h-4 w-4" />
 {t('positions:engagement_section.suggestions_tab')}
 {suggestionsCount > 0 && (
 <span className="ms-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
 {suggestionsCount}
 </span>
 )}
 </TabsTrigger>
 <TabsTrigger
 value="briefing"
 disabled={attachedCount === 0}
 className="gap-2"
 >
 {t('positions:engagement_section.briefing_tab')}
 </TabsTrigger>
 </TabsList>

 {/* Attached Positions Tab */}
 <TabsContent value="attached" className="mt-6">
 {attachedError ? (
 <div
 className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center"
 role="alert"
 >
 <p className="text-sm text-red-700 dark:text-red-300">
 {attachedError instanceof Error
 ? attachedError.message
 : t('positions:engagement_section.error_loading_attached')}
 </p>
 </div>
 ) : (
 <PositionList
 positions={attachedPositions}
 isLoading={isLoadingAttached}
 context="engagement"
 engagementId={engagementId}
 emptyMessage={t('positions:engagement_section.no_attached')}
 showAttachButton={false}
 />
 )}
 </TabsContent>

 {/* Suggestions Tab */}
 <TabsContent value="suggestions" className="mt-6">
 {suggestionsError ? (
 <div
 className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center"
 role="alert"
 >
 <p className="text-sm text-red-700 dark:text-red-300">
 {suggestionsError instanceof Error
 ? suggestionsError.message
 : t('positions:engagement_section.error_loading_suggestions')}
 </p>
 </div>
 ) : (
 <PositionSuggestionsPanel
 engagementId={engagementId}
 suggestions={suggestions}
 isLoading={isLoadingSuggestions}
 isFallbackMode={isFallbackMode}
 />
 )}
 </TabsContent>

 {/* Briefing Pack Tab */}
 <TabsContent value="briefing" className="mt-6">
 {attachedCount === 0 ? (
 <div className="text-center py-12">
 <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
 <p className="text-sm text-gray-500 dark:text-gray-400">
 {t('positions:engagement_section.no_positions_for_briefing')}
 </p>
 <Button
 onClick={() => setActiveTab('attached')}
 variant="outline"
 size="sm"
 className="mt-4"
 >
 {t('positions:engagement_section.attach_positions_first')}
 </Button>
 </div>
 ) : (
 <BriefingPackGenerator
 engagementId={engagementId}
 positionCount={attachedCount}
 />
 )}
 </TabsContent>
 </Tabs>
 </CardContent>

 {/* Attach Position Dialog */}
 {showAttachDialog && (
 <AttachPositionDialog
 open={showAttachDialog}
 onClose={() => setShowAttachDialog(false)}
 context="engagement"
 contextId={engagementId}
 />
 )}
 </Card>
 );
}
