import * as React from "react";
import {
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { HumanAgentPair, HAPIntegrationStatus } from "@/lib/schemas/hap";

// Helper to calculate department-wide metrics using new Responsibility Phase Model
export function calculateDepartmentMetrics(haps: HumanAgentPair[]) {
  if (haps.length === 0) {
    return {
      totalHAPs: 0,
      totalTasks: 0,
      humanPhasesPercent: 100,
      agentPhasesPercent: 0,
      avgProgress: 0,
      statusBreakdown: {
        not_started: 0,
        planning: 0,
        skills_pending: 0,
        ready: 0,
        active: 0,
        paused: 0,
      },
    };
  }

  let totalTasks = 0;
  let humanPhases = 0;
  let agentPhases = 0;

  const statusBreakdown: Record<HAPIntegrationStatus, number> = {
    not_started: 0,
    planning: 0,
    skills_pending: 0,
    ready: 0,
    active: 0,
    paused: 0,
  };

  haps.forEach((hap) => {
    statusBreakdown[hap.integrationStatus]++;

    // Tasks use new Responsibility Phase Model
    (hap.tasks ?? []).forEach((task) => {
      totalTasks++;
      Object.values(task.phases).forEach((phase) => {
        if (phase.owner === "human") {
          humanPhases++;
        } else {
          agentPhases++;
        }
      });
    });
  });

  const totalPhases = humanPhases + agentPhases;

  // Calculate average progress (based on agent phases that have skills assigned)
  const avgProgress =
    haps.length > 0
      ? haps.reduce((sum, hap) => {
          const tasks = hap.tasks ?? [];
          let hapAgentPhases = 0;
          let hapAgentPhasesWithSkills = 0;
          tasks.forEach((task) => {
            Object.values(task.phases).forEach((phase) => {
              if (phase.owner === "agent") {
                hapAgentPhases++;
                if (phase.skillId) hapAgentPhasesWithSkills++;
              }
            });
          });
          // If no agent phases, consider it 100% complete
          return sum + (hapAgentPhases > 0 ? (hapAgentPhasesWithSkills / hapAgentPhases) * 100 : 100);
        }, 0) / haps.length
      : 0;

  return {
    totalHAPs: haps.length,
    totalTasks,
    humanPhasesPercent: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
    agentPhasesPercent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
    avgProgress: Math.round(avgProgress),
    statusBreakdown,
  };
}

export const statusConfig: Record<
  HAPIntegrationStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  not_started: { label: "Not Started", color: "bg-gray-500", icon: Clock },
  planning: { label: "Planning", color: "bg-blue-500", icon: Target },
  skills_pending: { label: "Skills Pending", color: "bg-yellow-500", icon: TrendingUp },
  ready: { label: "Ready", color: "bg-green-500", icon: CheckCircle2 },
  active: { label: "Active", color: "bg-emerald-500", icon: CheckCircle2 },
  paused: { label: "Paused", color: "bg-orange-500", icon: AlertTriangle },
};

export type DepartmentMetrics = ReturnType<typeof calculateDepartmentMetrics>;
