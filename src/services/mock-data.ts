import type { AgentStory, Template, TemplateCategory } from '@/lib/schemas';
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

// Mock stories data - skill-based architecture
const mockStories: AgentStory[] = [
  // Customer Support Agent
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'customer-support-agent',
    name: 'Customer Support Agent',
    role: 'A customer support specialist that handles incoming support tickets',
    purpose: 'Provide fast, accurate customer support while maintaining high satisfaction',
    autonomyLevel: 'supervised',
    tags: ['customer-service', 'support', 'tickets'],
    skills: [
      {
        id: uuid(),
        name: 'Ticket Analysis',
        description: 'Analyze incoming tickets and categorize them',
        domain: 'Customer Service',
        acquired: 'built_in',
        triggers: [
          {
            type: 'message',
            description: 'New support ticket created in helpdesk system'
          }
        ],
        acceptance: {
          successConditions: ['Ticket categorized', 'Priority assigned']
        }
      }
    ]
  },

  // Code Review Assistant
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'code-review-assistant',
    name: 'Code Review Assistant',
    role: 'A code reviewer that analyzes pull requests for quality and best practices',
    purpose: 'Improve code quality through automated review and suggestions',
    autonomyLevel: 'collaborative',
    tags: ['development', 'code-review', 'automation'],
    skills: [
      {
        id: uuid(),
        name: 'Code Analysis',
        description: 'Review code changes for style, bugs, and security issues',
        domain: 'Development',
        acquired: 'built_in',
        triggers: [
          {
            type: 'resource_change',
            description: 'Pull request opened or updated in GitHub repository'
          }
        ],
        acceptance: {
          successConditions: ['Code reviewed', 'Comments posted']
        }
      }
    ]
  },

  // Support Request Router
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    identifier: 'support-request-router',
    name: 'Support Request Router',
    role: 'Customer Support Triage Agent',
    purpose: 'Ensure support requests reach the right team quickly with full context',
    autonomyLevel: 'supervised',
    tags: ['customer-support', 'triage', 'routing'],

    skills: [
      {
        id: uuid(),
        name: 'Request Classification',
        description: 'Categorize incoming requests by type, urgency, and sentiment',
        domain: 'Natural Language Understanding',
        acquired: 'built_in',
        triggers: [
          {
            type: 'message',
            description: 'New support request received',
            conditions: ['Source is customer support gateway', 'Request not previously classified'],
            examples: ['Customer submits ticket via web form', 'Email received at support@company.com']
          }
        ],
        tools: [
          {
            name: 'Customer Database',
            purpose: 'Lookup customer tier and history',
            permissions: ['read'],
            required: false
          },
          {
            name: 'Classification Model API',
            purpose: 'ML-based categorization',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Extract key phrases from message',
            'Lookup customer context if available',
            'Run classification model',
            'Apply confidence thresholds'
          ]
        },
        reasoning: {
          strategy: 'hybrid',
          decisionPoints: [
            {
              name: 'Confidence Check',
              inputs: ['model_confidence_score'],
              approach: 'Escalate if confidence < 0.8',
              outcomes: ['accept', 'escalate']
            }
          ],
          retry: {
            maxAttempts: 2,
            backoffStrategy: 'exponential',
            retryOn: ['Model timeout']
          }
        },
        acceptance: {
          successConditions: [
            'Category assigned',
            'Urgency determined',
            'Confidence recorded'
          ],
          qualityMetrics: [
            { name: 'accuracy', target: '>= 95%' },
            { name: 'latency', target: '< 500ms p95' }
          ]
        },
        failureHandling: {
          modes: [
            {
              condition: 'Model unavailable',
              recovery: 'Use rule-based fallback classifier',
              escalate: false
            },
            {
              condition: 'All attempts fail',
              recovery: 'Route to human classifier',
              escalate: true
            }
          ],
          defaultFallback: 'Flag for manual classification',
          notifyOnFailure: true
        },
        guardrails: [
          {
            name: 'No PII logging',
            constraint: 'Never log raw message content',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Queue Routing',
        description: 'Route classified requests to appropriate support queues',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Classification skill completed',
            conditions: ['Classification result available']
          }
        ],
        tools: [
          {
            name: 'Queue Manager API',
            purpose: 'Check queue capacity and route',
            permissions: ['read', 'execute'],
            required: true
          }
        ],
        behavior: {
          model: 'workflow',
          stages: [
            {
              name: 'Check VIP Status',
              purpose: 'Prioritize high-value customers',
              transitions: [{ to: 'Select Queue', when: 'VIP status checked' }]
            },
            {
              name: 'Select Queue',
              purpose: 'Match category to queue',
              transitions: [{ to: 'Confirm Route', when: 'Queue selected' }]
            },
            {
              name: 'Confirm Route',
              purpose: 'Finalize routing decision'
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Request assigned to queue',
            'Priority set correctly',
            'Routing logged'
          ]
        },
        guardrails: [
          {
            name: 'Compliance routing',
            constraint: 'Compliance issues never go to standard queues',
            enforcement: 'hard'
          }
        ]
      }
    ],

    humanInteraction: {
      mode: 'on_the_loop',
      escalation: {
        conditions: 'Critical issue or low confidence',
        channel: 'Slack #support-escalations'
      }
    },
    collaboration: {
      role: 'worker',
      reportsTo: 'support-orchestrator'
    },
    memory: {
      working: ['Current request context', 'Customer sentiment from recent interactions'],
      persistent: [
        {
          name: 'Routing History',
          type: 'relational',
          purpose: 'Track routing patterns and outcomes',
          updates: 'append'
        }
      ],
      learning: [
        {
          type: 'feedback_loop',
          signal: 'Human corrections to classifications'
        }
      ]
    },
    guardrails: [
      {
        name: 'Never auto-close',
        constraint: 'Never close tickets without customer confirmation',
        rationale: 'Prevent premature resolution',
        enforcement: 'hard'
      },
      {
        name: 'Audit trail',
        constraint: 'All routing decisions must be logged',
        rationale: 'Compliance and debugging',
        enforcement: 'hard'
      }
    ]
  },

  // Data Pipeline Monitor
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    identifier: 'data-pipeline-monitor',
    name: 'Data Pipeline Monitor',
    role: 'Infrastructure Monitoring Agent',
    purpose: 'Detect pipeline issues early and notify relevant teams with context',
    autonomyLevel: 'full',
    tags: ['monitoring', 'data-pipeline', 'alerting'],

    skills: [
      {
        id: uuid(),
        name: 'Health Check',
        description: 'Monitor pipeline health metrics and detect anomalies',
        domain: 'Data Processing',
        acquired: 'built_in',
        triggers: [
          {
            type: 'schedule',
            description: 'Every 5 minutes',
            conditions: ['Pipeline is running']
          }
        ],
        tools: [
          {
            name: 'Pipeline Metrics API',
            purpose: 'Fetch current pipeline metrics and status',
            permissions: ['read'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Fetch current metrics',
            'Compare against thresholds',
            'Detect anomalies',
            'Return health status'
          ]
        },
        acceptance: {
          successConditions: [
            'All pipeline components checked',
            'Health status determined',
            'Metrics recorded'
          ],
          timeout: '30 seconds'
        }
      },
      {
        id: uuid(),
        name: 'Alert Routing',
        description: 'Send alerts to appropriate channels based on severity',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Health check detected issue',
            conditions: ['Issue severity >= warning']
          }
        ],
        tools: [
          {
            name: 'Slack Notifier',
            purpose: 'Send notifications to Slack channels',
            permissions: ['execute'],
            required: true
          },
          {
            name: 'PagerDuty',
            purpose: 'Escalate critical issues',
            permissions: ['execute'],
            required: false,
            conditions: 'Only for critical severity'
          }
        ],
        reasoning: {
          strategy: 'rule_based',
          decisionPoints: [
            {
              name: 'Severity Assessment',
              inputs: ['error_rate', 'pipeline_delay', 'data_quality_score'],
              approach: 'Apply threshold rules to determine alert severity',
              outcomes: ['info', 'warning', 'critical']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Alert sent to correct channel',
            'No duplicate alerts within 15 minutes',
            'Alert includes context'
          ]
        },
        guardrails: [
          {
            name: 'Deduplication',
            constraint: 'Do not send duplicate alerts for same issue',
            enforcement: 'hard'
          }
        ]
      }
    ],

    humanInteraction: {
      mode: 'out_of_loop',
      escalation: {
        conditions: 'Critical failure or unknown error pattern',
        channel: 'PagerDuty to on-call engineer'
      }
    },
    memory: {
      persistent: [
        {
          name: 'Alert History',
          type: 'kv',
          purpose: 'Track recent alerts to prevent duplicates',
          updates: 'append'
        }
      ]
    }
  }
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
    }): Promise<AgentStory[]> => {
      initializeStories();
      await delay(300);
      let result = [...stories];

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.role?.toLowerCase().includes(search)
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
        identifier: story.identifier ? `${story.identifier}-copy-${Date.now()}` : undefined,
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
      const newStory: AgentStory = {
        ...template.storyTemplate,
        id: uuid(),
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1',
        identifier: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `New ${template.name}`,
        purpose: 'Define the purpose of this agent',
        skills: [
          {
            id: uuid(),
            name: 'Primary Capability',
            description: 'Define what this skill does',
            domain: 'General',
            acquired: 'built_in',
            triggers: [{ type: 'manual', description: 'Triggered manually' }],
            acceptance: { successConditions: ['Define success criteria'] }
          }
        ],
      };

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
