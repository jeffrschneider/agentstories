import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
} from '@/lib/schemas';

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
const CURRENT_VERSION = '1.0';

interface HAPStorageData {
  domains: BusinessDomain[];
  departments: Department[];
  roles: Role[];
  people: Person[];
  haps: HumanAgentPair[];
  version: string;
}

// Fixed UUIDs for referential integrity in mock data
const DOMAIN_IDS = {
  customerService: uuid(),
  engineering: uuid(),
  sales: uuid(),
};

const DEPT_IDS = {
  supportTier1: uuid(),
  supportTier2: uuid(),
  platformEng: uuid(),
  frontendEng: uuid(),
  sdr: uuid(),
};

const ROLE_IDS = {
  supportSpecialist: uuid(),
  seniorSupport: uuid(),
  codeReviewer: uuid(),
  platformEngineer: uuid(),
  leadQualifier: uuid(),
};

const PERSON_IDS = {
  sarah: uuid(),
  mike: uuid(),
  alex: uuid(),
  jamie: uuid(),
  taylor: uuid(),
};

// We'll reference agent story IDs dynamically
const AGENT_STORY_PLACEHOLDER = 'customer-support-agent';

// Mock data
const now = new Date().toISOString();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const mockDomains: BusinessDomain[] = [
  {
    id: DOMAIN_IDS.customerService,
    name: 'Customer Service',
    description: 'Customer support, success, and experience teams',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DOMAIN_IDS.engineering,
    name: 'Engineering',
    description: 'Software development, infrastructure, and QA',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DOMAIN_IDS.sales,
    name: 'Sales',
    description: 'Sales development, account management, and revenue',
    createdAt: weekAgo,
    updatedAt: now,
  },
];

const mockDepartments: Department[] = [
  {
    id: DEPT_IDS.supportTier1,
    domainId: DOMAIN_IDS.customerService,
    name: 'Tier 1 Support',
    description: 'First-line customer support handling common inquiries',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DEPT_IDS.supportTier2,
    domainId: DOMAIN_IDS.customerService,
    name: 'Tier 2 Support',
    description: 'Advanced support for complex technical issues',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DEPT_IDS.platformEng,
    domainId: DOMAIN_IDS.engineering,
    name: 'Platform Engineering',
    description: 'Core platform and infrastructure development',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DEPT_IDS.frontendEng,
    domainId: DOMAIN_IDS.engineering,
    name: 'Frontend Engineering',
    description: 'User interface and experience development',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: DEPT_IDS.sdr,
    domainId: DOMAIN_IDS.sales,
    name: 'Sales Development',
    description: 'Lead qualification and outbound prospecting',
    createdAt: weekAgo,
    updatedAt: now,
  },
];

const mockRoles: Role[] = [
  {
    id: ROLE_IDS.supportSpecialist,
    departmentId: DEPT_IDS.supportTier1,
    name: 'Support Specialist',
    description: 'Handle incoming customer inquiries and resolve common issues',
    level: 'entry',
    responsibilities: [
      {
        id: uuid(),
        name: 'Ticket Triage',
        description: 'Categorize and prioritize incoming support tickets',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Common Issue Resolution',
        description: 'Resolve frequently asked questions and known issues',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Customer Communication',
        description: 'Respond to customers with clear, empathetic messages',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Escalation Handling',
        description: 'Identify and escalate complex issues to Tier 2',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Customer Relationship Building',
        description: 'Build rapport and maintain positive customer relationships',
        aiCandidate: false,
      },
    ],
    requiredSkillDomains: ['Customer Service', 'Communication'],
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: ROLE_IDS.seniorSupport,
    departmentId: DEPT_IDS.supportTier2,
    name: 'Senior Support Engineer',
    description: 'Handle complex technical issues and mentor junior staff',
    level: 'senior',
    responsibilities: [
      {
        id: uuid(),
        name: 'Complex Issue Resolution',
        description: 'Diagnose and resolve complex technical problems',
        aiCandidate: false,
      },
      {
        id: uuid(),
        name: 'Root Cause Analysis',
        description: 'Investigate and document root causes of recurring issues',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Knowledge Base Updates',
        description: 'Create and maintain support documentation',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Team Mentoring',
        description: 'Train and mentor Tier 1 support staff',
        aiCandidate: false,
      },
    ],
    requiredSkillDomains: ['Customer Service', 'Technical Support', 'Communication'],
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: ROLE_IDS.codeReviewer,
    departmentId: DEPT_IDS.platformEng,
    name: 'Code Reviewer',
    description: 'Review pull requests for quality, security, and best practices',
    level: 'senior',
    responsibilities: [
      {
        id: uuid(),
        name: 'PR Review',
        description: 'Review code changes for correctness and style',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Security Analysis',
        description: 'Check for security vulnerabilities in code',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Architecture Guidance',
        description: 'Provide guidance on architectural decisions',
        aiCandidate: false,
      },
      {
        id: uuid(),
        name: 'Best Practices Enforcement',
        description: 'Ensure code follows team standards and patterns',
        aiCandidate: true,
      },
    ],
    requiredSkillDomains: ['Development', 'Security', 'Code Quality'],
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: ROLE_IDS.platformEngineer,
    departmentId: DEPT_IDS.platformEng,
    name: 'Platform Engineer',
    description: 'Build and maintain core platform infrastructure',
    level: 'mid',
    responsibilities: [
      {
        id: uuid(),
        name: 'Feature Development',
        description: 'Implement new platform features and capabilities',
        aiCandidate: false,
      },
      {
        id: uuid(),
        name: 'Bug Fixing',
        description: 'Investigate and fix reported bugs',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Code Review Participation',
        description: 'Participate in code reviews as reviewer and author',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Documentation',
        description: 'Write technical documentation for features',
        aiCandidate: true,
      },
    ],
    requiredSkillDomains: ['Development', 'Infrastructure'],
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: ROLE_IDS.leadQualifier,
    departmentId: DEPT_IDS.sdr,
    name: 'Lead Qualifier',
    description: 'Qualify inbound leads and schedule meetings with sales reps',
    level: 'entry',
    responsibilities: [
      {
        id: uuid(),
        name: 'Lead Scoring',
        description: 'Score leads based on fit and intent signals',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Initial Outreach',
        description: 'Send initial outreach emails and messages',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Qualification Calls',
        description: 'Conduct discovery calls to qualify leads',
        aiCandidate: false,
      },
      {
        id: uuid(),
        name: 'CRM Updates',
        description: 'Keep CRM records accurate and up to date',
        aiCandidate: true,
      },
      {
        id: uuid(),
        name: 'Meeting Scheduling',
        description: 'Schedule meetings between qualified leads and AEs',
        aiCandidate: true,
      },
    ],
    requiredSkillDomains: ['Sales', 'Communication'],
    createdAt: weekAgo,
    updatedAt: now,
  },
];

