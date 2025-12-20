"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Loader2,
  Filter,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/layout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useHAPs,
  useHAPStats,
  usePeople,
  useRoles,
  useDepartments,
  useDomains,
} from "@/hooks";
import { TRANSITION_STATUS_METADATA } from "@/lib/schemas";
import type { TransitionStatus } from "@/lib/schemas";
import { HAPExportPanel } from "@/components/hap";

export default function HAPsPage() {
  const [statusFilter, setStatusFilter] = useState<TransitionStatus | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string | "all">("all");

  const { data: haps, isLoading } = useHAPs(
    deptFilter !== "all" ? { departmentId: deptFilter } : undefined
  );
  const { data: allHAPs } = useHAPs();
  const { data: stats } = useHAPStats();
  const { data: people } = usePeople();
  const { data: roles } = useRoles();
  const { data: departments } = useDepartments();
  const { data: domains } = useDomains();

  const filteredHAPs =
    haps?.filter((h) => {
      if (statusFilter !== "all" && h.transitionStatus !== statusFilter) {
        return false;
      }
      return true;
    }) || [];

  const getStatusColor = (status: TransitionStatus) => {
    const meta = TRANSITION_STATUS_METADATA[status];
    switch (meta.color) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: TransitionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "planned":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/organization">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Human-Agent Pairs
              </h1>
              <p className="text-muted-foreground">
                Track AI transformation across your organization
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Export HAP Data</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {allHAPs && (
                    <HAPExportPanel
                      haps={allHAPs}
                      domains={domains || []}
                      departments={departments || []}
                      roles={roles || []}
                      people={people || []}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button asChild>
              <Link href="/organization/haps/new">
                <Plus className="mr-2 h-4 w-4" />
                Create HAP
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.hapCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total HAPs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.not_started + stats.hapsByStatus.planned}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.in_progress}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.blocked}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.completed}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as TransitionStatus | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={deptFilter}
                onValueChange={(v) => setDeptFilter(v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* HAPs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredHAPs.length > 0 ? (
          <div className="space-y-4">
            {filteredHAPs.map((hap) => {
              const person = people?.find((p) => p.id === hap.personId);
              const role = roles?.find((r) => r.id === hap.roleId);
              const dept = departments?.find((d) => d.id === role?.departmentId);

              // Calculate transformation progress
              const tasksDone = hap.asIs.taskAssignments.filter(
                (t) => t.currentOwner === t.targetOwner
              ).length;
              const totalTasks = hap.asIs.taskAssignments.length;
              const progressPercent =
                totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

              return (
                <Card key={hap.id} className="overflow-hidden">
                  <div className="flex">
                    {/* Status indicator */}
                    <div
                      className={`w-1 ${getStatusColor(hap.transitionStatus)}`}
                    />
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(hap.transitionStatus)}
                              <Badge variant="outline">
                                {
                                  TRANSITION_STATUS_METADATA[hap.transitionStatus]
                                    .label
                                }
                              </Badge>
                              {dept && (
                                <Badge variant="secondary">{dept.name}</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              {person?.name || "Unknown"} + AI Agent
                            </CardTitle>
                            <CardDescription>
                              {role?.name || "Unknown Role"}
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/organization/haps/${hap.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                          {/* As-Is / To-Be */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Responsibility Split
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>As-Is</span>
                                <span>
                                  {hap.asIs.humanPercent}% Human /{" "}
                                  {hap.asIs.agentPercent}% Agent
                                </span>
                              </div>
                              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${hap.asIs.humanPercent}%` }}
                                />
                                <div
                                  className="bg-purple-500"
                                  style={{ width: `${hap.asIs.agentPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>To-Be</span>
                                <span>
                                  {hap.toBe.humanPercent}% Human /{" "}
                                  {hap.toBe.agentPercent}% Agent
                                </span>
                              </div>
                              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${hap.toBe.humanPercent}%` }}
                                />
                                <div
                                  className="bg-purple-500"
                                  style={{ width: `${hap.toBe.agentPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Transformation Progress
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>
                                  {tasksDone} of {totalTasks} tasks complete
                                </span>
                                <span>{progressPercent}%</span>
                              </div>
                              <Progress value={progressPercent} />
                            </div>
                            {hap.targetCompletionDate && (
                              <p className="text-xs text-muted-foreground">
                                Target:{" "}
                                {new Date(
                                  hap.targetCompletionDate
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {/* Blockers */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Blockers</h4>
                            {hap.topBlockers && hap.topBlockers.length > 0 ? (
                              <ul className="space-y-1 text-xs">
                                {hap.topBlockers.slice(0, 2).map((blocker, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-red-600"
                                  >
                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    {blocker}
                                  </li>
                                ))}
                                {hap.topBlockers.length > 2 && (
                                  <li className="text-muted-foreground">
                                    +{hap.topBlockers.length - 2} more
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No blockers
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No HAPs found</h3>
              <p className="text-muted-foreground mt-1">
                {statusFilter !== "all" || deptFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first Human-Agent Pair to start AI transformation"}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/organization/haps/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create HAP
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
