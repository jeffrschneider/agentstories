import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions } from '@/stores';
import type { Capability, CapabilityAnalysis } from '@/lib/schemas';

// Query keys
export const capabilityKeys = {
  all: ['capabilities'] as const,
  list: (domain?: string) => [...capabilityKeys.all, 'list', { domain }] as const,
  detail: (id: string) => [...capabilityKeys.all, 'detail', id] as const,
  analysis: (id: string) => [...capabilityKeys.all, 'analysis', id] as const,
  analyses: () => [...capabilityKeys.all, 'analyses'] as const,
  gaps: () => [...capabilityKeys.all, 'gaps'] as const,
};

// ============================================
// Capability List Hooks
// ============================================

export function useCapabilities(domain?: string) {
  return useQuery({
    queryKey: capabilityKeys.list(domain),
    queryFn: () => hapDataService.capabilities.list(domain),
  });
}

export function useCapability(id: string) {
  return useQuery({
    queryKey: capabilityKeys.detail(id),
    queryFn: () => hapDataService.capabilities.get(id),
    enabled: !!id,
  });
}

// ============================================
// Capability Analysis Hooks
// ============================================

export function useCapabilityAnalysis(id: string) {
  return useQuery({
    queryKey: capabilityKeys.analysis(id),
    queryFn: () => hapDataService.capabilities.analyze(id),
    enabled: !!id,
  });
}

export function useCapabilityAnalyses() {
  return useQuery({
    queryKey: capabilityKeys.analyses(),
    queryFn: () => hapDataService.capabilities.analyzeAll(),
  });
}

export function useCapabilityGaps() {
  return useQuery({
    queryKey: capabilityKeys.gaps(),
    queryFn: () => hapDataService.capabilities.getGaps(),
  });
}

// ============================================
// Capability Mutation Hooks
// ============================================

export function useCreateCapability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.capabilities.create(data),
    onSuccess: (newCapability) => {
      queryClient.invalidateQueries({ queryKey: capabilityKeys.all });
      uiActions.addToast({
        type: 'success',
        title: 'Capability created',
        message: `"${newCapability.name}" has been created.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create capability',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdateCapability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Capability> }) =>
      hapDataService.capabilities.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: capabilityKeys.all });
        queryClient.setQueryData(capabilityKeys.detail(updated.id), updated);
        uiActions.addToast({
          type: 'success',
          title: 'Capability updated',
          message: 'Your changes have been saved.',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update capability',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeleteCapability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await hapDataService.capabilities.delete(id);
      return { id, name };
    },
    onSuccess: ({ name }) => {
      queryClient.invalidateQueries({ queryKey: capabilityKeys.all });
      uiActions.addToast({
        type: 'success',
        title: 'Capability deleted',
        message: `"${name}" has been deleted.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete capability',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
