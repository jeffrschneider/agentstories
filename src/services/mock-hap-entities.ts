import type {
  BusinessDomain,
  Department,
  Role,
  Person,
  HumanAgentPair,
  TaskResponsibility,
} from '@/lib/schemas';
import { createPhaseAssignment } from '@/lib/schemas/hap';
import { AGENT_STORY_IDS } from './mock-stories';

// Generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fixed UUIDs for referential integrity in mock data
export const DOMAIN_IDS = {
  customerService: uuid(),
  engineering: uuid(),
  sales: uuid(),
};

export const DEPT_IDS = {
  supportTier1: uuid(),
  supportTier2: uuid(),
  platformEng: uuid(),
  frontendEng: uuid(),
  sdr: uuid(),
};

export const ROLE_IDS = {
  supportSpecialist: uuid(),
  seniorSupport: uuid(),
  codeReviewer: uuid(),
  platformEngineer: uuid(),
  leadQualifier: uuid(),
};

export const PERSON_IDS = {
  sarah: uuid(),
  mike: uuid(),
  alex: uuid(),
  jamie: uuid(),
  taylor: uuid(),
};

// Timestamp helpers
const now = new Date().toISOString();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// Helper to create a task with responsibility phases
function createTask(
  taskName: string,
  description: string,
  preset: 'human-only' | 'agent-only' | 'human-controlled' | 'supervised-execution'
): TaskResponsibility {
  const presets = {
    'human-only': { manage: 'human', define: 'human', perform: 'human', review: 'human' },
    'agent-only': { manage: 'agent', define: 'agent', perform: 'agent', review: 'agent' },
    'human-controlled': { manage: 'human', define: 'human', perform: 'agent', review: 'human' },
    'supervised-execution': { manage: 'human', define: 'agent', perform: 'agent', review: 'human' },
  } as const;

  const p = presets[preset];

  return {
    id: uuid(),
    taskName,
    description,
    phases: {
      manage: createPhaseAssignment('manage', p.manage),
      define: createPhaseAssignment('define', p.define),
      perform: createPhaseAssignment('perform', p.perform),
      review: createPhaseAssignment('review', p.review),
    },
    integrationStatus: preset === 'human-only' ? 'not_started' : 'partially_defined',
  };
}

