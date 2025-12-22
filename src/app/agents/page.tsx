"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Clock,
  Loader2,
  Bot,
  Lightbulb,
  Activity,
  CheckCircle,
  Archive,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents, useAgentStats } from "@/hooks";
import {
  LIFECYCLE_STATE_METADATA,
  CAPABILITY_PRIORITY_METADATA,
  type AgentLifecycle,
  type Agent,
} from "@/lib/schemas";

// Lifecycle icon mapping
const lifecycleIcons: Record<AgentLifecycle, React.ComponentType<{ className?: string }>> = {
  planned: Lightbulb,
  development: Activity,
  operational: CheckCircle,
  sunset: Archive,
};

// Lifecycle badge variant mapping
const lifecycleBadgeVariants: Record<AgentLifecycle, "default" | "secondary" | "outline" | "destructive"> = {
  planned: "default",
  development: "secondary",
  operational: "default",
  sunset: "outline",
};

function AgentCard({ agent }: { agent: Agent }) {
  const LifecycleIcon = lifecycleIcons[agent.lifecycleState];
  const metadata = LIFECYCLE_STATE_METADATA[agent.lifecycleState];
  const capabilityCount = agent.plannedCapabilities?.length || 0;
  const linkCount = agent.externalLinks?.length || 0;

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="h-full transition-colors hover:border-primary hover:bg-accent/50 group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant={lifecycleBadgeVariants[agent.lifecycleState]}>
              <LifecycleIcon className="mr-1 h-3 w-3" />
              {metadata.label}
            </Badge>
            {linkCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">{linkCount}</span>
              </div>
            )}
          </div>
          <CardTitle className="text-lg line-clamp-1 mt-2">
            {agent.name || "Untitled Agent"}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {agent.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agent.lifecycleState === "planned" && capabilityCount > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Lightbulb className="h-3 w-3" />
                <span>{capabilityCount} planned capabilities</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.plannedCapabilities?.slice(0, 2).map((cap) => (
                  <Badge
                    key={cap.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {cap.name}
                    {cap.priority && (
                      <span
                        className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${
                          cap.priority === "must-have"
                            ? "bg-red-500"
                            : cap.priority === "should-have"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                    )}
                  </Badge>
                ))}
                {capabilityCount > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{capabilityCount - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">{agent.identifier}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(agent.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {agent.tags && agent.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {agent.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {agent.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AgentCatalogPage() {
  const [search, setSearch] = useState("");
  const [lifecycleTab, setLifecycleTab] = useState<AgentLifecycle | "all">("all");

  const { data: agents, isLoading } = useAgents({
    search: search || undefined,
    lifecycleState: lifecycleTab === "all" ? undefined : lifecycleTab,
  });

  const { data: stats } = useAgentStats();

  // Filter agents by lifecycle (handled by hook, but we keep for UI state)
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    return agents;
  }, [agents]);

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-8 w-8" />
              Agent Catalog
            </h1>
            <p className="text-muted-foreground">
              Track agents through their lifecycle from planning to operations
            </p>
          </div>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Agents</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <div className="text-2xl font-bold">{stats.planned}</div>
                </div>
                <div className="text-xs text-muted-foreground">Planned</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <div className="text-2xl font-bold">{stats.development}</div>
                </div>
                <div className="text-xs text-muted-foreground">Development</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="text-2xl font-bold">{stats.operational}</div>
                </div>
                <div className="text-xs text-muted-foreground">Operational</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-gray-500" />
                  <div className="text-2xl font-bold">{stats.sunset}</div>
                </div>
                <div className="text-xs text-muted-foreground">Sunset</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lifecycle Tabs */}
        <Tabs value={lifecycleTab} onValueChange={(v) => setLifecycleTab(v as AgentLifecycle | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              All
              {stats && <Badge variant="secondary" className="ml-2">{stats.total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="planned">
              <Lightbulb className="mr-1 h-3 w-3" />
              Planned
              {stats && <Badge variant="secondary" className="ml-2">{stats.planned}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="development">
              <Activity className="mr-1 h-3 w-3" />
              Development
              {stats && <Badge variant="secondary" className="ml-2">{stats.development}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="operational">
              <CheckCircle className="mr-1 h-3 w-3" />
              Operational
              {stats && <Badge variant="secondary" className="ml-2">{stats.operational}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sunset">
              <Archive className="mr-1 h-3 w-3" />
              Sunset
              {stats && <Badge variant="secondary" className="ml-2">{stats.sunset}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAgents && filteredAgents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No agents found</h3>
              <p className="text-muted-foreground mt-1">
                {search || lifecycleTab !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first agent to start building your catalog"}
              </p>
              <Button asChild className="mt-4">
                <Link href="/agents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
