import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapDataService } from '@/services/mock-hap-data';
import { uiActions, hapActions } from '@/stores';
import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
} from '@/lib/schemas';

// Query keys
export const hapKeys = {
  all: ['hap'] as const,
  // Domains
  domains: () => [...hapKeys.all, 'domains'] as const,
  domain: (id: string) => [...hapKeys.domains(), id] as const,
  // Departments
  departments: () => [...hapKeys.all, 'departments'] as const,
  departmentsByDomain: (domainId: string) => [...hapKeys.departments(), 'byDomain', domainId] as const,
  department: (id: string) => [...hapKeys.departments(), id] as const,
  // Roles
  roles: () => [...hapKeys.all, 'roles'] as const,
  rolesByDepartment: (departmentId: string) => [...hapKeys.roles(), 'byDept', departmentId] as const,
  role: (id: string) => [...hapKeys.roles(), id] as const,
  // People
  people: () => [...hapKeys.all, 'people'] as const,
  peopleByDepartment: (departmentId: string) => [...hapKeys.people(), 'byDept', departmentId] as const,
  person: (id: string) => [...hapKeys.people(), id] as const,
  // HAPs
  haps: () => [...hapKeys.all, 'haps'] as const,
  hapsByFilters: (filters: { personId?: string; roleId?: string; departmentId?: string }) =>
    [...hapKeys.haps(), 'filtered', filters] as const,
  hap: (id: string) => [...hapKeys.haps(), id] as const,
  // Stats
  stats: () => [...hapKeys.all, 'stats'] as const,
  departmentStats: (deptId: string) => [...hapKeys.stats(), 'dept', deptId] as const,
};

// ============================================
// Domain Hooks
// ============================================

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

// ============================================
// Department Hooks
// ============================================

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

// ============================================
// Role Hooks
// ============================================

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

// ============================================
// People Hooks
// ============================================

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

// ============================================
// HAP Hooks
// ============================================

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

// ============================================
// Stats Hooks
// ============================================

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
