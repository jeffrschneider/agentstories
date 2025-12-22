import { z } from 'zod';

// ============================================
// Responsibility Phase Model
// ============================================

// The four phases of work responsibility
export const ResponsibilityPhaseEnum = z.enum([
  'manage',   // Sets goals, priorities, constraints
  'define',   // Specifies requirements, acceptance criteria
  'perform',  // Executes the work
  'review'    // Validates, provides feedback
]);

export type ResponsibilityPhase = z.infer<typeof ResponsibilityPhaseEnum>;

// Who owns a phase
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

  // If owner is 'agent', link to the skill that handles this
  // null means skill is required but not yet defined
  skillId: z.string().uuid().nullable().optional(),

  // Notes about this phase assignment
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
  integrationStatus: TaskIntegrationStatusEnum.default('not_started'),

  // Blockers preventing agent integration
  blockers: z.array(z.string()).optional(),

  // Target date for full integration
  targetDate: z.string().datetime().optional(),

  notes: z.string().max(500).optional()
});

export type TaskResponsibility = z.infer<typeof TaskResponsibilitySchema>;

// ============================================
// Responsibility Presets
// ============================================

export const RESPONSIBILITY_PRESETS = {
  // Human does everything
  'human-only': {
    label: 'Human Only',
    description: 'Human handles all phases',
    pattern: 'HHHH',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'human' as const,
      review: 'human' as const
    }
  },

  // Agent does everything (full autonomy)
  'agent-only': {
    label: 'Agent Only',
    description: 'Agent handles all phases autonomously',
    pattern: 'AAAA',
    phases: {
      manage: 'agent' as const,
      define: 'agent' as const,
      perform: 'agent' as const,
      review: 'agent' as const
    }
  },

  // Human manages and reviews, agent defines and performs
  'supervised-execution': {
    label: 'Supervised Execution',
    description: 'Human manages and reviews; agent defines and performs',
    pattern: 'HAAH',
    phases: {
      manage: 'human' as const,
      define: 'agent' as const,
      perform: 'agent' as const,
      review: 'human' as const
    }
  },

  // Human manages and defines, agent performs and self-reviews
  'directed-execution': {
    label: 'Directed Execution',
    description: 'Human directs; agent performs and self-reviews',
    pattern: 'HHAA',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'agent' as const,
      review: 'agent' as const
    }
  },

  // Human manages, defines, reviews; agent only performs
  'human-controlled': {
    label: 'Human Controlled',
    description: 'Human controls all except execution',
    pattern: 'HHAH',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'agent' as const,
      review: 'human' as const
    }
  },

  // Agent manages and defines, human performs and reviews
  'agent-directed': {
    label: 'Agent Directed',
    description: 'Agent directs; human performs and reviews',
    pattern: 'AAHH',
    phases: {
      manage: 'agent' as const,
      define: 'agent' as const,
      perform: 'human' as const,
      review: 'human' as const
    }
  }
} as const;

export type ResponsibilityPreset = keyof typeof RESPONSIBILITY_PRESETS;

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

  // Source of the requirement
  hapId: z.string().uuid(),
  taskId: z.string().uuid(),
  phase: ResponsibilityPhaseEnum,

  // Context for generation
  taskName: z.string(),
  taskDescription: z.string().optional(),
  roleContext: z.string().optional(),

  // Suggested capability (requires skills to implement)
  suggestedCapabilityName: z.string(),
  suggestedCapabilityDescription: z.string(),

  // Skills required to implement this capability
  requiredSkills: z.array(z.string()).optional(),

  // Status
  status: CapabilityRequirementStatusEnum,

  // Generated capability definition (when status is 'ready' or 'applied')
  // Using z.any() to avoid circular dependency with skill schema
  generatedCapability: z.any().optional(),

  // Target Agent Story
  agentStoryId: z.string().uuid(),

  // Tracking
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

  // The human in the pair
  personId: z.string().uuid(),

  // The role being shared
  roleId: z.string().uuid(),

  // The agent in the pair (links to AgentStory)
  agentStoryId: z.string().uuid(),

  // Task responsibilities (replaces asIs/toBe)
  tasks: z.array(TaskResponsibilitySchema).default([]),

  // Pending capability requirements generated from agent phase assignments
  capabilityRequirements: z.array(CapabilityRequirementSchema).default([]),

  // Overall integration status
  integrationStatus: HAPIntegrationStatusEnum.default('not_started'),

  // Summary metrics (computed)
  metrics: HAPMetricsSchema.optional(),

  // Notes about this HAP
  notes: z.string().max(1000).optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type HumanAgentPair = z.infer<typeof HumanAgentPairSchema>;

// ============================================
// Helper Functions
// ============================================

