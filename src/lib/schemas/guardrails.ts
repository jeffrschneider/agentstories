import { z } from 'zod';

// Enforcement level
export const EnforcementLevelEnum = z.enum([
  'hard',   // Must never be violated
  'soft'    // Preferred but can be overridden
]);

export type EnforcementLevel = z.infer<typeof EnforcementLevelEnum>;

// Skill-level guardrail
export const SkillGuardrailSchema = z.object({
  name: z.string().min(1),
  constraint: z.string().min(1).describe('What the skill must not do'),
  enforcement: EnforcementLevelEnum.default('hard'),
  onViolation: z.string().optional().describe('Action when violated')
});

export type SkillGuardrail = z.infer<typeof SkillGuardrailSchema>;

// Agent-level guardrail (applies to all skills)
export const AgentGuardrailSchema = z.object({
  name: z.string().min(1),
  constraint: z.string().min(1).describe('Identity-level constraint'),
  rationale: z.string().optional().describe('Why this guardrail exists'),
  enforcement: EnforcementLevelEnum.default('hard')
});

export type AgentGuardrail = z.infer<typeof AgentGuardrailSchema>;

// Collections
export const SkillGuardrailsSchema = z.array(SkillGuardrailSchema);
export const AgentGuardrailsSchema = z.array(AgentGuardrailSchema);

export type SkillGuardrails = z.infer<typeof SkillGuardrailsSchema>;
export type AgentGuardrails = z.infer<typeof AgentGuardrailsSchema>;

// Enforcement metadata for UI
export const ENFORCEMENT_LEVEL_METADATA = {
  hard: {
    label: 'Hard',
    description: 'Must never be violated - execution fails if breached',
    icon: 'Shield'
  },
  soft: {
    label: 'Soft',
    description: 'Preferred but can be overridden in special circumstances',
    icon: 'AlertTriangle'
  }
} as const;
