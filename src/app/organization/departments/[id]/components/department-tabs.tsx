"use client";

import Link from "next/link";
import { Users, Bot, AlertTriangle } from "lucide-react";
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
import type { HumanAgentPair, HAPIntegrationStatus, Person, Role } from "@/lib/schemas";
import { statusConfig, type DepartmentMetrics } from "./department-utils";

interface DepartmentTabsProps {
  metrics: DepartmentMetrics;
  departmentHAPs: HumanAgentPair[];
  people: Person[];
  roles: Role[];
}

export function DepartmentTabs({ metrics, departmentHAPs, people, roles }: DepartmentTabsProps) {
  return (
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
  );
}
