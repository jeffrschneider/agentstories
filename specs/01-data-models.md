# Data Models Specification

## Overview

This specification defines all core data models for Agent Story Builder using Zod schemas. The data model follows a **skill-based architecture** where:

- **Agents** are identity containers (WHO) - role, relationships, memory, guardrails
- **Skills** are capability bundles (WHAT + HOW) - tools, triggers, behavior, success criteria

This separation treats skills as the fundamental units of capability. An agent is defined by its identity and the collection of skills it possesses.

## File Location

All schemas live in `/lib/schemas/` with the following structure:

```
/lib/schemas
  /agent.ts           # Agent-level schemas (identity, collaboration)
  /skill.ts           # Skill-level schemas (the core unit)
  /trigger.ts         # Trigger schemas (skill-level)
  /behavior.ts        # Behavior model schemas (skill-level)
  /reasoning.ts       # Reasoning schemas (skill-level)
  /tools.ts           # Tools schemas (skill-level)
  /guardrails.ts      # Guardrails schemas (both levels)
  /collaboration.ts   # Human and agent collaboration schemas
  /memory.ts          # Memory and state schemas (agent-level)
  /story.ts           # Complete story schemas
  /template.ts        # Template schemas
  /user.ts            # User and organization schemas
  /index.ts           # Re-exports all schemas
```

---

## Core Principle: Agent vs Skill Separation

### Agent-Level (The Container)

The agent is the identity and context that persists across skills:

| Element | Description | Purpose |
|---------|-------------|---------|
| **Core Story** | Identity, role, autonomy level | WHO the agent is |
| **Human Interaction** | Overall mode, escalation policy | How humans engage |
| **Agent Collaboration** | Supervisor/worker/peer relationships | Multi-agent topology |
| **Memory** | What persists across skills and sessions | Shared state |
| **High-Level Guardrails** | Identity constraints that apply regardless of skill | Safety boundaries |

### Skill-Level (Units of Capability)

Skills are self-contained capability bundles:

| Element | Description | Purpose |
|---------|-------------|---------|
| **Tools** | Resources this skill uses | WHAT it works with |
| **Inputs/Outputs** | Skill signature | Interface contract |
| **Triggers** | When this skill activates | Activation conditions |
| **Behavior** | Stage transitions, execution flow | HOW it executes |
| **Acceptance Criteria** | What "done" looks like | Success definition |
| **Failure Modes** | Error handling, fallbacks | Recovery logic |
| **Guardrails** | Skill-specific constraints | Scoped safety |
| **Reasoning** | Decision strategy, iteration, retry | Cognitive approach |

---

## Skill Schemas (The Core Unit)

### Skill Trigger Schema

Each skill defines when it activates. This is fundamentally different from agent-level triggers.

```typescript
// /lib/schemas/trigger.ts

import { z } from 'zod';

export const TriggerTypeEnum = z.enum([
  'message',          // Incoming message/request
  'resource_change',  // Data/state change
  'schedule',         // Time-based activation
  'cascade',          // Triggered by another skill/agent
  'manual',           // Human-initiated
  'condition'         // State condition becomes true
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

// Skill trigger specification
export const SkillTriggerSchema = z.object({
  type: TriggerTypeEnum,
  description: z.string().min(1).describe('Human-readable trigger description'),
  conditions: z.array(z.string()).optional().describe('Guard conditions that must be true'),
  examples: z.array(z.string()).optional().describe('Concrete examples')
});

export type SkillTrigger = z.infer<typeof SkillTriggerSchema>;

// Type-specific trigger configurations
export const MessageTriggerConfigSchema = z.object({
  type: z.literal('message'),
  sources: z.array(z.string()).optional().describe('Valid message sources'),
  patterns: z.array(z.string()).optional().describe('Message patterns to match'),
  protocol: z.enum(['a2a', 'webhook', 'queue', 'api']).optional()
});

export const ResourceChangeTriggerConfigSchema = z.object({
  type: z.literal('resource_change'),
  resourceType: z.string(),
  resourcePath: z.string().optional(),
  changeTypes: z.array(z.enum(['create', 'update', 'delete']))
});

export const ScheduleTriggerConfigSchema = z.object({
  type: z.literal('schedule'),
  cronExpression: z.string(),
  timezone: z.string().default('UTC')
});

export const CascadeTriggerConfigSchema = z.object({
  type: z.literal('cascade'),
  sourceSkill: z.string().optional(),
  sourceAgent: z.string().optional(),
  eventType: z.string()
});

export const ConditionTriggerConfigSchema = z.object({
  type: z.literal('condition'),
  expression: z.string().describe('Condition expression to evaluate'),
  pollInterval: z.string().optional().describe('How often to check condition')
});

export const TriggerConfigSchema = z.discriminatedUnion('type', [
  MessageTriggerConfigSchema,
  ResourceChangeTriggerConfigSchema,
  ScheduleTriggerConfigSchema,
  CascadeTriggerConfigSchema,
  ConditionTriggerConfigSchema
]);

export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;
```

