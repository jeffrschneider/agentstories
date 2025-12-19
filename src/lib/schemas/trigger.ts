import { z } from 'zod';

// Trigger types enum
export const TriggerTypeEnum = z.enum([
  'message',
  'resource_change',
  'schedule',
  'cascade',
  'manual'
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

// Base trigger specification
export const TriggerSpecificationSchema = z.object({
  type: TriggerTypeEnum,
  source: z.string().min(1).describe('Description of event source'),
  conditions: z.string().optional().describe('Optional guard conditions'),
  examples: z.array(z.string()).optional().describe('Concrete examples of triggering events')
});

export type TriggerSpecification = z.infer<typeof TriggerSpecificationSchema>;

// Type-specific trigger details (for UI configuration)

// Message trigger (A2A communication)
export const MessageTriggerDetailsSchema = z.object({
  type: z.literal('message'),
  sourceAgents: z.array(z.string()).min(1),
  messageFormat: z.string().optional(),
  protocol: z.enum(['a2a', 'webhook', 'queue']).default('a2a')
});

// Resource change trigger
export const ResourceChangeTriggerDetailsSchema = z.object({
  type: z.literal('resource_change'),
  resourceType: z.string(),
  resourceIdentifier: z.string(),
  changeTypes: z.array(z.enum(['create', 'update', 'delete'])).min(1)
});

// Schedule trigger (cron-based)
export const ScheduleTriggerDetailsSchema = z.object({
  type: z.literal('schedule'),
  cronExpression: z.string().regex(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    { message: 'Invalid cron expression' }
  ),
  timezone: z.string().default('UTC')
});

// Cascade trigger (from upstream agents)
export const CascadeTriggerDetailsSchema = z.object({
  type: z.literal('cascade'),
  upstreamAgentId: z.string(),
  eventType: z.string()
});

// Manual trigger
export const ManualTriggerDetailsSchema = z.object({
  type: z.literal('manual'),
  requiredRole: z.string().optional(),
  confirmationRequired: z.boolean().default(false)
});

// Union of all trigger detail types
export const TriggerDetailsSchema = z.discriminatedUnion('type', [
  MessageTriggerDetailsSchema,
  ResourceChangeTriggerDetailsSchema,
  ScheduleTriggerDetailsSchema,
  CascadeTriggerDetailsSchema,
  ManualTriggerDetailsSchema
]);

export type TriggerDetails = z.infer<typeof TriggerDetailsSchema>;

// Complete trigger with both specification and details
export const TriggerSchema = z.object({
  specification: TriggerSpecificationSchema,
  details: TriggerDetailsSchema.optional()
});

export type Trigger = z.infer<typeof TriggerSchema>;

// Trigger type metadata for UI
export const TRIGGER_TYPE_METADATA = {
  message: {
    label: 'Message',
    description: 'A2A communication from other agents',
    icon: 'MessageSquare'
  },
  resource_change: {
    label: 'Resource Change',
    description: 'State change in monitored resources',
    icon: 'RefreshCw'
  },
  schedule: {
    label: 'Schedule',
    description: 'Cron-based time triggers',
    icon: 'Clock'
  },
  cascade: {
    label: 'Cascade',
    description: 'Events from upstream agents',
    icon: 'GitBranch'
  },
  manual: {
    label: 'Manual',
    description: 'Human-initiated activation',
    icon: 'Hand'
  }
} as const;
