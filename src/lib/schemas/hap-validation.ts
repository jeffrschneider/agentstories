import type { ResponsibilityPhase, TaskResponsibility } from './hap-schemas';

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

  const skillMap = new Map<string, string>();
  if (agentSkills) {
    for (const skill of agentSkills) {
      if (skill.id) {
        skillMap.set(skill.id, skill.name);
      }
    }
  }

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

// ============================================
// HAP Validation
// ============================================

export interface HAPValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Validates that a HAP has proper agent assignment.
 * Returns validation issues if any.
 */
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

  if (!hap.agentStoryId) {
    issues.push({
      type: 'error',
      code: 'NO_AGENT_ASSIGNED',
      message: 'No agent story is assigned to this HAP',
    });
    return issues;
  }

  if (!agentStory) {
    issues.push({
      type: 'error',
      code: 'AGENT_NOT_FOUND',
      message: 'The assigned agent story could not be found',
      details: { agentStoryId: hap.agentStoryId },
    });
    return issues;
  }

  if (agentStory.id !== hap.agentStoryId) {
    issues.push({
      type: 'error',
      code: 'AGENT_ID_MISMATCH',
      message: 'The provided agent story does not match the HAP assignment',
      details: { expected: hap.agentStoryId, provided: agentStory.id },
    });
    return issues;
  }

  const coverage = analyzeAgentSkillCoverage(hap.tasks, agentStory.skills);

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
