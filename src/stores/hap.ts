import { proxy, useSnapshot } from 'valtio';
import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
  TaskAssignment,
  TransitionStatus,
} from '@/lib/schemas';

// HAP Editor Draft
interface HAPDraft {
  id: string | null;
  personId: string | null;
  roleId: string | null;
  agentStoryId: string | null;
  taskAssignments: TaskAssignment[];
  transitionStatus: TransitionStatus;
  notes: string;
  targetCompletionDate: string | null;
}

// Filter state for HAP list
interface HAPFilters {
  domainId: string | null;
  departmentId: string | null;
  personId: string | null;
  transitionStatus: TransitionStatus | null;
  search: string;
}

// Selected entities for navigation/context
interface HAPSelection {
  domain: BusinessDomain | null;
  department: Department | null;
  role: Role | null;
  person: Person | null;
  hap: HumanAgentPair | null;
}

// View mode for HAP
type HAPViewMode = 'list' | 'grid' | 'map';

interface HAPState {
  // Current view mode
  viewMode: HAPViewMode;

  // Filters for list view
  filters: HAPFilters;

  // Currently selected entities
  selection: HAPSelection;

  // Editor state
  draft: HAPDraft;
  isEditing: boolean;
  isDirty: boolean;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Cached data for quick access
  cache: {
    domains: BusinessDomain[];
    departments: Department[];
    roles: Role[];
    people: Person[];
    haps: HumanAgentPair[];
  };
}

const initialDraft: HAPDraft = {
  id: null,
  personId: null,
  roleId: null,
  agentStoryId: null,
  taskAssignments: [],
  transitionStatus: 'not_started',
  notes: '',
  targetCompletionDate: null,
};

export const hapStore = proxy<HAPState>({
  viewMode: 'list',

  filters: {
    domainId: null,
    departmentId: null,
    personId: null,
    transitionStatus: null,
    search: '',
  },

  selection: {
    domain: null,
    department: null,
    role: null,
    person: null,
    hap: null,
  },

  draft: { ...initialDraft },
  isEditing: false,
  isDirty: false,

  isLoading: false,
  isSaving: false,

  cache: {
    domains: [],
    departments: [],
    roles: [],
    people: [],
    haps: [],
  },
});

