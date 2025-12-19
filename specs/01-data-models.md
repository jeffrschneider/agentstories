# Data Models Specification

## Overview

This specification defines all core data models for Agent Story Builder using Zod schemas. These schemas provide runtime validation and TypeScript type inference.

## File Location

All schemas live in `/lib/schemas/` with the following structure:

```
/lib/schemas
  /story.ts           # Core story schemas
  /trigger.ts         # Trigger type schemas
  /behavior.ts        # Behavior model schemas
  /skill.ts           # Skills and reasoning schemas
  /collaboration.ts   # Human and agent collaboration schemas
  /memory.ts          # Memory architecture schemas
  /template.ts        # Template schemas
  /user.ts            # User and organization schemas
  /index.ts           # Re-exports all schemas
```

---

## Core Enums and Constants

### Trigger Types

```typescript
// /lib/schemas/trigger.ts

import { z } from 'zod';

export const TriggerTypeEnum = z.enum([
  'message',
  'resource_change',
  'schedule',
  'cascade',
  'manual'
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;
```

### Autonomy Levels

```typescript
// /lib/schemas/story.ts

export const AutonomyLevelEnum = z.enum([
  'full',
  'supervised',
  'collaborative',
  'directed'
]);

export type AutonomyLevel = z.infer<typeof AutonomyLevelEnum>;

export const AUTONOMY_LEVEL_METADATA = {
  full: {
    label: 'Full Autonomy',
    humanInvolvement: 'Minimal oversight',
    agentAuthority: 'Complete decision authority',
    description: 'Agent operates independently with full decision-making power'
  },
  supervised: {
    label: 'Supervised',
    humanInvolvement: 'Exception-based review',
    agentAuthority: 'Operates independently, escalates edge cases',
    description: 'Agent handles routine tasks, humans review exceptions'
  },
  collaborative: {
    label: 'Collaborative',
    humanInvolvement: 'Active partnership',
    agentAuthority: 'Shared decision-making',
    description: 'Human and agent work together on decisions'
  },
  directed: {
    label: 'Directed',
    humanInvolvement: 'Step-by-step approval',
    agentAuthority: 'Executes specific instructions',
    description: 'Agent requires human approval for each action'
  }
} as const;
```

### Behavior Models

```typescript
// /lib/schemas/behavior.ts

export const BehaviorModelEnum = z.enum([
  'workflow',
  'adaptive',
  'hybrid'
]);

export type BehaviorModel = z.infer<typeof BehaviorModelEnum>;
```

### Story Format

```typescript
// /lib/schemas/story.ts

export const StoryFormatEnum = z.enum([
  'light',
  'full'
]);

export type StoryFormat = z.infer<typeof StoryFormatEnum>;
```

---

## Trigger Schemas

```typescript
// /lib/schemas/trigger.ts

// Base trigger with common fields
const BaseTriggerSchema = z.object({
  type: TriggerTypeEnum,
  description: z.string().optional()
});

// Message trigger (A2A communication)
export const MessageTriggerSchema = BaseTriggerSchema.extend({
  type: z.literal('message'),
  sourceAgents: z.array(z.string()).min(1),
  messageFormat: z.string().optional(),
  protocol: z.enum(['a2a', 'webhook', 'queue']).default('a2a')
});

// Resource change trigger
export const ResourceChangeTriggerSchema = BaseTriggerSchema.extend({
  type: z.literal('resource_change'),
  resourceType: z.string(),
  resourceIdentifier: z.string(),
  changeTypes: z.array(z.enum(['create', 'update', 'delete'])).min(1)
});

// Schedule trigger (cron-based)
export const ScheduleTriggerSchema = BaseTriggerSchema.extend({
  type: z.literal('schedule'),
  cronExpression: z.string().regex(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    { message: 'Invalid cron expression' }
  ),
  timezone: z.string().default('UTC')
});

// Cascade trigger (from upstream agents)
export const CascadeTriggerSchema = BaseTriggerSchema.extend({
  type: z.literal('cascade'),
  upstreamAgentId: z.string(),
  eventType: z.string(),
  conditions: z.record(z.unknown()).optional()
});

// Manual trigger
export const ManualTriggerSchema = BaseTriggerSchema.extend({
  type: z.literal('manual'),
  requiredRole: z.string().optional(),
  confirmationRequired: z.boolean().default(false)
});

// Union of all trigger types
export const TriggerSchema = z.discriminatedUnion('type', [
  MessageTriggerSchema,
  ResourceChangeTriggerSchema,
  ScheduleTriggerSchema,
  CascadeTriggerSchema,
  ManualTriggerSchema
]);

export type Trigger = z.infer<typeof TriggerSchema>;
```

