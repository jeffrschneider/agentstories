# Data Models Specification

## Overview

This specification defines all core data models for Agent Story Builder using Zod schemas. These schemas provide runtime validation and TypeScript type inference.

The data model follows a clear ownership hierarchy where agents own their configuration, compose skills, and reference shared tools.

## File Location

All schemas live in `/lib/schemas/` with the following structure:

```
/lib/schemas
  /story.ts           # Core story schemas
  /trigger.ts         # Trigger specification schemas
  /behavior.ts        # Behavior model schemas
  /reasoning.ts       # Reasoning and decision schemas
  /skill.ts           # Skills schemas
  /tools.ts           # Tools and integrations schemas
  /collaboration.ts   # Human and agent collaboration schemas
  /memory.ts          # Memory and state schemas
  /acceptance.ts      # Acceptance criteria schemas
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

## Trigger Specification Schemas

The trigger specification captures what activates an agent, with a simplified structure that includes source description, guard conditions, and concrete examples.

```typescript
// /lib/schemas/trigger.ts

// Base trigger specification
export const TriggerSpecificationSchema = z.object({
  type: TriggerTypeEnum,
  source: z.string().min(1).describe('Description of event source'),
  conditions: z.string().optional().describe('Optional guard conditions'),
  examples: z.array(z.string()).optional().describe('Concrete examples of triggering events')
});

export type TriggerSpecification = z.infer<typeof TriggerSpecificationSchema>;

// Type-specific trigger details (for UI configuration)
// These extend the base specification with type-specific fields

// Message trigger (A2A communication)
export const MessageTriggerDetailsSchema = z.object({
  type: z.literal('message'),
  sourceAgents: z.array(z.string()).min(1),
  messageFormat: z.string().optional(),
  protocol: z.enum(['a2a', 'webhook', 'queue']).default('a2a')
});

// Resource change trigger
export const ResourceChangeTriggerDetailsSchema = z.object({
  type: z.literal('resource_change'),
  resourceType: z.string(),
  resourceIdentifier: z.string(),
  changeTypes: z.array(z.enum(['create', 'update', 'delete'])).min(1)
});

// Schedule trigger (cron-based)
export const ScheduleTriggerDetailsSchema = z.object({
  type: z.literal('schedule'),
  cronExpression: z.string().regex(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    { message: 'Invalid cron expression' }
  ),
  timezone: z.string().default('UTC')
});

// Cascade trigger (from upstream agents)
export const CascadeTriggerDetailsSchema = z.object({
  type: z.literal('cascade'),
  upstreamAgentId: z.string(),
  eventType: z.string()
});

// Manual trigger
export const ManualTriggerDetailsSchema = z.object({
  type: z.literal('manual'),
  requiredRole: z.string().optional(),
  confirmationRequired: z.boolean().default(false)
});

// Union of all trigger detail types
export const TriggerDetailsSchema = z.discriminatedUnion('type', [
  MessageTriggerDetailsSchema,
  ResourceChangeTriggerDetailsSchema,
  ScheduleTriggerDetailsSchema,
  CascadeTriggerDetailsSchema,
  ManualTriggerDetailsSchema
]);

export type TriggerDetails = z.infer<typeof TriggerDetailsSchema>;

// Complete trigger with both specification and details
export const TriggerSchema = z.object({
  specification: TriggerSpecificationSchema,
  details: TriggerDetailsSchema.optional()
});

export type Trigger = z.infer<typeof TriggerSchema>;
```

### Trigger Specification Example

```yaml
trigger:
  type: message
  source: Customer support gateway
  conditions: Message contains support-related keywords
  examples:
    - "Customer submits a new support ticket via web form"
    - "Email received at support@company.com"
```

---

## Behavior Model Schemas

The behavior model defines how an agent is structured - whether it follows predictable workflows, adapts dynamically, or combines both approaches.

```typescript
// /lib/schemas/behavior.ts

// Planning strategy enum
export const PlanningStrategyEnum = z.enum([
  'none',       // No planning - direct execution
  'local',      // Agent plans its own work
  'delegated',  // Planning delegated to another agent
  'emergent'    // Planning emerges from agent collaboration
]);

export type PlanningStrategy = z.infer<typeof PlanningStrategyEnum>;

// Stage transition definition
export const StageTransitionSchema = z.object({
  to: z.string().min(1).describe('Name of the next stage'),
  when: z.string().min(1).describe('Condition for this transition')
});

// Workflow stage definition
export const WorkflowStageSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1).describe('What this stage accomplishes'),
  transitions: z.array(StageTransitionSchema).optional()
});

