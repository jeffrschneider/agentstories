"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  ArrowLeft,
  Users,
  Bot,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDepartment,
  useHAPs,
  usePeople,
  useRoles,
  useDepartmentStats,
} from "@/hooks";
import type { HumanAgentPair, TransitionStatus } from "@/lib/schemas/hap";

// Helper to calculate department-wide metrics
function calculateDepartmentMetrics(haps: HumanAgentPair[]) {
  if (haps.length === 0) {
    return {
      totalHAPs: 0,
      totalTasks: 0,
      asIsHumanPercent: 0,
      asIsAgentPercent: 0,
      asIsSharedPercent: 0,
      toBeHumanPercent: 0,
      toBeAgentPercent: 0,
      toBeSharedPercent: 0,
      avgProgress: 0,
      statusBreakdown: {
        not_started: 0,
        planned: 0,
        in_progress: 0,
        blocked: 0,
        completed: 0,
      },
    };
  }

  let totalTasks = 0;
  let asIsHuman = 0,
    asIsAgent = 0,
    asIsShared = 0;
  let toBeHuman = 0,
    toBeAgent = 0,
    toBeShared = 0;
  const statusBreakdown: Record<TransitionStatus, number> = {
    not_started: 0,
    planned: 0,
    in_progress: 0,
    blocked: 0,
    completed: 0,
  };

  haps.forEach((hap) => {
    statusBreakdown[hap.transitionStatus]++;

    // Task assignments are inside asIs state
    hap.asIs.taskAssignments.forEach((task) => {
      totalTasks++;
      // As-Is counts
      if (task.currentOwner === "human") asIsHuman++;
      else if (task.currentOwner === "agent") asIsAgent++;
      else asIsShared++;
      // To-Be counts
      if (task.targetOwner === "human") toBeHuman++;
      else if (task.targetOwner === "agent") toBeAgent++;
      else toBeShared++;
    });
  });

  const asIsTotal = asIsHuman + asIsAgent + asIsShared;
  const toBeTotal = toBeHuman + toBeAgent + toBeShared;

  // Calculate average progress across HAPs
  const avgProgress =
    haps.reduce((sum, hap) => {
      const completed = hap.asIs.taskAssignments.filter(
        (t) => t.currentOwner === t.targetOwner
      ).length;
      const total = hap.asIs.taskAssignments.length;
      return sum + (total > 0 ? (completed / total) * 100 : 0);
    }, 0) / haps.length;

  return {
    totalHAPs: haps.length,
    totalTasks,
    asIsHumanPercent: asIsTotal > 0 ? Math.round((asIsHuman / asIsTotal) * 100) : 0,
    asIsAgentPercent: asIsTotal > 0 ? Math.round((asIsAgent / asIsTotal) * 100) : 0,
    asIsSharedPercent: asIsTotal > 0 ? Math.round((asIsShared / asIsTotal) * 100) : 0,
    toBeHumanPercent: toBeTotal > 0 ? Math.round((toBeHuman / toBeTotal) * 100) : 0,
    toBeAgentPercent: toBeTotal > 0 ? Math.round((toBeAgent / toBeTotal) * 100) : 0,
    toBeSharedPercent: toBeTotal > 0 ? Math.round((toBeShared / toBeTotal) * 100) : 0,
    avgProgress: Math.round(avgProgress),
    statusBreakdown,
  };
}

const statusConfig: Record<
  TransitionStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  not_started: { label: "Not Started", color: "bg-gray-500", icon: Clock },
  planned: { label: "Planned", color: "bg-blue-500", icon: Target },
  in_progress: { label: "In Progress", color: "bg-yellow-500", icon: TrendingUp },
  blocked: { label: "Blocked", color: "bg-red-500", icon: AlertTriangle },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
};

