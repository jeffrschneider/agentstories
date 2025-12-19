import type { AgentStory, AgentStoryLight, AgentStoryFull, Template, TemplateCategory } from '@/lib/schemas';
import { loadFromStorage, saveToStorage } from './storage';

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

// Mock stories data
const mockStories: AgentStory[] = [
  {
    id: uuid(),
    format: 'light',
    version: '1.0',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'customer-support-agent',
    name: 'Customer Support Agent',
    role: 'A customer support specialist that handles incoming support tickets',
    trigger: {
      specification: {
        type: 'message',
        source: 'helpdesk system',
        conditions: 'New support ticket created',
        examples: ['Customer complaint ticket', 'Feature request ticket']
      }
    },
    action: 'Analyze the ticket content, categorize the issue, and either provide an automated response or escalate to human support',
    outcome: 'Ticket is resolved with customer satisfaction or properly escalated with full context',
    autonomyLevel: 'supervised',
    tags: ['customer-service', 'support', 'tickets'],
  } satisfies AgentStoryLight,
  {
    id: uuid(),
    format: 'light',
    version: '1.0',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'code-review-assistant',
    name: 'Code Review Assistant',
    role: 'A code reviewer that analyzes pull requests for quality and best practices',
    trigger: {
      specification: {
        type: 'resource_change',
        source: 'GitHub repository',
        conditions: 'Pull request opened or updated',
        examples: ['New PR created', 'PR commits pushed']
      }
    },
    action: 'Review code changes for style, bugs, security issues, and suggest improvements',
    outcome: 'Pull request receives detailed feedback with actionable suggestions',
    autonomyLevel: 'collaborative',
    tags: ['development', 'code-review', 'automation'],
  } satisfies AgentStoryLight,
  {
    id: uuid(),
    format: 'full',
    version: '1.0',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    identifier: 'data-pipeline-monitor',
    name: 'Data Pipeline Monitor',
    role: 'A monitoring agent that watches data pipeline health and triggers alerts',
    trigger: {
      specification: {
        type: 'schedule',
        source: 'cron scheduler',
        conditions: 'Every 5 minutes',
        examples: ['Scheduled health check', 'Error detection scan']
      },
      details: {
        type: 'schedule',
        cronExpression: '*/5 * * * *',
        timezone: 'UTC',
      },
    },
    action: 'Check pipeline status, analyze error patterns, and notify relevant teams',
    outcome: 'Pipeline issues are detected early and relevant teams are notified with context',
    autonomyLevel: 'full',
    tags: ['monitoring', 'data-pipeline', 'alerting'],
    behavior: {
      type: 'workflow',
      planning: 'none',
      stages: [
        { name: 'check', purpose: 'Check pipeline health metrics' },
        { name: 'analyze', purpose: 'Analyze any detected issues' },
        { name: 'notify', purpose: 'Send notifications if needed' },
      ],
    },
    reasoning: {
      strategy: 'rule_based',
      decisionPoints: [
        {
          name: 'severity_assessment',
          inputs: 'error_rate, pipeline_delay, data_quality_score',
          approach: 'Apply threshold rules to determine alert severity',
          fallback: 'Default to high severity if uncertain',
        },
      ],
    },
    memory: {
      persistent: [
        {
          name: 'alert_history',
          type: 'kv',
          purpose: 'Track recent alerts to prevent duplicate notifications',
          updates: 'append',
        },
      ],
    },
    tools: [
      {
        name: 'pipeline_metrics',
        purpose: 'Fetch current pipeline metrics and status',
        permissions: ['read'],
      },
      {
        name: 'slack_notify',
        purpose: 'Send notifications to Slack channels',
        permissions: ['execute'],
      },
    ],
    skills: [
      {
        name: 'metric_analysis',
        domain: 'Data pipeline monitoring',
        proficiencies: ['Anomaly detection', 'Threshold evaluation', 'Trend analysis'],
        qualityBar: 'Accurately identifies issues with < 5% false positive rate',
        acquired: 'built_in',
        toolsUsed: ['pipeline_metrics'],
      },
      {
        name: 'alert_routing',
        domain: 'Notification management',
        proficiencies: ['Severity classification', 'Channel selection', 'Message formatting'],
        qualityBar: 'Routes alerts to correct channels within 30 seconds',
        acquired: 'built_in',
        toolsUsed: ['slack_notify'],
      },
    ],
    humanInteraction: {
      mode: 'out_of_loop',
      escalation: {
        conditions: 'Critical failure or unknown error pattern detected',
        channel: 'PagerDuty alert to on-call engineer',
      },
    },
    acceptance: {
      functional: [
        'Detects pipeline failures within 5 minutes',
        'Sends alerts with relevant context and suggested actions',
        'Does not send duplicate alerts for the same issue',
      ],
      quality: [
        'Check completes in under 30 seconds',
        'Alert delivery within 1 minute of detection',
      ],
    },
  } satisfies AgentStoryFull,
];

