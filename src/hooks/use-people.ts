import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type { Person } from '@/lib/schemas';
import { hapKeys } from './use-hap-keys';

export function usePeople(departmentId?: string) {
  const query = useQuery({
    queryKey: departmentId ? hapKeys.peopleByDepartment(departmentId) : hapKeys.people(),
    queryFn: () => hapDataService.people.list(departmentId),
  });

  if (query.data) {
    hapActions.setPeople(query.data);
  }

  return query;
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: hapKeys.person(id),
    queryFn: () => hapDataService.people.get(id),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.people.create(data),
    onSuccess: (newPerson) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.people() });
      uiActions.addToast({
        type: 'success',
        title: 'Person added',
        message: `"${newPerson.name}" has been added.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to add person',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) =>
      hapDataService.people.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: hapKeys.people() });
        uiActions.addToast({
          type: 'success',
          title: 'Person updated',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update person',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await hapDataService.people.delete(id);
      return { id, name };
    },
    onSuccess: ({ name }) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.people() });
      uiActions.addToast({
        type: 'success',
        title: 'Person removed',
        message: `"${name}" has been removed.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to remove person',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
