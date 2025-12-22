import type { Agent, AgentLifecycle } from '@/lib/schemas';
import { createPlannedCapability, createExternalLink } from '@/lib/schemas';
import { AGENT_STORY_IDS } from './mock-data';

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
const STORAGE_KEY_AGENTS = 'agent-stories-agent-catalog';
const CURRENT_VERSION = '1.0';

interface AgentStorageData {
  agents: Agent[];
  version: string;
}

// Fixed UUIDs for referential integrity in mock data
const AGENT_IDS = {
  customerSupport: 'd1e2f3a4-b5c6-4789-defg-hij0123456789',
  codeReview: 'e2f3a4b5-c6d7-4890-efgh-ijk1234567890',
  salesAssistant: 'f3a4b5c6-d7e8-4901-fghi-jkl2345678901',
  dataAnalyst: 'a4b5c6d7-e8f9-4012-ghij-klm3456789012',
  contentWriter: 'b5c6d7e8-f9a0-4123-hijk-lmn4567890123',
  securityMonitor: 'c6d7e8f9-a0b1-4234-ijkl-mno5678901234',
};

// Mock data
const now = new Date().toISOString();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const mockAgents: Agent[] = [
  // Operational Agent - linked to existing story
  {
    id: AGENT_IDS.customerSupport,
    name: 'Customer Support Agent',
    description: 'Handles incoming support tickets, resolves common issues, and escalates complex cases to human agents',
    identifier: 'customer-support-agent',
    lifecycleState: 'operational',
    lifecycleNotes: 'Running in production since Q3. Handling 60% of tier 1 tickets.',
    agentStoryId: AGENT_STORY_IDS.customerSupport,
    departmentId: undefined,
    plannedCapabilities: [],
    externalLinks: [
      createExternalLink('tracing', 'Datadog APM', 'https://app.datadoghq.com/apm/traces?query=service:customer-support-agent'),
      createExternalLink('monitoring', 'Grafana Dashboard', 'https://grafana.company.com/d/customer-support'),
      createExternalLink('reputation', 'Agent Scorecard', 'https://agents.company.com/scorecard/customer-support'),
    ],
    tags: ['customer-service', 'support', 'tickets', 'production'],
    createdAt: monthAgo,
    updatedAt: now,
  },
  // Operational Agent
  {
    id: AGENT_IDS.codeReview,
    name: 'Code Review Assistant',
    description: 'Reviews pull requests for code quality, security vulnerabilities, and adherence to coding standards',
    identifier: 'code-review-assistant',
    lifecycleState: 'operational',
    lifecycleNotes: 'Integrated with GitHub. Processing PRs for 3 repositories.',
    agentStoryId: AGENT_STORY_IDS.codeReview,
    departmentId: undefined,
    plannedCapabilities: [],
    externalLinks: [
      createExternalLink('repository', 'GitHub App', 'https://github.com/apps/code-review-assistant'),
      createExternalLink('tracing', 'OpenTelemetry', 'https://otel.company.com/traces/code-review'),
    ],
    tags: ['engineering', 'code-review', 'security', 'production'],
    createdAt: monthAgo,
    updatedAt: weekAgo,
  },
  // Development Agent
  {
    id: AGENT_IDS.salesAssistant,
    name: 'Sales Assistant Agent',
    description: 'Helps sales team with lead qualification, CRM updates, and meeting scheduling',
    identifier: 'sales-assistant-agent',
    lifecycleState: 'development',
    lifecycleNotes: 'In beta testing with SDR team. Expected launch Q1.',
    agentStoryId: AGENT_STORY_IDS.salesAssistant,
    departmentId: undefined,
    plannedCapabilities: [],
    externalLinks: [
      createExternalLink('repository', 'GitLab Repo', 'https://gitlab.company.com/agents/sales-assistant'),
      createExternalLink('ticketing', 'Jira Project', 'https://jira.company.com/projects/SALES-AGENT'),
    ],
    tags: ['sales', 'crm', 'automation', 'beta'],
    createdAt: weekAgo,
    updatedAt: now,
  },
  // Planned Agent - primary focus
  {
    id: AGENT_IDS.dataAnalyst,
    name: 'Data Analyst Agent',
    description: 'Automates data analysis workflows, generates reports, and surfaces insights from business metrics',
    identifier: 'data-analyst-agent',
    lifecycleState: 'planned',
    lifecycleNotes: 'Gathering requirements from analytics team. Need to define data source access patterns.',
    agentStoryId: undefined,
    departmentId: undefined,
    plannedCapabilities: [
      createPlannedCapability('SQL Query Generation', 'Generate SQL queries from natural language questions', 'must-have'),
      createPlannedCapability('Dashboard Creation', 'Create data visualizations and dashboards', 'must-have'),
      createPlannedCapability('Anomaly Detection', 'Detect unusual patterns in time-series data', 'should-have'),
      createPlannedCapability('Report Scheduling', 'Schedule and distribute automated reports', 'should-have'),
      createPlannedCapability('Natural Language Summaries', 'Generate plain English summaries of data trends', 'nice-to-have'),
    ],
    externalLinks: [
      createExternalLink('documentation', 'Requirements Doc', 'https://docs.company.com/agents/data-analyst-requirements'),
    ],
    tags: ['analytics', 'data', 'reporting', 'planning'],
    createdAt: now,
    updatedAt: now,
  },
  // Planned Agent
  {
    id: AGENT_IDS.contentWriter,
    name: 'Content Writer Agent',
    description: 'Creates marketing content, blog posts, and social media updates based on brand guidelines',
    identifier: 'content-writer-agent',
    lifecycleState: 'planned',
    lifecycleNotes: 'Initial requirements gathered. Pending brand guideline integration.',
    agentStoryId: undefined,
    departmentId: undefined,
    plannedCapabilities: [
      createPlannedCapability('Blog Post Generation', 'Generate long-form blog posts on given topics', 'must-have'),
      createPlannedCapability('Social Media Posts', 'Create platform-specific social media content', 'must-have'),
      createPlannedCapability('SEO Optimization', 'Optimize content for search engines', 'should-have'),
      createPlannedCapability('Brand Voice Consistency', 'Maintain consistent brand voice across all content', 'must-have'),
    ],
    externalLinks: [],
    tags: ['marketing', 'content', 'writing', 'planning'],
    createdAt: weekAgo,
    updatedAt: weekAgo,
  },
  // Sunset Agent
  {
    id: AGENT_IDS.securityMonitor,
    name: 'Legacy Security Monitor',
    description: 'Monitored security events and generated alerts (replaced by new SIEM integration)',
    identifier: 'legacy-security-monitor',
    lifecycleState: 'sunset',
    lifecycleNotes: 'Deprecated in favor of native SIEM agent integration. Historical data archived.',
    agentStoryId: undefined,
    departmentId: undefined,
    plannedCapabilities: [],
    externalLinks: [
      createExternalLink('documentation', 'Sunset Notice', 'https://docs.company.com/agents/security-monitor-sunset'),
    ],
    tags: ['security', 'deprecated', 'historical'],
    createdAt: monthAgo,
    updatedAt: weekAgo,
  },
];

