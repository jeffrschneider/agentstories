"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Loader2,
  Bot,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useCreateAgent } from "@/hooks";
import {
  createEmptyAgent,
  createPlannedCapability,
  LIFECYCLE_STATE_METADATA,
  CAPABILITY_PRIORITY_METADATA,
  type Agent,
  type AgentLifecycle,
  type CapabilityPriority,
  type PlannedCapability,
} from "@/lib/schemas";

export default function NewAgentPage() {
  const router = useRouter();
  const createAgent = useCreateAgent();

  const [agent, setAgent] = useState<Agent>(() => createEmptyAgent());
  const [isSaving, setIsSaving] = useState(false);
  const [newCapName, setNewCapName] = useState("");
  const [newCapDescription, setNewCapDescription] = useState("");
  const [newCapPriority, setNewCapPriority] = useState<CapabilityPriority>("must-have");

  const handleSave = async () => {
    if (!agent.name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const newAgent = await createAgent.mutateAsync({
        name: agent.name,
        description: agent.description,
        identifier: agent.identifier,
        lifecycleState: agent.lifecycleState,
        lifecycleNotes: agent.lifecycleNotes,
        plannedCapabilities: agent.plannedCapabilities,
        externalLinks: agent.externalLinks,
        tags: agent.tags,
      });
      router.push(`/agents/${newAgent.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addCapability = () => {
    if (!newCapName.trim()) return;

    const newCap = createPlannedCapability(
      newCapName.trim(),
      newCapDescription.trim() || undefined,
      newCapPriority
    );

    setAgent((prev) => ({
      ...prev,
      plannedCapabilities: [...(prev.plannedCapabilities || []), newCap],
    }));

    setNewCapName("");
    setNewCapDescription("");
    setNewCapPriority("must-have");
  };

  const removeCapability = (id: string) => {
    setAgent((prev) => ({
      ...prev,
      plannedCapabilities: prev.plannedCapabilities?.filter((c) => c.id !== id),
    }));
  };

  const updateCapabilityPriority = (id: string, priority: CapabilityPriority) => {
    setAgent((prev) => ({
      ...prev,
      plannedCapabilities: prev.plannedCapabilities?.map((c) =>
        c.id === id ? { ...c, priority } : c
      ),
    }));
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6" />
              New Agent
            </h1>
            <p className="text-muted-foreground">
              Create a new agent entry in the catalog
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Identity</CardTitle>
            <CardDescription>
              Basic information about this agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Agent"
                  value={agent.name}
                  onChange={(e) =>
                    setAgent((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identifier">Identifier</Label>
                <Input
                  id="identifier"
                  placeholder="e.g., customer-support-agent"
                  value={agent.identifier || ""}
                  onChange={(e) =>
                    setAgent((prev) => ({ ...prev, identifier: e.target.value || undefined }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this agent do?"
                value={agent.description || ""}
                onChange={(e) =>
                  setAgent((prev) => ({ ...prev, description: e.target.value || undefined }))
                }
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lifecycle">Lifecycle State</Label>
                <Select
                  value={agent.lifecycleState}
                  onValueChange={(v) =>
                    setAgent((prev) => ({
                      ...prev,
                      lifecycleState: v as AgentLifecycle,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LIFECYCLE_STATE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{meta.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {meta.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifecycleNotes">Lifecycle Notes</Label>
              <Textarea
                id="lifecycleNotes"
                placeholder="Notes about current status, blockers, or next steps..."
                value={agent.lifecycleNotes || ""}
                onChange={(e) =>
                  setAgent((prev) => ({ ...prev, lifecycleNotes: e.target.value || undefined }))
                }
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Planned Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Planned Capabilities</CardTitle>
            <CardDescription>
              What should this agent be able to do? Add capabilities to define requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing capabilities */}
            {agent.plannedCapabilities && agent.plannedCapabilities.length > 0 && (
              <div className="space-y-2">
                {agent.plannedCapabilities.map((cap) => (
                  <div
                    key={cap.id}
                    className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50"
                  >
                    <GripVertical className="h-4 w-4 mt-1 text-muted-foreground cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cap.name}</span>
                        <Select
                          value={cap.priority || "must-have"}
                          onValueChange={(v) =>
                            updateCapabilityPriority(cap.id, v as CapabilityPriority)
                          }
                        >
                          <SelectTrigger className="w-[130px] h-7">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CAPABILITY_PRIORITY_METADATA).map(
                              ([key, meta]) => (
                                <SelectItem key={key} value={key}>
                                  {meta.label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {cap.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cap.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCapability(cap.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new capability */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capName">Capability Name</Label>
                  <Input
                    id="capName"
                    placeholder="e.g., SQL Query Generation"
                    value={newCapName}
                    onChange={(e) => setNewCapName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCapability();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capPriority">Priority</Label>
                  <Select
                    value={newCapPriority}
                    onValueChange={(v) => setNewCapPriority(v as CapabilityPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAPABILITY_PRIORITY_METADATA).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capDescription">Description (optional)</Label>
                <Input
                  id="capDescription"
                  placeholder="Brief description of what this capability does"
                  value={newCapDescription}
                  onChange={(e) => setNewCapDescription(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={addCapability}
                disabled={!newCapName.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Capability
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help organize and find this agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.tags?.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() =>
                      setAgent((prev) => ({
                        ...prev,
                        tags: prev.tags?.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="Add tag and press Enter"
                className="w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !agent.tags?.includes(value)) {
                      setAgent((prev) => ({
                        ...prev,
                        tags: [...(prev.tags || []), value],
                      }));
                      (e.target as HTMLInputElement).value = "";
                    }
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving || !agent.name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Agent
              </>
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
