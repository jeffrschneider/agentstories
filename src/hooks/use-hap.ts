// HAP Hooks - Barrel Export
// Re-exports all HAP-related hooks from individual modules

// Query keys
export { hapKeys } from './use-hap-keys';

// Domain hooks
export {
  useDomains,
  useDomain,
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
} from './use-domains';

// Department hooks
export {
  useDepartments,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from './use-departments';

// Role hooks
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './use-roles';

// People hooks
export {
  usePeople,
  usePerson,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
} from './use-people';

// HAP hooks
export {
  useHAPs,
  useHAPDetail,
  useCreateHAP,
  useUpdateHAP,
  useDeleteHAP,
} from './use-haps';

// Stats hooks
export {
  useHAPStats,
  useDepartmentStats,
} from './use-hap-stats';