### Skill Input/Output Schema

Each skill has a clear interface contract.

```typescript
// /lib/schemas/skill.ts

// Input specification
export const SkillInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1).describe('Data type (string, object, array, etc.)'),
  description: z.string().min(1),
  required: z.boolean().default(true),
  schema: z.string().optional().describe('JSON Schema or Zod reference for complex types')
});

export type SkillInput = z.infer<typeof SkillInputSchema>;

// Output specification
export const SkillOutputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  schema: z.string().optional()
});

export type SkillOutput = z.infer<typeof SkillOutputSchema>;
```

### Skill Tools Schema

Tools are owned at the skill level - each skill declares what resources it needs.

```typescript
// /lib/schemas/tools.ts

export const ToolPermissionEnum = z.enum([
  'read',
  'write',
  'execute',
  'admin'
]);

export type ToolPermission = z.infer<typeof ToolPermissionEnum>;

// Tool declaration (skill-owned)
export const SkillToolSchema = z.object({
  name: z.string().min(1).describe('Tool or MCP Server name'),
  purpose: z.string().min(1).describe('Why this skill uses this tool'),
  permissions: z.array(ToolPermissionEnum).min(1),
  required: z.boolean().default(true).describe('Is this tool mandatory for skill execution?'),
  conditions: z.string().optional().describe('When/how tool is used')
});

export type SkillTool = z.infer<typeof SkillToolSchema>;
```

### Skill Behavior Schema

Behavior defines how the skill executes - its internal workflow or adaptive approach.

```typescript
// /lib/schemas/behavior.ts

// Stage transition within a skill
export const StageTransitionSchema = z.object({
  to: z.string().min(1).describe('Target stage name'),
  when: z.string().min(1).describe('Transition condition')
});

// Execution stage
export const ExecutionStageSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1).describe('What this stage accomplishes'),
  actions: z.array(z.string()).optional().describe('Actions performed in this stage'),
  transitions: z.array(StageTransitionSchema).optional()
});

// Behavior model types
export const BehaviorModelEnum = z.enum([
  'sequential',   // Linear step-by-step execution
  'workflow',     // Multi-stage with conditional transitions
  'adaptive',     // Dynamic based on context
  'iterative'     // Loop until condition met
]);

export type BehaviorModel = z.infer<typeof BehaviorModelEnum>;

// Sequential behavior
export const SequentialBehaviorSchema = z.object({
  model: z.literal('sequential'),
  steps: z.array(z.string()).min(1).describe('Ordered list of steps')
});

// Workflow behavior (multi-stage)
export const WorkflowBehaviorSchema = z.object({
  model: z.literal('workflow'),
  stages: z.array(ExecutionStageSchema).min(1),
  entryStage: z.string().optional().describe('Starting stage (defaults to first)')
});

// Adaptive behavior
export const AdaptiveBehaviorSchema = z.object({
  model: z.literal('adaptive'),
  capabilities: z.array(z.string()).min(1).describe('Available actions to choose from'),
  selectionStrategy: z.string().optional().describe('How to select next action')
});

// Iterative behavior
export const IterativeBehaviorSchema = z.object({
  model: z.literal('iterative'),
  body: z.array(z.string()).min(1).describe('Actions per iteration'),
  terminationCondition: z.string().min(1),
  maxIterations: z.number().int().positive().optional()
});

export const SkillBehaviorSchema = z.discriminatedUnion('model', [
  SequentialBehaviorSchema,
  WorkflowBehaviorSchema,
  AdaptiveBehaviorSchema,
  IterativeBehaviorSchema
]);

export type SkillBehavior = z.infer<typeof SkillBehaviorSchema>;
```

