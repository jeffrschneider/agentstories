import { z } from 'zod';
import { TriggerSchema, TriggerSpecificationSchema } from './trigger';
import { BehaviorConfigSchema } from './behavior';
import { ReasoningSchema } from './reasoning';
import { ToolsSchema } from './tools';
import { SkillsSchema } from './skill';
import { HumanInteractionSchema, AgentCollaborationSchema } from './collaboration';
import { MemorySchema } from './memory';
import { AcceptanceCriteriaSchema } from './acceptance';

// Autonomy levels
export const AutonomyLevelEnum = z.enum([
  'full',
  'supervised',
  'collaborative',
  'directed'
]);

export type AutonomyLevel = z.infer<typeof AutonomyLevelEnum>;

// Story format
export const StoryFormatEnum = z.enum([
  'light',
  'full'
]);

export type StoryFormat = z.infer<typeof StoryFormatEnum>;

// Agent Story Light - Simple format for quick design
export const AgentStoryLightSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  format: z.literal('light'),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),

  // Core story elements
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    }),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200), // "As a [role]"
  trigger: TriggerSchema,
  action: z.string().min(1).max(500), // "I [action/goal]"
  outcome: z.string().min(1).max(500), // "so that [outcome]"
  autonomyLevel: AutonomyLevelEnum,

  // Optional light metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type AgentStoryLight = z.infer<typeof AgentStoryLightSchema>;

// Agent Story Full - Complete format with all structured annotations
export const AgentStoryFullSchema = AgentStoryLightSchema.extend({
  format: z.literal('full'),

  // Structured Annotations (all optional except skills and acceptance)

  // 1. Trigger specification (enhances core trigger)
  triggerSpec: TriggerSpecificationSchema.optional(),

  // 2. Behavior model
  behavior: BehaviorConfigSchema.optional(),

  // 3. Reasoning & decisions (agent-level, shared across skills)
  reasoning: ReasoningSchema.optional(),

  // 4. Memory & state
  memory: MemorySchema.optional(),

  // 5. Tools & integrations
  tools: ToolsSchema.optional(),

  // 6. Skills (required for full format - at least one)
  skills: SkillsSchema,

  // 7. Human collaboration
  humanInteraction: HumanInteractionSchema.optional(),

  // 8. Agent collaboration
  collaboration: AgentCollaborationSchema.optional(),

  // 9. Acceptance criteria (required for full format)
  acceptance: AcceptanceCriteriaSchema
});

export type AgentStoryFull = z.infer<typeof AgentStoryFullSchema>;

// Union schema for any story format
export const AgentStorySchema = z.discriminatedUnion('format', [
  AgentStoryLightSchema,
  AgentStoryFullSchema
]);

export type AgentStory = z.infer<typeof AgentStorySchema>;

// Helper type guard
export function isFullFormat(story: AgentStory): story is AgentStoryFull {
  return story.format === 'full';
}

// Upgrade function type
export function upgradeToFull(light: AgentStoryLight): AgentStoryFull {
  return {
    ...light,
    format: 'full' as const,
    updatedAt: new Date().toISOString(),
    skills: [], // Required - user must add at least one
    acceptance: { functional: [] } // Required - user must add at least one
  };
}

// Autonomy level metadata for UI
export const AUTONOMY_LEVEL_METADATA = {
  full: {
    label: 'Full Autonomy',
    humanInvolvement: 'Minimal oversight',
    agentAuthority: 'Complete decision authority',
    description: 'Agent operates independently with full decision-making power'
  },
  supervised: {
    label: 'Supervised',
    humanInvolvement: 'Exception-based review',
    agentAuthority: 'Operates independently, escalates edge cases',
    description: 'Agent handles routine tasks, humans review exceptions'
  },
  collaborative: {
    label: 'Collaborative',
    humanInvolvement: 'Active partnership',
    agentAuthority: 'Shared decision-making',
    description: 'Human and agent work together on decisions'
  },
  directed: {
    label: 'Directed',
    humanInvolvement: 'Step-by-step approval',
    agentAuthority: 'Executes specific instructions',
    description: 'Agent requires human approval for each action'
  }
} as const;
