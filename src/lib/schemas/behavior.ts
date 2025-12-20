import { z } from 'zod';

// Behavior model types - now at skill level
export const BehaviorModelEnum = z.enum([
  'sequential',   // Linear step-by-step execution
  'workflow',     // Multi-stage with conditional transitions
  'adaptive',     // Dynamic based on context
  'iterative'     // Loop until condition met
]);

export type BehaviorModel = z.infer<typeof BehaviorModelEnum>;

// Stage transition within a skill
export const StageTransitionSchema = z.object({
  to: z.string().min(1).describe('Target stage name'),
  when: z.string().min(1).describe('Transition condition')
});

export type StageTransition = z.infer<typeof StageTransitionSchema>;

// Execution stage
export const ExecutionStageSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1).describe('What this stage accomplishes'),
  actions: z.array(z.string()).optional().describe('Actions performed in this stage'),
  transitions: z.array(StageTransitionSchema).optional()
});

export type ExecutionStage = z.infer<typeof ExecutionStageSchema>;

// Sequential behavior - simple step-by-step
export const SequentialBehaviorSchema = z.object({
  model: z.literal('sequential'),
  steps: z.array(z.string()).min(1).describe('Ordered list of steps')
});

export type SequentialBehavior = z.infer<typeof SequentialBehaviorSchema>;

// Workflow behavior (multi-stage with transitions)
export const WorkflowBehaviorSchema = z.object({
  model: z.literal('workflow'),
  stages: z.array(ExecutionStageSchema).min(1),
  entryStage: z.string().optional().describe('Starting stage (defaults to first)')
});

export type WorkflowBehavior = z.infer<typeof WorkflowBehaviorSchema>;

// Adaptive behavior
export const AdaptiveBehaviorSchema = z.object({
  model: z.literal('adaptive'),
  capabilities: z.array(z.string()).min(1).describe('Available actions to choose from'),
  selectionStrategy: z.string().optional().describe('How to select next action')
});

export type AdaptiveBehavior = z.infer<typeof AdaptiveBehaviorSchema>;

// Iterative behavior
export const IterativeBehaviorSchema = z.object({
  model: z.literal('iterative'),
  body: z.array(z.string()).min(1).describe('Actions per iteration'),
  terminationCondition: z.string().min(1),
  maxIterations: z.number().int().positive().optional()
});

export type IterativeBehavior = z.infer<typeof IterativeBehaviorSchema>;

// Union of all skill behavior types
export const SkillBehaviorSchema = z.discriminatedUnion('model', [
  SequentialBehaviorSchema,
  WorkflowBehaviorSchema,
  AdaptiveBehaviorSchema,
  IterativeBehaviorSchema
]);

export type SkillBehavior = z.infer<typeof SkillBehaviorSchema>;

// Behavior model metadata for UI
export const BEHAVIOR_MODEL_METADATA = {
  sequential: {
    label: 'Sequential',
    description: 'Linear step-by-step execution',
    icon: 'List'
  },
  workflow: {
    label: 'Workflow',
    description: 'Multi-stage with conditional transitions',
    icon: 'GitBranch'
  },
  adaptive: {
    label: 'Adaptive',
    description: 'Dynamic based on context',
    icon: 'Sparkles'
  },
  iterative: {
    label: 'Iterative',
    description: 'Loop until termination condition met',
    icon: 'Repeat'
  }
} as const;
