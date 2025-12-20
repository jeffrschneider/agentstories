import { z } from 'zod';

// Quality metric for skill acceptance
export const QualityMetricSchema = z.object({
  name: z.string().min(1),
  target: z.string().min(1).describe('Target value (e.g., ">= 95%")'),
  measurement: z.string().optional().describe('How to measure this metric')
});

export type QualityMetric = z.infer<typeof QualityMetricSchema>;

// Skill-level acceptance criteria - what "done" looks like
export const SkillAcceptanceCriteriaSchema = z.object({
  successConditions: z.array(z.string()).min(1).describe('What "done" looks like'),
  qualityMetrics: z.array(QualityMetricSchema).optional().describe('Measurable performance targets'),
  timeout: z.string().optional().describe('Max execution time')
});

export type SkillAcceptanceCriteria = z.infer<typeof SkillAcceptanceCriteriaSchema>;