// Workflow behavior - predictable stage-based execution
export const WorkflowBehaviorSchema = z.object({
  type: z.literal('workflow'),
  stages: z.array(WorkflowStageSchema).min(1),
  planning: PlanningStrategyEnum.default('none')
});

// Adaptive behavior - runtime decisions based on context
export const AdaptiveBehaviorSchema = z.object({
  type: z.literal('adaptive'),
  capabilities: z.array(z.string()).min(1).describe('High-level capabilities the agent can invoke'),
  planning: PlanningStrategyEnum.default('local')
});

// Hybrid behavior - structured workflows with adaptive decision points
export const HybridBehaviorSchema = z.object({
  type: z.literal('hybrid'),
  stages: z.array(WorkflowStageSchema).optional(),
  capabilities: z.array(z.string()).optional(),
  planning: PlanningStrategyEnum.default('local')
});

export const BehaviorConfigSchema = z.discriminatedUnion('type', [
  WorkflowBehaviorSchema,
  AdaptiveBehaviorSchema,
  HybridBehaviorSchema
]);

export type BehaviorConfig = z.infer<typeof BehaviorConfigSchema>;
```

### Behavior Model Example

```yaml
behavior:
  type: workflow
  planning: local

  stages:
    - name: Classification
      purpose: Categorize incoming request by type and urgency
      transitions:
        - to: Routing
          when: Classification complete with confidence > 0.8
        - to: Human Review
          when: Classification confidence <= 0.8

    - name: Routing
      purpose: Direct request to appropriate handler
      transitions:
        - to: Complete
          when: Successfully routed

    - name: Human Review
      purpose: Escalate uncertain cases to human operator
      transitions:
        - to: Routing
          when: Human provides classification
```

---

## Reasoning & Decisions Schema

Reasoning defines how an agent makes decisions. This can be specified at the agent level (shared across all skills) or at the skill level (for domain-specific logic).

```typescript
// /lib/schemas/reasoning.ts

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

// Iteration configuration
export const IterationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).optional(),
  retryConditions: z.string().optional().describe('When to retry')
});

// Complete reasoning schema
export const ReasoningSchema = z.object({
  strategy: ReasoningStrategyEnum,
  decisionPoints: z.array(DecisionPointSchema).optional(),
  iteration: IterationConfigSchema.optional()
});

export type Reasoning = z.infer<typeof ReasoningSchema>;
```

### Reasoning Example

```yaml
reasoning:
  strategy: hybrid

  decision_points:
    - name: Urgency Classification
      inputs: Message content, sender history, keywords
      approach: LLM classification with confidence scoring
      fallback: Default to medium urgency, flag for review

    - name: Queue Selection
      inputs: Classification result, queue availability
      approach: Rule-based routing table
      fallback: Route to general queue

  iteration:
    enabled: true
    max_attempts: 3
    retry_conditions: Classification confidence below threshold
```

---

## Tools & Integrations Schema

Tools are resources the agent has access to (MCP servers, APIs, databases). They are declared at the agent level and referenced by skills.

```typescript
// /lib/schemas/tools.ts

// Tool permission levels
export const ToolPermissionEnum = z.enum([
  'read',
  'write',
  'execute',
  'admin'
]);

export type ToolPermission = z.infer<typeof ToolPermissionEnum>;

// Tool schema
export const ToolSchema = z.object({
  name: z.string().min(1).describe('Tool or MCP Server name'),
  purpose: z.string().min(1).describe('Why the agent uses this tool'),
  permissions: z.array(ToolPermissionEnum).min(1),
  conditions: z.string().optional().describe('When tool is available/used')
});

export type Tool = z.infer<typeof ToolSchema>;

// Tools collection
export const ToolsSchema = z.array(ToolSchema).min(1);

export type Tools = z.infer<typeof ToolsSchema>;
```

### Tools Example

```yaml
tools:
  - name: Customer Database MCP
    purpose: Look up customer information and history
    permissions: [read]
    conditions: Only for authenticated requests

  - name: Ticket System API
    purpose: Create and update support tickets
    permissions: [read, write]

  - name: Slack Notifier
    purpose: Send notifications to support channels
    permissions: [execute]
    conditions: For high-priority escalations only
```

---

## Skills Schema

Skills are composable units of competency that bundle domain knowledge, behavioral patterns, tool proficiency, and quality standards. They are owned by agents and can be reused across different agent configurations.

```typescript
// /lib/schemas/skill.ts

// Skill acquisition types
export const SkillAcquisitionEnum = z.enum([
  'built_in',   // Core competency the agent is designed with
  'learned',    // Acquired through training, feedback, or experience
  'delegated'   // Performed by calling another agent or service
]);

