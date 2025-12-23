// Query keys for HAP-related data
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
