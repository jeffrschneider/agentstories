import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type { Department } from '@/lib/schemas';
import { hapKeys } from './use-hap-keys';

export function useDepartments(domainId?: string) {
  const query = useQuery({
    queryKey: domainId ? hapKeys.departmentsByDomain(domainId) : hapKeys.departments(),
    queryFn: () => hapDataService.departments.list(domainId),
  });

  if (query.data) {
    hapActions.setDepartments(query.data);
  }

  return query;
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: hapKeys.department(id),
    queryFn: () => hapDataService.departments.get(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.departments.create(data),
    onSuccess: (newDept) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.departments() });
      uiActions.addToast({
        type: 'success',
        title: 'Department created',
        message: `"${newDept.name}" has been created.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create department',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      hapDataService.departments.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: hapKeys.departments() });
        uiActions.addToast({
          type: 'success',
          title: 'Department updated',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update department',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await hapDataService.departments.delete(id);
      return { id, name };
    },
    onSuccess: ({ name }) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.departments() });
      uiActions.addToast({
        type: 'success',
        title: 'Department deleted',
        message: `"${name}" has been deleted.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete department',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