// Mock Domains
export const mockDomains: BusinessDomain[] = [
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

// Mock Departments
export const mockDepartments: Department[] = [
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

// Mock Roles
export const mockRoles: Role[] = [
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
        requiredSkillDomains: ['Content Classification', 'Natural Language Understanding'],
      },
      {
        id: uuid(),
        name: 'Common Issue Resolution',
        description: 'Resolve frequently asked questions and known issues',
        aiCandidate: true,
        requiredSkillDomains: ['Information Retrieval', 'Natural Language Generation'],
      },
      {
        id: uuid(),
        name: 'Customer Communication',
        description: 'Respond to customers with clear, empathetic messages',
        aiCandidate: true,
        requiredSkillDomains: ['Natural Language Generation', 'Customer Service'],
      },
      {
        id: uuid(),
        name: 'Escalation Handling',
        description: 'Identify and escalate complex issues to Tier 2',
        aiCandidate: true,
        requiredSkillDomains: ['Decision Making', 'Content Classification'],
      },
      {
        id: uuid(),
        name: 'Customer Relationship Building',
        description: 'Build rapport and maintain positive customer relationships',
        aiCandidate: false,
        requiredSkillDomains: [],
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
        requiredSkillDomains: [],
      },
      {
        id: uuid(),
        name: 'Root Cause Analysis',
        description: 'Investigate and document root causes of recurring issues',
        aiCandidate: true,
        requiredSkillDomains: ['Document Analysis', 'Data Processing'],
      },
      {
        id: uuid(),
        name: 'Knowledge Base Updates',
        description: 'Create and maintain support documentation',
        aiCandidate: true,
        requiredSkillDomains: ['Natural Language Generation', 'Document Analysis'],
      },
      {
        id: uuid(),
        name: 'Team Mentoring',
        description: 'Train and mentor Tier 1 support staff',
        aiCandidate: false,
        requiredSkillDomains: [],
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
        requiredSkillDomains: ['Code Generation', 'Testing & QA'],
      },
      {
        id: uuid(),
        name: 'Security Analysis',
        description: 'Check for security vulnerabilities in code',
        aiCandidate: true,
        requiredSkillDomains: ['Code Generation', 'Document Analysis'],
      },
      {
        id: uuid(),
        name: 'Architecture Guidance',
        description: 'Provide guidance on architectural decisions',
        aiCandidate: false,
        requiredSkillDomains: [],
      },
      {
        id: uuid(),
        name: 'Best Practices Enforcement',
        description: 'Ensure code follows team standards and patterns',
        aiCandidate: true,
        requiredSkillDomains: ['Code Generation', 'Testing & QA'],
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
        requiredSkillDomains: [],
      },
      {
        id: uuid(),
        name: 'Bug Fixing',
        description: 'Investigate and fix reported bugs',
        aiCandidate: true,
        requiredSkillDomains: ['Code Generation', 'Testing & QA'],
      },
      {
        id: uuid(),
        name: 'Code Review Participation',
        description: 'Participate in code reviews as reviewer and author',
        aiCandidate: true,
        requiredSkillDomains: ['Code Generation'],
      },
      {
        id: uuid(),
        name: 'Documentation',
        description: 'Write technical documentation for features',
        aiCandidate: true,
        requiredSkillDomains: ['Natural Language Generation', 'Document Analysis'],
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
        requiredSkillDomains: ['Data Processing', 'Decision Making'],
      },
      {
        id: uuid(),
        name: 'Initial Outreach',
        description: 'Send initial outreach emails and messages',
        aiCandidate: true,
        requiredSkillDomains: ['Natural Language Generation', 'Customer Service'],
      },
      {
        id: uuid(),
        name: 'Qualification Calls',
        description: 'Conduct discovery calls to qualify leads',
        aiCandidate: false,
        requiredSkillDomains: [],
      },
      {
        id: uuid(),
        name: 'CRM Updates',
        description: 'Keep CRM records accurate and up to date',
        aiCandidate: true,
        requiredSkillDomains: ['Data Processing', 'API Integration'],
      },
      {
        id: uuid(),
        name: 'Meeting Scheduling',
        description: 'Schedule meetings between qualified leads and AEs',
        aiCandidate: true,
        requiredSkillDomains: ['Workflow Management', 'API Integration'],
      },
    ],
    requiredSkillDomains: ['Sales', 'Communication'],
    createdAt: weekAgo,
    updatedAt: now,
  },
];

// Mock People
export const mockPeople: Person[] = [
  {
    id: PERSON_IDS.sarah,
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    title: 'Support Specialist',
    departmentId: DEPT_IDS.supportTier1,
    roleAssignments: [
      { roleId: ROLE_IDS.supportSpecialist, allocation: 100, isPrimary: true },
    ],
    skills: ['Natural Language Understanding', 'Content Classification', 'Customer Service'],
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
    skills: ['Document Analysis', 'Data Processing', 'Natural Language Generation'],
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
    skills: ['Code Generation', 'Testing & QA', 'Document Analysis'],
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
    skills: ['Data Processing', 'Natural Language Generation', 'Workflow Management'],
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
    skills: ['Natural Language Generation', 'Information Retrieval', 'Decision Making'],
    status: 'active',
    createdAt: weekAgo,
    updatedAt: now,
  },
];