export function createPhaseAssignment(
  phase: ResponsibilityPhase,
  owner: PhaseOwner = 'human'
): PhaseAssignment {
  return {
    phase,
    owner,
    skillId: null
  };
}

export function createEmptyTaskResponsibility(taskName: string = ''): TaskResponsibility {
  return {
    id: crypto.randomUUID(),
    taskName,
    phases: {
      manage: createPhaseAssignment('manage', 'human'),
      define: createPhaseAssignment('define', 'human'),
      perform: createPhaseAssignment('perform', 'human'),
      review: createPhaseAssignment('review', 'human')
    },
    integrationStatus: 'not_started'
  };
}

export function createTaskFromPreset(
  taskName: string,
  preset: ResponsibilityPreset
): TaskResponsibility {
  const presetConfig = RESPONSIBILITY_PRESETS[preset];
  return {
    id: crypto.randomUUID(),
    taskName,
    phases: {
      manage: createPhaseAssignment('manage', presetConfig.phases.manage),
      define: createPhaseAssignment('define', presetConfig.phases.define),
      perform: createPhaseAssignment('perform', presetConfig.phases.perform),
      review: createPhaseAssignment('review', presetConfig.phases.review)
    },
    integrationStatus: 'not_started'
  };
}

export function applyPresetToTask(
  task: TaskResponsibility,
  preset: ResponsibilityPreset
): TaskResponsibility {
  const presetConfig = RESPONSIBILITY_PRESETS[preset];
  return {
    ...task,
    phases: {
      manage: { ...task.phases.manage, owner: presetConfig.phases.manage },
      define: { ...task.phases.define, owner: presetConfig.phases.define },
      perform: { ...task.phases.perform, owner: presetConfig.phases.perform },
      review: { ...task.phases.review, owner: presetConfig.phases.review }
    }
  };
}

export function createEmptyHAP(
  personId: string,
  roleId: string,
  agentStoryId: string
): HumanAgentPair {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    personId,
    roleId,
    agentStoryId,
    tasks: [],
    capabilityRequirements: [],
    integrationStatus: 'not_started',
    createdAt: now,
    updatedAt: now
  };
}

export function createCapabilityRequirement(
  hapId: string,
  taskId: string,
  taskName: string,
  phase: ResponsibilityPhase,
  agentStoryId: string,
  taskDescription?: string
): CapabilityRequirement {
  const now = new Date().toISOString();

  // Generate suggested capability name based on phase and task
  const phaseVerbs: Record<ResponsibilityPhase, string> = {
    manage: 'Manage',
    define: 'Define',
    perform: 'Execute',
    review: 'Review'
  };

  return {
    id: crypto.randomUUID(),
    hapId,
    taskId,
    phase,
    taskName,
    taskDescription,
    suggestedCapabilityName: `${phaseVerbs[phase]} ${taskName}`,
    suggestedCapabilityDescription: `Capability to ${phase} the "${taskName}" task`,
    status: 'pending',
    agentStoryId,
    createdAt: now,
    updatedAt: now
  };
}

// ============================================
// Metric Calculation Functions
// ============================================

export function calculateHAPMetrics(hap: HumanAgentPair): HAPMetrics {
  const tasks = hap.tasks;
  const totalTasks = tasks.length;
  const totalPhases = totalTasks * 4;

  let humanPhases = 0;
  let agentPhases = 0;
  let agentPhasesWithSkills = 0;
  let readyTasks = 0;

  for (const task of tasks) {
    const phases = Object.values(task.phases);
    let taskAgentPhasesReady = true;
    let hasAgentPhase = false;

    for (const phase of phases) {
      if (phase.owner === 'human') {
        humanPhases++;
      } else {
        agentPhases++;
        hasAgentPhase = true;
        if (phase.skillId) {
          agentPhasesWithSkills++;
        } else {
          taskAgentPhasesReady = false;
        }
      }
    }

    // A task is ready if all its agent phases have skills (or it has no agent phases)
    if (!hasAgentPhase || taskAgentPhasesReady) {
      readyTasks++;
    }
  }

  const pendingCapabilityRequirements = hap.capabilityRequirements.filter(
    r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
  ).length;

  return {
    totalTasks,
    totalPhases,
    humanPhases,
    agentPhases,
    agentPhasesWithSkills,
    agentPhasesPendingSkills: agentPhases - agentPhasesWithSkills,
    pendingCapabilityRequirements,
    readyTasks
  };
}

