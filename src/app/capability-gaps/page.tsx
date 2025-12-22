"use client";

import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  Layers,
  Briefcase,
  ArrowRight,
  Plus,
  CheckCircle2,
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
import { useCapabilityGaps, useCapabilityAnalyses } from "@/hooks";

export default function CapabilityGapsPage() {
  const { data: gaps, isLoading } = useCapabilityGaps();
  const { data: allAnalyses } = useCapabilityAnalyses();

  // Calculate summary stats
  const stats = {
    totalGaps: gaps?.length || 0,
    totalCapabilities: allAnalyses?.length || 0,
    matchedCapabilities: allAnalyses?.filter((a) => a.isMatched).length || 0,
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Capability Gaps</h1>
            <p className="text-muted-foreground">
              Capabilities needed by the organization but not yet available
            </p>
          </div>
          <Button asChild>
            <Link href="/stories/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent Story
            </Link>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{stats.totalGaps}</span>
              </div>
              <p className="text-xs text-muted-foreground">Capability Gaps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.matchedCapabilities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Matched Capabilities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.totalCapabilities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Capabilities</p>
            </CardContent>
          </Card>
        </div>

        {/* Gaps List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : gaps && gaps.length > 0 ? (
          <div className="space-y-4">
            {gaps.map((gap) => (
              <Card
                key={gap.capability.id}
                className="border-red-200 dark:border-red-900"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      {/* Capability Info */}
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-lg">{gap.capability.name}</h3>
                        {gap.capability.domain && (
                          <Badge variant="outline">{gap.capability.domain}</Badge>
                        )}
                      </div>
                      {gap.capability.description && (
                        <p className="text-sm text-muted-foreground">
                          {gap.capability.description}
                        </p>
                      )}

                      {/* Demanding Responsibilities */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Required by {gap.demand.length} responsibilit
                          {gap.demand.length === 1 ? "y" : "ies"}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {gap.demand.slice(0, 3).map((source, idx) => (
                            <Badge
                              key={`${source.roleId}-${source.responsibilityId}-${idx}`}
                              variant="secondary"
                            >
                              {source.responsibilityName}
                              <span className="text-muted-foreground ml-1">
                                ({source.roleName})
                              </span>
                            </Badge>
                          ))}
                          {gap.demand.length > 3 && (
                            <Badge variant="outline">+{gap.demand.length - 3} more</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild>
                        <Link href="/stories/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Agent
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/capabilities/${gap.capability.id}`}>
                          View Details
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
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">No Capability Gaps</h3>
              <p className="text-muted-foreground mt-1">
                All required capabilities have at least one agent or person who can
                provide them.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button variant="outline" asChild>
                  <Link href="/capabilities">
                    <Layers className="mr-2 h-4 w-4" />
                    View All Capabilities
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/organization">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Manage Organization
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">How to Resolve Capability Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-purple-600 text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Review the Gap</p>
                  <p className="text-muted-foreground">
                    Click on a gap to see which responsibilities need this capability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-blue-600 text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Create an Agent Story</p>
                  <p className="text-muted-foreground">
                    Define an agent with skills that provide this capability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-green-600 text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Create HAPs</p>
                  <p className="text-muted-foreground">
                    Pair the agent with humans to handle the responsibilities
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
