"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Loader2,
  Filter,
  Timer,
  CheckCircle,
  Clock,
  Download,
  PlayCircle,
  Edit,
  User,
  Cpu,
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
  useStories,
} from "@/hooks";
import { INTEGRATION_STATUS_METADATA, calculatePhaseDistribution } from "@/lib/schemas";
import type { HAPIntegrationStatus } from "@/lib/schemas";
import { HAPExportPanel } from "@/components/hap";

export default function HAPsPage() {
  const [statusFilter, setStatusFilter] = useState<HAPIntegrationStatus | "all">("all");
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
  const { data: stories } = useStories();

  const filteredHAPs =
    haps?.filter((h) => {
      if (statusFilter !== "all" && h.integrationStatus !== statusFilter) {
        return false;
      }
      return true;
    }) || [];

  const getStatusColor = (status: HAPIntegrationStatus) => {
    const meta = INTEGRATION_STATUS_METADATA[status];
    switch (meta.color) {
      case "green":
        return "bg-green-500";
      case "emerald":
        return "bg-emerald-500";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: HAPIntegrationStatus) => {
    switch (status) {
      case "active":
        return <PlayCircle className="h-4 w-4 text-emerald-500" />;
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "skills_pending":
        return <Timer className="h-4 w-4 text-yellow-500" />;
      case "planning":
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Human-Agent Pairs
            </h1>
            <p className="text-muted-foreground">
              Track AI integration across your organization
            </p>
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
              <Link href="/haps/new">
                <Plus className="mr-2 h-4 w-4" />
                Create HAP
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-6">
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
                    {stats.hapsByStatus.not_started}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.planning}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Planning</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.skills_pending}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Skills Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.ready}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Ready</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-2xl font-bold">
                    {stats.hapsByStatus.active}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
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
                  setStatusFilter(v as HAPIntegrationStatus | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="skills_pending">Skills Pending</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
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
              const agentStory = stories?.find((s) => s.id === hap.agentStoryId);

              // Calculate phase distribution
              const distribution = calculatePhaseDistribution(hap.tasks);

              // Count pending capability requirements
              const pendingCapabilities = hap.capabilityRequirements?.filter(
                r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
              ).length || 0;

              return (
                <Card key={hap.id} className="overflow-hidden">
                  <div className="flex">
                    {/* Status indicator */}
                    <div
                      className={`w-1 ${getStatusColor(hap.integrationStatus)}`}
                    />
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(hap.integrationStatus)}
                              <Badge variant="outline">
                                {INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}
                              </Badge>
                              {dept && (
                                <Badge variant="secondary">{dept.name}</Badge>
                              )}
                              {pendingCapabilities > 0 && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  {pendingCapabilities} capabilities pending
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              {person?.name || "Unknown"} + {agentStory?.name || "Unassigned Agent"}
                            </CardTitle>
                            <CardDescription>
                              {role?.name || "Unknown Role"}
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/haps/${hap.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                          {/* Phase Distribution */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Responsibility Distribution
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> Human
                                </span>
                                <span>{distribution.humanPercent}%</span>
                              </div>
                              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${distribution.humanPercent}%` }}
                                />
                                <div
                                  className="bg-purple-500"
                                  style={{ width: `${distribution.agentPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3" /> Agent
                                </span>
                                <span>{distribution.agentPercent}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Tasks Summary */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Tasks Overview
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>{hap.tasks.length} tasks defined</span>
                                <span>{distribution.agent} agent phases</span>
                              </div>
                              <Progress
                                value={distribution.agentPercent}
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground">
                                {distribution.human} human phases / {distribution.agent} agent phases
                              </p>
                            </div>
                          </div>

                          {/* Capability Requirements */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Capability Requirements</h4>
                            {pendingCapabilities > 0 ? (
                              <div className="space-y-1">
                                <p className="text-sm text-yellow-600">
                                  {pendingCapabilities} {pendingCapabilities !== 1 ? 'capabilities' : 'capability'} need to be defined
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Agent phases without linked capabilities
                                </p>
                              </div>
                            ) : hap.tasks.some(t =>
                                Object.values(t.phases).some(p => p.owner === 'agent')
                              ) ? (
                              <p className="text-xs text-green-600">
                                All agent capabilities defined
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No agent phases assigned
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
                  : "Create your first Human-Agent Pair to start AI integration"}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/haps/new">
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
