import { useQuery } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { hapKeys } from './use-hap-keys';

export function useHAPStats() {
  return useQuery({
    queryKey: hapKeys.stats(),
    queryFn: () => hapDataService.stats.getOverallStats(),
  });
}

export function useDepartmentStats(departmentId: string) {
  return useQuery({
    queryKey: hapKeys.departmentStats(departmentId),
    queryFn: () => hapDataService.stats.getDepartmentStats(departmentId),
    enabled: !!departmentId,
  });
}
