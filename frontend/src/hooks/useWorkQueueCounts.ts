// Placeholder hook for work queue counts
// TODO: Implement actual API call to fetch work queue counts
export function useWorkQueueCounts() {
  return {
    data: {
      assignments: 0,
      intake: 0,
      waiting: 0,
    },
    isLoading: false,
  };
}
