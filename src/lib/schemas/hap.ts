// HAP (Human-Agent Pair) Schema - Barrel Export
// This file re-exports all HAP-related schemas, types, and utilities

// Schemas and Types
export {
  ResponsibilityPhaseEnum,
  PhaseOwnerEnum,
  PhaseAssignmentSchema,
  TaskIntegrationStatusEnum,
  TaskResponsibilitySchema,
  CapabilityRequirementStatusEnum,
  CapabilityRequirementSchema,
  HAPIntegrationStatusEnum,
  HAPMetricsSchema,
  HumanAgentPairSchema,
  type ResponsibilityPhase,
  type PhaseOwner,
  type PhaseAssignment,
  type TaskIntegrationStatus,
  type TaskResponsibility,
  type CapabilityRequirementStatus,
  type CapabilityRequirement,
  type HAPIntegrationStatus,
  type HAPMetrics,
  type HumanAgentPair,
} from './hap-schemas';

// Presets and Metadata
export {
  RESPONSIBILITY_PRESETS,
  RESPONSIBILITY_PHASE_METADATA,
  PHASE_OWNER_METADATA,
  INTEGRATION_STATUS_METADATA,
  CAPABILITY_REQUIREMENT_STATUS_METADATA,
  type ResponsibilityPreset,
} from './hap-presets';

// Helper Functions
export {
  createPhaseAssignment,
  createEmptyTaskResponsibility,
  createTaskFromPreset,
  applyPresetToTask,
  createEmptyHAP,
  createCapabilityRequirement,
  migrateOldTaskOwner,
} from './hap-helpers';

// Metric Calculation Functions
export {
  calculateHAPMetrics,
  determineIntegrationStatus,
  determineTaskIntegrationStatus,
  calculatePhaseDistribution,
} from './hap-metrics';

// Validation Functions
export {
  analyzeAgentSkillCoverage,
  validateHAPAgentAssignment,
  type AgentPhaseRequirement,
  type SkillCoverageAnalysis,
  type HAPValidationIssue,
} from './hap-validation';