### Skill Reasoning Schema

Reasoning configuration is skill-specific.

```typescript
// /lib/schemas/reasoning.ts

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

// Retry/iteration configuration
export const RetryConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).default(3),
  backoffStrategy: z.enum(['none', 'linear', 'exponential']).default('exponential'),
  retryOn: z.array(z.string()).optional().describe('Conditions that trigger retry')
});

// Complete skill reasoning
export const SkillReasoningSchema = z.object({
  strategy: ReasoningStrategyEnum,
  decisionPoints: z.array(DecisionPointSchema).optional(),
  retry: RetryConfigSchema.optional(),
  confidence: z.object({
    threshold: z.number().min(0).max(1).optional(),
    fallbackAction: z.string().optional()
  }).optional()
});

export type SkillReasoning = z.infer<typeof SkillReasoningSchema>;
```

### Skill Acceptance Criteria Schema

Each skill defines its own success criteria.

```typescript
// /lib/schemas/skill.ts

export const SkillAcceptanceCriteriaSchema = z.object({
  successConditions: z.array(z.string()).min(1).describe('What "done" looks like'),
  qualityMetrics: z.array(z.object({
    name: z.string(),
    target: z.string(),
    measurement: z.string().optional()
  })).optional(),
  timeout: z.string().optional().describe('Max execution time')
});

export type SkillAcceptanceCriteria = z.infer<typeof SkillAcceptanceCriteriaSchema>;
```

### Skill Failure Modes Schema

```typescript
// /lib/schemas/skill.ts

export const FailureModeSchema = z.object({
  condition: z.string().min(1).describe('What failure looks like'),
  recovery: z.string().min(1).describe('How to handle this failure'),
  escalate: z.boolean().default(false).describe('Should this escalate to human/supervisor?')
});

export const SkillFailureHandlingSchema = z.object({
  modes: z.array(FailureModeSchema).optional(),
  defaultFallback: z.string().optional().describe('Default action when no specific handler matches'),
  notifyOnFailure: z.boolean().default(true)
});

export type SkillFailureHandling = z.infer<typeof SkillFailureHandlingSchema>;
```

### Skill Guardrails Schema

Skill-specific constraints.

```typescript
// /lib/schemas/guardrails.ts

export const SkillGuardrailSchema = z.object({
  name: z.string().min(1),
  constraint: z.string().min(1).describe('What the skill must not do'),
  enforcement: z.enum(['hard', 'soft']).default('hard'),
  onViolation: z.string().optional().describe('Action when violated')
});

export type SkillGuardrail = z.infer<typeof SkillGuardrailSchema>;
```

### Complete Skill Schema

```typescript
// /lib/schemas/skill.ts

export const SkillAcquisitionEnum = z.enum([
  'built_in',    // Core competency
  'learned',     // Acquired through experience
  'delegated'    // Performed by external service/agent
]);

export type SkillAcquisition = z.infer<typeof SkillAcquisitionEnum>;

// Complete skill definition
export const SkillSchema = z.object({
  // Identity
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1).describe('What this skill does'),
  domain: z.string().min(1).describe('Knowledge domain'),
  acquired: SkillAcquisitionEnum,

  // Interface
  triggers: z.array(SkillTriggerSchema).min(1).describe('When this skill activates'),
  inputs: z.array(SkillInputSchema).optional(),
  outputs: z.array(SkillOutputSchema).optional(),

  // Resources
  tools: z.array(SkillToolSchema).optional().describe('Tools this skill uses'),

  // Execution
  behavior: SkillBehaviorSchema.optional(),
  reasoning: SkillReasoningSchema.optional(),

  // Success & Failure
  acceptance: SkillAcceptanceCriteriaSchema,
  failureHandling: SkillFailureHandlingSchema.optional(),

  // Constraints
  guardrails: z.array(SkillGuardrailSchema).optional()
});

export type Skill = z.infer<typeof SkillSchema>;
```