const mockPeople: Person[] = [
  {
    id: PERSON_IDS.sarah,
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    title: 'Support Specialist',
    departmentId: DEPT_IDS.supportTier1,
    roleAssignments: [
      { roleId: ROLE_IDS.supportSpecialist, allocation: 100, isPrimary: true },
    ],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: PERSON_IDS.mike,
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@company.com',
    title: 'Senior Support Engineer',
    departmentId: DEPT_IDS.supportTier2,
    roleAssignments: [
      { roleId: ROLE_IDS.seniorSupport, allocation: 80, isPrimary: true },
      { roleId: ROLE_IDS.supportSpecialist, allocation: 20, isPrimary: false },
    ],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: PERSON_IDS.alex,
    name: 'Alex Kim',
    email: 'alex.kim@company.com',
    title: 'Senior Platform Engineer',
    departmentId: DEPT_IDS.platformEng,
    roleAssignments: [
      { roleId: ROLE_IDS.platformEngineer, allocation: 70, isPrimary: true },
      { roleId: ROLE_IDS.codeReviewer, allocation: 30, isPrimary: false },
    ],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: PERSON_IDS.jamie,
    name: 'Jamie Thompson',
    email: 'jamie.thompson@company.com',
    title: 'Sales Development Representative',
    departmentId: DEPT_IDS.sdr,
    roleAssignments: [
      { roleId: ROLE_IDS.leadQualifier, allocation: 100, isPrimary: true },
    ],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: PERSON_IDS.taylor,
    name: 'Taylor Williams',
    email: 'taylor.williams@company.com',
    title: 'Support Specialist',
    departmentId: DEPT_IDS.supportTier1,
    roleAssignments: [
      { roleId: ROLE_IDS.supportSpecialist, allocation: 100, isPrimary: true },
    ],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
];

// Sample HAPs showing As-Is/To-Be transformation
const mockHAPs: HumanAgentPair[] = [
  {
    id: uuid(),
    personId: PERSON_IDS.sarah,
    roleId: ROLE_IDS.supportSpecialist,
    agentStoryId: AGENT_STORY_PLACEHOLDER, // Will be resolved at runtime
    asIs: {
      taskAssignments: [
        {
          id: uuid(),
          taskName: 'Ticket Triage',
          description: 'Categorize and prioritize incoming tickets',
          currentOwner: 'human',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Common Issue Resolution',
          description: 'Resolve FAQs and known issues',
          currentOwner: 'human',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Customer Response Drafting',
          description: 'Write responses to customer inquiries',
          currentOwner: 'human',
          targetOwner: 'shared',
        },
        {
          id: uuid(),
          taskName: 'Escalation Decision',
          description: 'Decide when to escalate to Tier 2',
          currentOwner: 'human',
          targetOwner: 'shared',
        },
        {
          id: uuid(),
          taskName: 'Customer Relationship Building',
          description: 'Build rapport with customers',
          currentOwner: 'human',
          targetOwner: 'human',
        },
      ],
      humanPercent: 100,
      agentPercent: 0,
      effectiveDate: weekAgo,
    },
    toBe: {
      taskAssignments: [
        {
          id: uuid(),
          taskName: 'Ticket Triage',
          description: 'Categorize and prioritize incoming tickets',
          currentOwner: 'human',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Common Issue Resolution',
          description: 'Resolve FAQs and known issues',
          currentOwner: 'human',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Customer Response Drafting',
          description: 'Write responses to customer inquiries',
          currentOwner: 'human',
          targetOwner: 'shared',
        },
        {
          id: uuid(),
          taskName: 'Escalation Decision',
          description: 'Decide when to escalate to Tier 2',
          currentOwner: 'human',
          targetOwner: 'shared',
        },
        {
          id: uuid(),
          taskName: 'Customer Relationship Building',
          description: 'Build rapport with customers',
          currentOwner: 'human',
          targetOwner: 'human',
        },
      ],
      humanPercent: 40,
      agentPercent: 60,
      effectiveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days target
    },
    transitionStatus: 'in_progress',
    topBlockers: ['Knowledge base needs expansion', 'Agent training on product updates'],
    targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Pilot program for AI-assisted support. Sarah is training the agent.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.alex,
    roleId: ROLE_IDS.codeReviewer,
    agentStoryId: 'code-review-assistant', // Will be resolved at runtime
    asIs: {
      taskAssignments: [
        {
          id: uuid(),
          taskName: 'Initial PR Scan',
          description: 'First pass review of PR changes',
          currentOwner: 'shared',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Security Check',
          description: 'Check for security vulnerabilities',
          currentOwner: 'shared',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Style/Lint Enforcement',
          description: 'Enforce coding standards',
          currentOwner: 'agent',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Architecture Review',
          description: 'Evaluate architectural decisions',
          currentOwner: 'human',
          targetOwner: 'human',
        },
        {
          id: uuid(),
          taskName: 'Final Approval',
          description: 'Give final approval on PRs',
          currentOwner: 'human',
          targetOwner: 'human',
        },
      ],
      humanPercent: 50,
      agentPercent: 50,
      effectiveDate: weekAgo,
    },
    toBe: {
      taskAssignments: [
        {
          id: uuid(),
          taskName: 'Initial PR Scan',
          description: 'First pass review of PR changes',
          currentOwner: 'shared',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Security Check',
          description: 'Check for security vulnerabilities',
          currentOwner: 'shared',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Style/Lint Enforcement',
          description: 'Enforce coding standards',
          currentOwner: 'agent',
          targetOwner: 'agent',
        },
        {
          id: uuid(),
          taskName: 'Architecture Review',
          description: 'Evaluate architectural decisions',
          currentOwner: 'human',
          targetOwner: 'human',
        },
        {
          id: uuid(),
          taskName: 'Final Approval',
          description: 'Give final approval on PRs',
          currentOwner: 'human',
          targetOwner: 'human',
        },
      ],
      humanPercent: 40,
      agentPercent: 60,
      effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days target
    },
    transitionStatus: 'in_progress',
    topBlockers: [],
    targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Code review agent is well-established. Focusing on improving security detection.',
    createdAt: weekAgo,
    updatedAt: now,
  },
];

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
        // Need to look up role to filter by department
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

      // Calculate aggregate As-Is/To-Be
      let totalAsIsHuman = 0;
      let totalAsIsAgent = 0;
      let totalToBeHuman = 0;
      let totalToBeAgent = 0;

      for (const hap of deptHaps) {
        totalAsIsHuman += hap.asIs.humanPercent;
        totalAsIsAgent += hap.asIs.agentPercent;
        totalToBeHuman += hap.toBe.humanPercent;
        totalToBeAgent += hap.toBe.agentPercent;
      }

      const hapCount = deptHaps.length || 1;

      return {
        departmentId,
        roleCount: deptRoles.length,
        peopleCount: deptPeople.length,
        hapCount: deptHaps.length,
        asIs: {
          humanPercent: Math.round(totalAsIsHuman / hapCount),
          agentPercent: Math.round(totalAsIsAgent / hapCount),
        },
        toBe: {
          humanPercent: Math.round(totalToBeHuman / hapCount),
          agentPercent: Math.round(totalToBeAgent / hapCount),
        },
        transitionProgress: deptHaps.filter(h => h.transitionStatus === 'completed').length / hapCount * 100,
      };
    },

    getOverallStats: async () => {
      initializeHAPData();
      await delay(200);

      return {
        domainCount: domains.length,
        departmentCount: departments.length,
        roleCount: roles.length,
        peopleCount: people.length,
        hapCount: haps.length,
        hapsByStatus: {
          not_started: haps.filter(h => h.transitionStatus === 'not_started').length,
          planned: haps.filter(h => h.transitionStatus === 'planned').length,
          in_progress: haps.filter(h => h.transitionStatus === 'in_progress').length,
          blocked: haps.filter(h => h.transitionStatus === 'blocked').length,
          completed: haps.filter(h => h.transitionStatus === 'completed').length,
        },
      };
    },
  },
};
