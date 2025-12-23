import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type { HumanAgentPair } from '@/lib/schemas';
import { hapKeys } from './use-hap-keys';

export function useHAPs(filters?: { personId?: string; roleId?: string; departmentId?: string }) {
  const query = useQuery({
    queryKey: hapKeys.hapsByFilters(filters || {}),
    queryFn: () => hapDataService.haps.list(filters),
  });

  if (query.data) {
    hapActions.setHAPs(query.data);
  }

  return query;
}

export function useHAPDetail(id: string) {
  return useQuery({
    queryKey: hapKeys.hap(id),
    queryFn: () => hapDataService.haps.get(id),
    enabled: !!id,
  });
}

export function useCreateHAP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<HumanAgentPair, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.haps.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hapKeys.haps() });
      uiActions.addToast({
        type: 'success',
        title: 'HAP created',
        message: 'Human-Agent Pair has been created.',
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create HAP',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdateHAP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HumanAgentPair> }) =>
      hapDataService.haps.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: hapKeys.haps() });
        uiActions.addToast({
          type: 'success',
          title: 'HAP updated',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update HAP',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeleteHAP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hapDataService.haps.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hapKeys.haps() });
      uiActions.addToast({
        type: 'success',
        title: 'HAP deleted',
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete HAP',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