### Skill Example

```yaml
skill:
  name: Request Classification
  description: Categorize incoming support requests by type, urgency, and sentiment
  domain: Natural Language Understanding
  acquired: built_in

  triggers:
    - type: message
      description: New support request received
      conditions:
        - Message source is customer support gateway
        - Message not already classified
      examples:
        - "Customer submits ticket via web form"
        - "Email received at support@company.com"

  inputs:
    - name: message
      type: string
      description: The raw support request text
      required: true
    - name: customerContext
      type: object
      description: Customer history and metadata
      required: false

  outputs:
    - name: classification
      type: object
      description: Category, urgency level, sentiment score

  tools:
    - name: Customer Database MCP
      purpose: Look up customer history for context
      permissions: [read]
      required: false
    - name: Classification Model API
      purpose: Run ML classification
      permissions: [execute]
      required: true

  behavior:
    model: sequential
    steps:
      - Extract key phrases from message
      - Lookup customer history if available
      - Run classification model
      - Apply confidence thresholds
      - Return classification result

  reasoning:
    strategy: hybrid
    decisionPoints:
      - name: Confidence Check
        inputs: [model_confidence_score]
        approach: If confidence < 0.8, flag for human review
        outcomes: [accept, escalate]
    retry:
      maxAttempts: 2
      backoffStrategy: exponential
      retryOn:
        - Model timeout
        - Database connection failure

  acceptance:
    successConditions:
      - Message is assigned a category
      - Urgency level is determined
      - Classification confidence is recorded
    qualityMetrics:
      - name: accuracy
        target: ">= 95% on standard categories"
      - name: latency
        target: "< 500ms p95"

  failureHandling:
    modes:
      - condition: Classification model unavailable
        recovery: Use rule-based fallback classifier
        escalate: false
      - condition: Customer not found in database
        recovery: Proceed without history context
        escalate: false
      - condition: All classification attempts fail
        recovery: Route to human classifier
        escalate: true
    defaultFallback: Flag for manual classification
    notifyOnFailure: true

  guardrails:
    - name: No PII in logs
      constraint: Never log raw customer message content
      enforcement: hard
    - name: Classification bounds
      constraint: Only assign to known categories
      enforcement: hard
      onViolation: Assign to "uncategorized" with flag
```

---

## Agent-Level Schemas

### Core Identity

```typescript
// /lib/schemas/agent.ts

export const AutonomyLevelEnum = z.enum([
  'full',          // Complete decision authority
  'supervised',    // Operates independently, escalates edge cases
  'collaborative', // Shared decision-making with humans
  'directed'       // Requires human approval for each action
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

// Agent identity schema
export const AgentIdentitySchema = z.object({
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens'
    }),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200).describe('What role does this agent play?'),
  purpose: z.string().min(1).max(500).describe('Why does this agent exist?'),
  autonomyLevel: AutonomyLevelEnum
});

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;
```

### Human Interaction (Agent-Level)

```typescript
// /lib/schemas/collaboration.ts

export const HumanInteractionModeEnum = z.enum([
  'in_the_loop',   // Human approval for every decision
  'on_the_loop',   // Human monitors, intervenes on exceptions
  'out_of_loop'    // Fully autonomous within boundaries
]);

export type HumanInteractionMode = z.infer<typeof HumanInteractionModeEnum>;

// Escalation policy (applies across all skills)
export const EscalationPolicySchema = z.object({
  defaultChannel: z.string().min(1).describe('How escalations are communicated'),
  urgencyLevels: z.array(z.object({
    level: z.string(),
    responseTime: z.string(),
    channel: z.string().optional()
  })).optional(),
  fallbackContact: z.string().optional()
});

// Agent-level human interaction
export const AgentHumanInteractionSchema = z.object({
  mode: HumanInteractionModeEnum,
  escalationPolicy: EscalationPolicySchema.optional(),
  availabilityRequirements: z.string().optional().describe('When human oversight is required')
});

export type AgentHumanInteraction = z.infer<typeof AgentHumanInteractionSchema>;
```

