"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Briefcase,
  Bot,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OwnershipChart, TransformationBar } from "@/components/hap";
import type { HumanAgentPair, BusinessDomain, Department, Role, Person } from "@/lib/schemas";

interface OrgSummaryProps {
  domains: BusinessDomain[];
  departments: Department[];
  roles: Role[];
  people: Person[];
  haps: HumanAgentPair[];
}

export function OrgSummary({
  domains,
  departments,
  roles,
  people,
  haps,
}: OrgSummaryProps) {
  // Calculate overall metrics using new Responsibility Phase Model
  const metrics = React.useMemo(() => {
    const totalTasks = haps.reduce(
      (sum, h) => sum + (h.tasks?.length ?? 0),
      0
    );

    let humanPhases = 0;
    let agentPhases = 0;

    haps.forEach((hap) => {
      (hap.tasks ?? []).forEach((task) => {
        // Count phases by owner
        Object.values(task.phases).forEach((phase) => {
          if (phase.owner === "human") humanPhases++;
          else agentPhases++;
        });
      });
    });

    const totalPhases = humanPhases + agentPhases;

    // In new model, there's no "shared" - phases are either human or agent
    // We keep the structure for backward compatibility with OwnershipChart
    return {
      totalTasks,
      asIs: {
        human: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
        agent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
        shared: 0, // No shared in new model
      },
      toBe: {
        human: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
        agent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
        shared: 0, // No shared in new model
      },
      // Map new integration statuses to legacy status counts
      completedHaps: haps.filter((h) => h.integrationStatus === "ready" || h.integrationStatus === "active").length,
      inProgressHaps: haps.filter((h) => h.integrationStatus === "planning" || h.integrationStatus === "skills_pending").length,
      blockedHaps: haps.filter((h) => h.integrationStatus === "paused").length,
    };
  }, [haps]);

  const overallProgress = React.useMemo(() => {
    if (haps.length === 0) return 0;

    // Calculate progress based on agent phases that have skills assigned
    let totalAgentPhases = 0;
    let agentPhasesWithSkills = 0;

    haps.forEach((hap) => {
      (hap.tasks ?? []).forEach((task) => {
        Object.values(task.phases).forEach((phase) => {
          if (phase.owner === "agent") {
            totalAgentPhases++;
            if (phase.skillId) {
              agentPhasesWithSkills++;
            }
          }
        });
      });
    });

    // If no agent phases, consider it 100% complete (all human work)
    if (totalAgentPhases === 0) return 100;

    return Math.round((agentPhasesWithSkills / totalAgentPhases) * 100);
  }, [haps]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Organization Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-blue-500" />
              Domains
            </span>
            <span className="font-bold">{domains.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-green-500" />
              Departments
            </span>
            <span className="font-bold">{departments.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Roles
            </span>
            <span className="font-bold">{roles.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-orange-500" />
              HAPs
            </span>
            <span className="font-bold">{haps.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overall Transformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-3xl font-bold">{overallProgress}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.completedHaps} of {haps.length} HAPs complete
              </p>
            </div>
            <Progress value={overallProgress} className="h-3 w-24" />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{metrics.completedHaps} done</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>{metrics.inProgressHaps} active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>{metrics.blockedHaps} blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Task Ownership
          </CardTitle>
        </CardHeader>
        <CardContent>
          {haps.length > 0 ? (
            <OwnershipChart
              humanPercent={metrics.asIs.human}
              agentPercent={metrics.asIs.agent}
              sharedPercent={metrics.asIs.shared}
              size="sm"
              showLegend={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No HAPs yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transformation Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transformation Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          {haps.length > 0 ? (
            <TransformationBar
              asIs={metrics.asIs}
              toBe={metrics.toBe}
              showLabels={true}
              showArrow={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No HAPs yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