// Mock templates data
const mockTemplates: Template[] = [
  {
    id: uuid(),
    name: 'Customer Service Agent',
    description: 'Handle customer inquiries and support tickets',
    category: 'customer_service',
    tags: ['support', 'chat', 'tickets'],
    storyTemplate: {
      format: 'light',
      role: 'A customer service agent that handles customer inquiries',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 42,
    whenToUse: 'When you need an agent to handle customer support interactions',
    exampleScenarios: ['Chat support', 'Email support', 'Ticket triage'],
  },
  {
    id: uuid(),
    name: 'Scheduled Report Generator',
    description: 'Generate and distribute reports on a schedule',
    category: 'scheduled_tasks',
    tags: ['reports', 'automation', 'scheduled'],
    storyTemplate: {
      format: 'full',
      role: 'A reporting agent that generates and distributes scheduled reports',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 28,
    whenToUse: 'When you need automated report generation on a schedule',
    exampleScenarios: ['Daily sales reports', 'Weekly analytics', 'Monthly summaries'],
  },
  {
    id: uuid(),
    name: 'Event-Driven Processor',
    description: 'React to events and process data accordingly',
    category: 'event_driven',
    tags: ['events', 'processing', 'reactive'],
    storyTemplate: {
      format: 'full',
      role: 'An event processor that reacts to system events',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 35,
    whenToUse: 'When you need an agent that responds to system events',
    exampleScenarios: ['Webhook handlers', 'Queue processors', 'Stream processors'],
  },
  {
    id: uuid(),
    name: 'Data Pipeline Agent',
    description: 'Transform and move data between systems',
    category: 'data_pipeline',
    tags: ['etl', 'data', 'integration'],
    storyTemplate: {
      format: 'full',
      role: 'A data pipeline agent that transforms and moves data',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 19,
    whenToUse: 'When you need to build ETL or data integration workflows',
    exampleScenarios: ['Database sync', 'API data fetching', 'Data transformation'],
  },
  {
    id: uuid(),
    name: 'Monitoring & Alerting Agent',
    description: 'Monitor systems and send alerts on issues',
    category: 'monitoring_alerting',
    tags: ['monitoring', 'alerts', 'observability'],
    storyTemplate: {
      format: 'full',
      role: 'A monitoring agent that watches systems and alerts on issues',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 31,
    whenToUse: 'When you need proactive system monitoring',
    exampleScenarios: ['Health checks', 'Error monitoring', 'Performance alerts'],
  },
  {
    id: uuid(),
    name: 'Content Generator',
    description: 'Generate content based on templates and data',
    category: 'content_generation',
    tags: ['content', 'generation', 'writing'],
    storyTemplate: {
      format: 'light',
      role: 'A content generator that creates content from templates',
      autonomyLevel: 'collaborative',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 24,
    whenToUse: 'When you need automated content creation',
    exampleScenarios: ['Blog posts', 'Product descriptions', 'Email templates'],
  },
  {
    id: uuid(),
    name: 'Multi-Agent Coordinator',
    description: 'Coordinate multiple agents working together',
    category: 'multi_agent',
    tags: ['coordination', 'orchestration', 'multi-agent'],
    storyTemplate: {
      format: 'full',
      role: 'A coordinator agent that orchestrates multiple sub-agents',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 12,
    whenToUse: 'When you need multiple agents working together',
    exampleScenarios: ['Complex workflows', 'Parallel processing', 'Agent pipelines'],
  },
  {
    id: uuid(),
    name: 'Analysis & Reporting Agent',
    description: 'Analyze data and generate insights',
    category: 'analysis_reporting',
    tags: ['analysis', 'insights', 'data'],
    storyTemplate: {
      format: 'full',
      role: 'An analysis agent that processes data and generates insights',
      autonomyLevel: 'collaborative',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 18,
    whenToUse: 'When you need data analysis and insight generation',
    exampleScenarios: ['Trend analysis', 'Anomaly detection', 'Performance reports'],
  },
  {
    id: uuid(),
    name: 'Background Processor',
    description: 'Process tasks asynchronously in the background',
    category: 'background_processing',
    tags: ['async', 'background', 'processing'],
    storyTemplate: {
      format: 'full',
      role: 'A background processor that handles async tasks',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 22,
    whenToUse: 'When you need async task processing',
    exampleScenarios: ['Image processing', 'Document parsing', 'Batch operations'],
  },
];

// In-memory storage with localStorage persistence
let stories: AgentStory[] = [];
let templates = [...mockTemplates];
let isInitialized = false;

// Initialize stories from localStorage or use defaults
function initializeStories(): void {
  if (isInitialized) return;

  const stored = loadFromStorage();
  if (stored && Array.isArray(stored) && stored.length > 0) {
    stories = stored as AgentStory[];
  } else {
    stories = [...mockStories];
    saveToStorage(stories);
  }
  isInitialized = true;
}

// Persist stories to localStorage
function persistStories(): void {
  saveToStorage(stories);
}

export const mockDataService = {
  // Stories
  stories: {
    list: async (params?: {
      search?: string;
      tags?: string[];
      autonomyLevel?: string;
      format?: string;
    }): Promise<AgentStory[]> => {
      initializeStories();
      await delay(300);
      let result = [...stories];

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.role.toLowerCase().includes(search)
        );
      }

      if (params?.tags?.length) {
        result = result.filter((s) =>
          params.tags!.some((tag) => s.tags?.includes(tag))
        );
      }

      if (params?.autonomyLevel) {
        result = result.filter((s) => s.autonomyLevel === params.autonomyLevel);
      }

      if (params?.format) {
        result = result.filter((s) => s.format === params.format);
      }

      return result;
    },

    get: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(200);
      return stories.find((s) => s.id === id) || null;
    },

    create: async (data: Omit<AgentStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const now = new Date().toISOString();
      const newStory = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(newStory);
      persistStories();
      return newStory;
    },

    update: async (id: string, data: Partial<AgentStory>): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return null;

      stories[index] = {
        ...stories[index],
        ...data,
        updatedAt: new Date().toISOString(),
      } as AgentStory;
      persistStories();
      return stories[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeStories();
      await delay(300);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return false;
      stories.splice(index, 1);
      persistStories();
      return true;
    },

    duplicate: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const story = stories.find((s) => s.id === id);
      if (!story) return null;

      const now = new Date().toISOString();
      const duplicate = {
        ...story,
        id: uuid(),
        name: `${story.name} (Copy)`,
        identifier: `${story.identifier}-copy-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(duplicate);
      persistStories();
      return duplicate;
    },
  },

  // Templates
  templates: {
    list: async (params?: {
      category?: TemplateCategory;
      search?: string;
    }): Promise<Template[]> => {
      await delay(300);
      let result = [...templates];

      if (params?.category) {
        result = result.filter((t) => t.category === params.category);
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search)
        );
      }

      return result;
    },

    get: async (id: string): Promise<Template | null> => {
      await delay(200);
      return templates.find((t) => t.id === id) || null;
    },

    useTemplate: async (templateId: string): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Increment usage count
      template.usageCount++;

      const now = new Date().toISOString();
      const baseStory = {
        ...template.storyTemplate,
        id: uuid(),
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1',
        identifier: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `New ${template.name}`,
        trigger: {
          specification: {
            type: 'manual' as const,
            source: 'User initiated',
          }
        },
        action: 'Define the action this agent will take',
        outcome: 'Define the expected outcome',
      };

      let newStory: AgentStory;

      if (template.storyTemplate.format === 'full') {
        newStory = {
          ...baseStory,
          format: 'full' as const,
          skills: [],
          acceptance: { functional: [] },
        } as AgentStoryFull;
      } else {
        newStory = {
          ...baseStory,
          format: 'light' as const,
        } as AgentStoryLight;
      }

      stories.push(newStory);
      persistStories();
      return newStory;
    },
  },

  // Stats
  stats: {
    get: async () => {
      initializeStories();
      await delay(200);
      return {
        totalStories: stories.length,
        totalTemplates: templates.length,
        storiesByFormat: {
          light: stories.filter((s) => s.format === 'light').length,
          full: stories.filter((s) => s.format === 'full').length,
        },
        storiesByAutonomy: {
          full: stories.filter((s) => s.autonomyLevel === 'full').length,
          supervised: stories.filter((s) => s.autonomyLevel === 'supervised').length,
          collaborative: stories.filter((s) => s.autonomyLevel === 'collaborative').length,
          directed: stories.filter((s) => s.autonomyLevel === 'directed').length,
        },
      };
    },
  },
};