### Agent Collaboration

```typescript
// /lib/schemas/collaboration.ts

export const AgentCollaborationRoleEnum = z.enum([
  'supervisor',   // Coordinates other agents
  'worker',       // Executes tasks as directed
  'peer'          // Collaborates as equals
]);

export type AgentCollaborationRole = z.infer<typeof AgentCollaborationRoleEnum>;

export const PeerInteractionEnum = z.enum([
  'request_response',
  'pub_sub',
  'shared_state'
]);

// Coordination (for supervisors)
export const CoordinationEntrySchema = z.object({
  agent: z.string().min(1),
  protocol: z.string().min(1),
  delegatedTasks: z.array(z.string())
});

// Peer relationship
export const PeerEntrySchema = z.object({
  agent: z.string().min(1),
  interaction: PeerInteractionEnum,
  sharedContext: z.array(z.string()).optional()
});

export const AgentCollaborationSchema = z.object({
  role: AgentCollaborationRoleEnum,
  coordinates: z.array(CoordinationEntrySchema).optional(),
  reportsTo: z.string().optional(),
  peers: z.array(PeerEntrySchema).optional()
});

export type AgentCollaboration = z.infer<typeof AgentCollaborationSchema>;
```

### Memory (Agent-Level)

Memory persists across skills and sessions.

```typescript
// /lib/schemas/memory.ts

export const PersistentStoreTypeEnum = z.enum([
  'kb',           // Knowledge base
  'vector',       // Vector database
  'relational',   // SQL database
  'kv',           // Key-value store
  'graph'         // Graph database
]);

export const StoreUpdateModeEnum = z.enum([
  'read_only',
  'append',
  'full_crud'
]);

export const PersistentStoreSchema = z.object({
  name: z.string().min(1),
  type: PersistentStoreTypeEnum,
  purpose: z.string().min(1),
  updateMode: StoreUpdateModeEnum.default('read_only'),
  sharedWith: z.array(z.string()).optional().describe('Other agents that share this store')
});

export const LearningTypeEnum = z.enum([
  'feedback_loop',
  'reinforcement',
  'fine_tuning',
  'example_based'
]);

export const LearningConfigSchema = z.object({
  type: LearningTypeEnum,
  signal: z.string().min(1),
  store: z.string().optional().describe('Which persistent store captures learnings')
});

export const AgentMemorySchema = z.object({
  workingMemory: z.array(z.string()).optional().describe('Ephemeral context during execution'),
  persistentStores: z.array(PersistentStoreSchema).optional(),
  learning: z.array(LearningConfigSchema).optional()
});

export type AgentMemory = z.infer<typeof AgentMemorySchema>;
```

### Agent-Level Guardrails

High-level constraints that apply regardless of which skill is executing.

```typescript
// /lib/schemas/guardrails.ts

export const AgentGuardrailSchema = z.object({
  name: z.string().min(1),
  constraint: z.string().min(1).describe('Identity-level constraint'),
  rationale: z.string().optional().describe('Why this guardrail exists'),
  enforcement: z.enum(['hard', 'soft']).default('hard')
});

export type AgentGuardrail = z.infer<typeof AgentGuardrailSchema>;
```

---

## Agent Story Schemas

### Agent Story Light

MVP format with core identity and a single capability statement.

```typescript
// /lib/schemas/story.ts

export const StoryFormatEnum = z.enum(['light', 'full']);
export type StoryFormat = z.infer<typeof StoryFormatEnum>;

export const AgentStoryLightSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  format: z.literal('light'),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),

  // Core identity
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  autonomyLevel: AutonomyLevelEnum,

  // Simple capability statement (becomes skills in full)
  trigger: z.string().min(1).max(300).describe('When [trigger]'),
  action: z.string().min(1).max(500).describe('I [action]'),
  outcome: z.string().min(1).max(500).describe('So that [outcome]'),

  // Optional metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type AgentStoryLight = z.infer<typeof AgentStoryLightSchema>;
```

### Agent Story Full

Complete format with structured skills and agent-level configuration.

