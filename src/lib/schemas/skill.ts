import { z } from 'zod';
import { ReasoningSchema } from './reasoning';

// Skill acquisition types
export const SkillAcquisitionEnum = z.enum([
  'built_in',   // Core competency the agent is designed with
  'learned',    // Acquired through training, feedback, or experience
  'delegated'   // Performed by calling another agent or service
]);

export type SkillAcquisition = z.infer<typeof SkillAcquisitionEnum>;

// Skill schema
export const SkillSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1).describe('Knowledge domain this skill operates in'),
  proficiencies: z.array(z.string()).min(1).describe('Specific competencies within the skill'),
  toolsUsed: z.array(z.string()).optional().describe('Tools this skill leverages (references agent-level tools)'),
  qualityBar: z.string().min(1).describe('What competent execution looks like'),
  acquired: SkillAcquisitionEnum,
  reasoning: ReasoningSchema.optional().describe('Skill-specific reasoning (overrides agent-level)')
});

export type Skill = z.infer<typeof SkillSchema>;

// Skills collection (agent must have at least one skill for full format)
export const SkillsSchema = z.array(SkillSchema);

export type Skills = z.infer<typeof SkillsSchema>;

// Skill acquisition metadata for UI
export const SKILL_ACQUISITION_METADATA = {
  built_in: {
    label: 'Built-in',
    description: 'Core competency the agent is designed with'
  },
  learned: {
    label: 'Learned',
    description: 'Acquired through training, feedback, or experience'
  },
  delegated: {
    label: 'Delegated',
    description: 'Performed by calling another agent or service'
  }
} as const;