---

## Behavior Model Schemas

```typescript
// /lib/schemas/behavior.ts

// Workflow stage definition
export const WorkflowStageSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  entryConditions: z.array(z.string()).optional(),
  exitConditions: z.array(z.string()).optional(),
  transitions: z.array(z.object({
    targetStageId: z.string(),
    condition: z.string(),
    priority: z.number().int().min(0).default(0)
  })).optional()
});

export const WorkflowBehaviorSchema = z.object({
  type: z.literal('workflow'),
  stages: z.array(WorkflowStageSchema).min(1),
  initialStageId: z.string(),
  terminalStageIds: z.array(z.string()).min(1)
});

// Adaptive behavior
export const AdaptiveBehaviorSchema = z.object({
  type: z.literal('adaptive'),
  learningBoundaries: z.object({
    maxDriftFromBaseline: z.number().min(0).max(1).optional(),
    requiresRetrainingThreshold: z.number().min(0).max(1).optional(),
    forbiddenActions: z.array(z.string()).optional()
  }).optional(),
  decisionDocumentation: z.object({
    logLevel: z.enum(['none', 'summary', 'detailed', 'full']).default('summary'),
    retentionDays: z.number().int().min(1).default(30)
  }).optional()
});

// Hybrid behavior
export const HybridBehaviorSchema = z.object({
  type: z.literal('hybrid'),
  structuredComponents: z.array(z.object({
    stageId: z.string(),
    behavior: WorkflowStageSchema
  })),
  adaptiveComponents: z.array(z.object({
    stageId: z.string(),
    decisionPoint: z.string(),
    constraints: z.array(z.string()).optional()
  }))
});

export const BehaviorConfigSchema = z.discriminatedUnion('type', [
  WorkflowBehaviorSchema,
  AdaptiveBehaviorSchema,
  HybridBehaviorSchema
]);

export type BehaviorConfig = z.infer<typeof BehaviorConfigSchema>;
```

---

## Skills Schema

```typescript
// /lib/schemas/skill.ts

export const ProficiencyLevelEnum = z.enum([
  'novice',
  'competent',
  'proficient',
  'expert',
  'master'
]);

export const AcquisitionTypeEnum = z.enum([
  'built_in',      // Pre-configured capability
  'learned',       // Acquired through experience
  'delegated'      // Handled by sub-agent or external service
]);

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  proficiencyLevel: ProficiencyLevelEnum,
  qualityThreshold: z.object({
    metric: z.string(),
    minimumValue: z.number(),
    unit: z.string().optional()
  }).optional(),
  acquisitionType: AcquisitionTypeEnum,
  delegationTarget: z.string().optional(), // Required if acquisitionType is 'delegated'
  subSkills: z.array(z.string()).optional(), // References to other skill IDs
  mcpTools: z.array(z.string()).optional() // MCP tool identifiers
});

export const SkillsInventorySchema = z.object({
  skills: z.array(SkillSchema),
  primarySkillIds: z.array(z.string()), // Main competencies
  supportingSkillIds: z.array(z.string()).optional() // Secondary competencies
});

export type Skill = z.infer<typeof SkillSchema>;
export type SkillsInventory = z.infer<typeof SkillsInventorySchema>;
```

---

## Human Collaboration Schema

```typescript
// /lib/schemas/collaboration.ts

export const HumanCollaborationPatternEnum = z.enum([
  'in_the_loop',
  'on_the_loop',
  'out_of_loop'
]);

export const EscalationTriggerSchema = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  notificationChannels: z.array(z.string()).optional()
});

export const ApprovalWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  requiredApprovers: z.number().int().min(1).default(1),
  approverRoles: z.array(z.string()),
  timeoutMinutes: z.number().int().min(1).optional(),
  timeoutAction: z.enum(['escalate', 'deny', 'auto_approve']).optional()
});

export const HumanCollaborationSchema = z.object({
  pattern: HumanCollaborationPatternEnum,
  escalationTriggers: z.array(EscalationTriggerSchema).optional(),
  approvalWorkflows: z.array(ApprovalWorkflowSchema).optional(),
  interventionPoints: z.array(z.object({
    stageId: z.string().optional(),
    condition: z.string(),
    interventionType: z.enum(['review', 'approve', 'modify', 'override'])
  })).optional(),
  feedbackMechanisms: z.array(z.object({
    type: z.enum(['rating', 'correction', 'reinforcement', 'annotation']),
    frequency: z.enum(['per_task', 'periodic', 'on_demand'])
  })).optional()
});

export type HumanCollaboration = z.infer<typeof HumanCollaborationSchema>;
```

