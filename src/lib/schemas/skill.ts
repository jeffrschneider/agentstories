import { z } from 'zod';
import { SkillTriggerSchema } from './trigger';
import { SkillBehaviorSchema } from './behavior';
import { SkillReasoningSchema } from './reasoning';
import { SkillToolSchema } from './tools';
import { SkillAcceptanceCriteriaSchema } from './acceptance';
import { SkillGuardrailSchema } from './guardrails';

// Skill acquisition types
export const SkillAcquisitionEnum = z.enum([
  'built_in',    // Core competency the agent is designed with
  'learned',     // Acquired through training, feedback, or experience
  'delegated'    // Performed by calling another agent or service
]);

export type SkillAcquisition = z.infer<typeof SkillAcquisitionEnum>;

// Skill input specification
export const SkillInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1).describe('Data type (string, object, array, etc.)'),
  description: z.string().min(1),
  required: z.boolean().default(true),
  schema: z.string().optional().describe('JSON Schema or Zod reference for complex types')
});

export type SkillInput = z.infer<typeof SkillInputSchema>;

// Skill output specification
export const SkillOutputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  schema: z.string().optional()
});

export type SkillOutput = z.infer<typeof SkillOutputSchema>;

// Failure mode definition
export const FailureModeSchema = z.object({
  condition: z.string().min(1).describe('What failure looks like'),
  recovery: z.string().min(1).describe('How to handle this failure'),
  escalate: z.boolean().default(false).describe('Should this escalate to human/supervisor?')
});

export type FailureMode = z.infer<typeof FailureModeSchema>;

// Skill failure handling
export const SkillFailureHandlingSchema = z.object({
  modes: z.array(FailureModeSchema).optional(),
  defaultFallback: z.string().optional().describe('Default action when no specific handler matches'),
  notifyOnFailure: z.boolean().default(true)
});

export type SkillFailureHandling = z.infer<typeof SkillFailureHandlingSchema>;

// Complete skill definition - the core unit of capability
export const SkillSchema = z.object({
  // Identity
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1).describe('What this skill does'),
  domain: z.string().min(1).describe('Knowledge domain (e.g., "NLP", "Workflow Management")'),
  acquired: SkillAcquisitionEnum,

  // Interface (when this skill activates and what it produces)
  triggers: z.array(SkillTriggerSchema).min(1).describe('When this skill activates'),
  inputs: z.array(SkillInputSchema).optional(),
  outputs: z.array(SkillOutputSchema).optional(),

  // Resources (what this skill needs)
  tools: z.array(SkillToolSchema).optional().describe('Tools this skill uses'),

  // Execution (how this skill works)
  behavior: SkillBehaviorSchema.optional(),
  reasoning: SkillReasoningSchema.optional(),

  // Success & Failure
  acceptance: SkillAcceptanceCriteriaSchema,
  failureHandling: SkillFailureHandlingSchema.optional(),

  // Constraints
  guardrails: z.array(SkillGuardrailSchema).optional()
});

export type Skill = z.infer<typeof SkillSchema>;

// Skills collection (agent must have at least one skill for full format)
export const SkillsSchema = z.array(SkillSchema);

export type Skills = z.infer<typeof SkillsSchema>;

// Skill acquisition metadata for UI
export const SKILL_ACQUISITION_METADATA = {
  built_in: {
    label: 'Built-in',
    description: 'Core competency the agent is designed with',
    icon: 'Cpu'
  },
  learned: {
    label: 'Learned',
    description: 'Acquired through training, feedback, or experience',
    icon: 'GraduationCap'
  },
  delegated: {
    label: 'Delegated',
    description: 'Performed by calling another agent or service',
    icon: 'Share2'
  }
} as const;

// Common skill domains for UI suggestions
export const SKILL_DOMAINS = [
  'Natural Language Understanding',
  'Natural Language Generation',
  'Workflow Management',
  'Data Processing',
  'API Integration',
  'Decision Making',
  'Content Classification',
  'Information Retrieval',
  'Document Analysis',
  'Customer Service',
  'Code Generation',
  'Testing & QA'
] as const;

// Helper to create a minimal valid skill
export function createEmptySkill(): Skill {
  return {
    name: '',
    description: '',
    domain: '',
    acquired: 'built_in',
    triggers: [{ type: 'manual', description: '' }],
    acceptance: { successConditions: [''] }
  };
}

// Helper to validate skill completeness
export function getSkillCompleteness(skill: Skill): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!skill.name) missing.push('name');
  if (!skill.description) missing.push('description');
  if (!skill.domain) missing.push('domain');
  if (!skill.triggers?.length) missing.push('triggers');
  if (!skill.acceptance?.successConditions?.length) missing.push('acceptance criteria');

  // Check if triggers have descriptions
  if (skill.triggers?.some(t => !t.description)) {
    missing.push('trigger descriptions');
  }

  // Check if success conditions have content
  if (skill.acceptance?.successConditions?.some(c => !c)) {
    missing.push('success condition content');
  }

  return {
    complete: missing.length === 0,
    missing
  };
}
