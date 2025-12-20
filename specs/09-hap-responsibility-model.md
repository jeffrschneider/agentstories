# HAP Responsibility Model Specification

## Overview

This specification defines how work responsibilities are distributed between humans and agents within a Human-Agent Pair (HAP). It replaces the previous As-Is/To-Be model with a **Responsibility Phase Model** that captures the iterative nature of work.

## Core Concept: Work Phases

Work is typically done in an iterative loop where the work product is refined over time. Each task goes through four responsibility phases:

| Phase | Description | Examples |
|-------|-------------|----------|
| **Manage** | Sets goals, priorities, constraints, deadlines | "This invoice is urgent", "Focus on Q4 data" |
| **Define** | Specifies what needs to be done, acceptance criteria | "Extract vendor, amount, date fields", "Must match PO" |
| **Perform** | Executes the actual work | Process the invoice, write the code, analyze the data |
| **Review** | Validates output, provides feedback, approves/rejects | Check accuracy, approve for payment, request changes |

## Data Model

### ResponsibilityPhase Enum

```typescript
export const ResponsibilityPhaseEnum = z.enum([
  'manage',   // Sets goals, priorities, constraints
  'define',   // Specifies requirements, acceptance criteria
  'perform',  // Executes the work
  'review'    // Validates, provides feedback
]);

export type ResponsibilityPhase = z.infer<typeof ResponsibilityPhaseEnum>;
```

### PhaseOwner Enum

```typescript
export const PhaseOwnerEnum = z.enum([
  'human',  // Human is responsible for this phase
  'agent'   // Agent is responsible for this phase
]);

export type PhaseOwner = z.infer<typeof PhaseOwnerEnum>;
```

### PhaseAssignment Schema

Each phase within a task has an owner assignment:

```typescript
export const PhaseAssignmentSchema = z.object({
  phase: ResponsibilityPhaseEnum,
  owner: PhaseOwnerEnum,

  // If owner is 'agent', link to the skill that handles this
  // null means skill is required but not yet defined
  skillId: z.string().uuid().nullable().optional(),

  // Notes about this phase assignment
  notes: z.string().max(500).optional()
});

export type PhaseAssignment = z.infer<typeof PhaseAssignmentSchema>;
```

### TaskResponsibility Schema (replaces TaskAssignment)

```typescript
export const TaskResponsibilitySchema = z.object({
  id: z.string().uuid(),

  // Task identification
  taskName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),

  // The four phases with their assignments
  phases: z.object({
    manage: PhaseAssignmentSchema,
    define: PhaseAssignmentSchema,
    perform: PhaseAssignmentSchema,
    review: PhaseAssignmentSchema
  }),

  // Overall status of this task's agent integration
  integrationStatus: z.enum([
    'not_started',      // No agent phases configured
    'partially_defined', // Some agent phases, missing skills
    'ready',            // All agent phases have linked skills
    'active'            // Currently in use
  ]).default('not_started'),

  // Blockers preventing agent integration
  blockers: z.array(z.string()).optional(),

  // Target date for full integration
  targetDate: z.string().datetime().optional(),

  notes: z.string().max(500).optional()
});

export type TaskResponsibility = z.infer<typeof TaskResponsibilitySchema>;
```

### Preset Patterns

Common responsibility patterns can be applied as presets:

```typescript
export const RESPONSIBILITY_PRESETS = {
  // Human does everything
  'human-only': {
    manage: 'human',
    define: 'human',
    perform: 'human',
    review: 'human'
  },

  // Agent does everything (full autonomy)
  'agent-only': {
    manage: 'agent',
    define: 'agent',
    perform: 'agent',
    review: 'agent'
  },

  // Human manages and reviews, agent defines and performs
  'supervised-execution': {
    manage: 'human',
    define: 'agent',
    perform: 'agent',
    review: 'human'
  },

  // Human manages and defines, agent performs and self-reviews
  'directed-execution': {
    manage: 'human',
    define: 'human',
    perform: 'agent',
    review: 'agent'
  },

  // Human manages, defines, reviews; agent only performs
  'human-controlled': {
    manage: 'human',
    define: 'human',
    perform: 'agent',
    review: 'human'
  },

  // Collaborative - agent performs, human reviews
  'collaborative': {
    manage: 'human',
    define: 'human',
    perform: 'agent',
    review: 'human'
  }
} as const;

export type ResponsibilityPreset = keyof typeof RESPONSIBILITY_PRESETS;
```

