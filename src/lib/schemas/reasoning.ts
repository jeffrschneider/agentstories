import { z } from 'zod';

// Reasoning strategy enum
export const ReasoningStrategyEnum = z.enum([
  'rule_based',   // Deterministic rules and logic
  'llm_guided',   // LLM-driven decision making
  'hybrid'        // Combination of rules and LLM
]);

export type ReasoningStrategy = z.infer<typeof ReasoningStrategyEnum>;

// Decision point schema
export const DecisionPointSchema = z.object({
  name: z.string().min(1),
  inputs: z.string().min(1).describe('What information informs this decision'),
  approach: z.string().min(1).describe('How the decision is made'),
  fallback: z.string().optional().describe('What happens if decision fails')
});

export type DecisionPoint = z.infer<typeof DecisionPointSchema>;

// Iteration configuration
export const IterationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).optional(),
  retryConditions: z.string().optional().describe('When to retry')
});

export type IterationConfig = z.infer<typeof IterationConfigSchema>;

// Complete reasoning schema
export const ReasoningSchema = z.object({
  strategy: ReasoningStrategyEnum,
  decisionPoints: z.array(DecisionPointSchema).optional(),
  iteration: IterationConfigSchema.optional()
});

export type Reasoning = z.infer<typeof ReasoningSchema>;

// Reasoning strategy metadata for UI
export const REASONING_STRATEGY_METADATA = {
  rule_based: {
    label: 'Rule-Based',
    description: 'Deterministic rules and logic'
  },
  llm_guided: {
    label: 'LLM-Guided',
    description: 'LLM-driven decision making'
  },
  hybrid: {
    label: 'Hybrid',
    description: 'Combination of rules and LLM'
  }
} as const;
