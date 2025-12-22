"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Bot,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCapabilityAnalysis, useDeleteCapability } from "@/hooks";

interface CapabilityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CapabilityDetailPage({ params }: CapabilityDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: analysis, isLoading } = useCapabilityAnalysis(id);
  const deleteCapability = useDeleteCapability();

  const handleDelete = async () => {
    if (!analysis) return;
    await deleteCapability.mutateAsync({
      id: analysis.capability.id,
      name: analysis.capability.name,
    });
    router.push("/capabilities");
  };

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!analysis) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-4xl text-center py-24">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Capability not found</h1>
          <p className="mt-2 text-muted-foreground">
            This capability may have been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/capabilities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Capabilities
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const { capability, demand, supply, isGap, isMatched } = analysis;

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/capabilities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Capabilities
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{capability.name}</h1>
              {isGap ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Gap
                </Badge>
              ) : isMatched ? (
                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Matched
                </Badge>
              ) : (
                <Badge variant="outline">Unused</Badge>
              )}
            </div>
            {capability.description && (
              <p className="text-lg text-muted-foreground">{capability.description}</p>
            )}
            {capability.domain && (
              <Badge variant="outline" className="mt-2">
                {capability.domain}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Capability?</DialogTitle>
                  <DialogDescription>
                    This will remove &quot;{capability.name}&quot; from the system. This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Demand Side */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-500" />
                Demand
              </CardTitle>
              <CardDescription>
                Responsibilities that require this capability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demand.length > 0 ? (
                <div className="space-y-3">
                  {demand.map((source, idx) => (
                    <div
                      key={`${source.roleId}-${source.responsibilityId}-${idx}`}
                      className="flex items-start justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{source.responsibilityName}</p>
                        <p className="text-sm text-muted-foreground">
                          Role: {source.roleName}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/organization">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No responsibilities require this capability yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supply Side */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Supply
              </CardTitle>
              <CardDescription>
                Agents and people who can provide this capability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agents */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4" />
                  Agents
                </h4>
                {supply.agents.length > 0 ? (
                  <div className="space-y-2">
                    {supply.agents.map((agent) => (
                      <div
                        key={agent.skillId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{agent.storyName}</p>
                          <p className="text-sm text-muted-foreground">
                            Skill: {agent.skillName}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/stories/${agent.storyId}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 rounded-lg border border-dashed">
                    <Bot className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-sm text-muted-foreground">No agents yet</p>
                    {isGap && (
                      <Button size="sm" className="mt-2" asChild>
                        <Link href="/stories/new">
                          <Plus className="mr-2 h-3 w-3" />
                          Create Agent Story
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* People */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  People
                </h4>
                {supply.people.length > 0 ? (
                  <div className="space-y-2">
                    {supply.people.map((person) => (
                      <div
                        key={person.personId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <p className="font-medium">{person.personName}</p>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/organization">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 rounded-lg border border-dashed">
                    <Users className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-sm text-muted-foreground">
                      No people with this capability
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gap Resolution CTA */}
        {isGap && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                      Capability Gap
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {demand.length} responsibilit{demand.length === 1 ? "y" : "ies"}{" "}
                      require this capability, but no agents or people can provide it.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/stories/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent Story
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
