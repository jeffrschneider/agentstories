import { z } from 'zod';
import { AgentStorySchema, AgentStoryFull, AgentStoryLightSchema, AgentStoryFullSchema, isFullFormat } from './story';
import { SkillSchema, Skill, getSkillCompleteness } from './skill';

export type ValidationResult = {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
};

export function validateStory(data: unknown): ValidationResult {
  const result = AgentStorySchema.safeParse(data);

  if (result.success) {
    const warnings = checkConsistency(result.data);
    return { valid: true, errors: [], warnings };
  }

  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    })),
    warnings: []
  };
}

export function validateSkill(data: unknown): ValidationResult {
  const result = SkillSchema.safeParse(data);

  if (result.success) {
    const warnings = checkSkillConsistency(result.data);
    return { valid: true, errors: [], warnings };
  }

  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    })),
    warnings: []
  };
}

function checkConsistency(story: z.infer<typeof AgentStorySchema>): ValidationResult['warnings'] {
  const warnings: ValidationResult['warnings'] = [];

  if (!isFullFormat(story)) return warnings;

  const full = story as AgentStoryFull;

  // Check autonomy vs human interaction mode consistency
  if (story.autonomyLevel === 'full' && full.humanInteraction?.mode === 'in_the_loop') {
    warnings.push({
      path: 'humanInteraction.mode',
      message: 'Full autonomy with in-the-loop collaboration may be contradictory'
    });
  }

  if (story.autonomyLevel === 'directed' && full.humanInteraction?.mode === 'out_of_loop') {
    warnings.push({
      path: 'humanInteraction.mode',
      message: 'Directed autonomy with out-of-loop collaboration may be contradictory'
    });
  }

  // Validate each skill
  for (let i = 0; i < full.skills.length; i++) {
    const skill = full.skills[i];
    const skillWarnings = checkSkillConsistency(skill);
    for (const w of skillWarnings) {
      warnings.push({
        path: `skills[${i}].${w.path}`,
        message: w.message
      });
    }
  }

  // Check for duplicate skill names
  const skillNames = full.skills.map(s => s.name);
  const duplicates = skillNames.filter((name, i) => skillNames.indexOf(name) !== i);
  if (duplicates.length > 0) {
    warnings.push({
      path: 'skills',
      message: `Duplicate skill names: ${[...new Set(duplicates)].join(', ')}`
    });
  }

  // Check agent guardrails don't duplicate skill guardrails
  if (full.guardrails) {
    const agentConstraints = new Set(full.guardrails.map(g => g.name.toLowerCase()));
    for (const skill of full.skills) {
      if (skill.guardrails) {
        for (const sg of skill.guardrails) {
          if (agentConstraints.has(sg.name.toLowerCase())) {
            warnings.push({
              path: `skills.${skill.name}.guardrails`,
              message: `Skill guardrail "${sg.name}" duplicates agent-level guardrail`
            });
          }
        }
      }
    }
  }

  return warnings;
}

function checkSkillConsistency(skill: Skill): ValidationResult['warnings'] {
  const warnings: ValidationResult['warnings'] = [];

  // Check skill completeness
  const completeness = getSkillCompleteness(skill);
  if (!completeness.complete) {
    for (const missing of completeness.missing) {
      warnings.push({
        path: missing,
        message: `Missing required field: ${missing}`
      });
    }
  }

  // Check for skills with no tools but complex behavior
  if (!skill.tools?.length && skill.behavior?.model === 'adaptive') {
    warnings.push({
      path: 'behavior',
      message: 'Adaptive behavior without tools may indicate missing configuration'
    });
  }

  // Check for workflow behavior with single stage
  if (skill.behavior?.model === 'workflow') {
    const workflowBehavior = skill.behavior as { model: 'workflow'; stages: unknown[] };
    if (workflowBehavior.stages.length < 2) {
      warnings.push({
        path: 'behavior.stages',
        message: 'Workflow behavior typically has multiple stages'
      });
    }
  }

  // Check for iterative behavior without max iterations
  if (skill.behavior?.model === 'iterative') {
    const iterativeBehavior = skill.behavior as { model: 'iterative'; maxIterations?: number };
    if (!iterativeBehavior.maxIterations) {
      warnings.push({
        path: 'behavior.maxIterations',
        message: 'Consider setting maxIterations to prevent infinite loops'
      });
    }
  }

  // Check reasoning confidence threshold
  if (skill.reasoning?.confidence?.threshold && !skill.reasoning.confidence.fallbackAction) {
    warnings.push({
      path: 'reasoning.confidence',
      message: 'Confidence threshold set without fallback action'
    });
  }

  // Check failure handling has at least one mode
  if (skill.failureHandling && !skill.failureHandling.modes?.length && !skill.failureHandling.defaultFallback) {
    warnings.push({
      path: 'failureHandling',
      message: 'Failure handling configured without specific modes or default fallback'
    });
  }

  // Check for schedule triggers with no timeout
  const hasScheduleTrigger = skill.triggers.some(t => t.type === 'schedule');
  if (hasScheduleTrigger && !skill.acceptance.timeout) {
    warnings.push({
      path: 'acceptance.timeout',
      message: 'Scheduled skill should have a timeout defined'
    });
  }

  return warnings;
}

// Partial validation for drafts
export function validatePartialStory(data: unknown): ValidationResult {
  // Create partial schemas for both formats
  const PartialLightSchema = AgentStoryLightSchema.partial().extend({
    format: z.literal('light').optional()
  });
  const PartialFullSchema = AgentStoryFullSchema.partial().extend({
    format: z.literal('full').optional()
  });

  // Try to validate as either format
  const lightResult = PartialLightSchema.safeParse(data);
  if (lightResult.success) {
    return { valid: true, errors: [], warnings: [] };
  }

  const fullResult = PartialFullSchema.safeParse(data);
  if (fullResult.success) {
    return { valid: true, errors: [], warnings: [] };
  }

  // Return errors from the full schema (more comprehensive)
  return {
    valid: false,
    errors: fullResult.error.issues.map((issue: z.ZodIssue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    })),
    warnings: []
  };
}
