import { z } from 'zod';

// Reasoning strategy enum
export const ReasoningStrategyEnum = z.enum([
  'rule_based',    // Deterministic rules
  'llm_guided',    // LLM-driven decisions
  'hybrid'         // Rules + LLM
]);

export type ReasoningStrategy = z.infer<typeof ReasoningStrategyEnum>;

// Decision point within skill execution
export const DecisionPointSchema = z.object({
  name: z.string().min(1),
  inputs: z.array(z.string()).min(1).describe('What informs this decision'),
  approach: z.string().min(1).describe('How decision is made'),
  outcomes: z.array(z.string()).optional().describe('Possible decision outcomes')
});

export type DecisionPoint = z.infer<typeof DecisionPointSchema>;

// Retry/iteration configuration
export const RetryConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).default(3),
  backoffStrategy: z.enum(['none', 'linear', 'exponential']).default('exponential'),
  retryOn: z.array(z.string()).optional().describe('Conditions that trigger retry')
});

export type RetryConfig = z.infer<typeof RetryConfigSchema>;

// Confidence configuration
export const ConfidenceConfigSchema = z.object({
  threshold: z.number().min(0).max(1).optional(),
  fallbackAction: z.string().optional()
});

export type ConfidenceConfig = z.infer<typeof ConfidenceConfigSchema>;

// Complete skill reasoning
export const SkillReasoningSchema = z.object({
  strategy: ReasoningStrategyEnum,
  decisionPoints: z.array(DecisionPointSchema).optional(),
  retry: RetryConfigSchema.optional(),
  confidence: ConfidenceConfigSchema.optional()
});

export type SkillReasoning = z.infer<typeof SkillReasoningSchema>;

// Reasoning strategy metadata for UI
export const REASONING_STRATEGY_METADATA = {
  rule_based: {
    label: 'Rule-Based',
    description: 'Deterministic rules and logic',
    icon: 'GitBranch'
  },
  llm_guided: {
    label: 'LLM-Guided',
    description: 'LLM-driven decision making',
    icon: 'Brain'
  },
  hybrid: {
    label: 'Hybrid',
    description: 'Combination of rules and LLM',
    icon: 'Layers'
  }
} as const;

export const BACKOFF_STRATEGY_METADATA = {
  none: {
    label: 'None',
    description: 'No delay between retries'
  },
  linear: {
    label: 'Linear',
    description: 'Constant delay between retries'
  },
  exponential: {
    label: 'Exponential',
    description: 'Increasing delay between retries'
  }
} as const;
