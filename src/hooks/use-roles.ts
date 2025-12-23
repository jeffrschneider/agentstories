import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type { Role } from '@/lib/schemas';
import { hapKeys } from './use-hap-keys';

export function useRoles(departmentId?: string) {
  const query = useQuery({
    queryKey: departmentId ? hapKeys.rolesByDepartment(departmentId) : hapKeys.roles(),
    queryFn: () => hapDataService.roles.list(departmentId),
  });

  if (query.data) {
    hapActions.setRoles(query.data);
  }

  return query;
}

export function useRole(id: string) {
  return useQuery({
    queryKey: hapKeys.role(id),
    queryFn: () => hapDataService.roles.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) =>
      hapDataService.roles.create(data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.roles() });
      uiActions.addToast({
        type: 'success',
        title: 'Role created',
        message: `"${newRole.name}" has been created.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create role',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) =>
      hapDataService.roles.update(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: hapKeys.roles() });
        uiActions.addToast({
          type: 'success',
          title: 'Role updated',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update role',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await hapDataService.roles.delete(id);
      return { id, name };
    },
    onSuccess: ({ name }) => {
      queryClient.invalidateQueries({ queryKey: hapKeys.roles() });
      uiActions.addToast({
        type: 'success',
        title: 'Role deleted',
        message: `"${name}" has been deleted.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete role',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
