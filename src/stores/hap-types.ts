import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
  TaskResponsibility,
  HAPIntegrationStatus,
  CapabilityRequirement,
} from '@/lib/schemas';

// HAP Editor Draft
export interface HAPDraft {
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
export interface HAPFilters {
  domainId: string | null;
  departmentId: string | null;
  personId: string | null;
  integrationStatus: HAPIntegrationStatus | null;
  search: string;
}

// Selected entities for navigation/context
export interface HAPSelection {
  domain: BusinessDomain | null;
  department: Department | null;
  role: Role | null;
  person: Person | null;
  hap: HumanAgentPair | null;
}

// View mode for HAP
export type HAPViewMode = 'list' | 'grid' | 'map';

// Cache for quick data access
export interface HAPCache {
  domains: BusinessDomain[];
  departments: Department[];
  roles: Role[];
  people: Person[];
  haps: HumanAgentPair[];
}

// Main store state
export interface HAPState {
  viewMode: HAPViewMode;
  filters: HAPFilters;
  selection: HAPSelection;
  draft: HAPDraft;
  isEditing: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  cache: HAPCache;
}

// Initial draft state
export const initialDraft: HAPDraft = {
  id: null,
  personId: null,
  roleId: null,
  agentStoryId: null,
  tasks: [],
  capabilityRequirements: [],
  integrationStatus: 'not_started',
  notes: '',
};

// Initial state factory
export const createInitialState = (): HAPState => ({
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
