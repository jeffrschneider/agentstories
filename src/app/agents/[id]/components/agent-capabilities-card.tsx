"use client";

import { useState } from "react";
import { Lightbulb, Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
  createPlannedCapability,
  CAPABILITY_PRIORITY_METADATA,
  type Agent,
  type CapabilityPriority,
  type PlannedCapability,
} from "@/lib/schemas";

interface AgentCapabilitiesCardProps {
  currentAgent: Agent;
  isEditing: boolean;
  editedAgent: Agent | null;
  onUpdateEditedAgent: (updates: Partial<Agent>) => void;
}

export function AgentCapabilitiesCard({
  currentAgent,
  isEditing,
  editedAgent,
  onUpdateEditedAgent,
}: AgentCapabilitiesCardProps) {
  const [newCapName, setNewCapName] = useState("");
  const [newCapDescription, setNewCapDescription] = useState("");
  const [newCapPriority, setNewCapPriority] = useState<CapabilityPriority>("must-have");

  const addCapability = () => {
    if (!editedAgent || !newCapName.trim()) return;

    const newCap = createPlannedCapability(
      newCapName.trim(),
      newCapDescription.trim() || undefined,
      newCapPriority
    );

    onUpdateEditedAgent({
      plannedCapabilities: [...(editedAgent.plannedCapabilities || []), newCap],
    });

    setNewCapName("");
    setNewCapDescription("");
    setNewCapPriority("must-have");
  };

  const removeCapability = (capId: string) => {
    if (!editedAgent) return;
    onUpdateEditedAgent({
      plannedCapabilities: editedAgent.plannedCapabilities?.filter((c) => c.id !== capId),
    });
  };

  const capabilities = currentAgent.plannedCapabilities || [];

  return (
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
        {capabilities.length > 0 ? (
          <div className="space-y-2">
            {capabilities.map((cap: PlannedCapability) => (
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
  );
}