```typescript
// /lib/schemas/story.ts

export const AgentStoryFullSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  format: z.literal('full'),
  version: z.string().default('1.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),

  // Agent Identity (WHO)
  identifier: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  autonomyLevel: AutonomyLevelEnum,

  // Skills (WHAT + HOW) - required, at least one
  skills: z.array(SkillSchema).min(1),

  // Agent-Level Configuration (context for all skills)
  humanInteraction: AgentHumanInteractionSchema.optional(),
  collaboration: AgentCollaborationSchema.optional(),
  memory: AgentMemorySchema.optional(),
  guardrails: z.array(AgentGuardrailSchema).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type AgentStoryFull = z.infer<typeof AgentStoryFullSchema>;
```

### Union and Helpers

```typescript
// /lib/schemas/story.ts

export const AgentStorySchema = z.discriminatedUnion('format', [
  AgentStoryLightSchema,
  AgentStoryFullSchema
]);

export type AgentStory = z.infer<typeof AgentStorySchema>;

export function isFullFormat(story: AgentStory): story is AgentStoryFull {
  return story.format === 'full';
}

// Upgrade light to full by creating a skill from the simple statements
export function upgradeToFull(light: AgentStoryLight): AgentStoryFull {
  return {
    id: light.id,
    format: 'full',
    version: light.version,
    createdAt: light.createdAt,
    updatedAt: new Date().toISOString(),
    createdBy: light.createdBy,

    identifier: light.identifier,
    name: light.name,
    role: light.role,
    purpose: light.outcome, // "so that [outcome]" becomes purpose
    autonomyLevel: light.autonomyLevel,

    // Convert simple statements to a single skill
    skills: [{
      name: 'Primary Capability',
      description: light.action,
      domain: 'General',
      acquired: 'built_in',
      triggers: [{
        type: 'manual',
        description: light.trigger
      }],
      acceptance: {
        successConditions: [light.outcome]
      }
    }],

    tags: light.tags,
    notes: light.notes
  };
}
```

---

## Complete Example: Support Request Router

```yaml
# Agent Story (Full Format)

format: full
version: "1.0"

# === AGENT IDENTITY (WHO) ===
identifier: support-request-router
name: Support Request Router
role: Customer Support Triage Agent
purpose: Ensure support requests reach the right team quickly with full context
autonomyLevel: supervised

# === SKILLS (WHAT + HOW) ===
skills:

  # Skill 1: Classification
  - name: Request Classification
    description: Categorize incoming requests by type, urgency, and sentiment
    domain: Natural Language Understanding
    acquired: built_in

    triggers:
      - type: message
        description: New support request received
        conditions:
          - Source is customer support gateway
          - Request not previously classified

    inputs:
      - name: requestText
        type: string
        description: Raw support request
        required: true
      - name: customerInfo
        type: object
        description: Customer metadata
        required: false

    outputs:
      - name: classification
        type: object
        description: Category, urgency, sentiment, confidence

    tools:
      - name: Customer Database
        purpose: Lookup customer tier and history
        permissions: [read]
        required: false
      - name: Classification Model
        purpose: ML-based categorization
        permissions: [execute]
        required: true

    behavior:
      model: sequential
      steps:
        - Extract key phrases
        - Lookup customer context
        - Run classification
        - Apply confidence thresholds

    reasoning:
      strategy: hybrid
      decisionPoints:
        - name: Confidence Check
          inputs: [model_score]
          approach: Escalate if confidence < 0.8
      retry:
        maxAttempts: 2
        retryOn: [model_timeout]

    acceptance:
      successConditions:
        - Category assigned
        - Urgency determined
        - Confidence recorded
      qualityMetrics:
        - name: accuracy
          target: ">= 95%"
        - name: latency
          target: "< 500ms p95"

    failureHandling:
      modes:
        - condition: Model unavailable
          recovery: Use rule-based fallback
          escalate: false
        - condition: All attempts fail
          recovery: Route to human classifier
          escalate: true

    guardrails:
      - name: No PII logging
        constraint: Never log raw message content
        enforcement: hard

  # Skill 2: Queue Routing
  - name: Queue Routing
    description: Route classified requests to appropriate support queues
    domain: Workflow Management
    acquired: built_in

    triggers:
      - type: cascade
        description: Classification skill completed
        eventType: classification_complete

    inputs:
      - name: classification
        type: object
        description: Result from classification skill
        required: true

    outputs:
      - name: routingDecision
        type: object
        description: Target queue and priority

    tools:
      - name: Queue Manager API
        purpose: Check queue capacity and route
        permissions: [read, execute]
        required: true

    behavior:
      model: workflow
      stages:
        - name: Check VIP Status
          purpose: Prioritize high-value customers
          transitions:
            - to: Select Queue
              when: VIP status checked
        - name: Select Queue
          purpose: Match category to queue
          transitions:
            - to: Confirm Route
              when: Queue selected
        - name: Confirm Route
          purpose: Finalize routing decision

    acceptance:
      successConditions:
        - Request assigned to queue
        - Priority set correctly
        - Routing logged

    guardrails:
      - name: Compliance routing
        constraint: Compliance issues never go to standard queues
        enforcement: hard

# === AGENT-LEVEL CONFIGURATION ===

humanInteraction:
  mode: on_the_loop
  escalationPolicy:
    defaultChannel: Slack #support-escalations
    urgencyLevels:
      - level: critical
        responseTime: 5 minutes
        channel: PagerDuty
      - level: high
        responseTime: 1 hour
      - level: normal
        responseTime: 4 hours

collaboration:
  role: worker
  reportsTo: support-orchestrator
  peers:
    - agent: knowledge-base-agent
      interaction: request_response

memory:
  workingMemory:
    - Current request context
    - Customer sentiment from recent interactions
  persistentStores:
    - name: Routing History
      type: relational
      purpose: Track routing patterns and outcomes
      updateMode: append
  learning:
    - type: feedback_loop
      signal: Human corrections to classifications

guardrails:
  - name: Never auto-close
    constraint: Never close tickets without customer confirmation
    rationale: Prevent premature resolution
  - name: Audit trail
    constraint: All routing decisions must be logged
    rationale: Compliance and debugging

tags: [customer-support, triage, routing]
```

