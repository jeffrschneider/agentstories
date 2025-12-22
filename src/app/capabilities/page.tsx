"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Bot,
  ArrowRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCapabilityAnalyses, useCreateCapability } from "@/hooks";
import { CAPABILITY_DOMAINS } from "@/lib/schemas";

type StatusFilter = "all" | "matched" | "gaps" | "unused";

export default function CapabilitiesPage() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCapability, setNewCapability] = useState({
    name: "",
    description: "",
    domain: "",
  });

  const { data: analyses, isLoading } = useCapabilityAnalyses();
  const createCapability = useCreateCapability();

  // Get unique domains from analyses
  const domains = useMemo(() => {
    if (!analyses) return [];
    const domainSet = new Set(analyses.map((a) => a.capability.domain).filter(Boolean));
    return Array.from(domainSet).sort();
  }, [analyses]);

  // Filter capabilities
  const filteredAnalyses = useMemo(() => {
    if (!analyses) return [];

    return analyses.filter((analysis) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          analysis.capability.name.toLowerCase().includes(searchLower) ||
          analysis.capability.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Domain filter
      if (domainFilter !== "all" && analysis.capability.domain !== domainFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "matched" && !analysis.isMatched) return false;
      if (statusFilter === "gaps" && !analysis.isGap) return false;
      if (statusFilter === "unused" && (analysis.demand.length > 0 || analysis.isMatched))
        return false;

      return true;
    });
  }, [analyses, search, domainFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!analyses) return { total: 0, matched: 0, gaps: 0, unused: 0 };

    return {
      total: analyses.length,
      matched: analyses.filter((a) => a.isMatched).length,
      gaps: analyses.filter((a) => a.isGap).length,
      unused: analyses.filter((a) => a.demand.length === 0 && !a.isMatched).length,
    };
  }, [analyses]);

  const handleCreate = async () => {
    if (!newCapability.name.trim()) return;

    await createCapability.mutateAsync({
      name: newCapability.name.trim(),
      description: newCapability.description.trim() || undefined,
      domain: newCapability.domain || undefined,
    });

    setNewCapability({ name: "", description: "", domain: "" });
    setIsCreateOpen(false);
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Capabilities</h1>
            <p className="text-muted-foreground">
              The shared vocabulary connecting organizational needs to agent offerings
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Capability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Capability</DialogTitle>
                <DialogDescription>
                  Define a new capability that can be required by responsibilities or
                  provided by agents and people.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Screen Resumes"
                    value={newCapability.name}
                    onChange={(e) =>
                      setNewCapability({ ...newCapability, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this capability entail?"
                    value={newCapability.description}
                    onChange={(e) =>
                      setNewCapability({ ...newCapability, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Select
                    value={newCapability.domain}
                    onValueChange={(v) =>
                      setNewCapability({ ...newCapability, domain: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPABILITY_DOMAINS.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newCapability.name.trim() || createCapability.isPending}
                >
                  {createCapability.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Capabilities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.matched}</span>
              </div>
              <p className="text-xs text-muted-foreground">Matched (has supply)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{stats.gaps}</span>
              </div>
              <p className="text-xs text-muted-foreground">Gaps (needed, no supply)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <span className="text-2xl font-bold">{stats.unused}</span>
              </div>
              <p className="text-xs text-muted-foreground">Unused</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search capabilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain as string}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="gaps">Gaps</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAnalyses && filteredAnalyses.length > 0 ? (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Link key={analysis.capability.id} href={`/capabilities/${analysis.capability.id}`}>
                <Card className="transition-colors hover:border-primary hover:bg-accent/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {analysis.capability.name}
                          </h3>
                          {analysis.isGap ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Gap
                            </Badge>
                          ) : analysis.isMatched ? (
                            <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Matched
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unused</Badge>
                          )}
                          {analysis.capability.domain && (
                            <Badge variant="outline">{analysis.capability.domain}</Badge>
                          )}
                        </div>
                        {analysis.capability.description && (
                          <p className="text-sm text-muted-foreground">
                            {analysis.capability.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Required by:</span>
                            <span>{analysis.demand.length} responsibilities</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{analysis.supply.people.length} people</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Bot className="h-4 w-4" />
                            <span>{analysis.supply.agents.length} agents</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No capabilities found</h3>
              <p className="text-muted-foreground mt-1">
                {search || domainFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first capability to define the shared vocabulary"}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Capability
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