### Updated HAP Schema

```typescript
export const HumanAgentPairSchema = z.object({
  id: z.string().uuid(),

  // The human in the pair
  personId: z.string().uuid(),

  // The role being shared
  roleId: z.string().uuid(),

  // The agent in the pair (links to AgentStory)
  agentStoryId: z.string().uuid(),

  // Task responsibilities (replaces asIs/toBe)
  tasks: z.array(TaskResponsibilitySchema).default([]),

  // Pending skill requirements generated from agent phase assignments
  pendingSkillRequirements: z.array(z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    phase: ResponsibilityPhaseEnum,
    suggestedSkillName: z.string(),
    suggestedSkillDescription: z.string(),
    status: z.enum(['pending', 'generating', 'ready', 'applied', 'rejected']),
    generatedSkill: z.any().optional(), // Skill schema when generated
    createdAt: z.string().datetime()
  })).default([]),

  // Overall integration status
  integrationStatus: z.enum([
    'not_started',
    'planning',        // Defining task responsibilities
    'skills_pending',  // Waiting for agent skills
    'ready',           // All skills defined
    'active',          // In production use
    'paused'           // Temporarily paused
  ]).default('not_started'),

  // Summary metrics (computed)
  metrics: z.object({
    totalTasks: z.number(),
    tasksWithAgentPhases: z.number(),
    pendingSkillCount: z.number(),
    readyTaskCount: z.number()
  }).optional(),

  notes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type HumanAgentPair = z.infer<typeof HumanAgentPairSchema>;
```

## Skill Requirement Flow

When a phase is assigned to an agent, the system checks if the linked Agent Story has a skill that can handle that phase. If not, a skill requirement is created.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  User assigns phase to Agent                                     │
│  Task: "Process invoices" → Perform: Agent                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  System checks Agent Story for matching skill                    │
│  Does agent have skill for "invoice processing"?                 │
└─────────────────────────────────────────────────────────────────┘
              │                                    │
              ▼                                    ▼
       ┌──────────┐                    ┌─────────────────────┐
       │   YES    │                    │         NO          │
       │          │                    │                     │
       │ Link     │                    │ Create Skill        │
       │ skillId  │                    │ Requirement         │
       └──────────┘                    └─────────────────────┘
                                                  │
                                                  ▼
                           ┌─────────────────────────────────────┐
                           │  Skill Requirement added to queue   │
                           │  - taskId: "process-invoices"       │
                           │  - phase: "perform"                 │
                           │  - status: "pending"                │
                           └─────────────────────────────────────┘
                                                  │
                                                  ▼
                           ┌─────────────────────────────────────┐
                           │  LLM generates draft skill          │
                           │  Based on:                          │
                           │  - Task name and description        │
                           │  - Phase type                       │
                           │  - Agent Story context              │
                           │  - Role responsibilities            │
                           └─────────────────────────────────────┘
                                                  │
                                                  ▼
                           ┌─────────────────────────────────────┐
                           │  User reviews and approves skill    │
                           │  Skill added to Agent Story         │
                           │  TaskResponsibility.skillId updated │
                           └─────────────────────────────────────┘
```

### Skill Requirement Schema

```typescript
export const SkillRequirementSchema = z.object({
  id: z.string().uuid(),

  // Source of the requirement
  hapId: z.string().uuid(),
  taskId: z.string().uuid(),
  phase: ResponsibilityPhaseEnum,

  // Context for generation
  taskName: z.string(),
  taskDescription: z.string().optional(),
  roleContext: z.string().optional(),

  // Suggested skill (from LLM or user)
  suggestedSkillName: z.string(),
  suggestedSkillDescription: z.string(),

  // Status
  status: z.enum([
    'pending',     // Waiting to be processed
    'generating',  // LLM is generating skill
    'ready',       // Draft skill ready for review
    'applied',     // Skill added to Agent Story
    'rejected'     // User rejected this requirement
  ]),

  // Generated skill (when status is 'ready' or 'applied')
  generatedSkill: SkillSchema.optional(),

  // Target Agent Story
  agentStoryId: z.string().uuid(),

  // Tracking
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  appliedAt: z.string().datetime().optional()
});

