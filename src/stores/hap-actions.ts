import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
  TaskResponsibility,
  ResponsibilityPhase,
  PhaseOwner,
  ResponsibilityPreset,
  CapabilityRequirement,
} from '@/lib/schemas';
import {
  createEmptyTaskResponsibility,
  applyPresetToTask,
  createCapabilityRequirement,
  RESPONSIBILITY_PRESETS,
} from '@/lib/schemas/hap';
import type { HAPState, HAPViewMode, HAPFilters, HAPDraft } from './hap-types';
import { initialDraft } from './hap-types';

// Create actions factory that operates on the store
export function createHAPActions(hapStore: HAPState) {
  // Helper function to apply preset to a task (used by both applyPresetToTask and applyPresetToAllTasks)
  const applyPresetToTaskImpl = (taskId: string, preset: ResponsibilityPreset) => {
    const taskIndex = hapStore.draft.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const task = hapStore.draft.tasks[taskIndex];
      const updatedTask = applyPresetToTask(task, preset);
      hapStore.draft.tasks[taskIndex] = updatedTask;

      const agentStoryId = hapStore.draft.agentStoryId;
      if (agentStoryId) {
        const presetConfig = RESPONSIBILITY_PRESETS[preset];
        const phases: ResponsibilityPhase[] = ['manage', 'define', 'perform', 'review'];

        for (const phase of phases) {
          if (presetConfig.phases[phase] === 'agent' && !updatedTask.phases[phase].skillId) {
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
  };

  return {
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

        task.phases[phase] = {
          ...task.phases[phase],
          owner,
          skillId: owner === 'human' ? null : task.phases[phase].skillId,
        };

        if (owner === 'agent' && previousOwner === 'human') {
          const agentStoryId = hapStore.draft.agentStoryId;
          if (agentStoryId && !task.phases[phase].skillId) {
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

        if (owner === 'human' && previousOwner === 'agent') {
          hapStore.draft.capabilityRequirements = hapStore.draft.capabilityRequirements.filter(
            r => !(r.taskId === taskId && r.phase === phase && r.status === 'pending')
          );
        }

        hapStore.isDirty = true;
      }
    },

    applyPresetToTask: (taskId: string, preset: ResponsibilityPreset) => {
      applyPresetToTaskImpl(taskId, preset);
    },

    applyPresetToAllTasks: (preset: ResponsibilityPreset) => {
      for (const task of hapStore.draft.tasks) {
        applyPresetToTaskImpl(task.id, preset);
      }
    },

    // Skill link actions
    linkSkillToPhase: (taskId: string, phase: ResponsibilityPhase, skillId: string) => {
      const taskIndex = hapStore.draft.tasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0) {
        hapStore.draft.tasks[taskIndex].phases[phase].skillId = skillId;

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

    // Lookup helpers
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

    getDepartmentsForDomain: (domainId: string): Department[] => {
      return hapStore.cache.departments.filter(d => d.domainId === domainId);
    },

    getRolesForDepartment: (departmentId: string): Role[] => {
      return hapStore.cache.roles.filter(r => r.departmentId === departmentId);
    },

    getPeopleForDepartment: (departmentId: string): Person[] => {
      return hapStore.cache.people.filter(p => p.departmentId === departmentId);
    },

    getHAPsForPerson: (personId: string): HumanAgentPair[] => {
      return hapStore.cache.haps.filter(h => h.personId === personId);
    },

    getHAPsForRole: (roleId: string): HumanAgentPair[] => {
      return hapStore.cache.haps.filter(h => h.roleId === roleId);
    },
  };
}
