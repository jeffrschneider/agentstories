import type {
  TaskResponsibility,
  HumanAgentPair,
  HAPMetrics,
  HAPIntegrationStatus,
  TaskIntegrationStatus,
} from './hap-schemas';

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

  if (metrics.agentPhases === 0) {
    return 'planning';
  }

  if (metrics.agentPhasesPendingSkills > 0) {
    return 'skills_pending';
  }

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
