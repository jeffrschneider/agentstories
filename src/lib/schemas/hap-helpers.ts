import type {
  ResponsibilityPhase,
  PhaseOwner,
  PhaseAssignment,
  TaskResponsibility,
  HumanAgentPair,
  CapabilityRequirement,
} from './hap-schemas';
import { RESPONSIBILITY_PRESETS, type ResponsibilityPreset } from './hap-presets';

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
      return 'human-controlled';
    default:
      return 'human-only';
  }
}