---

## Relationship Summary

| Element | Owned By | Cardinality | Notes |
|---------|----------|-------------|-------|
| triggers | Skill | 1..* | Each skill defines its activation conditions |
| inputs | Skill | 0..* | Skill interface contract |
| outputs | Skill | 0..* | Skill interface contract |
| tools | Skill | 0..* | Resources needed for this skill |
| behavior | Skill | 0..1 | Execution model for this skill |
| reasoning | Skill | 0..1 | Decision-making for this skill |
| acceptance | Skill | 1 | What "done" looks like for this skill |
| failureHandling | Skill | 0..1 | Recovery logic for this skill |
| guardrails (skill) | Skill | 0..* | Skill-specific constraints |
| skills | Agent | 1..* | Agent must have at least one skill |
| humanInteraction | Agent | 0..1 | Overall interaction mode |
| collaboration | Agent | 0..1 | Multi-agent relationships |
| memory | Agent | 0..1 | Shared across all skills |
| guardrails (agent) | Agent | 0..* | Identity-level constraints |

---

## Key Design Decisions

### Why Skills Own Tools

The previous model had tools at agent level with skills referencing them. This new model has skills owning their tools because:

1. **Self-contained units**: A skill is a complete capability - it should declare everything it needs
2. **Clearer dependencies**: When you read a skill, you see all its requirements
3. **Better reusability**: Skills can be moved between agents without fixing tool references
4. **Simpler validation**: No need to cross-reference tool declarations

### Why Triggers Are Skill-Level

Different skills activate under different conditions. A "Request Classification" skill activates on new messages, while a "Queue Routing" skill activates on classification completion. The agent doesn't have a single trigger - it's the collection of its skills' triggers that define when it acts.

### Why Guardrails Exist at Both Levels

- **Agent guardrails**: Identity constraints (e.g., "never expose PII") that apply regardless of skill
- **Skill guardrails**: Capability-specific constraints (e.g., "only assign known categories")

Agent guardrails are inherited by all skills. Skill guardrails add additional constraints.

### Memory Stays at Agent Level

Memory is the exception - it stays at agent level because:

1. Skills often need to share context
2. Persistent state should not be fragmented
3. Learning signals often come from cross-skill patterns

