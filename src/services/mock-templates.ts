import type { Template } from '@/lib/schemas';

// Generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock templates data
export const mockTemplates: Template[] = [
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
