import { z } from 'zod';
import { AgentStorySchema } from './story';

// Template categories
export const TemplateCategoryEnum = z.enum([
  'background_processing',
  'monitoring_alerting',
  'data_pipeline',
  'scheduled_tasks',
  'event_driven',
  'multi_agent',
  'customer_service',
  'content_generation',
  'analysis_reporting',
  'custom'
]);

export type TemplateCategory = z.infer<typeof TemplateCategoryEnum>;

// Partial story template - story schema with all fields optional (name generated from template)
const StoryTemplateSchema = AgentStorySchema.partial();

// Template schema
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategoryEnum,
  tags: z.array(z.string()),

  // Template content - a partial story
  storyTemplate: StoryTemplateSchema,

  // Template metadata
  isBuiltIn: z.boolean().default(false),
  organizationId: z.string().uuid().optional(), // null for built-in
  createdBy: z.string().optional(),
  createdAt: z.string().datetime(),
  usageCount: z.number().int().min(0).default(0),

  // Guidance
  whenToUse: z.string().optional(),
  exampleScenarios: z.array(z.string()).optional()
});

export type Template = z.infer<typeof TemplateSchema>;

// Template category metadata for UI
export const TEMPLATE_CATEGORY_METADATA = {
  background_processing: {
    label: 'Background Processing',
    description: 'Agents that process tasks asynchronously'
  },
  monitoring_alerting: {
    label: 'Monitoring & Alerting',
    description: 'Agents that watch systems and notify on events'
  },
  data_pipeline: {
    label: 'Data Pipeline',
    description: 'Agents that transform and move data'
  },
  scheduled_tasks: {
    label: 'Scheduled Tasks',
    description: 'Agents that run on a schedule'
  },
  event_driven: {
    label: 'Event-Driven',
    description: 'Agents that respond to events'
  },
  multi_agent: {
    label: 'Multi-Agent',
    description: 'Agents that coordinate with other agents'
  },
  customer_service: {
    label: 'Customer Service',
    description: 'Agents that handle customer interactions'
  },
  content_generation: {
    label: 'Content Generation',
    description: 'Agents that create content'
  },
  analysis_reporting: {
    label: 'Analysis & Reporting',
    description: 'Agents that analyze data and generate reports'
  },
  custom: {
    label: 'Custom',
    description: 'User-defined templates'
  }
} as const;