---

## Agent Collaboration Schema

```typescript
// /lib/schemas/collaboration.ts

export const AgentCollaborationRoleEnum = z.enum([
  'supervisor',
  'worker',
  'peer'
]);

export const CommunicationPatternSchema = z.object({
  targetAgentId: z.string(),
  messageTypes: z.array(z.string()),
  protocol: z.enum(['sync', 'async', 'broadcast']),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).default(3),
    backoffMs: z.number().int().min(0).default(1000)
  }).optional()
});

export const SharedResourceSchema = z.object({
  resourceId: z.string(),
  resourceType: z.string(),
  accessLevel: z.enum(['read', 'write', 'admin']),
  lockingStrategy: z.enum(['optimistic', 'pessimistic', 'none']).optional()
});

export const AgentCollaborationSchema = z.object({
  role: AgentCollaborationRoleEnum,
  managedAgentIds: z.array(z.string()).optional(), // For supervisors
  supervisorAgentId: z.string().optional(), // For workers
  peerAgentIds: z.array(z.string()).optional(), // For peers
  communicationPatterns: z.array(CommunicationPatternSchema).optional(),
  sharedResources: z.array(SharedResourceSchema).optional(),
  coordinationProtocol: z.string().optional()
});

export type AgentCollaboration = z.infer<typeof AgentCollaborationSchema>;
```

---

## Memory Schema

```typescript
// /lib/schemas/memory.ts

export const MemoryTypeEnum = z.enum([
  'working',
  'episodic',
  'semantic',
  'procedural'
]);

export const StorageTypeEnum = z.enum([
  'in_memory',
  'redis',
  'postgresql',
  'vector_db',
  'document_db'
]);

export const DataSensitivityEnum = z.enum([
  'public',
  'internal',
  'confidential',
  'restricted'
]);

export const MemoryComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  memoryType: MemoryTypeEnum,
  storageType: StorageTypeEnum,
  storageConfig: z.record(z.unknown()).optional(),
  retentionPolicy: z.object({
    maxAgeDays: z.number().int().min(1).optional(),
    maxEntries: z.number().int().min(1).optional(),
    cleanupStrategy: z.enum(['fifo', 'lru', 'importance_based']).optional()
  }).optional(),
  accessPattern: z.enum(['read_heavy', 'write_heavy', 'balanced']).default('balanced'),
  dataSensitivity: DataSensitivityEnum.default('internal')
});

export const LearningSignalSchema = z.object({
  id: z.string(),
  name: z.string(),
  signalType: z.enum(['feedback', 'reinforcement', 'correction', 'demonstration']),
  source: z.enum(['human', 'system', 'agent', 'environment']),
  frequency: z.enum(['continuous', 'batch', 'on_demand']),
  processingPipeline: z.string().optional()
});

export const MemoryArchitectureSchema = z.object({
  workingMemory: MemoryComponentSchema.optional(),
  persistentStores: z.array(MemoryComponentSchema).optional(),
  learningSignals: z.array(LearningSignalSchema).optional(),
  contextWindowSize: z.number().int().min(1).optional()
});

export type MemoryArchitecture = z.infer<typeof MemoryArchitectureSchema>;
```

---

## Agent Story Schemas

### Agent Story Light

```typescript
// /lib/schemas/story.ts

export const AgentStoryLightSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  format: z.literal('light'),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),

  // Core story elements
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    }),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200), // "As a [role]"
  trigger: TriggerSchema,
  action: z.string().min(1).max(500), // "I [action/goal]"
  outcome: z.string().min(1).max(500), // "so that [outcome]"
  autonomyLevel: AutonomyLevelEnum,

  // Optional light metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type AgentStoryLight = z.infer<typeof AgentStoryLightSchema>;
```

### Agent Story Full

```typescript
// /lib/schemas/story.ts

export const AgentStoryFullSchema = AgentStoryLightSchema.extend({
  format: z.literal('full'),

  // Extended specifications
  behaviorConfig: BehaviorConfigSchema.optional(),
  skillsInventory: SkillsInventorySchema.optional(),
  humanCollaboration: HumanCollaborationSchema.optional(),
  agentCollaboration: AgentCollaborationSchema.optional(),
  memoryArchitecture: MemoryArchitectureSchema.optional(),

  // Quality and constraints
  qualityRequirements: z.object({
    responseTimeMs: z.number().int().min(0).optional(),
    accuracyThreshold: z.number().min(0).max(1).optional(),
    availabilityTarget: z.number().min(0).max(1).optional(),
    errorBudget: z.number().min(0).max(1).optional()
  }).optional(),

  constraints: z.object({
    maxConcurrentTasks: z.number().int().min(1).optional(),
    resourceLimits: z.record(z.number()).optional(),
    geographicRestrictions: z.array(z.string()).optional(),
    complianceFrameworks: z.array(z.string()).optional()
  }).optional(),

  // Documentation
  assumptions: z.array(z.string()).optional(),
  dependencies: z.array(z.object({
    type: z.enum(['agent', 'service', 'resource', 'data']),
    identifier: z.string(),
    description: z.string().optional(),
    criticality: z.enum(['required', 'optional', 'fallback'])
  })).optional(),
  acceptanceCriteria: z.array(z.object({
    id: z.string(),
    description: z.string(),
    testable: z.boolean().default(true)
  })).optional()
});

export type AgentStoryFull = z.infer<typeof AgentStoryFullSchema>;
```

