import { useQuery } from '@tanstack/react-query';
import { mockDataService } from '@/services';

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
};

// Get dashboard stats
export function useStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: () => mockDataService.stats.get(),
    staleTime: 30 * 1000, // 30 seconds
  });
}