export type SkillAcquisition = z.infer<typeof SkillAcquisitionEnum>;

// Skill schema
export const SkillSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1).describe('Knowledge domain this skill operates in'),
  proficiencies: z.array(z.string()).min(1).describe('Specific competencies within the skill'),
  toolsUsed: z.array(z.string()).optional().describe('Tools this skill leverages (references agent-level tools)'),
  qualityBar: z.string().min(1).describe('What competent execution looks like'),
  acquired: SkillAcquisitionEnum,
  reasoning: ReasoningSchema.optional().describe('Skill-specific reasoning (overrides agent-level)')
});

export type Skill = z.infer<typeof SkillSchema>;

// Skills collection (agent must have at least one skill)
export const SkillsSchema = z.array(SkillSchema).min(1);

export type Skills = z.infer<typeof SkillsSchema>;
```

### Skills Example

```yaml
skills:
  - name: Request Classification
    domain: Natural Language Understanding
    proficiencies:
      - Topic categorization
      - Urgency detection
      - Sentiment analysis
    tools_used:
      - Customer Database MCP
    quality_bar: >
      95% accuracy on standard categories,
      90% accuracy on urgency detection,
      Response within 500ms
    acquired: built_in

  - name: Queue Routing
    domain: Workflow Management
    proficiencies:
      - Load balancing
      - Skill-based routing
      - Priority scheduling
    tools_used:
      - Ticket System API
    quality_bar: >
      Route to optimal queue 98% of the time,
      No routing failures during business hours
    acquired: built_in

  - name: Escalation Handling
    domain: Customer Service
    proficiencies:
      - VIP customer detection
      - Compliance issue identification
    tools_used:
      - Customer Database MCP
      - Slack Notifier
    quality_bar: >
      100% of VIP customers identified,
      Zero missed compliance escalations
    acquired: learned
```

---

## Human Collaboration Schema

Human collaboration defines how humans interact with the agent during execution.

```typescript
// /lib/schemas/collaboration.ts

// Human interaction mode
export const HumanInteractionModeEnum = z.enum([
  'in_the_loop',   // Human approval for every decision
  'on_the_loop',   // Human monitors, intervenes on exceptions
  'out_of_loop'    // Fully autonomous within boundaries
]);

export type HumanInteractionMode = z.infer<typeof HumanInteractionModeEnum>;

// Checkpoint types
export const CheckpointTypeEnum = z.enum([
  'approval',    // Requires explicit approval to proceed
  'input',       // Requires human input/data
  'review',      // Human reviews but doesn't block
  'escalation'   // Escalates to human for resolution
]);

export type CheckpointType = z.infer<typeof CheckpointTypeEnum>;

// Checkpoint schema
export const CheckpointSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().min(1).describe('When human involvement is required'),
  type: CheckpointTypeEnum,
  timeout: z.string().optional().describe('What happens if human does not respond')
});

// Escalation configuration
export const EscalationConfigSchema = z.object({
  conditions: z.string().min(1).describe('When to escalate to human'),
  channel: z.string().min(1).describe('How escalation occurs')
});

// Complete human interaction schema
export const HumanInteractionSchema = z.object({
  mode: HumanInteractionModeEnum,
  checkpoints: z.array(CheckpointSchema).optional(),
  escalation: EscalationConfigSchema.optional()
});

export type HumanInteraction = z.infer<typeof HumanInteractionSchema>;
```

### Human Collaboration Example

```yaml
human_interaction:
  mode: on_the_loop

  checkpoints:
    - name: High-Value Transaction Review
      trigger: Transaction amount exceeds $10,000
      type: approval
      timeout: Auto-reject after 4 hours

    - name: Compliance Flag Review
      trigger: Potential compliance issue detected
      type: escalation
      timeout: Route to compliance team if no response in 1 hour

  escalation:
    conditions: >
      Confidence score below 70%,
      Customer requests human assistance,
      System detects potential fraud
    channel: Slack #support-escalations with @on-call mention
```

---

## Agent Collaboration Schema

Agent collaboration defines how this agent interacts with other agents in a multi-agent system.

```typescript
// /lib/schemas/collaboration.ts

// Agent collaboration role
export const AgentCollaborationRoleEnum = z.enum([
  'supervisor',   // Coordinates and orchestrates other agents
  'worker',       // Executes specific tasks as directed
  'peer'          // Collaborates as equals with defined patterns
]);

export type AgentCollaborationRole = z.infer<typeof AgentCollaborationRoleEnum>;

