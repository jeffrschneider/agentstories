import { z } from 'zod';
import { SimpleTriggerSchema } from './trigger';
import { SkillsSchema, SkillSchema, createEmptySkill } from './skill';
import { HumanInteractionSchema, AgentCollaborationSchema } from './collaboration';
import { MemorySchema } from './memory';
import { AgentGuardrailsSchema } from './guardrails';

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

  // Core story elements (simple capability statement)
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    }),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200), // "As a [role]"
  trigger: SimpleTriggerSchema,      // Simple trigger for light format
  action: z.string().min(1).max(500), // "I [action/goal]"
  outcome: z.string().min(1).max(500), // "so that [outcome]"
  autonomyLevel: AutonomyLevelEnum,

  // Optional metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type AgentStoryLight = z.infer<typeof AgentStoryLightSchema>;

// Agent Story Full - Skill-based format
// Agent = WHO (identity, relationships, memory, guardrails)
// Skills = WHAT + HOW (capability bundles)
export const AgentStoryFullSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  format: z.literal('full'),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),

  // === AGENT IDENTITY (WHO) ===
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500).describe('Why does this agent exist?'),
  autonomyLevel: AutonomyLevelEnum,

  // === SKILLS (WHAT + HOW) ===
  // Required - at least one skill
  skills: SkillsSchema.min(1),

  // === AGENT-LEVEL CONFIGURATION ===
  // These provide context for all skills

  // Human interaction (overall mode, escalation policy)
  humanInteraction: HumanInteractionSchema.optional(),

  // Agent collaboration (supervisor/worker/peer relationships)
  collaboration: AgentCollaborationSchema.optional(),

  // Memory (persists across skills and sessions)
  memory: MemorySchema.optional(),

  // High-level guardrails (identity constraints that apply to all skills)
  guardrails: AgentGuardrailsSchema.optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
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

// Upgrade function: convert light format to full by creating a skill from the simple statements
export function upgradeToFull(light: AgentStoryLight): AgentStoryFull {
  return {
    id: light.id,
    format: 'full' as const,
    version: light.version,
    createdAt: light.createdAt,
    updatedAt: new Date().toISOString(),
    createdBy: light.createdBy,

    // Agent identity
    identifier: light.identifier,
    name: light.name,
    role: light.role,
    purpose: light.outcome, // "so that [outcome]" becomes purpose
    autonomyLevel: light.autonomyLevel,

    // Convert simple statements to a single skill
    skills: [{
      name: 'Primary Capability',
      description: light.action,
      domain: 'General',
      acquired: 'built_in',
      triggers: [{
        type: light.trigger.type,
        description: light.trigger.description
      }],
      acceptance: {
        successConditions: [light.outcome]
      }
    }],

    tags: light.tags,
    notes: light.notes
  };
}

// Create a new empty full format story
export function createEmptyFullStory(userId: string): AgentStoryFull {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    format: 'full',
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    createdBy: userId,

    identifier: '',
    name: '',
    role: '',
    purpose: '',
    autonomyLevel: 'supervised',

    skills: [createEmptySkill()]
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
