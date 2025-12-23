import { z } from 'zod';

// ============================================
// Responsibility Phase Model
// ============================================

export const ResponsibilityPhaseEnum = z.enum([
  'manage',   // Sets goals, priorities, constraints
  'define',   // Specifies requirements, acceptance criteria
  'perform',  // Executes the work
  'review'    // Validates, provides feedback
]);

export type ResponsibilityPhase = z.infer<typeof ResponsibilityPhaseEnum>;

export const PhaseOwnerEnum = z.enum([
  'human',  // Human is responsible for this phase
  'agent'   // Agent is responsible for this phase
]);

export type PhaseOwner = z.infer<typeof PhaseOwnerEnum>;

// ============================================
// Phase Assignment Schema
// ============================================

export const PhaseAssignmentSchema = z.object({
  phase: ResponsibilityPhaseEnum,
  owner: PhaseOwnerEnum,
  skillId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).optional()
});

export type PhaseAssignment = z.infer<typeof PhaseAssignmentSchema>;

// ============================================
// Task Responsibility Schema
// ============================================

export const TaskIntegrationStatusEnum = z.enum([
  'not_started',       // No agent phases configured
  'partially_defined', // Some agent phases, missing skills
  'ready',             // All agent phases have linked skills
  'active'             // Currently in use
]);

export type TaskIntegrationStatus = z.infer<typeof TaskIntegrationStatusEnum>;

export const TaskResponsibilitySchema = z.object({
  id: z.string().uuid(),
  taskName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  phases: z.object({
    manage: PhaseAssignmentSchema,
    define: PhaseAssignmentSchema,
    perform: PhaseAssignmentSchema,
    review: PhaseAssignmentSchema
  }),
  integrationStatus: TaskIntegrationStatusEnum.default('not_started'),
  blockers: z.array(z.string()).optional(),
  targetDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
});

export type TaskResponsibility = z.infer<typeof TaskResponsibilitySchema>;

// ============================================
// Capability Requirement Schema
// ============================================

export const CapabilityRequirementStatusEnum = z.enum([
  'pending',     // Waiting to be processed
  'generating',  // LLM is generating capability
  'ready',       // Draft capability ready for review
  'applied',     // Capability added to Agent Story
  'rejected'     // User rejected this requirement
]);

export type CapabilityRequirementStatus = z.infer<typeof CapabilityRequirementStatusEnum>;

export const CapabilityRequirementSchema = z.object({
  id: z.string().uuid(),
  hapId: z.string().uuid(),
  taskId: z.string().uuid(),
  phase: ResponsibilityPhaseEnum,
  taskName: z.string(),
  taskDescription: z.string().optional(),
  roleContext: z.string().optional(),
  suggestedCapabilityName: z.string(),
  suggestedCapabilityDescription: z.string(),
  requiredSkills: z.array(z.string()).optional(),
  status: CapabilityRequirementStatusEnum,
  generatedCapability: z.any().optional(),
  agentStoryId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  appliedAt: z.string().datetime().optional()
});

export type CapabilityRequirement = z.infer<typeof CapabilityRequirementSchema>;

// ============================================
// HAP Integration Status
// ============================================

export const HAPIntegrationStatusEnum = z.enum([
  'not_started',     // No task responsibilities defined
  'planning',        // Defining task responsibilities
  'skills_pending',  // Waiting for agent skills
  'ready',           // All skills defined
  'active',          // In production use
  'paused'           // Temporarily paused
]);

export type HAPIntegrationStatus = z.infer<typeof HAPIntegrationStatusEnum>;

// ============================================
// HAP Metrics Schema
// ============================================

export const HAPMetricsSchema = z.object({
  totalTasks: z.number(),
  totalPhases: z.number(),
  humanPhases: z.number(),
  agentPhases: z.number(),
  agentPhasesWithSkills: z.number(),
  agentPhasesPendingSkills: z.number(),
  pendingCapabilityRequirements: z.number(),
  readyTasks: z.number()
});

export type HAPMetrics = z.infer<typeof HAPMetricsSchema>;

// ============================================
// Human-Agent Pair (HAP) Schema
// ============================================

export const HumanAgentPairSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  roleId: z.string().uuid(),
  agentStoryId: z.string().uuid(),
  tasks: z.array(TaskResponsibilitySchema).default([]),
  capabilityRequirements: z.array(CapabilityRequirementSchema).default([]),
  integrationStatus: HAPIntegrationStatusEnum.default('not_started'),
  metrics: HAPMetricsSchema.optional(),
  notes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type HumanAgentPair = z.infer<typeof HumanAgentPairSchema>;
