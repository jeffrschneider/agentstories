import { z } from 'zod';

// ============================================
// Task Assignment Schema
// ============================================

// Who owns a task
export const TaskOwnerEnum = z.enum([
  'human',    // Human handles this task
  'agent',    // Agent handles this task
  'shared'    // Human and agent collaborate on this task
]);

export type TaskOwner = z.infer<typeof TaskOwnerEnum>;

// A task assignment within a HAP
export const TaskAssignmentSchema = z.object({
  id: z.string().uuid(),
  // Task name/description (often derived from role responsibilities)
  taskName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),

  // As-Is: Who currently handles this task
  currentOwner: TaskOwnerEnum,

  // To-Be: Who should handle this task in the future
  targetOwner: TaskOwnerEnum,

  // Blockers preventing transition from As-Is to To-Be
  blockers: z.array(z.string()).optional(),

  // Target date for completing the transition
  targetDate: z.string().datetime().optional(),

  // Notes about this task assignment
  notes: z.string().max(500).optional()
});

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;

// ============================================
// HAP State Schema (As-Is or To-Be snapshot)
// ============================================

export const HAPStateSchema = z.object({
  // Task-level breakdown
  taskAssignments: z.array(TaskAssignmentSchema).default([]),

  // Aggregate percentages (computed from task assignments or set manually)
  humanPercent: z.number().min(0).max(100),
  agentPercent: z.number().min(0).max(100),

  // When this state is/was effective
  effectiveDate: z.string().datetime().optional()
});

export type HAPState = z.infer<typeof HAPStateSchema>;

// ============================================
// Transition Status
// ============================================

export const TransitionStatusEnum = z.enum([
  'not_started',   // No transition planned yet
  'planned',       // Transition planned but not started
  'in_progress',   // Currently transitioning
  'blocked',       // Blocked by issues
  'completed'      // Transition complete (As-Is matches To-Be)
]);

export type TransitionStatus = z.infer<typeof TransitionStatusEnum>;

// ============================================
// Human-Agent Pair (HAP) Schema
// ============================================

export const HumanAgentPairSchema = z.object({
  id: z.string().uuid(),

  // The human in the pair
  personId: z.string().uuid(),

  // The role being shared
  roleId: z.string().uuid(),

  // The agent in the pair (links to AgentStory)
  agentStoryId: z.string().uuid(),

  // Current state (As-Is)
  asIs: HAPStateSchema,

  // Target state (To-Be)
  toBe: HAPStateSchema,

  // Overall transition status
  transitionStatus: TransitionStatusEnum.default('not_started'),

  // Summary of blockers across all tasks
  topBlockers: z.array(z.string()).optional(),

  // Target completion date for full transition
  targetCompletionDate: z.string().datetime().optional(),

  // Notes about this HAP
  notes: z.string().max(1000).optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type HumanAgentPair = z.infer<typeof HumanAgentPairSchema>;

// ============================================
// Helper Functions
// ============================================

export function createEmptyTaskAssignment(): TaskAssignment {
  return {
    id: crypto.randomUUID(),
    taskName: '',
    currentOwner: 'human',
    targetOwner: 'human'
  };
}

export function createEmptyHAPState(): HAPState {
  return {
    taskAssignments: [],
    humanPercent: 100,
    agentPercent: 0
  };
}

export function createEmptyHAP(personId: string, roleId: string, agentStoryId: string): HumanAgentPair {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    personId,
    roleId,
    agentStoryId,
    asIs: createEmptyHAPState(),
    toBe: createEmptyHAPState(),
    transitionStatus: 'not_started',
    createdAt: now,
    updatedAt: now
  };
}

// Calculate percentages from task assignments
export function calculateHAPPercentages(tasks: TaskAssignment[], useTarget = false): { humanPercent: number; agentPercent: number } {
  if (tasks.length === 0) {
    return { humanPercent: 100, agentPercent: 0 };
  }

  const owner = useTarget ? 'targetOwner' : 'currentOwner';
  let humanCount = 0;
  let agentCount = 0;
  let sharedCount = 0;

  for (const task of tasks) {
    switch (task[owner]) {
      case 'human':
        humanCount++;
        break;
      case 'agent':
        agentCount++;
        break;
      case 'shared':
        sharedCount++;
        break;
    }
  }

  const total = tasks.length;
  // Shared tasks count as 50% for each
  const humanPercent = Math.round(((humanCount + sharedCount * 0.5) / total) * 100);
  const agentPercent = Math.round(((agentCount + sharedCount * 0.5) / total) * 100);

  return { humanPercent, agentPercent };
}

// Determine transition status from task assignments
export function determineTransitionStatus(tasks: TaskAssignment[]): TransitionStatus {
  if (tasks.length === 0) {
    return 'not_started';
  }

  const hasBlockers = tasks.some(t => t.blockers && t.blockers.length > 0);
  const allMatched = tasks.every(t => t.currentOwner === t.targetOwner);
  const anyChanged = tasks.some(t => t.currentOwner !== t.targetOwner);

  if (allMatched) {
    return 'completed';
  }

  if (hasBlockers) {
    return 'blocked';
  }

  if (anyChanged) {
    return 'in_progress';
  }

  return 'planned';
}

// ============================================
// Metadata for UI
// ============================================

export const TASK_OWNER_METADATA = {
  human: {
    label: 'Human',
    description: 'Task handled by the human',
    icon: 'user',
    color: 'blue'
  },
  agent: {
    label: 'Agent',
    description: 'Task handled by the AI agent',
    icon: 'bot',
    color: 'purple'
  },
  shared: {
    label: 'Shared',
    description: 'Human and agent collaborate',
    icon: 'users',
    color: 'green'
  }
} as const;

export const TRANSITION_STATUS_METADATA = {
  not_started: {
    label: 'Not Started',
    description: 'Transition not yet planned',
    color: 'gray'
  },
  planned: {
    label: 'Planned',
    description: 'Transition planned but not started',
    color: 'blue'
  },
  in_progress: {
    label: 'In Progress',
    description: 'Currently transitioning',
    color: 'yellow'
  },
  blocked: {
    label: 'Blocked',
    description: 'Transition blocked by issues',
    color: 'red'
  },
  completed: {
    label: 'Completed',
    description: 'Transition complete',
    color: 'green'
  }
} as const;
