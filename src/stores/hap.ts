import { proxy, useSnapshot } from 'valtio';
import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
  TaskResponsibility,
  HAPIntegrationStatus,
  CapabilityRequirement,
  ResponsibilityPhase,
  PhaseOwner,
  ResponsibilityPreset,
} from '@/lib/schemas';
import {
  createEmptyTaskResponsibility,
  applyPresetToTask,
  createCapabilityRequirement,
  calculateHAPMetrics,
  determineIntegrationStatus,
  RESPONSIBILITY_PRESETS,
} from '@/lib/schemas/hap';

// HAP Editor Draft
interface HAPDraft {
  id: string | null;
  personId: string | null;
  roleId: string | null;
  agentStoryId: string | null;
  tasks: TaskResponsibility[];
  capabilityRequirements: CapabilityRequirement[];
  integrationStatus: HAPIntegrationStatus;
  notes: string;
}

// Filter state for HAP list
interface HAPFilters {
  domainId: string | null;
  departmentId: string | null;
  personId: string | null;
  integrationStatus: HAPIntegrationStatus | null;
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
  tasks: [],
  capabilityRequirements: [],
  integrationStatus: 'not_started',
  notes: '',
};

export const hapStore = proxy<HAPState>({
  viewMode: 'list',

  filters: {
    domainId: null,
    departmentId: null,
    personId: null,
    integrationStatus: null,
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
      integrationStatus: null,
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
      tasks: [...hap.tasks],
      capabilityRequirements: [...hap.capabilityRequirements],
      integrationStatus: hap.integrationStatus,
      notes: hap.notes || '',
    };
    hapStore.isEditing = true;
    hapStore.isDirty = false;
  },

  updateDraft: <K extends keyof HAPDraft>(field: K, value: HAPDraft[K]) => {
    hapStore.draft[field] = value;
    hapStore.isDirty = true;
  },

  // Task Responsibility actions
  addTask: (taskName: string) => {
    const task = createEmptyTaskResponsibility(taskName);
    hapStore.draft.tasks.push(task);
    hapStore.isDirty = true;
  },

  updateTask: (taskId: string, updates: Partial<TaskResponsibility>) => {
    const index = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
      hapStore.draft.tasks[index] = {
        ...hapStore.draft.tasks[index],
        ...updates,
      };
      hapStore.isDirty = true;
    }
  },

  removeTask: (taskId: string) => {
    const index = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
      hapStore.draft.tasks.splice(index, 1);
      // Also remove any capability requirements for this task
      hapStore.draft.capabilityRequirements = hapStore.draft.capabilityRequirements.filter(
        r => r.taskId !== taskId
      );
      hapStore.isDirty = true;
    }
  },

  // Phase assignment actions
  setPhaseOwner: (
    taskId: string,
    phase: ResponsibilityPhase,
    owner: PhaseOwner
  ) => {
    const taskIndex = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const task = hapStore.draft.tasks[taskIndex];
      const previousOwner = task.phases[phase].owner;

      // Update the phase owner
      task.phases[phase] = {
        ...task.phases[phase],
        owner,
        // Clear skillId if switching from agent to human
        skillId: owner === 'human' ? null : task.phases[phase].skillId,
      };

      // If switching to agent and no skill is linked, create a capability requirement
      if (owner === 'agent' && previousOwner === 'human') {
        const agentStoryId = hapStore.draft.agentStoryId;
        if (agentStoryId && !task.phases[phase].skillId) {
          // Check if requirement already exists
          const existingReq = hapStore.draft.capabilityRequirements.find(
            r => r.taskId === taskId && r.phase === phase
          );
          if (!existingReq) {
            const req = createCapabilityRequirement(
              hapStore.draft.id || crypto.randomUUID(),
              taskId,
              task.taskName,
              phase,
              agentStoryId,
              task.description
            );
            hapStore.draft.capabilityRequirements.push(req);
          }
        }
      }

      // If switching to human, remove any pending capability requirement for this phase
      if (owner === 'human' && previousOwner === 'agent') {
        hapStore.draft.capabilityRequirements = hapStore.draft.capabilityRequirements.filter(
          r => !(r.taskId === taskId && r.phase === phase && r.status === 'pending')
        );
      }

      hapStore.isDirty = true;
    }
  },

  applyPresetToTask: (taskId: string, preset: ResponsibilityPreset) => {
    const taskIndex = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const task = hapStore.draft.tasks[taskIndex];
      const updatedTask = applyPresetToTask(task, preset);
      hapStore.draft.tasks[taskIndex] = updatedTask;

      // Create capability requirements for any new agent phases
      const agentStoryId = hapStore.draft.agentStoryId;
      if (agentStoryId) {
        const presetConfig = RESPONSIBILITY_PRESETS[preset];
        const phases: ResponsibilityPhase[] = ['manage', 'define', 'perform', 'review'];

        for (const phase of phases) {
          if (presetConfig.phases[phase] === 'agent' && !updatedTask.phases[phase].skillId) {
            // Check if requirement already exists
            const existingReq = hapStore.draft.capabilityRequirements.find(
              r => r.taskId === taskId && r.phase === phase
            );
            if (!existingReq) {
              const req = createCapabilityRequirement(
                hapStore.draft.id || crypto.randomUUID(),
                taskId,
                updatedTask.taskName,
                phase,
                agentStoryId,
                updatedTask.description
              );
              hapStore.draft.capabilityRequirements.push(req);
            }
          }
        }
      }

      hapStore.isDirty = true;
    }
  },

  applyPresetToAllTasks: (preset: ResponsibilityPreset) => {
    for (const task of hapStore.draft.tasks) {
      hapActions.applyPresetToTask(task.id, preset);
    }
  },

  // Skill link actions
  linkSkillToPhase: (taskId: string, phase: ResponsibilityPhase, skillId: string) => {
    const taskIndex = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      hapStore.draft.tasks[taskIndex].phases[phase].skillId = skillId;

      // Update any matching capability requirement to applied
      const reqIndex = hapStore.draft.capabilityRequirements.findIndex(
        r => r.taskId === taskId && r.phase === phase
      );
      if (reqIndex >= 0) {
        hapStore.draft.capabilityRequirements[reqIndex] = {
          ...hapStore.draft.capabilityRequirements[reqIndex],
          status: 'applied',
          appliedAt: new Date().toISOString(),
        };
      }

      hapStore.isDirty = true;
    }
  },

  // Capability requirement actions
  updateCapabilityRequirementStatus: (
    requirementId: string,
    status: CapabilityRequirement['status']
  ) => {
    const index = hapStore.draft.capabilityRequirements.findIndex(r => r.id === requirementId);
    if (index >= 0) {
      hapStore.draft.capabilityRequirements[index] = {
        ...hapStore.draft.capabilityRequirements[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      hapStore.isDirty = true;
    }
  },

  setGeneratedCapability: (requirementId: string, generatedCapability: unknown) => {
    const index = hapStore.draft.capabilityRequirements.findIndex(r => r.id === requirementId);
    if (index >= 0) {
      hapStore.draft.capabilityRequirements[index] = {
        ...hapStore.draft.capabilityRequirements[index],
        generatedCapability,
        status: 'ready',
        updatedAt: new Date().toISOString(),
      };
      hapStore.isDirty = true;
    }
  },

  dismissCapabilityRequirement: (requirementId: string) => {
    const index = hapStore.draft.capabilityRequirements.findIndex(r => r.id === requirementId);
    if (index >= 0) {
      hapStore.draft.capabilityRequirements[index] = {
        ...hapStore.draft.capabilityRequirements[index],
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      };
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

    if (hapStore.filters.integrationStatus) {
      result = result.filter(h => h.integrationStatus === hapStore.filters.integrationStatus);
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
  getIntegrationStats: () => {
    const haps = hapStore.cache.haps;
    return {
      total: haps.length,
      notStarted: haps.filter(h => h.integrationStatus === 'not_started').length,
      planning: haps.filter(h => h.integrationStatus === 'planning').length,
      skillsPending: haps.filter(h => h.integrationStatus === 'skills_pending').length,
      ready: haps.filter(h => h.integrationStatus === 'ready').length,
      active: haps.filter(h => h.integrationStatus === 'active').length,
      paused: haps.filter(h => h.integrationStatus === 'paused').length,
    };
  },

  // Get aggregate metrics across all HAPs
  getAggregateMetrics: () => {
    const haps = hapStore.cache.haps;
    let totalTasks = 0;
    let totalPhases = 0;
    let humanPhases = 0;
    let agentPhases = 0;
    let agentPhasesWithSkills = 0;
    let pendingCapabilityRequirements = 0;

    for (const hap of haps) {
      const metrics = calculateHAPMetrics(hap);
      totalTasks += metrics.totalTasks;
      totalPhases += metrics.totalPhases;
      humanPhases += metrics.humanPhases;
      agentPhases += metrics.agentPhases;
      agentPhasesWithSkills += metrics.agentPhasesWithSkills;
      pendingCapabilityRequirements += metrics.pendingCapabilityRequirements;
    }

    return {
      totalHAPs: haps.length,
      totalTasks,
      totalPhases,
      humanPhases,
      agentPhases,
      agentPhasesWithSkills,
      agentPhasesPendingSkills: agentPhases - agentPhasesWithSkills,
      pendingCapabilityRequirements,
      humanPercent: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
      agentPercent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
    };
  },

  // Get all pending capability requirements across all HAPs
  getAllPendingCapabilityRequirements: (): CapabilityRequirement[] => {
    const allRequirements: CapabilityRequirement[] = [];
    for (const hap of hapStore.cache.haps) {
      const pending = hap.capabilityRequirements.filter(
        r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
      );
      allRequirements.push(...pending);
    }
    return allRequirements;
  },

  // Get draft metrics
  getDraftMetrics: () => {
    if (hapStore.draft.tasks.length === 0) {
      return {
        totalTasks: 0,
        totalPhases: 0,
        humanPhases: 0,
        agentPhases: 0,
        pendingCapabilityRequirements: hapStore.draft.capabilityRequirements.filter(
          r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
        ).length,
      };
    }

    let humanPhases = 0;
    let agentPhases = 0;

    for (const task of hapStore.draft.tasks) {
      for (const phase of Object.values(task.phases)) {
        if (phase.owner === 'human') {
          humanPhases++;
        } else {
          agentPhases++;
        }
      }
    }

    return {
      totalTasks: hapStore.draft.tasks.length,
      totalPhases: hapStore.draft.tasks.length * 4,
      humanPhases,
      agentPhases,
      pendingCapabilityRequirements: hapStore.draft.capabilityRequirements.filter(
        r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
      ).length,
    };
  },
};