// Actions
export const hapActions = {
  // View mode
  setViewMode: (mode: HAPViewMode) => {
    hapStore.viewMode = mode;
  },

  // Filters
  setFilter: <K extends keyof HAPFilters>(key: K, value: HAPFilters[K]) => {
    hapStore.filters[key] = value;
  },

  clearFilters: () => {
    hapStore.filters = {
      domainId: null,
      departmentId: null,
      personId: null,
      transitionStatus: null,
      search: '',
    };
  },

  // Selection
  selectDomain: (domain: BusinessDomain | null) => {
    hapStore.selection.domain = domain;
    // Clear child selections when domain changes
    if (!domain) {
      hapStore.selection.department = null;
      hapStore.selection.role = null;
      hapStore.selection.person = null;
      hapStore.selection.hap = null;
    }
  },

  selectDepartment: (department: Department | null) => {
    hapStore.selection.department = department;
    if (!department) {
      hapStore.selection.role = null;
      hapStore.selection.person = null;
      hapStore.selection.hap = null;
    }
  },

  selectRole: (role: Role | null) => {
    hapStore.selection.role = role;
  },

  selectPerson: (person: Person | null) => {
    hapStore.selection.person = person;
  },

  selectHAP: (hap: HumanAgentPair | null) => {
    hapStore.selection.hap = hap;
  },

  // Draft/Editor
  initNewHAP: () => {
    hapStore.draft = { ...initialDraft };
    hapStore.isEditing = true;
    hapStore.isDirty = false;
  },

  loadHAP: (hap: HumanAgentPair) => {
    hapStore.draft = {
      id: hap.id,
      personId: hap.personId,
      roleId: hap.roleId,
      agentStoryId: hap.agentStoryId,
      taskAssignments: [...hap.asIs.taskAssignments],
      transitionStatus: hap.transitionStatus,
      notes: hap.notes || '',
      targetCompletionDate: hap.targetCompletionDate || null,
    };
    hapStore.isEditing = true;
    hapStore.isDirty = false;
  },

  updateDraft: <K extends keyof HAPDraft>(field: K, value: HAPDraft[K]) => {
    hapStore.draft[field] = value;
    hapStore.isDirty = true;
  },

  addTaskAssignment: (task: TaskAssignment) => {
    hapStore.draft.taskAssignments.push(task);
    hapStore.isDirty = true;
  },

  updateTaskAssignment: (index: number, task: Partial<TaskAssignment>) => {
    if (index >= 0 && index < hapStore.draft.taskAssignments.length) {
      hapStore.draft.taskAssignments[index] = {
        ...hapStore.draft.taskAssignments[index],
        ...task,
      };
      hapStore.isDirty = true;
    }
  },

  removeTaskAssignment: (index: number) => {
    if (index >= 0 && index < hapStore.draft.taskAssignments.length) {
      hapStore.draft.taskAssignments.splice(index, 1);
      hapStore.isDirty = true;
    }
  },

  clearDraft: () => {
    hapStore.draft = { ...initialDraft };
    hapStore.isEditing = false;
    hapStore.isDirty = false;
  },

  // Loading states
  setLoading: (loading: boolean) => {
    hapStore.isLoading = loading;
  },

  setSaving: (saving: boolean) => {
    hapStore.isSaving = saving;
  },

  // Cache management
  setDomains: (domains: BusinessDomain[]) => {
    hapStore.cache.domains = domains;
  },

  setDepartments: (departments: Department[]) => {
    hapStore.cache.departments = departments;
  },

  setRoles: (roles: Role[]) => {
    hapStore.cache.roles = roles;
  },

  setPeople: (people: Person[]) => {
    hapStore.cache.people = people;
  },

  setHAPs: (haps: HumanAgentPair[]) => {
    hapStore.cache.haps = haps;
  },

  // Lookup helpers (use cached data)
  getDomainById: (id: string): BusinessDomain | undefined => {
    return hapStore.cache.domains.find(d => d.id === id);
  },

  getDepartmentById: (id: string): Department | undefined => {
    return hapStore.cache.departments.find(d => d.id === id);
  },

  getRoleById: (id: string): Role | undefined => {
    return hapStore.cache.roles.find(r => r.id === id);
  },

  getPersonById: (id: string): Person | undefined => {
    return hapStore.cache.people.find(p => p.id === id);
  },

  getHAPById: (id: string): HumanAgentPair | undefined => {
    return hapStore.cache.haps.find(h => h.id === id);
  },

  // Get departments for a domain
  getDepartmentsForDomain: (domainId: string): Department[] => {
    return hapStore.cache.departments.filter(d => d.domainId === domainId);
  },

  // Get roles for a department
  getRolesForDepartment: (departmentId: string): Role[] => {
    return hapStore.cache.roles.filter(r => r.departmentId === departmentId);
  },

  // Get people for a department
  getPeopleForDepartment: (departmentId: string): Person[] => {
    return hapStore.cache.people.filter(p => p.departmentId === departmentId);
  },

  // Get HAPs for a person
  getHAPsForPerson: (personId: string): HumanAgentPair[] => {
    return hapStore.cache.haps.filter(h => h.personId === personId);
  },

  // Get HAPs for a role
  getHAPsForRole: (roleId: string): HumanAgentPair[] => {
    return hapStore.cache.haps.filter(h => h.roleId === roleId);
  },
};

// Hook for easy access
export function useHAP() {
  return useSnapshot(hapStore);
}

// Computed selectors
export const hapSelectors = {
  // Get filtered HAPs based on current filters
  getFilteredHAPs: (): HumanAgentPair[] => {
    let result = [...hapStore.cache.haps];

    if (hapStore.filters.departmentId) {
      const deptRoleIds = hapStore.cache.roles
        .filter(r => r.departmentId === hapStore.filters.departmentId)
        .map(r => r.id);
      result = result.filter(h => deptRoleIds.includes(h.roleId));
    }

    if (hapStore.filters.personId) {
      result = result.filter(h => h.personId === hapStore.filters.personId);
    }

    if (hapStore.filters.transitionStatus) {
      result = result.filter(h => h.transitionStatus === hapStore.filters.transitionStatus);
    }

    if (hapStore.filters.search) {
      const search = hapStore.filters.search.toLowerCase();
      result = result.filter(h => {
        const person = hapStore.cache.people.find(p => p.id === h.personId);
        const role = hapStore.cache.roles.find(r => r.id === h.roleId);
        return (
          person?.name.toLowerCase().includes(search) ||
          role?.name.toLowerCase().includes(search) ||
          h.notes?.toLowerCase().includes(search)
        );
      });
    }

    return result;
  },

  // Get stats for current view
  getTransitionStats: () => {
    const haps = hapStore.cache.haps;
    return {
      total: haps.length,
      notStarted: haps.filter(h => h.transitionStatus === 'not_started').length,
      planned: haps.filter(h => h.transitionStatus === 'planned').length,
      inProgress: haps.filter(h => h.transitionStatus === 'in_progress').length,
      blocked: haps.filter(h => h.transitionStatus === 'blocked').length,
      completed: haps.filter(h => h.transitionStatus === 'completed').length,
    };
  },
};
