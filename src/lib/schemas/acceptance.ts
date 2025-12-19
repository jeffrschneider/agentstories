import { z } from 'zod';

// Acceptance criteria schema
export const AcceptanceCriteriaSchema = z.object({
  functional: z.array(z.string()).min(1).describe('Observable behaviors that indicate success'),
  quality: z.array(z.string()).optional().describe('Non-functional requirements: latency, accuracy, etc.'),
  guardrails: z.array(z.string()).optional().describe('Constraints the agent must never violate')
});

export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;