Skills read from and write to agent memory, but don't own separate memory stores.

---

## Template Schema

```typescript
// /lib/schemas/template.ts

export const TemplateCategoryEnum = z.enum([
  'customer_service',
  'data_processing',
  'monitoring',
  'content_generation',
  'research',
  'automation',
  'multi_agent',
  'custom'
]);

// Skill template (can be applied independently)
export const SkillTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  skillTemplate: SkillSchema.partial(),
  tags: z.array(z.string()),
  usageCount: z.number().default(0)
});

// Agent story template
export const StoryTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategoryEnum,
  tags: z.array(z.string()),

  // Partial story as template
  storyTemplate: AgentStorySchema.partial(),

  // Pre-defined skills that can be included
  includedSkills: z.array(SkillTemplateSchema).optional(),

  // Metadata
  isBuiltIn: z.boolean().default(false),
  organizationId: z.string().uuid().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime(),
  usageCount: z.number().default(0),

  // Guidance
  whenToUse: z.string().optional(),
  exampleScenarios: z.array(z.string()).optional()
});

export type SkillTemplate = z.infer<typeof SkillTemplateSchema>;
export type StoryTemplate = z.infer<typeof StoryTemplateSchema>;
```

---

## Validation Utilities

```typescript
// /lib/schemas/validation.ts

export type ValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; message: string; code: string }>;
  warnings: Array<{ path: string; message: string }>;
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

function checkConsistency(story: AgentStory): ValidationResult['warnings'] {
  const warnings: ValidationResult['warnings'] = [];

  if (!isFullFormat(story)) return warnings;

  // Check autonomy vs human interaction consistency
  if (story.autonomyLevel === 'full' && story.humanInteraction?.mode === 'in_the_loop') {
    warnings.push({
      path: 'humanInteraction.mode',
      message: 'Full autonomy with in-the-loop mode may be contradictory'
    });
  }

  if (story.autonomyLevel === 'directed' && story.humanInteraction?.mode === 'out_of_loop') {
    warnings.push({
      path: 'humanInteraction.mode',
      message: 'Directed autonomy with out-of-loop mode may be contradictory'
    });
  }

  // Check skill guardrails don't contradict agent guardrails
  if (story.guardrails && story.skills) {
    const agentConstraints = new Set(story.guardrails.map(g => g.name.toLowerCase()));
    for (const skill of story.skills) {
      if (skill.guardrails) {
        for (const sg of skill.guardrails) {
          if (agentConstraints.has(sg.name.toLowerCase())) {
            warnings.push({
              path: `skills.${skill.name}.guardrails`,
              message: `Skill guardrail "${sg.name}" duplicates agent-level guardrail`
            });
          }
        }
      }
    }
  }

  // Check for skills with no tools but complex behavior
  for (const skill of story.skills) {
    if (!skill.tools?.length && skill.behavior?.model === 'adaptive') {
      warnings.push({
        path: `skills.${skill.name}`,
        message: 'Adaptive behavior without tools may indicate missing configuration'
      });
    }
  }

  return warnings;
}
```

---

## Database Schema

```sql
-- Agent stories with skill-based structure
CREATE TABLE agent_stories (
  id UUID PRIMARY KEY,
  identifier VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  format VARCHAR(10) NOT NULL,
  autonomy_level VARCHAR(20) NOT NULL,

  -- Full story content as JSONB (includes skills)
  content JSONB NOT NULL,

  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],

  UNIQUE(organization_id, identifier)
);

-- Skill templates (reusable skill definitions)
CREATE TABLE skill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  domain VARCHAR(50) NOT NULL,
  skill_template JSONB NOT NULL,
  tags TEXT[],
  is_built_in BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Story templates
CREATE TABLE story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  story_template JSONB NOT NULL,
  included_skill_ids UUID[],
  tags TEXT[],
  is_built_in BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_stories_org ON agent_stories(organization_id);
CREATE INDEX idx_stories_tags ON agent_stories USING GIN(tags);
CREATE INDEX idx_skill_templates_domain ON skill_templates(domain);
CREATE INDEX idx_story_templates_category ON story_templates(category);
```
