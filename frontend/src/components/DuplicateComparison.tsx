import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

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

  // Fetch duplicate candidates
  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['duplicate-candidates', ticketId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/intake/tickets/${ticketId}/duplicates`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch duplicate candidates');
      }

      return response.json() as Promise<DuplicateCandidate[]>;
    },
  });

  // Merge tickets mutation
  const mergeMutation = useMutation({
    mutationFn: async ({
      candidateId,
      primaryTicketId,
      reason,
    }: {
      candidateId: string;
      primaryTicketId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/intake/tickets/${ticketId}/merge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            target_ticket_id: primaryTicketId === ticketId ? selectedCandidate?.target_ticket_id : ticketId,
            primary_ticket_id: primaryTicketId,
            merge_reason: reason,
            merge_reason_ar: i18n.language === 'ar' ? reason : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to merge tickets');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-candidates', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['intake-ticket', ticketId] });
      setSelectedCandidate(null);
      setMergeReason('');
    },
  });

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

    mergeMutation.mutate({
      candidateId: selectedCandidate.id,
      primaryTicketId: primaryId,
      reason: mergeReason,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {t('duplicates.loading', 'Checking for duplicates...')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        {t('duplicates.error', 'Failed to load duplicate candidates. Please try again.')}
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">✓</div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t('duplicates.highConfidenceWarning', 'High Confidence Duplicates Detected')}
            </h3>
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('duplicates.mergDialog.title', 'Merge Tickets')}
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('duplicates.mergeDialog.primaryTicket', 'Select Primary Ticket')}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t(
                      'duplicates.mergeDialog.primaryTicketHelp',
                      'The primary ticket will remain active, and the other will be marked as merged.'
                    )}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMerge(ticketId)}
                      className="w-full text-start p-3 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t('duplicates.mergeDialog.currentTicket', 'Current Ticket')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{ticketId}</div>
                    </button>
                    <button
                      onClick={() => handleMerge(selectedCandidate.target_ticket_id)}
                      className="w-full text-start p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedCandidate(null);
                    setMergeReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
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
      className={`border-2 rounded-lg p-4 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            to={`/intake/tickets/${candidate.target_ticket_id}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            target="_blank"
          >
            {candidate.target_ticket.ticket_number} ↗
          </Link>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {i18n.language === 'ar' && candidate.target_ticket.title_ar
              ? candidate.target_ticket.title_ar
              : candidate.target_ticket.title}
          </h4>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSimilarityColor(candidate.overall_score)}`}>
          {Math.round(candidate.overall_score * 100)}%
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {i18n.language === 'ar' && candidate.target_ticket.description_ar
          ? candidate.target_ticket.description_ar
          : candidate.target_ticket.description}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('duplicates.titleSimilarity', 'Title')}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.round(candidate.title_similarity * 100)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('duplicates.contentSimilarity', 'Content')}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.round(candidate.content_similarity * 100)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
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
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          {t('duplicates.merge', 'Merge Tickets')}
        </button>
        <button
          onClick={onNotDuplicate}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('duplicates.notDuplicate', 'Not a Duplicate')}
        </button>
      </div>
    </div>
  );
}