export function determineIntegrationStatus(hap: HumanAgentPair): HAPIntegrationStatus {
  if (hap.tasks.length === 0) {
    return 'not_started';
  }

  const metrics = calculateHAPMetrics(hap);

  // If no agent phases, we're in planning mode
  if (metrics.agentPhases === 0) {
    return 'planning';
  }

  // If some agent phases don't have skills, we're waiting
  if (metrics.agentPhasesPendingSkills > 0) {
    return 'skills_pending';
  }

  // All agent phases have skills - we're ready
  return 'ready';
}

export function determineTaskIntegrationStatus(task: TaskResponsibility): TaskIntegrationStatus {
  const phases = Object.values(task.phases);
  const agentPhases = phases.filter(p => p.owner === 'agent');

  if (agentPhases.length === 0) {
    return 'not_started';
  }

  const allHaveSkills = agentPhases.every(p => p.skillId);
  if (allHaveSkills) {
    return 'ready';
  }

  return 'partially_defined';
}

// ============================================
// Phase Distribution Calculation
// ============================================

export function calculatePhaseDistribution(tasks: TaskResponsibility[]): {
  human: number;
  agent: number;
  humanPercent: number;
  agentPercent: number;
} {
  if (tasks.length === 0) {
    return { human: 0, agent: 0, humanPercent: 100, agentPercent: 0 };
  }

  let human = 0;
  let agent = 0;

  for (const task of tasks) {
    for (const phase of Object.values(task.phases)) {
      if (phase.owner === 'human') {
        human++;
      } else {
        agent++;
      }
    }
  }

  const total = human + agent;
  return {
    human,
    agent,
    humanPercent: Math.round((human / total) * 100),
    agentPercent: Math.round((agent / total) * 100)
  };
}

// ============================================
// Metadata for UI
// ============================================

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

export const PHASE_OWNER_METADATA = {
  human: {
    label: 'Human',
    description: 'Human is responsible for this phase',
    icon: 'user',
    color: 'blue'
  },
  agent: {
    label: 'Agent',
    description: 'Agent is responsible for this phase',
    icon: 'bot',
    color: 'purple'
  }
} as const;

export const INTEGRATION_STATUS_METADATA = {
  not_started: {
    label: 'Not Started',
    description: 'No task responsibilities defined yet',
    color: 'gray',
    icon: 'circle'
  },
  planning: {
    label: 'Planning',
    description: 'Defining task responsibilities',
    color: 'blue',
    icon: 'edit'
  },
  skills_pending: {
    label: 'Skills Pending',
    description: 'Waiting for agent skills to be defined',
    color: 'yellow',
    icon: 'clock'
  },
  ready: {
    label: 'Ready',
    description: 'All skills defined, ready for use',
    color: 'green',
    icon: 'check-circle'
  },
  active: {
    label: 'Active',
    description: 'Currently in production use',
    color: 'emerald',
    icon: 'play-circle'
  },
  paused: {
    label: 'Paused',
    description: 'Temporarily paused',
    color: 'orange',
    icon: 'pause-circle'
  }
} as const;

export const CAPABILITY_REQUIREMENT_STATUS_METADATA = {
  pending: {
    label: 'Pending',
    description: 'Waiting to be processed',
    color: 'gray',
    icon: 'clock'
  },
  generating: {
    label: 'Generating',
    description: 'AI is generating the capability',
    color: 'blue',
    icon: 'loader'
  },
  ready: {
    label: 'Ready for Review',
    description: 'Draft capability ready for review',
    color: 'yellow',
    icon: 'eye'
  },
  applied: {
    label: 'Applied',
    description: 'Capability added to Agent Story',
    color: 'green',
    icon: 'check'
  },
  rejected: {
    label: 'Rejected',
    description: 'Requirement was dismissed',
    color: 'red',
    icon: 'x'
  }
} as const;

// ============================================
// Migration Helper (from old As-Is/To-Be model)
// ============================================

/**
 * @deprecated Use for migration only
 * Maps old TaskOwner values to responsibility presets
 */
export function migrateOldTaskOwner(
  oldOwner: 'human' | 'agent' | 'shared'
): ResponsibilityPreset {
  switch (oldOwner) {
    case 'human':
      return 'human-only';
    case 'agent':
      return 'agent-only';
    case 'shared':
      return 'human-controlled'; // Shared maps to human controls, agent performs
    default:
      return 'human-only';
  }
}

// ============================================
// Agent Skill Coverage Validation
// ============================================

export interface AgentPhaseRequirement {
  taskId: string;
  taskName: string;
  phase: ResponsibilityPhase;
  hasSkillAssigned: boolean;
  assignedSkillId: string | null;
  assignedSkillName?: string;
}

export interface SkillCoverageAnalysis {
  totalAgentPhases: number;
  phasesWithSkills: number;
  phasesWithoutSkills: number;
  coveragePercent: number;
  isFullyCovered: boolean;
  uncoveredPhases: AgentPhaseRequirement[];
  coveredPhases: AgentPhaseRequirement[];
}

