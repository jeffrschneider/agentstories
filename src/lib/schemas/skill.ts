import { z } from 'zod';
import { SkillTriggerSchema } from './trigger';
import { SkillBehaviorSchema } from './behavior';
import { SkillReasoningSchema } from './reasoning';
import { SkillToolSchema } from './tools';
import { SkillAcceptanceCriteriaSchema } from './acceptance';
import { SkillGuardrailSchema } from './guardrails';

// ============================================================================
// AgentSkills.io Portability Schema
// See: https://agentskills.io/specification
// ============================================================================

// Script language options for agentskills.io scripts/ directory
export const ScriptLanguageEnum = z.enum(['python', 'bash', 'javascript', 'typescript']);
export type ScriptLanguage = z.infer<typeof ScriptLanguageEnum>;

// Script reference for agentskills.io compatibility
export const SkillScriptSchema = z.object({
  filename: z.string().min(1).describe('Script filename (e.g., "extract.py")'),
  language: ScriptLanguageEnum,
  purpose: z.string().min(1).describe('What this script does'),
  content: z.string().optional().describe('Inline script content, if not external file')
});

export type SkillScript = z.infer<typeof SkillScriptSchema>;

// Reference document for agentskills.io compatibility
export const SkillReferenceSchema = z.object({
  filename: z.string().min(1).describe('Reference filename (e.g., "REFERENCE.md")'),
  title: z.string().min(1).describe('Human-readable title'),
  content: z.string().optional().describe('Inline reference content, if not external file')
});

export type SkillReference = z.infer<typeof SkillReferenceSchema>;

// Asset for agentskills.io compatibility (static resources)
export const SkillAssetSchema = z.object({
  filename: z.string().min(1).describe('Asset filename (e.g., "template.json", "schema.yaml")'),
  type: z.enum(['json', 'yaml', 'csv', 'txt', 'png', 'svg', 'other']).default('other'),
  description: z.string().optional().describe('What this asset is for'),
  content: z.string().optional().describe('Inline asset content, if text-based')
});

export type SkillAsset = z.infer<typeof SkillAssetSchema>;

// AgentSkills.io portability configuration
export const AgentSkillsPortabilitySchema = z.object({
  // Required by agentskills.io
  slug: z.string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, {
      message: 'Must be lowercase alphanumeric with single hyphens, no leading/trailing hyphens'
    })
    .describe('AgentSkills.io compatible name (kebab-case)'),

  // Optional agentskills.io fields
  license: z.string()
    .max(100)
    .optional()
    .describe('SPDX license identifier or custom license name (e.g., "MIT", "Apache-2.0")'),

  compatibility: z.string()
    .max(500)
    .optional()
    .describe('Environment requirements (e.g., "Python 3.10+, Node 18+")'),

  // References to additional files (Agent Skills spec directories)
  scripts: z.array(SkillScriptSchema).optional()
    .describe('Executable scripts for this skill (scripts/ directory)'),

  references: z.array(SkillReferenceSchema).optional()
    .describe('Additional documentation files (references/ directory)'),

  assets: z.array(SkillAssetSchema).optional()
    .describe('Static resources like templates, schemas, data files (assets/ directory)')
});

export type AgentSkillsPortability = z.infer<typeof AgentSkillsPortabilitySchema>;

// Common license options for UI
export const COMMON_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'GPL-3.0',
  'ISC',
  'proprietary'
] as const;

// ============================================================================
// Skill Acquisition Types
// ============================================================================

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

// ============================================================================
// Filesystem Export Schemas (Extended Skill Content)
// ============================================================================

// Prompt variable definition
export const PromptVariableSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(true),
  description: z.string().optional()
});

export type PromptVariable = z.infer<typeof PromptVariableSchema>;

// Prompt template for skill
export const SkillPromptSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, {
    message: 'Prompt name must be lowercase alphanumeric with underscores'
  }),
  description: z.string().min(1),
  inputs: z.array(PromptVariableSchema).optional(),
  outputs: z.array(PromptVariableSchema).optional(),
  content: z.string().min(1).describe('Prompt template content with {{variables}}')
});

export type SkillPrompt = z.infer<typeof SkillPromptSchema>;

// Tool implementation (actual code)
export const ToolImplementationSchema = z.object({
  toolName: z.string().min(1).describe('References tools[].name'),
  language: z.enum(['python', 'typescript', 'javascript', 'bash']),
  filename: z.string().min(1),
  content: z.string().min(1).describe('Implementation source code'),
  dependencies: z.array(z.string()).optional().describe('Required packages/modules')
});