// Interaction pattern for peers
export const PeerInteractionEnum = z.enum([
  'request_response',   // Synchronous request/response
  'pub_sub',            // Publish/subscribe messaging
  'shared_state'        // Shared state coordination
]);

export type PeerInteraction = z.infer<typeof PeerInteractionEnum>;

// Coordination entry (for supervisors)
export const CoordinationEntrySchema = z.object({
  agent: z.string().min(1).describe('Worker Agent ID/Type'),
  via: z.string().min(1).describe('Communication protocol'),
  for: z.string().min(1).describe('What tasks are delegated')
});

// Peer entry
export const PeerEntrySchema = z.object({
  agent: z.string().min(1).describe('Peer Agent ID/Type'),
  interaction: PeerInteractionEnum
});

// Complete agent collaboration schema
export const AgentCollaborationSchema = z.object({
  role: AgentCollaborationRoleEnum,

  // For supervisors
  coordinates: z.array(CoordinationEntrySchema).optional(),

  // For workers
  reportsTo: z.string().optional().describe('Supervisor Agent ID/Type'),

  // For all roles
  peers: z.array(PeerEntrySchema).optional()
});

export type AgentCollaboration = z.infer<typeof AgentCollaborationSchema>;
```

### Agent Collaboration Examples

**Supervisor Agent:**
```yaml
collaboration:
  role: supervisor

  coordinates:
    - agent: classification-worker
      via: A2A messaging
      for: Request classification tasks

    - agent: routing-worker
      via: A2A messaging
      for: Queue routing decisions

    - agent: escalation-handler
      via: A2A messaging
      for: Escalation processing
```

**Worker Agent:**
```yaml
collaboration:
  role: worker

  reports_to: support-orchestrator

  peers:
    - agent: knowledge-base-agent
      interaction: request_response
```

**Peer Agent:**
```yaml
collaboration:
  role: peer

  peers:
    - agent: inventory-agent
      interaction: shared_state

    - agent: pricing-agent
      interaction: request_response

    - agent: notification-agent
      interaction: pub_sub
```

---

## Memory & State Schema

Memory is always owned at the agent level - skills share access to the same memory stores. This prevents fragmentation and ensures consistency.

```typescript
// /lib/schemas/memory.ts

// Persistent store types
export const PersistentStoreTypeEnum = z.enum([
  'kb',           // Knowledge base
  'vector',       // Vector database for embeddings
  'relational',   // Relational database
  'kv'            // Key-value store
]);

export type PersistentStoreType = z.infer<typeof PersistentStoreTypeEnum>;

// Update modes for persistent stores
export const StoreUpdateModeEnum = z.enum([
  'read_only',    // Agent can only read
  'append',       // Agent can add but not modify
  'full_crud'     // Full create, read, update, delete
]);

export type StoreUpdateMode = z.infer<typeof StoreUpdateModeEnum>;

// Persistent store schema
export const PersistentStoreSchema = z.object({
  name: z.string().min(1).describe('Memory Store Name'),
  type: PersistentStoreTypeEnum,
  purpose: z.string().min(1).describe('Why this memory exists'),
  updates: StoreUpdateModeEnum.default('read_only')
});

// Learning signal types
export const LearningTypeEnum = z.enum([
  'feedback_loop',    // Iterative improvement from feedback
  'reinforcement',    // Reward-based learning
  'fine_tuning'       // Model fine-tuning
]);

export type LearningType = z.infer<typeof LearningTypeEnum>;

// Learning configuration
export const LearningConfigSchema = z.object({
  type: LearningTypeEnum,
  signal: z.string().min(1).describe('What triggers learning')
});

// Complete memory schema
export const MemorySchema = z.object({
  working: z.array(z.string()).optional().describe('Ephemeral context maintained during execution'),
  persistent: z.array(PersistentStoreSchema).optional(),
  learning: z.array(LearningConfigSchema).optional()
});

export type Memory = z.infer<typeof MemorySchema>;
```

### Memory Example

```yaml
memory:
  working:
    - Current conversation context
    - Customer sentiment from recent interactions
    - Active ticket details

  persistent:
    - name: Customer Interaction History
      type: vector
      purpose: Semantic search over past interactions for context
      updates: append

    - name: Routing Rules Cache
      type: kv
      purpose: Fast lookup of routing configurations
      updates: read_only

    - name: Agent Performance Metrics
      type: relational
      purpose: Track accuracy and performance over time
      updates: full_crud

  learning:
    - type: feedback_loop
      signal: Human corrections to classifications

    - type: reinforcement
      signal: Customer satisfaction scores post-interaction