// In-memory storage
let agents: Agent[] = [];
let isInitialized = false;

// Load from localStorage
function loadAgentData(): AgentStorageData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_AGENTS);
    if (!stored) return null;

    const data: AgentStorageData = JSON.parse(stored);
    if (data.version !== CURRENT_VERSION) {
      // Version mismatch - clear old data and use fresh mock data
      localStorage.removeItem(STORAGE_KEY_AGENTS);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Save to localStorage
function saveAgentData(): void {
  if (typeof window === 'undefined') return;

  try {
    const data: AgentStorageData = {
      agents,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save agent data to localStorage:', error);
  }
}

// Initialize data
function initializeAgentData(): void {
  if (isInitialized) return;

  const stored = loadAgentData();
  if (stored) {
    agents = stored.agents;
  } else {
    agents = [...mockAgents];
    saveAgentData();
  }
  isInitialized = true;
}

export interface AgentFilters {
  search?: string;
  lifecycleState?: AgentLifecycle | 'all';
  departmentId?: string;
  tags?: string[];
}

export interface AgentStats {
  total: number;
  planned: number;
  development: number;
  operational: number;
  sunset: number;
  withStories: number;
  totalCapabilities: number;
}

export const agentDataService = {
  // List agents with optional filters
  list: async (filters?: AgentFilters): Promise<Agent[]> => {
    initializeAgentData();
    await delay(200);

    let result = [...agents];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower) ||
          a.identifier?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.lifecycleState && filters.lifecycleState !== 'all') {
      result = result.filter(a => a.lifecycleState === filters.lifecycleState);
    }

    if (filters?.departmentId) {
      result = result.filter(a => a.departmentId === filters.departmentId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter(a =>
        a.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Sort by lifecycle state (planned first) then by updated date
    const lifecycleOrder: Record<AgentLifecycle, number> = {
      planned: 0,
      development: 1,
      operational: 2,
      sunset: 3,
    };

    result.sort((a, b) => {
      const stateCompare = lifecycleOrder[a.lifecycleState] - lifecycleOrder[b.lifecycleState];
      if (stateCompare !== 0) return stateCompare;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  },

  // Get a single agent by ID
  get: async (id: string): Promise<Agent | null> => {
    initializeAgentData();
    await delay(100);
    return agents.find(a => a.id === id) || null;
  },

  // Create a new agent
  create: async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
    initializeAgentData();
    await delay(300);

    const now = new Date().toISOString();
    const newAgent: Agent = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };

    agents.push(newAgent);
    saveAgentData();
    return newAgent;
  },

  // Update an existing agent
  update: async (id: string, data: Partial<Agent>): Promise<Agent | null> => {
    initializeAgentData();
    await delay(300);

    const index = agents.findIndex(a => a.id === id);
    if (index === -1) return null;

    agents[index] = {
      ...agents[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveAgentData();
    return agents[index];
  },

  // Delete an agent
  delete: async (id: string): Promise<boolean> => {
    initializeAgentData();
    await delay(200);

    const index = agents.findIndex(a => a.id === id);
    if (index === -1) return false;

    agents.splice(index, 1);
    saveAgentData();
    return true;
  },

  // Get agent statistics
  getStats: async (): Promise<AgentStats> => {
    initializeAgentData();
    await delay(200);

    const stats: AgentStats = {
      total: agents.length,
      planned: agents.filter(a => a.lifecycleState === 'planned').length,
      development: agents.filter(a => a.lifecycleState === 'development').length,
      operational: agents.filter(a => a.lifecycleState === 'operational').length,
      sunset: agents.filter(a => a.lifecycleState === 'sunset').length,
      withStories: agents.filter(a => a.agentStoryId).length,
      totalCapabilities: agents.reduce((sum, a) => sum + (a.plannedCapabilities?.length || 0), 0),
    };

    return stats;
  },

  // Get all unique tags
  getTags: async (): Promise<string[]> => {
    initializeAgentData();
    await delay(100);

    const tagSet = new Set<string>();
    agents.forEach(a => {
      a.tags?.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  },
};