export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;
```

## UI Components

### Task Responsibility Editor

A grid view showing all four phases for each task:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Task: Process incoming invoices                                      │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│     MANAGE      │     DEFINE      │     PERFORM     │    REVIEW     │
├─────────────────┼─────────────────┼─────────────────┼───────────────┤
│   👤 Human      │   👤 Human      │   🤖 Agent      │  👤 Human     │
│                 │                 │   ⚠️ No skill   │               │
│                 │                 │   [Generate]    │               │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
```

### Preset Selector

Quick application of common patterns:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Apply Preset:                                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │
│ │ Human Only  │ │ Agent Only  │ │ Supervised  │ │ Human Controlled│ │
│ │ HHHH        │ │ AAAA        │ │ HAAH        │ │ HHAH            │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Skill Requirements Queue

Dashboard showing pending skill requirements:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Skill Requirements Queue                                    [3 pending]│
├─────────────────────────────────────────────────────────────────────┤
│ ⚠️ Process invoices → Perform                                        │
│    Agent: invoice-processor-agent                                    │
│    [Generate Skill] [Link Existing] [Dismiss]                        │
├─────────────────────────────────────────────────────────────────────┤
│ ⚠️ Validate invoice data → Review                                    │
│    Agent: invoice-processor-agent                                    │
│    [Generate Skill] [Link Existing] [Dismiss]                        │
├─────────────────────────────────────────────────────────────────────┤
│ 🔄 Categorize expenses → Perform                          [Generating]│
│    Agent: expense-categorizer-agent                                  │
│    Draft skill being created...                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## LLM Skill Generation

When generating a skill from a requirement, the LLM receives:

### Input Context

```typescript
interface SkillGenerationContext {
  // The requirement
  taskName: string;
  taskDescription?: string;
  phase: ResponsibilityPhase;

  // The role context
  roleName: string;
  roleResponsibilities: string[];

  // The agent context
  agentName: string;
  agentRole: string;
  agentPurpose: string;
  existingSkills: Skill[];

  // The HAP context
  otherTasks: Array<{
    name: string;
    phases: PhaseAssignment[];
  }>;
}
```

### LLM Prompt Template

```
You are helping define an AI agent skill based on a task responsibility assignment.

## Context

**Agent**: {{agentName}}
- Role: {{agentRole}}
- Purpose: {{agentPurpose}}

**Task**: {{taskName}}
{{#if taskDescription}}
Description: {{taskDescription}}
{{/if}}

**Assigned Phase**: {{phase}}
- manage: Sets goals, priorities, constraints
- define: Specifies requirements, acceptance criteria
- perform: Executes the actual work
- review: Validates output, provides feedback

**Role Context**: {{roleName}}
Responsibilities:
{{#each roleResponsibilities}}
- {{this}}
{{/each}}

## Existing Agent Skills
{{#each existingSkills}}
- {{name}}: {{description}}
{{/each}}

## Task

Generate a skill definition for the agent to handle the "{{phase}}" phase of the "{{taskName}}" task.

The skill should:
1. Have a clear name and description
2. Define appropriate triggers for this phase
3. Specify inputs and outputs
4. Include acceptance criteria
5. Consider failure modes

Return the skill as a JSON object matching the Skill schema.
```

### Output

The LLM returns a complete Skill object that can be reviewed and added to the Agent Story.

## Migration from As-Is/To-Be

### Mapping Rules

| Old Field | New Mapping |
|-----------|-------------|
| `currentOwner: 'human'` | All phases → 'human' |
| `currentOwner: 'agent'` | All phases → 'agent' |
| `currentOwner: 'shared'` | Manage/Review → 'human', Define/Perform → 'agent' |
| `targetOwner` | Removed (no longer needed) |
| `asIs` / `toBe` | Removed (replaced by current phase assignments) |

### Migration Script