```

---

## Acceptance Criteria Schema

Acceptance criteria define what success looks like for the agent as a whole. These are distinct from skill-level quality bars.

```typescript
// /lib/schemas/acceptance.ts

// Acceptance criteria schema
export const AcceptanceCriteriaSchema = z.object({
  functional: z.array(z.string()).min(1).describe('Observable behaviors that indicate success'),
  quality: z.array(z.string()).optional().describe('Non-functional requirements: latency, accuracy, etc.'),
  guardrails: z.array(z.string()).optional().describe('Constraints the agent must never violate')
});

export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;
```

### Acceptance Criteria Example

```yaml
acceptance:
  functional:
    - All incoming support requests are classified within 30 seconds
    - Requests are routed to appropriate queue based on classification
    - VIP customers are identified and prioritized
    - Escalations are surfaced to human operators with full context

  quality:
    - Classification accuracy >= 95% on standard categories
    - Routing accuracy >= 98%
    - Average response time < 500ms
    - System availability >= 99.9%

  guardrails:
    - Never expose customer PII in logs
    - Never auto-close tickets without customer confirmation
    - Never route compliance issues to standard queues
    - Always preserve audit trail of routing decisions
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

The full format includes all structured annotations for complete agent specification.

```typescript
// /lib/schemas/story.ts

export const AgentStoryFullSchema = AgentStoryLightSchema.extend({
  format: z.literal('full'),

  // Structured Annotations (all optional, add only what's relevant)

  // 1. Trigger specification (enhances core trigger)
  triggerSpec: TriggerSpecificationSchema.optional(),

  // 2. Behavior model
  behavior: BehaviorConfigSchema.optional(),

  // 3. Reasoning & decisions (agent-level, shared across skills)
  reasoning: ReasoningSchema.optional(),

  // 4. Memory & state
  memory: MemorySchema.optional(),

  // 5. Tools & integrations
  tools: ToolsSchema.optional(),

  // 6. Skills (required for full format - at least one)
  skills: SkillsSchema,

  // 7. Human collaboration
  humanInteraction: HumanInteractionSchema.optional(),

  // 8. Agent collaboration
  collaboration: AgentCollaborationSchema.optional(),

  // 9. Acceptance criteria (required for full format)
  acceptance: AcceptanceCriteriaSchema
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
  if (story.trigger.specification?.type === 'schedule' && story.autonomyLevel === 'directed') {
    warnings.push({
      path: 'trigger',
      message: 'Scheduled triggers with directed autonomy require human availability'
    });
  }

  return warnings;
}
```

---

## Relationship Rules

The following table defines the ownership and cardinality of all elements in an Agent Story:

| Element | Owned By | Cardinality | Notes |
|---------|----------|-------------|-------|
| trigger | Agent | 1..* | An agent must have at least one trigger |
| behavior | Agent | 1 | One behavior model per agent |
| tools | Agent | 1..* | Declared at agent level, referenced by skills |
| skills | Agent | 1..* | An agent must have at least one skill |
| proficiencies | Skill | 1..* | Each skill must specify what it can do |
| toolsUsed | Skill | 0..* | Skills reference agent-level tools |
| qualityBar | Skill | 1 | Every skill needs a measurable standard |
| reasoning | Agent or Skill | 0..1 | Can be defined at agent level or per-skill |
| memory | Agent | 0..1 | Shared across all skills |
| humanInteraction | Agent | 0..1 | Defined at agent level |
| collaboration | Agent | 0..1 | Agent-to-agent relationships |
| acceptance | Agent | 1 | Agent-level success criteria |

---

## Key Distinctions

### Tools vs. Skills

- **Tools** are resources the agent has access to (MCP servers, APIs, databases)
- **Skills** are competencies that use tools to accomplish domain-specific work
- Tools are declared once at agent level; skills reference which tools they use
- A tool can be used by multiple skills; a skill can use multiple tools (or none)

### Agent-level vs. Skill-level Reasoning

- **Agent-level reasoning**: Shared decision-making patterns (e.g., "always retry 3 times")
- **Skill-level reasoning**: Domain-specific logic (e.g., fraud detection heuristics)
- If reasoning is the same across skills, define it once at agent level
- If skills have distinct reasoning approaches, define per-skill

### Memory Ownership

- Memory is always agent-level - skills share access to the same memory stores
- Skills may read from or write to memory, but don't own separate memory
- This prevents fragmentation and ensures consistency

### Quality Bars vs. Acceptance Criteria

- **Quality bars** (skill-level): "This skill performs at X standard"
- **Acceptance criteria** (agent-level): "The agent as a whole succeeds when..."
- Skill quality bars are inputs to agent acceptance criteria

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