/**
 * Analyzes whether the agent's skills cover all assigned task phases.
 * Returns coverage metrics and identifies gaps.
 */
export function analyzeAgentSkillCoverage(
  tasks: TaskResponsibility[],
  agentSkills?: Array<{ id?: string; name: string; domain: string }>
): SkillCoverageAnalysis {
  const uncoveredPhases: AgentPhaseRequirement[] = [];
  const coveredPhases: AgentPhaseRequirement[] = [];

  // Create a map of skill IDs to names for quick lookup
  const skillMap = new Map<string, string>();
  if (agentSkills) {
    for (const skill of agentSkills) {
      if (skill.id) {
        skillMap.set(skill.id, skill.name);
      }
    }
  }

  // Analyze each task's phases
  for (const task of tasks) {
    for (const [phaseName, phaseData] of Object.entries(task.phases)) {
      if (phaseData.owner === 'agent') {
        const hasSkill = !!phaseData.skillId && skillMap.has(phaseData.skillId);
        const requirement: AgentPhaseRequirement = {
          taskId: task.id,
          taskName: task.taskName,
          phase: phaseName as ResponsibilityPhase,
          hasSkillAssigned: hasSkill,
          assignedSkillId: phaseData.skillId || null,
          assignedSkillName: phaseData.skillId ? skillMap.get(phaseData.skillId) : undefined,
        };

        if (hasSkill) {
          coveredPhases.push(requirement);
        } else {
          uncoveredPhases.push(requirement);
        }
      }
    }
  }

  const totalAgentPhases = coveredPhases.length + uncoveredPhases.length;
  const phasesWithSkills = coveredPhases.length;
  const phasesWithoutSkills = uncoveredPhases.length;
  const coveragePercent = totalAgentPhases > 0
    ? Math.round((phasesWithSkills / totalAgentPhases) * 100)
    : 100;

  return {
    totalAgentPhases,
    phasesWithSkills,
    phasesWithoutSkills,
    coveragePercent,
    isFullyCovered: phasesWithoutSkills === 0,
    uncoveredPhases,
    coveredPhases,
  };
}

/**
 * Validates that a HAP has proper agent assignment.
 * Returns validation issues if any.
 */
export interface HAPValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function validateHAPAgentAssignment(
  hap: {
    agentStoryId: string;
    tasks: TaskResponsibility[];
  },
  agentStory?: {
    id: string;
    name: string;
    skills?: Array<{ id?: string; name: string; domain: string }>;
  }
): HAPValidationIssue[] {
  const issues: HAPValidationIssue[] = [];

  // Check if agent story is assigned
  if (!hap.agentStoryId) {
    issues.push({
      type: 'error',
      code: 'NO_AGENT_ASSIGNED',
      message: 'No agent story is assigned to this HAP',
    });
    return issues;
  }

  // Check if assigned agent story exists
  if (!agentStory) {
    issues.push({
      type: 'error',
      code: 'AGENT_NOT_FOUND',
      message: 'The assigned agent story could not be found',
      details: { agentStoryId: hap.agentStoryId },
    });
    return issues;
  }

  // Check if agent story IDs match
  if (agentStory.id !== hap.agentStoryId) {
    issues.push({
      type: 'error',
      code: 'AGENT_ID_MISMATCH',
      message: 'The provided agent story does not match the HAP assignment',
      details: { expected: hap.agentStoryId, provided: agentStory.id },
    });
    return issues;
  }

  // Analyze skill coverage
  const coverage = analyzeAgentSkillCoverage(hap.tasks, agentStory.skills);

  // Check if agent has any skills
  if (!agentStory.skills || agentStory.skills.length === 0) {
    if (coverage.totalAgentPhases > 0) {
      issues.push({
        type: 'warning',
        code: 'AGENT_NO_SKILLS',
        message: `Agent "${agentStory.name}" has no skills defined but is assigned to ${coverage.totalAgentPhases} phase(s)`,
        details: { agentName: agentStory.name, agentPhases: coverage.totalAgentPhases },
      });
    }
  }

  // Check for uncovered phases
  if (coverage.phasesWithoutSkills > 0) {
    issues.push({
      type: 'warning',
      code: 'INCOMPLETE_SKILL_COVERAGE',
      message: `${coverage.phasesWithoutSkills} of ${coverage.totalAgentPhases} agent phase(s) don't have skills assigned (${coverage.coveragePercent}% coverage)`,
      details: {
        coverage,
        uncoveredPhases: coverage.uncoveredPhases.map(p => ({
          task: p.taskName,
          phase: p.phase,
        })),
      },
    });
  }

  return issues;
}
