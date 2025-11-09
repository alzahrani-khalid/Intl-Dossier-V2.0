import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useDuplicateCandidates, useMergeTickets } from '../hooks/useIntakeApi';

interface DuplicateCandidate {
 id: string;
 target_ticket_id: string;
 target_ticket: {
 id: string;
 ticket_number: string;
 title: string;
 title_ar?: string;
 description: string;
 description_ar?: string;
 request_type: string;
 status: string;
 created_at: string;
 };
 overall_score: number;
 title_similarity: number;
 content_similarity: number;
 metadata_similarity: number;
 status: 'pending' | 'confirmed_duplicate' | 'not_duplicate' | 'merged';
}

interface DuplicateComparisonProps {
 ticketId: string;
}

export function DuplicateComparison({ ticketId }: DuplicateComparisonProps) {
 const { t, i18n } = useTranslation('intake');
 const queryClient = useQueryClient();
 const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
 const [mergeReason, setMergeReason] = useState('');

 // Fetch duplicate candidates using the proper hook
 const { data: response, isLoading, error } = useDuplicateCandidates(ticketId);
 const candidates = response?.candidates || [];

 // Use the merge tickets hook
 const mergeMutation = useMergeTickets(ticketId);

 // Mark as not duplicate mutation
 const notDuplicateMutation = useMutation({
 mutationFn: async (candidateId: string) => {
 const response = await fetch(
 `${import.meta.env.VITE_API_URL}/intake/duplicates/${candidateId}`,
 {
 method: 'PATCH',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${localStorage.getItem('access_token')}`,
 },
 body: JSON.stringify({
 status: 'not_duplicate',
 }),
 }
 );

 if (!response.ok) {
 throw new Error('Failed to update duplicate status');
 }

 return response.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['duplicate-candidates', ticketId] });
 },
 });

 const getSimilarityColor = (score: number): string => {
 if (score >= 0.8) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
 if (score >= 0.65) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
 return 'text-green-600 bg-green-100 dark:bg-green-900/20';
 };

 const getSimilarityLabel = (score: number): string => {
 if (score >= 0.8) return t('duplicates.similarity.high', 'High Similarity');
 if (score >= 0.65) return t('duplicates.similarity.medium', 'Medium Similarity');
 return t('duplicates.similarity.low', 'Low Similarity');
 };

 const handleMerge = (primaryId: string) => {
 if (!selectedCandidate || !mergeReason.trim()) {
 alert(t('duplicates.mergeReasonRequired', 'Please provide a reason for merging'));
 return;
 }

 const targetId = primaryId === ticketId ? selectedCandidate.target_ticket_id : ticketId;

 mergeMutation.mutate({
 targetTicketIds: [targetId],
 primaryTicketId: primaryId,
 mergeReason: mergeReason,
 mergeReasonAr: i18n.language === 'ar' ? mergeReason : undefined,
 }, {
 onSuccess: () => {
 setSelectedCandidate(null);
 setMergeReason('');
 }
 });
 };

 if (isLoading) {
 return (
 <div className="py-8 text-center">
 <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
 <p className="mt-4 text-gray-600 dark:text-gray-400">
 {t('duplicates.loading', 'Checking for duplicates...')}
 </p>
 </div>
 );
 }

 if (error) {
 return (
 <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
 {t('duplicates.error', 'Failed to load duplicate candidates. Please try again.')}
 </div>
 );
 }

 if (!candidates || candidates.length === 0) {
 return (
 <div className="py-8 text-center">
 <div className="mb-4 text-6xl">✓</div>
 <p className="text-lg text-gray-600 dark:text-gray-400">
 {t('duplicates.noDuplicates', 'No potential duplicates detected')}
 </p>
 </div>
 );
 }

 // Separate high-confidence and medium-confidence candidates
 const highConfidence = candidates.filter((c) => c.overall_score >= 0.8);
 const mediumConfidence = candidates.filter((c) => c.overall_score >= 0.65 && c.overall_score < 0.8);

 return (
 <div className="space-y-6">
 {/* Warning Banner for High Confidence Duplicates */}
 {highConfidence.length > 0 && (
 <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
 <div className="mb-2 flex items-center gap-2">
 <span className="text-xl text-red-600 dark:text-red-400">⚠️</span>
 <h3 className="font-semibold text-red-800 dark:text-red-300">
 {t('duplicates.highConfidenceWarning', 'High Confidence Duplicates Detected')}
 </h3>
 </div>
 <p className="text-sm text-red-700 dark:text-red-400">
 {t(
 'duplicates.highConfidenceMessage',
 'We found {{count}} ticket(s) with high similarity. Please review and consider merging.',
 { count: highConfidence.length }
 )}
 </p>
 </div>
 )}

 {/* High Confidence Candidates */}
 {highConfidence.length > 0 && (
 <div>
 <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
 {t('duplicates.highConfidence', 'High Confidence Duplicates')}
 </h3>
 <div className="space-y-4">
 {highConfidence.map((candidate) => (
 <DuplicateCandidateCard
 key={candidate.id}
 candidate={candidate}
 onSelect={() => setSelectedCandidate(candidate)}
 onNotDuplicate={() => notDuplicateMutation.mutate(candidate.id)}
 isSelected={selectedCandidate?.id === candidate.id}
 />
 ))}
 </div>
 </div>
 )}

 {/* Medium Confidence Candidates */}
 {mediumConfidence.length > 0 && (
 <div>
 <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
 {t('duplicates.mediumConfidence', 'Possible Duplicates')}
 </h3>
 <div className="space-y-4">
 {mediumConfidence.map((candidate) => (
 <DuplicateCandidateCard
 key={candidate.id}
 candidate={candidate}
 onSelect={() => setSelectedCandidate(candidate)}
 onNotDuplicate={() => notDuplicateMutation.mutate(candidate.id)}
 isSelected={selectedCandidate?.id === candidate.id}
 />
 ))}
 </div>
 </div>
 )}

 {/* Merge Dialog */}
 {selectedCandidate && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
 <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
 <div className="p-6">
 <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
 {t('duplicates.mergDialog.title', 'Merge Tickets')}
 </h2>

 <div className="mb-6 space-y-4">
 <div>
 <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('duplicates.mergeDialog.primaryTicket', 'Select Primary Ticket')}
 </label>
 <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
 {t(
 'duplicates.mergeDialog.primaryTicketHelp',
 'The primary ticket will remain active, and the other will be marked as merged.'
 )}
 </p>
 <div className="space-y-2">
 <button
 onClick={() => handleMerge(ticketId)}
 className="w-full rounded-lg border-2 border-blue-500 bg-blue-50 p-3 text-start hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
 >
 <div className="font-medium text-gray-900 dark:text-white">
 {t('duplicates.mergeDialog.currentTicket', 'Current Ticket')}
 </div>
 <div className="text-sm text-gray-600 dark:text-gray-400">{ticketId}</div>
 </button>
 <button
 onClick={() => handleMerge(selectedCandidate.target_ticket_id)}
 className="w-full rounded-lg border-2 border-gray-300 p-3 text-start hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
 >
 <div className="font-medium text-gray-900 dark:text-white">
 {selectedCandidate.target_ticket.ticket_number}
 </div>
 <div className="text-sm text-gray-600 dark:text-gray-400">
 {i18n.language === 'ar' && selectedCandidate.target_ticket.title_ar
 ? selectedCandidate.target_ticket.title_ar
 : selectedCandidate.target_ticket.title}
 </div>
 </button>
 </div>
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('duplicates.mergeDialog.reason', 'Reason for Merge')} *
 </label>
 <textarea
 value={mergeReason}
 onChange={(e) => setMergeReason(e.target.value)}
 placeholder={t(
 'duplicates.mergeDialog.reasonPlaceholder',
 'Explain why these tickets should be merged'
 )}
 rows={3}
 className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
 />
 </div>
 </div>

 <div className="flex gap-3">
 <button
 onClick={() => {
 setSelectedCandidate(null);
 setMergeReason('');
 }}
 className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
 >
 {t('common.cancel', 'Cancel')}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// Sub-component for individual candidate cards
function DuplicateCandidateCard({
 candidate,
 onSelect,
 onNotDuplicate,
 isSelected,
}: {
 candidate: DuplicateCandidate;
 onSelect: () => void;
 onNotDuplicate: () => void;
 isSelected: boolean;
}) {
 const { t, i18n } = useTranslation('intake');

 const getSimilarityColor = (score: number): string => {
 if (score >= 0.8) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
 if (score >= 0.65) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
 return 'text-green-600 bg-green-100 dark:bg-green-900/20';
 };

 return (
 <div
 className={`rounded-lg border-2 p-4 transition-all ${
 isSelected
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
 : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
 }`}
 >
 <div className="mb-3 flex items-start justify-between">
 <div className="flex-1">
 <Link
 to={`/intake/tickets/${candidate.target_ticket_id}`}
 className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
 target="_blank"
 >
 {candidate.target_ticket.ticket_number} ↗
 </Link>
 <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
 {i18n.language === 'ar' && candidate.target_ticket.title_ar
 ? candidate.target_ticket.title_ar
 : candidate.target_ticket.title}
 </h4>
 </div>
 <div className={`rounded-full px-3 py-1 text-sm font-semibold ${getSimilarityColor(candidate.overall_score)}`}>
 {Math.round(candidate.overall_score * 100)}%
 </div>
 </div>

 <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
 {i18n.language === 'ar' && candidate.target_ticket.description_ar
 ? candidate.target_ticket.description_ar
 : candidate.target_ticket.description}
 </p>

 <div className="mb-4 grid grid-cols-3 gap-2">
 <div className="text-center">
 <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
 {t('duplicates.titleSimilarity', 'Title')}
 </div>
 <div className="text-sm font-semibold text-gray-900 dark:text-white">
 {Math.round(candidate.title_similarity * 100)}%
 </div>
 </div>
 <div className="text-center">
 <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
 {t('duplicates.contentSimilarity', 'Content')}
 </div>
 <div className="text-sm font-semibold text-gray-900 dark:text-white">
 {Math.round(candidate.content_similarity * 100)}%
 </div>
 </div>
 <div className="text-center">
 <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
 {t('duplicates.metadataSimilarity', 'Metadata')}
 </div>
 <div className="text-sm font-semibold text-gray-900 dark:text-white">
 {Math.round(candidate.metadata_similarity * 100)}%
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <button
 onClick={onSelect}
 className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
 >
 {t('duplicates.merge', 'Merge Tickets')}
 </button>
 <button
 onClick={onNotDuplicate}
 className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
 >
 {t('duplicates.notDuplicate', 'Not a Duplicate')}
 </button>
 </div>
 </div>
 );
}