export type ToolImplementation = z.infer<typeof ToolImplementationSchema>;

// Usage example
export const SkillExampleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_-]*$/, {
    message: 'Example name must be lowercase alphanumeric with hyphens/underscores'
  }),
  description: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional().describe('Example input data'),
  expectedOutput: z.record(z.string(), z.unknown()).optional().describe('Expected output'),
  content: z.string().min(1).describe('Full example markdown content')
});

export type SkillExample = z.infer<typeof SkillExampleSchema>;

// Output template
export const OutputTemplateSchema = z.object({
  name: z.string().min(1),
  format: z.enum(['markdown', 'json', 'yaml', 'html', 'text', 'docx', 'pdf']),
  filename: z.string().min(1),
  content: z.string().min(1).describe('Template content')
});

export type OutputTemplate = z.infer<typeof OutputTemplateSchema>;

// Complete skill definition - the core unit of capability
export const SkillSchema = z.object({
  // Identity
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1).max(1024).describe('What this skill does (max 1024 chars for agentskills.io)'),
  domain: z.string().min(1).describe('Knowledge domain (e.g., "NLP", "Workflow Management")'),
  acquired: SkillAcquisitionEnum,

  // AgentSkills.io Portability (optional)
  portability: AgentSkillsPortabilitySchema.optional()
    .describe('AgentSkills.io compatibility settings for export/import'),

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
  guardrails: z.array(SkillGuardrailSchema).optional(),

  // Filesystem export content (extended skill data)
  prompts: z.array(SkillPromptSchema).optional()
    .describe('Prompt templates used by this skill'),
  toolImplementations: z.array(ToolImplementationSchema).optional()
    .describe('Actual code implementations for tools'),
  examples: z.array(SkillExampleSchema).optional()
    .describe('Usage examples for this skill'),
  templates: z.array(OutputTemplateSchema).optional()
    .describe('Output templates for formatted responses')
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

// ============================================================================
// AgentSkills.io Portability Helpers
// ============================================================================

/**
 * Generate a valid agentskills.io slug from a skill name.
 * Converts to lowercase, replaces non-alphanumeric chars with hyphens,
 * removes leading/trailing hyphens, and collapses consecutive hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-')        // Collapse consecutive hyphens
    .slice(0, 64);                 // Truncate to max length
}

/**
 * Validate a slug against agentskills.io requirements.
 * Must be lowercase alphanumeric with single hyphens, no leading/trailing hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

/**
 * Check if a skill has the required portability data for agentskills.io export.
 */
export function hasPortabilityData(skill: Skill): boolean {
  return !!(skill.portability?.slug && isValidSlug(skill.portability.slug));
}

/**
 * Get detailed portability completeness for UI indicators.
 * Returns whether the skill is ready for export and what fields are missing/optional.
 */
export function getPortabilityCompleteness(skill: Skill): {
  ready: boolean;
  missing: string[];
  optional: string[];
} {
  const missing: string[] = [];
  const optional: string[] = [];

  // Required field
  if (!skill.portability?.slug) {
    missing.push('slug');
  } else if (!isValidSlug(skill.portability.slug)) {
    missing.push('valid slug format');
  }

  // Optional but recommended fields
  if (!skill.portability?.license) {
    optional.push('license');
  }

  if (!skill.portability?.compatibility) {
    optional.push('compatibility');
  }

  return {
    ready: missing.length === 0,
    missing,
    optional
  };
}

/**
 * Auto-populate portability defaults from existing skill data.
 * Generates slug from name and compatibility from tools.
 */
export function populatePortabilityDefaults(skill: Skill): Skill {
  if (skill.portability?.slug) {
    // Already has portability data, don't overwrite
    return skill;
  }

  const generatedSlug = generateSlug(skill.name);
  const compatibility = skill.tools?.length
    ? `Requires: ${skill.tools.map(t => t.name).join(', ')}`
    : undefined;

  return {
    ...skill,
    portability: {
      slug: generatedSlug,
      compatibility,
      ...skill.portability
    }
  };
}

/**
 * Infer script language from filename extension.
 */
export function inferScriptLanguage(filename: string): ScriptLanguage {
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.sh') || filename.endsWith('.bash')) return 'bash';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  return 'javascript';
}

/**
 * Convert a slug back to a human-readable title case name.
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
