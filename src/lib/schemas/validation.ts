import { z } from 'zod';
import { AgentStorySchema, AgentStoryFull, isFullFormat } from './story';

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

  // Check that skills reference valid tools
  if (full.tools && full.skills) {
    const toolNames = new Set(full.tools.map(t => t.name));
    for (const skill of full.skills) {
      if (skill.toolsUsed) {
        for (const toolRef of skill.toolsUsed) {
          if (!toolNames.has(toolRef)) {
            warnings.push({
              path: `skills.${skill.name}.toolsUsed`,
              message: `Skill references unknown tool: ${toolRef}`
            });
          }
        }
      }
    }
  }

  // Check behavior model has sufficient stages for workflow type
  if (full.behavior?.type === 'workflow' && full.behavior.stages.length < 2) {
    warnings.push({
      path: 'behavior.stages',
      message: 'Workflow agents typically have multiple stages'
    });
  }

  // Check schedule trigger with directed autonomy
  if (full.trigger.specification?.type === 'schedule' && story.autonomyLevel === 'directed') {
    warnings.push({
      path: 'trigger',
      message: 'Scheduled triggers with directed autonomy require human availability'
    });
  }

  // Check that acceptance criteria has at least one functional requirement
  if (!full.acceptance.functional || full.acceptance.functional.length === 0) {
    warnings.push({
      path: 'acceptance.functional',
      message: 'At least one functional acceptance criterion is recommended'
    });
  }

  // Check that skills array is not empty for full format
  if (!full.skills || full.skills.length === 0) {
    warnings.push({
      path: 'skills',
      message: 'At least one skill is recommended for full format stories'
    });
  }

  return warnings;
}

// Partial validation for drafts
export function validatePartialStory(data: unknown): ValidationResult {
  // Use partial schema for drafts
  const PartialStorySchema = AgentStorySchema.partial();
  const result = PartialStorySchema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: [], warnings: [] };
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
