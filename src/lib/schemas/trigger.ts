import { z } from 'zod';

// Trigger types enum - now used at skill level
export const TriggerTypeEnum = z.enum([
  'message',          // Incoming message/request
  'resource_change',  // Data/state change
  'schedule',         // Time-based activation
  'cascade',          // Triggered by another skill/agent
  'manual',           // Human-initiated
  'condition'         // State condition becomes true
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

// Skill trigger specification - simpler, cleaner
export const SkillTriggerSchema = z.object({
  type: TriggerTypeEnum,
  description: z.string().min(1).describe('Human-readable trigger description'),
  conditions: z.array(z.string()).optional().describe('Guard conditions that must be true'),
  examples: z.array(z.string()).optional().describe('Concrete examples')
});

export type SkillTrigger = z.infer<typeof SkillTriggerSchema>;

// Type-specific trigger configurations (optional detailed config)
export const MessageTriggerConfigSchema = z.object({
  type: z.literal('message'),
  sources: z.array(z.string()).optional().describe('Valid message sources'),
  patterns: z.array(z.string()).optional().describe('Message patterns to match'),
  protocol: z.enum(['a2a', 'webhook', 'queue', 'api']).optional()
});

export const ResourceChangeTriggerConfigSchema = z.object({
  type: z.literal('resource_change'),
  resourceType: z.string(),
  resourcePath: z.string().optional(),
  changeTypes: z.array(z.enum(['create', 'update', 'delete']))
});

export const ScheduleTriggerConfigSchema = z.object({
  type: z.literal('schedule'),
  cronExpression: z.string(),
  timezone: z.string().default('UTC')
});

export const CascadeTriggerConfigSchema = z.object({
  type: z.literal('cascade'),
  sourceSkill: z.string().optional(),
  sourceAgent: z.string().optional(),
  eventType: z.string()
});

export const ConditionTriggerConfigSchema = z.object({
  type: z.literal('condition'),
  expression: z.string().describe('Condition expression to evaluate'),
  pollInterval: z.string().optional().describe('How often to check condition')
});

export const ManualTriggerConfigSchema = z.object({
  type: z.literal('manual'),
  requiredRole: z.string().optional(),
  confirmationRequired: z.boolean().default(false)
});

export const TriggerConfigSchema = z.discriminatedUnion('type', [
  MessageTriggerConfigSchema,
  ResourceChangeTriggerConfigSchema,
  ScheduleTriggerConfigSchema,
  CascadeTriggerConfigSchema,
  ConditionTriggerConfigSchema,
  ManualTriggerConfigSchema
]);

export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

// Legacy support: Complete trigger with both specification and details
// Used in light format for simple trigger representation
export const SimpleTriggerSchema = z.object({
  type: TriggerTypeEnum,
  description: z.string().min(1)
});

export type SimpleTrigger = z.infer<typeof SimpleTriggerSchema>;

// Trigger type metadata for UI
export const TRIGGER_TYPE_METADATA = {
  message: {
    label: 'Message',
    description: 'Incoming message or request',
    icon: 'MessageSquare'
  },
  resource_change: {
    label: 'Resource Change',
    description: 'State change in monitored resources',
    icon: 'RefreshCw'
  },
  schedule: {
    label: 'Schedule',
    description: 'Time-based activation',
    icon: 'Clock'
  },
  cascade: {
    label: 'Cascade',
    description: 'Triggered by another skill or agent',
    icon: 'GitBranch'
  },
  manual: {
    label: 'Manual',
    description: 'Human-initiated activation',
    icon: 'Hand'
  },
  condition: {
    label: 'Condition',
    description: 'State condition becomes true',
    icon: 'CheckCircle'
  }
} as const;
