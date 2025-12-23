"use client";

import {
  Clock,
  Lightbulb,
  Activity,
  CheckCircle,
  Archive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LIFECYCLE_STATE_METADATA,
  type Agent,
  type AgentLifecycle,
} from "@/lib/schemas";

// Lifecycle icon mapping
const lifecycleIcons: Record<AgentLifecycle, React.ComponentType<{ className?: string }>> = {
  planned: Lightbulb,
  development: Activity,
  operational: CheckCircle,
  sunset: Archive,
};

interface AgentIdentityCardProps {
  currentAgent: Agent;
  isEditing: boolean;
  editedAgent: Agent | null;
  onUpdateEditedAgent: (updates: Partial<Agent>) => void;
}

export function AgentIdentityCard({
  currentAgent,
  isEditing,
  editedAgent,
  onUpdateEditedAgent,
}: AgentIdentityCardProps) {
  const LifecycleIcon = lifecycleIcons[currentAgent.lifecycleState];
  const lifecycleMeta = LIFECYCLE_STATE_METADATA[currentAgent.lifecycleState];

  return (
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
                  onChange={(e) => onUpdateEditedAgent({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identifier">Identifier</Label>
                <Input
                  id="identifier"
                  value={editedAgent.identifier || ""}
                  onChange={(e) =>
                    onUpdateEditedAgent({ identifier: e.target.value || undefined })
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
                  onUpdateEditedAgent({ description: e.target.value || undefined })
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
                    onUpdateEditedAgent({ lifecycleState: v as AgentLifecycle })
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
                  onUpdateEditedAgent({ lifecycleNotes: e.target.value || undefined })
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
  );
}
