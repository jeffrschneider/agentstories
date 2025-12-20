import { z } from 'zod';
import { SkillsSchema, createEmptySkill } from './skill';
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

// Agent Story Schema - skill-based format
// Agent = WHO (identity, relationships, memory, guardrails)
// Skills = WHAT + HOW (capability bundles)
export const AgentStorySchema = z.object({
  // Metadata
  id: z.string().uuid(),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),

  // === AGENT IDENTITY (WHO) ===
  // Only name is required
  name: z.string().min(1).max(100),

  // Optional identity fields
  identifier: z.string()
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    })
    .optional(),
  role: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  autonomyLevel: AutonomyLevelEnum.optional(),

  // === SKILLS (WHAT + HOW) ===
  // Optional - agent can have no skills yet
  skills: SkillsSchema.optional(),

  // === AGENT-LEVEL CONFIGURATION ===
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

export type AgentStory = z.infer<typeof AgentStorySchema>;

// For backwards compatibility during transition
export type AgentStoryFull = AgentStory;
export type AgentStoryLight = AgentStory;

// Create a new empty story
export function createEmptyStory(userId?: string): AgentStory {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    name: '',
    skills: []
  };
}

// Legacy alias
export const createEmptyFullStory = createEmptyStory;

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
