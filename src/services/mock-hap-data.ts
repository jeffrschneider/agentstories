import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
} from '@/lib/schemas';
import { calculateHAPMetrics } from '@/lib/schemas/hap';
import {
  mockDomains,
  mockDepartments,
  mockRoles,
  mockPeople,
  mockHAPs,
} from './mock-hap-entities';

// Simulated delay for realistic async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Storage keys
const STORAGE_KEY_HAP = 'agent-stories-hap-data';
const CURRENT_VERSION = '5.0';

interface HAPStorageData {
  domains: BusinessDomain[];
  departments: Department[];
  roles: Role[];
  people: Person[];
  haps: HumanAgentPair[];
  version: string;
}

// In-memory storage
let domains: BusinessDomain[] = [];
let departments: Department[] = [];
let roles: Role[] = [];
let people: Person[] = [];
let haps: HumanAgentPair[] = [];
let isInitialized = false;

// Load from localStorage
function loadHAPData(): HAPStorageData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_HAP);
    if (!stored) return null;

    const data: HAPStorageData = JSON.parse(stored);
    if (data.version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY_HAP);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Save to localStorage
function saveHAPData(): void {
  if (typeof window === 'undefined') return;

  try {
    const data: HAPStorageData = {
      domains,
      departments,
      roles,
      people,
      haps,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY_HAP, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save HAP data to localStorage:', error);
  }
}

// Initialize data
function initializeHAPData(): void {
  if (isInitialized) return;

  const stored = loadHAPData();
  if (stored) {
    domains = stored.domains;
    departments = stored.departments;
    roles = stored.roles;
    people = stored.people;
    haps = stored.haps;
  } else {
    domains = [...mockDomains];
    departments = [...mockDepartments];
    roles = [...mockRoles];
    people = [...mockPeople];
    haps = [...mockHAPs];
    saveHAPData();
  }
  isInitialized = true;
}

export const hapDataService = {
  // Domains
  domains: {
    list: async (): Promise<BusinessDomain[]> => {
      initializeHAPData();
      await delay(200);
      return [...domains];
    },

    get: async (id: string): Promise<BusinessDomain | null> => {
      initializeHAPData();
      await delay(100);
      return domains.find(d => d.id === id) || null;
    },

    create: async (data: Omit<BusinessDomain, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessDomain> => {
      initializeHAPData();
      await delay(300);
      const now = new Date().toISOString();
      const newDomain: BusinessDomain = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      domains.push(newDomain);
      saveHAPData();
      return newDomain;
    },

    update: async (id: string, data: Partial<BusinessDomain>): Promise<BusinessDomain | null> => {
      initializeHAPData();
      await delay(300);
      const index = domains.findIndex(d => d.id === id);
      if (index === -1) return null;

      domains[index] = {
        ...domains[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveHAPData();
      return domains[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeHAPData();
      await delay(200);
      const index = domains.findIndex(d => d.id === id);
      if (index === -1) return false;
      domains.splice(index, 1);
      saveHAPData();
      return true;
    },
  },

  // Departments
  departments: {
    list: async (domainId?: string): Promise<Department[]> => {
      initializeHAPData();
      await delay(200);
      if (domainId) {
        return departments.filter(d => d.domainId === domainId);
      }
      return [...departments];
    },

    get: async (id: string): Promise<Department | null> => {
      initializeHAPData();
      await delay(100);
      return departments.find(d => d.id === id) || null;
    },

    create: async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
      initializeHAPData();
      await delay(300);
      const now = new Date().toISOString();
      const newDept: Department = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      departments.push(newDept);
      saveHAPData();
      return newDept;
    },

    update: async (id: string, data: Partial<Department>): Promise<Department | null> => {
      initializeHAPData();
      await delay(300);
      const index = departments.findIndex(d => d.id === id);
      if (index === -1) return null;

      departments[index] = {
        ...departments[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveHAPData();
      return departments[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeHAPData();
      await delay(200);
      const index = departments.findIndex(d => d.id === id);
      if (index === -1) return false;
      departments.splice(index, 1);
      saveHAPData();
      return true;
    },
  },

  // Roles
  roles: {
    list: async (departmentId?: string): Promise<Role[]> => {
      initializeHAPData();
      await delay(200);
      if (departmentId) {
        return roles.filter(r => r.departmentId === departmentId);
      }
      return [...roles];
    },

    get: async (id: string): Promise<Role | null> => {
      initializeHAPData();
      await delay(100);
      return roles.find(r => r.id === id) || null;
    },

    create: async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
      initializeHAPData();
      await delay(300);
      const now = new Date().toISOString();
      const newRole: Role = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      roles.push(newRole);
      saveHAPData();
      return newRole;
    },

    update: async (id: string, data: Partial<Role>): Promise<Role | null> => {
      initializeHAPData();
      await delay(300);
      const index = roles.findIndex(r => r.id === id);
      if (index === -1) return null;

      roles[index] = {
        ...roles[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveHAPData();
      return roles[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeHAPData();
      await delay(200);
      const index = roles.findIndex(r => r.id === id);
      if (index === -1) return false;
      roles.splice(index, 1);
      saveHAPData();
      return true;
    },
  },

  // People
  people: {
    list: async (departmentId?: string): Promise<Person[]> => {
      initializeHAPData();
      await delay(200);
      if (departmentId) {
        return people.filter(p => p.departmentId === departmentId);
      }
      return [...people];
    },

    get: async (id: string): Promise<Person | null> => {
      initializeHAPData();
      await delay(100);
      return people.find(p => p.id === id) || null;
    },

    create: async (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
      initializeHAPData();
      await delay(300);
      const now = new Date().toISOString();
      const newPerson: Person = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      people.push(newPerson);
      saveHAPData();
      return newPerson;
    },

    update: async (id: string, data: Partial<Person>): Promise<Person | null> => {
      initializeHAPData();
      await delay(300);
      const index = people.findIndex(p => p.id === id);
      if (index === -1) return null;

      people[index] = {
        ...people[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveHAPData();
      return people[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeHAPData();
      await delay(200);
      const index = people.findIndex(p => p.id === id);
      if (index === -1) return false;
      people.splice(index, 1);
      saveHAPData();
      return true;
    },
  },

  // HAPs
  haps: {
    list: async (filters?: { personId?: string; roleId?: string; departmentId?: string }): Promise<HumanAgentPair[]> => {
      initializeHAPData();
      await delay(200);
      let result = [...haps];

      if (filters?.personId) {
        result = result.filter(h => h.personId === filters.personId);
      }
      if (filters?.roleId) {
        result = result.filter(h => h.roleId === filters.roleId);
      }
      if (filters?.departmentId) {
        const deptRoleIds = roles.filter(r => r.departmentId === filters.departmentId).map(r => r.id);
        result = result.filter(h => deptRoleIds.includes(h.roleId));
      }

      return result;
    },

    get: async (id: string): Promise<HumanAgentPair | null> => {
      initializeHAPData();
      await delay(100);
      return haps.find(h => h.id === id) || null;
    },

    create: async (data: Omit<HumanAgentPair, 'id' | 'createdAt' | 'updatedAt'>): Promise<HumanAgentPair> => {
      initializeHAPData();
      await delay(300);
      const now = new Date().toISOString();
      const newHAP: HumanAgentPair = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      haps.push(newHAP);
      saveHAPData();
      return newHAP;
    },

    update: async (id: string, data: Partial<HumanAgentPair>): Promise<HumanAgentPair | null> => {
      initializeHAPData();
      await delay(300);
      const index = haps.findIndex(h => h.id === id);
      if (index === -1) return null;

      haps[index] = {
        ...haps[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveHAPData();
      return haps[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeHAPData();
      await delay(200);
      const index = haps.findIndex(h => h.id === id);
      if (index === -1) return false;
      haps.splice(index, 1);
      saveHAPData();
      return true;
    },
  },

  // Stats
  stats: {
    getDepartmentStats: async (departmentId: string) => {
      initializeHAPData();
      await delay(200);

      const deptRoles = roles.filter(r => r.departmentId === departmentId);
      const deptRoleIds = deptRoles.map(r => r.id);
      const deptHaps = haps.filter(h => deptRoleIds.includes(h.roleId));
      const deptPeople = people.filter(p => p.departmentId === departmentId);

      let totalHumanPhases = 0;
      let totalAgentPhases = 0;
      let totalPendingCapabilities = 0;

      for (const hap of deptHaps) {
        const metrics = calculateHAPMetrics(hap);
        totalHumanPhases += metrics.humanPhases;
        totalAgentPhases += metrics.agentPhases;
        totalPendingCapabilities += metrics.pendingCapabilityRequirements;
      }

      const totalPhases = totalHumanPhases + totalAgentPhases;

      return {
        departmentId,
        roleCount: deptRoles.length,
        peopleCount: deptPeople.length,
        hapCount: deptHaps.length,
        phaseDistribution: {
          humanPhases: totalHumanPhases,
          agentPhases: totalAgentPhases,
          humanPercent: totalPhases > 0 ? Math.round((totalHumanPhases / totalPhases) * 100) : 100,
          agentPercent: totalPhases > 0 ? Math.round((totalAgentPhases / totalPhases) * 100) : 0,
        },
        pendingCapabilityRequirements: totalPendingCapabilities,
        integrationProgress: deptHaps.filter(h => h.integrationStatus === 'ready' || h.integrationStatus === 'active').length / (deptHaps.length || 1) * 100,
      };
    },

    getOverallStats: async () => {
      initializeHAPData();
      await delay(200);

      let totalTasks = 0;
      let totalHumanPhases = 0;
      let totalAgentPhases = 0;
      let pendingCapabilityRequirements = 0;

      for (const hap of haps) {
        const metrics = calculateHAPMetrics(hap);
        totalTasks += metrics.totalTasks;
        totalHumanPhases += metrics.humanPhases;
        totalAgentPhases += metrics.agentPhases;
        pendingCapabilityRequirements += metrics.pendingCapabilityRequirements;
      }

      return {
        domainCount: domains.length,
        departmentCount: departments.length,
        roleCount: roles.length,
        peopleCount: people.length,
        hapCount: haps.length,
        totalTasks,
        phaseDistribution: {
          humanPhases: totalHumanPhases,
          agentPhases: totalAgentPhases,
          humanPercent: (totalHumanPhases + totalAgentPhases) > 0
            ? Math.round((totalHumanPhases / (totalHumanPhases + totalAgentPhases)) * 100)
            : 100,
          agentPercent: (totalHumanPhases + totalAgentPhases) > 0
            ? Math.round((totalAgentPhases / (totalHumanPhases + totalAgentPhases)) * 100)
            : 0,
        },
        pendingCapabilityRequirements,
        hapsByStatus: {
          not_started: haps.filter(h => h.integrationStatus === 'not_started').length,
          planning: haps.filter(h => h.integrationStatus === 'planning').length,
          skills_pending: haps.filter(h => h.integrationStatus === 'skills_pending').length,
          ready: haps.filter(h => h.integrationStatus === 'ready').length,
          active: haps.filter(h => h.integrationStatus === 'active').length,
          paused: haps.filter(h => h.integrationStatus === 'paused').length,
        },
      };
    },
  },
};