### Union Schema

```typescript
// /lib/schemas/story.ts

export const AgentStorySchema = z.discriminatedUnion('format', [
  AgentStoryLightSchema,
  AgentStoryFullSchema
]);

export type AgentStory = z.infer<typeof AgentStorySchema>;

// Helper type guard
export function isFullFormat(story: AgentStory): story is AgentStoryFull {
  return story.format === 'full';
}

// Upgrade function type
export function upgradeToFull(light: AgentStoryLight): AgentStoryFull {
  return {
    ...light,
    format: 'full',
    updatedAt: new Date().toISOString()
  };
}
```

---

## Template Schema

```typescript
// /lib/schemas/template.ts

export const TemplateCategoryEnum = z.enum([
  'background_processing',
  'monitoring_alerting',
  'data_pipeline',
  'scheduled_tasks',
  'event_driven',
  'multi_agent',
  'customer_service',
  'content_generation',
  'analysis_reporting',
  'custom'
]);

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategoryEnum,
  tags: z.array(z.string()),

  // Template content - a partial story
  storyTemplate: AgentStorySchema.partial().required({
    format: true
  }),

  // Template metadata
  isBuiltIn: z.boolean().default(false),
  organizationId: z.string().uuid().optional(), // null for built-in
  createdBy: z.string().optional(),
  createdAt: z.string().datetime(),
  usageCount: z.number().int().min(0).default(0),

  // Guidance
  whenToUse: z.string().optional(),
  exampleScenarios: z.array(z.string()).optional()
});

export type Template = z.infer<typeof TemplateSchema>;
```

---

## User and Organization Schemas

```typescript
// /lib/schemas/user.ts

export const UserRoleEnum = z.enum([
  'owner',
  'admin',
  'editor',
  'viewer'
]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional()
});

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'team', 'enterprise']),
  createdAt: z.string().datetime(),
  settings: z.object({
    defaultAutonomyLevel: AutonomyLevelEnum.optional(),
    requireApprovalForFull: z.boolean().default(false),
    allowedExportFormats: z.array(z.enum(['markdown', 'json', 'pdf'])).optional()
  }).optional()
});

export const OrganizationMemberSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: UserRoleEnum,
  joinedAt: z.string().datetime()
});

export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
```

---

## Validation Utilities

```typescript
// /lib/schemas/validation.ts

import { z } from 'zod';
import { AgentStorySchema } from './story';

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

  // Check for inconsistencies
  if (story.autonomyLevel === 'full' && story.format === 'full') {
    const full = story as AgentStoryFull;
    if (full.humanCollaboration?.pattern === 'in_the_loop') {
      warnings.push({
        path: 'humanCollaboration.pattern',
        message: 'Full autonomy with in-the-loop collaboration may be contradictory'
      });
    }
  }

  if (story.autonomyLevel === 'directed' && story.format === 'full') {
    const full = story as AgentStoryFull;
    if (full.humanCollaboration?.pattern === 'out_of_loop') {
      warnings.push({
        path: 'humanCollaboration.pattern',
        message: 'Directed autonomy with out-of-loop collaboration may be contradictory'
      });
    }
  }

  return warnings;
}
```

---

## Database Schema (PostgreSQL)

For reference, here's the corresponding database schema:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- Agent stories (metadata only - content in document store)
CREATE TABLE agent_stories (
  id UUID PRIMARY KEY,
  identifier VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  format VARCHAR(10) NOT NULL,
  autonomy_level VARCHAR(20) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  UNIQUE(organization_id, identifier)
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[],
  story_template JSONB NOT NULL,
  is_built_in BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_stories_org ON agent_stories(organization_id);
CREATE INDEX idx_stories_created_by ON agent_stories(created_by);
CREATE INDEX idx_stories_tags ON agent_stories USING GIN(tags);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_org ON templates(organization_id);
```