export default function DepartmentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: department, isLoading: loadingDept } = useDepartment(id);
  const { data: allHAPs = [], isLoading: loadingHAPs } = useHAPs();
  const { data: people = [] } = usePeople();
  const { data: roles = [] } = useRoles();
  const { data: stats } = useDepartmentStats(id);

  // Filter HAPs for this department
  const departmentHAPs = React.useMemo(() => {
    const deptRoleIds = roles.filter((r) => r.departmentId === id).map((r) => r.id);
    return allHAPs.filter((hap) => deptRoleIds.includes(hap.roleId));
  }, [allHAPs, roles, id]);

  const metrics = React.useMemo(
    () => calculateDepartmentMetrics(departmentHAPs),
    [departmentHAPs]
  );

  const manager = people.find((p) => p.id === department?.managerId);

  if (loadingDept || loadingHAPs) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Department not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/organization")}
            >
              Back to Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organization">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{department.name}</h1>
          </div>
          {department.description && (
            <p className="text-muted-foreground mt-1">{department.description}</p>
          )}
        </div>
        {manager && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Manager</p>
            <p className="font-medium">{manager.name}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Human-Agent Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{metrics.totalHAPs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{metrics.totalTasks}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{metrics.avgProgress}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Adoption Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{metrics.toBeAgentPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transformation">Transformation</TabsTrigger>
          <TabsTrigger value="haps">HAPs ({metrics.totalHAPs})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Transition Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Transition Status</CardTitle>
              <CardDescription>
                Current status of HAP transitions in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {(Object.keys(statusConfig) as TransitionStatus[]).map((status) => {
                  const config = statusConfig[status];
                  const count = metrics.statusBreakdown[status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div className={`p-2 rounded-full ${config.color} bg-opacity-20`}>
                        <Icon className={`h-4 w-4 ${config.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Blockers Alert */}
          {metrics.statusBreakdown.blocked > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Blocked Transitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {departmentHAPs
                    .filter((hap) => hap.transitionStatus === "blocked")
                    .map((hap) => {
                      const person = people.find((p) => p.id === hap.personId);
                      const role = roles.find((r) => r.id === hap.roleId);
                      return (
                        <div
                          key={hap.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-background rounded border"
                        >
                          <div>
                            <p className="font-medium">{person?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {role?.name || "Unknown Role"}
                            </p>
                          </div>
                          <div className="text-right">
                            {hap.topBlockers && hap.topBlockers.length > 0 && (
                              <p className="text-sm text-red-600">{hap.topBlockers[0]}</p>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/haps/${hap.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transformation Tab */}
        <TabsContent value="transformation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* As-Is State */}
            <Card>
              <CardHeader>
                <CardTitle>Current State (As-Is)</CardTitle>
                <CardDescription>
                  How tasks are currently distributed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Human
                    </span>
                    <span>{metrics.asIsHumanPercent}%</span>
                  </div>
                  <Progress value={metrics.asIsHumanPercent} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" /> Agent
                    </span>
                    <span>{metrics.asIsAgentPercent}%</span>
                  </div>
                  <Progress value={metrics.asIsAgentPercent} className="h-2 [&>div]:bg-orange-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <Bot className="h-4 w-4 -ml-2" /> Shared
                    </span>
                    <span>{metrics.asIsSharedPercent}%</span>
                  </div>
                  <Progress value={metrics.asIsSharedPercent} className="h-2 [&>div]:bg-purple-500" />
                </div>
              </CardContent>
            </Card>

            {/* To-Be State */}
            <Card>
              <CardHeader>
                <CardTitle>Target State (To-Be)</CardTitle>
                <CardDescription>
                  How tasks will be distributed after transition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Human
                    </span>
                    <span>{metrics.toBeHumanPercent}%</span>
                  </div>
                  <Progress value={metrics.toBeHumanPercent} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" /> Agent
                    </span>
                    <span>{metrics.toBeAgentPercent}%</span>
                  </div>
                  <Progress value={metrics.toBeAgentPercent} className="h-2 [&>div]:bg-orange-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <Bot className="h-4 w-4 -ml-2" /> Shared
                    </span>
                    <span>{metrics.toBeSharedPercent}%</span>
                  </div>
                  <Progress value={metrics.toBeSharedPercent} className="h-2 [&>div]:bg-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transformation Delta */}
          <Card>
            <CardHeader>
              <CardTitle>Transformation Delta</CardTitle>
              <CardDescription>
                Change in task ownership from As-Is to To-Be
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Human Tasks</p>
                  <p className="text-2xl font-bold">
                    {metrics.asIsHumanPercent}% → {metrics.toBeHumanPercent}%
                  </p>
                  <p
                    className={`text-sm ${
                      metrics.toBeHumanPercent < metrics.asIsHumanPercent
                        ? "text-red-500"
                        : metrics.toBeHumanPercent > metrics.asIsHumanPercent
                        ? "text-green-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metrics.toBeHumanPercent - metrics.asIsHumanPercent > 0 ? "+" : ""}
                    {metrics.toBeHumanPercent - metrics.asIsHumanPercent}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Agent Tasks</p>
                  <p className="text-2xl font-bold">
                    {metrics.asIsAgentPercent}% → {metrics.toBeAgentPercent}%
                  </p>
                  <p
                    className={`text-sm ${
                      metrics.toBeAgentPercent > metrics.asIsAgentPercent
                        ? "text-green-500"
                        : metrics.toBeAgentPercent < metrics.asIsAgentPercent
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metrics.toBeAgentPercent - metrics.asIsAgentPercent > 0 ? "+" : ""}
                    {metrics.toBeAgentPercent - metrics.asIsAgentPercent}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Shared Tasks</p>
                  <p className="text-2xl font-bold">
                    {metrics.asIsSharedPercent}% → {metrics.toBeSharedPercent}%
                  </p>
                  <p
                    className={`text-sm ${
                      metrics.toBeSharedPercent !== metrics.asIsSharedPercent
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metrics.toBeSharedPercent - metrics.asIsSharedPercent > 0 ? "+" : ""}
                    {metrics.toBeSharedPercent - metrics.asIsSharedPercent}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HAPs Tab */}
        <TabsContent value="haps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Human-Agent Pairs</CardTitle>
              <CardDescription>
                All HAPs assigned to roles in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentHAPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No HAPs found in this department</p>
                  <Button className="mt-4" asChild>
                    <Link href="/haps/new">Create HAP</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {departmentHAPs.map((hap) => {
                    const person = people.find((p) => p.id === hap.personId);
                    const role = roles.find((r) => r.id === hap.roleId);
                    const status = statusConfig[hap.transitionStatus];
                    const StatusIcon = status.icon;
                    const completedTasks = hap.asIs.taskAssignments.filter(
                      (t) => t.currentOwner === t.targetOwner
                    ).length;
                    const totalTasks = hap.asIs.taskAssignments.length;
                    const progress =
                      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <Link
                        key={hap.id}
                        href={`/haps/${hap.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{person?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {role?.name || "Unknown Role"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{progress}%</p>
                            <Progress value={progress} className="h-1 w-20" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`${status.color} bg-opacity-20`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
