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
  // Calculate overall metrics
  const metrics = React.useMemo(() => {
    const totalTasks = haps.reduce(
      (sum, h) => sum + h.asIs.taskAssignments.length,
      0
    );

    let asIsHuman = 0, asIsAgent = 0, asIsShared = 0;
    let toBeHuman = 0, toBeAgent = 0, toBeShared = 0;

    haps.forEach((hap) => {
      hap.asIs.taskAssignments.forEach((task) => {
        if (task.currentOwner === "human") asIsHuman++;
        else if (task.currentOwner === "agent") asIsAgent++;
        else asIsShared++;

        if (task.targetOwner === "human") toBeHuman++;
        else if (task.targetOwner === "agent") toBeAgent++;
        else toBeShared++;
      });
    });

    const total = asIsHuman + asIsAgent + asIsShared;

    return {
      totalTasks,
      asIs: {
        human: total > 0 ? Math.round((asIsHuman / total) * 100) : 0,
        agent: total > 0 ? Math.round((asIsAgent / total) * 100) : 0,
        shared: total > 0 ? Math.round((asIsShared / total) * 100) : 0,
      },
      toBe: {
        human: total > 0 ? Math.round((toBeHuman / total) * 100) : 0,
        agent: total > 0 ? Math.round((toBeAgent / total) * 100) : 0,
        shared: total > 0 ? Math.round((toBeShared / total) * 100) : 0,
      },
      completedHaps: haps.filter((h) => h.transitionStatus === "completed").length,
      inProgressHaps: haps.filter((h) => h.transitionStatus === "in_progress").length,
      blockedHaps: haps.filter((h) => h.transitionStatus === "blocked").length,
    };
  }, [haps]);

  const overallProgress = React.useMemo(() => {
    if (haps.length === 0) return 0;
    const totalTasks = haps.reduce((sum, h) => sum + h.asIs.taskAssignments.length, 0);
    const completedTasks = haps.reduce(
      (sum, h) =>
        sum + h.asIs.taskAssignments.filter((t) => t.currentOwner === t.targetOwner).length,
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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
