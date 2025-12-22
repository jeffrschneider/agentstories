"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  Plus,
  Clock,
  Lightbulb,
  Activity,
  CheckCircle,
  Archive,
  FileText,
  X,
  GripVertical,
  Link2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAgent, useUpdateAgent, useDeleteAgent, useStory } from "@/hooks";
import {
  createPlannedCapability,
  createExternalLink,
  LIFECYCLE_STATE_METADATA,
  CAPABILITY_PRIORITY_METADATA,
  EXTERNAL_LINK_TYPE_METADATA,
  type Agent,
  type AgentLifecycle,
  type CapabilityPriority,
  type ExternalLinkType,
} from "@/lib/schemas";

// Lifecycle icon mapping
const lifecycleIcons: Record<AgentLifecycle, React.ComponentType<{ className?: string }>> = {
  planned: Lightbulb,
  development: Activity,
  operational: CheckCircle,
  sunset: Archive,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: agent, isLoading } = useAgent(id);
  const { data: linkedStory } = useStory(agent?.agentStoryId || "", { trackView: false });
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New capability form state
  const [newCapName, setNewCapName] = useState("");
  const [newCapDescription, setNewCapDescription] = useState("");
  const [newCapPriority, setNewCapPriority] = useState<CapabilityPriority>("must-have");

  // New link form state
  const [newLinkType, setNewLinkType] = useState<ExternalLinkType>("documentation");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!agent) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-3xl text-center py-12">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Agent not found</h2>
          <p className="text-muted-foreground mt-2">
            The agent you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/agents">Back to Catalog</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const currentAgent = isEditing && editedAgent ? editedAgent : agent;
  const LifecycleIcon = lifecycleIcons[currentAgent.lifecycleState];
  const lifecycleMeta = LIFECYCLE_STATE_METADATA[currentAgent.lifecycleState];

  const startEditing = () => {
    setEditedAgent({ ...agent });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedAgent(null);
    setIsEditing(false);
    setNewCapName("");
    setNewCapDescription("");
    setNewCapPriority("must-have");
    setNewLinkType("documentation");
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const handleSave = async () => {
    if (!editedAgent) return;

    setIsSaving(true);
    try {
      await updateAgent.mutateAsync({
        id: agent.id,
        data: {
          name: editedAgent.name,
          description: editedAgent.description,
          identifier: editedAgent.identifier,
          lifecycleState: editedAgent.lifecycleState,
          lifecycleNotes: editedAgent.lifecycleNotes,
          plannedCapabilities: editedAgent.plannedCapabilities,
          externalLinks: editedAgent.externalLinks,
          tags: editedAgent.tags,
        },
      });
      setIsEditing(false);
      setEditedAgent(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteAgent.mutateAsync({ id: agent.id, name: agent.name });
    router.push("/agents");
  };

  const addCapability = () => {
    if (!editedAgent || !newCapName.trim()) return;

    const newCap = createPlannedCapability(
      newCapName.trim(),
      newCapDescription.trim() || undefined,
      newCapPriority
    );

    setEditedAgent({
      ...editedAgent,
      plannedCapabilities: [...(editedAgent.plannedCapabilities || []), newCap],
    });

    setNewCapName("");
    setNewCapDescription("");
    setNewCapPriority("must-have");
  };

  const removeCapability = (capId: string) => {
    if (!editedAgent) return;
    setEditedAgent({
      ...editedAgent,
      plannedCapabilities: editedAgent.plannedCapabilities?.filter((c) => c.id !== capId),
    });
  };

  const addLink = () => {
    if (!editedAgent || !newLinkLabel.trim() || !newLinkUrl.trim()) return;

    try {
      new URL(newLinkUrl);
    } catch {
      return;
    }

    const newLink = createExternalLink(newLinkType, newLinkLabel.trim(), newLinkUrl.trim());

    setEditedAgent({
      ...editedAgent,
      externalLinks: [...(editedAgent.externalLinks || []), newLink],
    });

    setNewLinkType("documentation");
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const removeLink = (linkId: string) => {
    if (!editedAgent) return;
    setEditedAgent({
      ...editedAgent,
      externalLinks: editedAgent.externalLinks?.filter((l) => l.id !== linkId),
    });
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
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">
                {currentAgent.name || "Untitled Agent"}
              </h1>
              <Badge variant="outline">
                <LifecycleIcon className="mr-1 h-3 w-3" />
                {lifecycleMeta.label}
              </Badge>
            </div>
            {currentAgent.identifier && (
              <p className="text-muted-foreground font-mono text-sm">
                {currentAgent.identifier}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={cancelEditing}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{agent.name}"? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && editedAgent ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedAgent.name}
                      onChange={(e) =>
                        setEditedAgent({ ...editedAgent, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Identifier</Label>
                    <Input
                      id="identifier"
                      value={editedAgent.identifier || ""}
                      onChange={(e) =>
                        setEditedAgent({
                          ...editedAgent,
                          identifier: e.target.value || undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedAgent.description || ""}
                    onChange={(e) =>
                      setEditedAgent({
                        ...editedAgent,
                        description: e.target.value || undefined,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lifecycle State</Label>
                    <Select
                      value={editedAgent.lifecycleState}
                      onValueChange={(v) =>
                        setEditedAgent({
                          ...editedAgent,
                          lifecycleState: v as AgentLifecycle,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIFECYCLE_STATE_METADATA).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
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
                    value={editedAgent.lifecycleNotes || ""}
                    onChange={(e) =>
                      setEditedAgent({
                        ...editedAgent,
                        lifecycleNotes: e.target.value || undefined,
                      })
                    }
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{currentAgent.description || "No description"}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Lifecycle State
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <LifecycleIcon className="h-4 w-4" />
                      <span>{lifecycleMeta.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lifecycleMeta.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(currentAgent.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {currentAgent.lifecycleNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Lifecycle Notes
                    </h3>
                    <p className="mt-1 text-sm">{currentAgent.lifecycleNotes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Linked Agent Story */}
        {(currentAgent.agentStoryId || isEditing) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Agent Story
              </CardTitle>
              <CardDescription>
                Detailed specification for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedStory ? (
                <Link
                  href={`/stories/${linkedStory.id}`}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{linkedStory.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {linkedStory.role}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">
                    No Agent Story linked yet
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/stories/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent Story
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Planned Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Planned Capabilities
            </CardTitle>
            <CardDescription>
              What this agent should be able to do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAgent.plannedCapabilities && currentAgent.plannedCapabilities.length > 0 ? (
              <div className="space-y-2">
                {currentAgent.plannedCapabilities.map((cap) => (
                  <div
                    key={cap.id}
                    className="flex items-start gap-2 p-3 border rounded-lg"
                  >
                    {isEditing && <GripVertical className="h-4 w-4 mt-1 text-muted-foreground cursor-grab" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cap.name}</span>
                        {cap.priority && (
                          <Badge
                            variant="outline"
                            className={
                              cap.priority === "must-have"
                                ? "border-red-500 text-red-500"
                                : cap.priority === "should-have"
                                ? "border-yellow-500 text-yellow-500"
                                : "border-green-500 text-green-500"
                            }
                          >
                            {CAPABILITY_PRIORITY_METADATA[cap.priority].label}
                          </Badge>
                        )}
                      </div>
                      {cap.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cap.description}
                        </p>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCapability(cap.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No capabilities planned yet
              </p>
            )}

            {isEditing && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Capability Name</Label>
                    <Input
                      placeholder="e.g., SQL Query Generation"
                      value={newCapName}
                      onChange={(e) => setNewCapName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
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
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Brief description"
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
            )}
          </CardContent>
        </Card>

        {/* External Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              External Links
            </CardTitle>
            <CardDescription>
              Links to tracing, monitoring, documentation, and other systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAgent.externalLinks && currentAgent.externalLinks.length > 0 ? (
              <div className="space-y-2">
                {currentAgent.externalLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-3 border rounded-lg"
                  >
                    <Badge variant="outline">
                      {EXTERNAL_LINK_TYPE_METADATA[link.type].label}
                    </Badge>
                    {isEditing ? (
                      <>
                        <span className="flex-1">{link.label}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-2 hover:underline"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No external links added
              </p>
            )}

            {isEditing && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newLinkType}
                      onValueChange={(v) => setNewLinkType(v as ExternalLinkType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXTERNAL_LINK_TYPE_METADATA).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      placeholder="e.g., Datadog APM"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={addLink}
                  disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentAgent.tags && currentAgent.tags.length > 0 ? (
                currentAgent.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {tag}
                    {isEditing && editedAgent && (
                      <button
                        onClick={() =>
                          setEditedAgent({
                            ...editedAgent,
                            tags: editedAgent.tags?.filter((_, idx) => idx !== i),
                          })
                        }
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No tags</p>
              )}
              {isEditing && editedAgent && (
                <Input
                  placeholder="Add tag"
                  className="w-[150px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !editedAgent.tags?.includes(value)) {
                        setEditedAgent({
                          ...editedAgent,
                          tags: [...(editedAgent.tags || []), value],
                        });
                        (e.target as HTMLInputElement).value = "";
                      }
                      e.preventDefault();
                    }
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
