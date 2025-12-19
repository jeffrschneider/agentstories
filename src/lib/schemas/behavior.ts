import { z } from 'zod';

// Planning strategy enum
export const PlanningStrategyEnum = z.enum([
  'none',       // No planning - direct execution
  'local',      // Agent plans its own work
  'delegated',  // Planning delegated to another agent
  'emergent'    // Planning emerges from agent collaboration
]);

export type PlanningStrategy = z.infer<typeof PlanningStrategyEnum>;

// Behavior model type enum
export const BehaviorModelEnum = z.enum([
  'workflow',
  'adaptive',
  'hybrid'
]);

export type BehaviorModel = z.infer<typeof BehaviorModelEnum>;

// Stage transition definition
export const StageTransitionSchema = z.object({
  to: z.string().min(1).describe('Name of the next stage'),
  when: z.string().min(1).describe('Condition for this transition')
});

export type StageTransition = z.infer<typeof StageTransitionSchema>;

// Workflow stage definition
export const WorkflowStageSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1).describe('What this stage accomplishes'),
  transitions: z.array(StageTransitionSchema).optional()
});

export type WorkflowStage = z.infer<typeof WorkflowStageSchema>;

// Workflow behavior - predictable stage-based execution
export const WorkflowBehaviorSchema = z.object({
  type: z.literal('workflow'),
  stages: z.array(WorkflowStageSchema).min(1),
  planning: PlanningStrategyEnum.default('none')
});

export type WorkflowBehavior = z.infer<typeof WorkflowBehaviorSchema>;

// Adaptive behavior - runtime decisions based on context
export const AdaptiveBehaviorSchema = z.object({
  type: z.literal('adaptive'),
  capabilities: z.array(z.string()).min(1).describe('High-level capabilities the agent can invoke'),
  planning: PlanningStrategyEnum.default('local')
});

export type AdaptiveBehavior = z.infer<typeof AdaptiveBehaviorSchema>;

// Hybrid behavior - structured workflows with adaptive decision points
export const HybridBehaviorSchema = z.object({
  type: z.literal('hybrid'),
  stages: z.array(WorkflowStageSchema).optional(),
  capabilities: z.array(z.string()).optional(),
  planning: PlanningStrategyEnum.default('local')
});

export type HybridBehavior = z.infer<typeof HybridBehaviorSchema>;

// Union of all behavior types
export const BehaviorConfigSchema = z.discriminatedUnion('type', [
  WorkflowBehaviorSchema,
  AdaptiveBehaviorSchema,
  HybridBehaviorSchema
]);

export type BehaviorConfig = z.infer<typeof BehaviorConfigSchema>;

// Behavior model metadata for UI
export const BEHAVIOR_MODEL_METADATA = {
  workflow: {
    label: 'Workflow',
    description: 'Predictable stage-based execution with defined transitions'
  },
  adaptive: {
    label: 'Adaptive',
    description: 'Runtime decisions based on context and capabilities'
  },
  hybrid: {
    label: 'Hybrid',
    description: 'Structured workflows with adaptive decision points'
  }
} as const;

export const PLANNING_STRATEGY_METADATA = {
  none: {
    label: 'None',
    description: 'No planning - direct execution'
  },
  local: {
    label: 'Local',
    description: 'Agent plans its own work'
  },
  delegated: {
    label: 'Delegated',
    description: 'Planning delegated to another agent'
  },
  emergent: {
    label: 'Emergent',
    description: 'Planning emerges from agent collaboration'
  }
} as const;