// Mock HAPs using the Responsibility Phase Model
export const mockHAPs: HumanAgentPair[] = [
  {
    id: uuid(),
    personId: PERSON_IDS.sarah,
    roleId: ROLE_IDS.supportSpecialist,
    agentStoryId: AGENT_STORY_IDS.customerSupport,
    tasks: [
      createTask('Ticket Triage', 'Categorize and prioritize incoming tickets', 'human-controlled'),
      createTask('Common Issue Resolution', 'Resolve FAQs and known issues', 'supervised-execution'),
      createTask('Customer Response Drafting', 'Write responses to customer inquiries', 'human-controlled'),
      createTask('Escalation Decision', 'Decide when to escalate to Tier 2', 'human-controlled'),
      createTask('Customer Relationship Building', 'Build rapport with customers', 'human-only'),
    ],
    capabilityRequirements: [
      {
        id: uuid(),
        hapId: '',
        taskId: '',
        phase: 'perform',
        taskName: 'Ticket Triage',
        suggestedCapabilityName: 'Execute Ticket Triage',
        suggestedCapabilityDescription: 'Capability to perform the "Ticket Triage" task',
        status: 'pending',
        agentStoryId: AGENT_STORY_IDS.customerSupport,
        createdAt: now,
        updatedAt: now,
      },
    ],
    integrationStatus: 'skills_pending',
    notes: 'Pilot program for AI-assisted support. Sarah is training the agent.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.alex,
    roleId: ROLE_IDS.codeReviewer,
    agentStoryId: AGENT_STORY_IDS.codeReview,
    tasks: [
      createTask('Initial PR Scan', 'First pass review of PR changes', 'supervised-execution'),
      createTask('Security Check', 'Check for security vulnerabilities', 'human-controlled'),
      createTask('Style/Lint Enforcement', 'Enforce coding standards', 'agent-only'),
      createTask('Architecture Review', 'Evaluate architectural decisions', 'human-only'),
      createTask('Final Approval', 'Give final approval on PRs', 'human-only'),
    ],
    capabilityRequirements: [],
    integrationStatus: 'ready',
    notes: 'Code review agent is well-established. Focusing on improving security detection.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.mike,
    roleId: ROLE_IDS.seniorSupport,
    agentStoryId: AGENT_STORY_IDS.customerSupport,
    tasks: [
      createTask('Complex Ticket Analysis', 'Analyze escalated tickets for root cause', 'human-controlled'),
      createTask('Knowledge Base Research', 'Search knowledge base for solutions', 'supervised-execution'),
      createTask('Response Quality Review', 'Review AI-generated responses for accuracy', 'human-only'),
      createTask('Documentation Updates', 'Update knowledge base with new solutions', 'human-controlled'),
    ],
    capabilityRequirements: [],
    integrationStatus: 'active',
    notes: 'Senior support leveraging agent for research and drafting, with human oversight.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.taylor,
    roleId: ROLE_IDS.supportSpecialist,
    agentStoryId: AGENT_STORY_IDS.customerSupport,
    tasks: [
      createTask('Ticket Triage', 'Categorize and prioritize incoming tickets', 'supervised-execution'),
      createTask('FAQ Response', 'Handle frequently asked questions', 'agent-only'),
      createTask('Customer Follow-up', 'Follow up with customers after resolution', 'human-controlled'),
    ],
    capabilityRequirements: [],
    integrationStatus: 'active',
    notes: 'Taylor has fully adopted the support agent for routine tasks.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.jamie,
    roleId: ROLE_IDS.leadQualifier,
    agentStoryId: AGENT_STORY_IDS.salesAssistant,
    tasks: [
      createTask('Lead Scoring', 'Score inbound leads based on fit and intent', 'supervised-execution'),
      createTask('Email Personalization', 'Generate personalized outreach emails', 'human-controlled'),
      createTask('CRM Data Entry', 'Update CRM with lead information', 'agent-only'),
      createTask('Meeting Scheduling', 'Schedule meetings with qualified leads', 'supervised-execution'),
      createTask('Discovery Calls', 'Conduct initial discovery calls', 'human-only'),
    ],
    capabilityRequirements: [],
    integrationStatus: 'ready',
    notes: 'Sales assistant helping Jamie with lead qualification and outreach.',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: uuid(),
    personId: PERSON_IDS.alex,
    roleId: ROLE_IDS.platformEngineer,
    agentStoryId: AGENT_STORY_IDS.codeReview,
    tasks: [
      createTask('Self-Review', 'Get AI feedback before submitting PR', 'supervised-execution'),
      createTask('Documentation Generation', 'Generate code documentation', 'human-controlled'),
      createTask('Test Coverage Analysis', 'Analyze test coverage gaps', 'agent-only'),
    ],
    capabilityRequirements: [],
    integrationStatus: 'active',
    notes: 'Alex uses the code review agent as a pre-submission review tool.',
    createdAt: weekAgo,
    updatedAt: now,
  },
];