```typescript
function migrateTaskAssignment(old: OldTaskAssignment): TaskResponsibility {
  const ownerToPreset = {
    'human': 'human-only',
    'agent': 'agent-only',
    'shared': 'collaborative'
  };

  const preset = RESPONSIBILITY_PRESETS[ownerToPreset[old.currentOwner]];

  return {
    id: old.id,
    taskName: old.taskName,
    description: old.description,
    phases: {
      manage: { phase: 'manage', owner: preset.manage },
      define: { phase: 'define', owner: preset.define },
      perform: { phase: 'perform', owner: preset.perform },
      review: { phase: 'review', owner: preset.review }
    },
    integrationStatus: 'not_started',
    blockers: old.blockers,
    targetDate: old.targetDate,
    notes: old.notes
  };
}
```

## API Endpoints

### HAP Endpoints (Updated)

```
GET    /api/haps/:id                    Get HAP with task responsibilities
PUT    /api/haps/:id/tasks/:taskId      Update task responsibility phases
POST   /api/haps/:id/tasks/:taskId/apply-preset  Apply a preset pattern
```

### Skill Requirements Endpoints (New)

```
GET    /api/skill-requirements                    List all pending requirements
GET    /api/skill-requirements?hapId=:id          List requirements for a HAP
POST   /api/skill-requirements/:id/generate       Trigger LLM skill generation
PUT    /api/skill-requirements/:id                Update requirement status
POST   /api/skill-requirements/:id/apply          Apply generated skill to Agent Story
DELETE /api/skill-requirements/:id                Reject/dismiss requirement
```

## Metrics and Reporting

### HAP Integration Progress

```typescript
interface HAPIntegrationMetrics {
  totalTasks: number;

  // Phase distribution
  phasesByOwner: {
    human: number;  // Total human-owned phases
    agent: number;  // Total agent-owned phases
  };

  // Agent integration status
  agentPhases: {
    total: number;           // Total phases assigned to agent
    withSkills: number;      // Phases with linked skills
    pendingSkills: number;   // Phases waiting for skills
  };

  // Task-level status
  taskStatus: {
    notStarted: number;
    partiallyDefined: number;
    ready: number;
    active: number;
  };
}
```

### Organization-Level Dashboard

Show aggregated metrics across all HAPs:
- Total agent phases pending skills
- Skill generation queue depth
- Integration progress by department
- Most common responsibility patterns

## Phase Metadata

```typescript
export const RESPONSIBILITY_PHASE_METADATA = {
  manage: {
    label: 'Manage',
    description: 'Sets goals, priorities, constraints, and deadlines',
    icon: 'target',
    color: 'blue',
    examples: [
      'Prioritize this task',
      'Set deadline for completion',
      'Define resource constraints'
    ]
  },
  define: {
    label: 'Define',
    description: 'Specifies what needs to be done and acceptance criteria',
    icon: 'file-text',
    color: 'purple',
    examples: [
      'Write requirements',
      'Define success criteria',
      'Specify expected outputs'
    ]
  },
  perform: {
    label: 'Perform',
    description: 'Executes the actual work',
    icon: 'play',
    color: 'green',
    examples: [
      'Process the data',
      'Write the code',
      'Generate the report'
    ]
  },
  review: {
    label: 'Review',
    description: 'Validates output, provides feedback, approves or rejects',
    icon: 'check-circle',
    color: 'orange',
    examples: [
      'Check for accuracy',
      'Approve the result',
      'Request revisions'
    ]
  }
} as const;
```

## Removed Concepts

The following concepts from the As-Is/To-Be model are removed:

| Removed | Reason |
|---------|--------|
| `asIs` state | No longer tracking "current" vs "target" |
| `toBe` state | Replaced by single set of phase assignments |
| `currentOwner` | Replaced by per-phase owner |
| `targetOwner` | No longer needed |
| `transitionStatus` | Replaced by `integrationStatus` |
| `HAPState` schema | Replaced by `TaskResponsibility` |
| `TransitionStatusEnum` | Replaced by integration status |
| Transformation bar component | Replaced by phase assignment grid |
| Percentage calculations | Replaced by phase counts |

## Summary

This specification replaces the binary As-Is/To-Be ownership model with a richer responsibility phase model that:

1. **Captures how work actually happens** - iterative cycles of manage → define → perform → review
2. **Enables fine-grained control** - each phase can be independently assigned
3. **Creates actionable requirements** - agent phase assignments generate skill requirements
4. **Supports automation** - LLM can generate draft skills from requirements
5. **Tracks integration progress** - clear visibility into what's ready vs pending
