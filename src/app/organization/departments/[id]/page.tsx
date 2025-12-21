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
import type { HumanAgentPair, HAPIntegrationStatus } from "@/lib/schemas/hap";

// Helper to calculate department-wide metrics using new Responsibility Phase Model
function calculateDepartmentMetrics(haps: HumanAgentPair[]) {
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
  let agentPhasesWithSkills = 0;

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
          if (phase.skillId) {
            agentPhasesWithSkills++;
          }
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

const statusConfig: Record<
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
              Agent Phases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{metrics.agentPhasesPercent}%</span>
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
              <div className="grid gap-4 md:grid-cols-6">
                {(Object.keys(statusConfig) as HAPIntegrationStatus[]).map((status) => {
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

          {/* Paused HAPs Alert */}
          {metrics.statusBreakdown.paused > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Paused HAPs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {departmentHAPs
                    .filter((hap) => hap.integrationStatus === "paused")
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
                            {hap.notes && (
                              <p className="text-sm text-orange-600">{hap.notes}</p>
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
          {/* Phase Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Phase Responsibility Distribution</CardTitle>
              <CardDescription>
                How task phases are distributed between humans and agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Human Phases
                  </span>
                  <span>{metrics.humanPhasesPercent}%</span>
                </div>
                <Progress value={metrics.humanPhasesPercent} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" /> Agent Phases
                  </span>
                  <span>{metrics.agentPhasesPercent}%</span>
                </div>
                <Progress value={metrics.agentPhasesPercent} className="h-2 [&>div]:bg-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Integration Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Progress</CardTitle>
              <CardDescription>
                Overall progress of agent skill integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Average Progress</p>
                  <p className="text-2xl font-bold">{metrics.avgProgress}%</p>
                  <Progress value={metrics.avgProgress} className="h-2 mt-2" />
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Ready HAPs</p>
                  <p className="text-2xl font-bold">
                    {metrics.statusBreakdown.ready + metrics.statusBreakdown.active} / {metrics.totalHAPs}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Fully integrated
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
                    const status = statusConfig[hap.integrationStatus];
                    const StatusIcon = status.icon;

                    // Calculate progress based on agent phases with skills
                    const tasks = hap.tasks ?? [];
                    let agentPhases = 0;
                    let agentPhasesWithSkills = 0;
                    tasks.forEach((task) => {
                      Object.values(task.phases).forEach((phase) => {
                        if (phase.owner === "agent") {
                          agentPhases++;
                          if (phase.skillId) agentPhasesWithSkills++;
                        }
                      });
                    });
                    const progress = agentPhases > 0
                      ? Math.round((agentPhasesWithSkills / agentPhases) * 100)
                      : 100;

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
