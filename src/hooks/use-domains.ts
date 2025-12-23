import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type { BusinessDomain } from '@/lib/schemas';
import { hapKeys } from './use-hap-keys';

export function useDomains() {
  const query = useQuery({
    queryKey: hapKeys.domains(),
    queryFn: () => hapDataService.domains.list(),
  });

  // Sync to store cache
  if (query.data) {
    hapActions.setDomains(query.data);
  }

  return query;
}

export function useDomain(id: string) {
  return useQuery({
    queryKey: hapKeys.domain(id),
    queryFn: () => hapDataService.domains.get(id),
    enabled: !!id,
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<BusinessDomain, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.domains.create(data),
    onSuccess: (newDomain) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.domains() });
      uiActions.addToast({
        type: 'success',
        title: 'Domain created',
        message: `"${newDomain.name}" has been created.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create domain',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BusinessDomain> }) =>
      hapDataService.domains.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: hapKeys.domains() });
        queryClient.setQueryData(hapKeys.domain(updated.id), updated);
        uiActions.addToast({
          type: 'success',
          title: 'Domain updated',
          message: 'Your changes have been saved.',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update domain',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await hapDataService.domains.delete(id);
      return { id, name };
    },
    onSuccess: ({ name }) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.domains() });
      uiActions.addToast({
        type: 'success',
        title: 'Domain deleted',
        message: `"${name}" has been deleted.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete domain',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
