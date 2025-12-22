"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Loader2,
  Clock,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Bot,
  User,
  ArrowRight,
  Filter,
  Target,
  FileText,
  Play,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHAPs, usePeople, useRoles, useStories } from "@/hooks";
import {
  CAPABILITY_REQUIREMENT_STATUS_METADATA,
  RESPONSIBILITY_PHASE_METADATA,
} from "@/lib/schemas";
import type { CapabilityRequirement, CapabilityRequirementStatus, ResponsibilityPhase } from "@/lib/schemas";

export default function CapabilityQueuePage() {
  const [statusFilter, setStatusFilter] = useState<CapabilityRequirementStatus | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<ResponsibilityPhase | "all">("all");

  const { data: haps, isLoading } = useHAPs();
  const { data: people } = usePeople();
  const { data: roles } = useRoles();
  const { data: stories } = useStories();

  // Aggregate all capability requirements from all HAPs
  const allRequirements: (CapabilityRequirement & { hapId: string; personName?: string; roleName?: string; agentName?: string })[] = [];

  haps?.forEach((hap) => {
    const person = people?.find((p) => p.id === hap.personId);
    const role = roles?.find((r) => r.id === hap.roleId);
    const agent = stories?.find((s) => s.id === hap.agentStoryId);

    hap.capabilityRequirements?.forEach((req) => {
      allRequirements.push({
        ...req,
        hapId: hap.id,
        personName: person?.name,
        roleName: role?.name,
        agentName: agent?.name,
      });
    });
  });

  // Filter requirements
  const filteredRequirements = allRequirements.filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) {
      return false;
    }
    if (phaseFilter !== "all" && req.phase !== phaseFilter) {
      return false;
    }
    return true;
  });

  // Group by status for summary
  const statusCounts = {
    pending: allRequirements.filter((r) => r.status === "pending").length,
    generating: allRequirements.filter((r) => r.status === "generating").length,
    ready: allRequirements.filter((r) => r.status === "ready").length,
    applied: allRequirements.filter((r) => r.status === "applied").length,
    rejected: allRequirements.filter((r) => r.status === "rejected").length,
  };

  const getStatusIcon = (status: CapabilityRequirementStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "generating":
        return <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "ready":
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case "applied":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: CapabilityRequirementStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700";
      case "generating":
        return "bg-blue-100 text-blue-700";
      case "ready":
        return "bg-yellow-100 text-yellow-700";
      case "applied":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
    }
  };

  const getPhaseIcon = (phase: ResponsibilityPhase) => {
    switch (phase) {
      case "manage":
        return <Target className="h-3 w-3" />;
      case "define":
        return <FileText className="h-3 w-3" />;
      case "perform":
        return <Play className="h-3 w-3" />;
      case "review":
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Capability Queue</h1>
            <p className="text-muted-foreground">
              Manage pending capability requirements from HAP assignments
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold">{statusCounts.pending}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{statusCounts.generating}</span>
              </div>
              <p className="text-xs text-muted-foreground">Generating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{statusCounts.ready}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ready for Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{statusCounts.applied}</span>
              </div>
              <p className="text-xs text-muted-foreground">Applied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{statusCounts.rejected}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as CapabilityRequirementStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="ready">Ready for Review</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={phaseFilter}
                onValueChange={(v) => setPhaseFilter(v as ResponsibilityPhase | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="manage">Manage</SelectItem>
                  <SelectItem value="define">Define</SelectItem>
                  <SelectItem value="perform">Perform</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requirements List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequirements.length > 0 ? (
          <div className="space-y-4">
            {filteredRequirements.map((req) => (
              <Card key={req.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      {/* Status and Phase */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(req.status)}
                        <Badge className={getStatusColor(req.status)}>
                          {CAPABILITY_REQUIREMENT_STATUS_METADATA[req.status].label}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getPhaseIcon(req.phase)}
                          {RESPONSIBILITY_PHASE_METADATA[req.phase].label}
                        </Badge>
                      </div>

                      {/* Task and Capability Info */}
                      <div>
                        <h3 className="font-semibold">{req.suggestedCapabilityName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Task: {req.taskName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {req.suggestedCapabilityDescription}
                        </p>
                      </div>

                      {/* HAP Context */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {req.personName || "Unknown"}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Bot className="h-3 w-3" />
                          {req.agentName || "Unknown Agent"}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {req.status === "pending" && (
                        <Button size="sm">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Capability
                        </Button>
                      )}
                      {req.status === "ready" && (
                        <>
                          <Button size="sm">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Apply to Agent
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/haps/${req.hapId}`}>
                          View HAP
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No capability requirements</h3>
              <p className="text-muted-foreground mt-1">
                {statusFilter !== "all" || phaseFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Capability requirements are created when you assign phases to agents in HAPs"}
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/haps">
                  <Bot className="mr-2 h-4 w-4" />
                  View HAPs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">How Capability Queue Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">HAP Assignment</p>
                  <p className="text-muted-foreground">Assign a phase to Agent in a HAP</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-blue-600 text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Capability Generation</p>
                  <p className="text-muted-foreground">AI generates a draft capability definition</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-200 text-yellow-600 text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Review</p>
                  <p className="text-muted-foreground">Review and refine the generated capability</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-green-600 text-xs font-bold">4</div>
                <div>
                  <p className="font-medium">Apply</p>
                  <p className="text-muted-foreground">Add capability to Agent Story</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
