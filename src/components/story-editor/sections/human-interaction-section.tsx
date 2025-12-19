"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HUMAN_INTERACTION_MODE_METADATA, CHECKPOINT_TYPE_METADATA } from "@/lib/schemas/collaboration";

interface Checkpoint {
  name: string;
  trigger: string;
  type: string;
  timeout?: string;
}

export function HumanInteractionSection() {
  const editor = useSnapshot(storyEditorStore);
  const humanInteraction = (editor.draft.data.humanInteraction as Record<string, unknown>) || {};
  const checkpoints = (humanInteraction.checkpoints as Checkpoint[]) || [];
  const escalation = (humanInteraction.escalation as { conditions?: string; channel?: string }) || {};

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`humanInteraction.${path}`, value);
  };

  const addCheckpoint = () => {
    const newCheckpoints = [...checkpoints, { name: "", trigger: "", type: "approval" }];
    updateField("checkpoints", newCheckpoints);
  };

  const updateCheckpoint = (index: number, field: keyof Checkpoint, value: string) => {
    const newCheckpoints = [...checkpoints];
    newCheckpoints[index] = { ...newCheckpoints[index], [field]: value };
    updateField("checkpoints", newCheckpoints);
  };

  const removeCheckpoint = (index: number) => {
    const newCheckpoints = checkpoints.filter((_, i) => i !== index);
    updateField("checkpoints", newCheckpoints);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Human Interaction</CardTitle>
        <CardDescription>
          Define how humans collaborate with this agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interaction Mode */}
        <div className="space-y-2">
          <Label>Interaction Mode</Label>
          <Select
            value={(humanInteraction.mode as string) || ""}
            onValueChange={(value) => updateField("mode", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HUMAN_INTERACTION_MODE_METADATA).map(([key, meta]) => (
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

        {/* Checkpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Checkpoints</Label>
            <Button variant="outline" size="sm" onClick={addCheckpoint}>
              <Plus className="mr-1 h-3 w-3" />
              Add Checkpoint
            </Button>
          </div>
          {checkpoints.map((checkpoint, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between">
                <Input
                  placeholder="Checkpoint name"
                  value={checkpoint.name}
                  onChange={(e) => updateCheckpoint(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCheckpoint(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Trigger (when human involvement is required)"
                value={checkpoint.trigger}
                onChange={(e) => updateCheckpoint(index, "trigger", e.target.value)}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Select
                  value={checkpoint.type}
                  onValueChange={(value) => updateCheckpoint(index, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHECKPOINT_TYPE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Timeout behavior (optional)"
                  value={checkpoint.timeout || ""}
                  onChange={(e) => updateCheckpoint(index, "timeout", e.target.value)}
                />
              </div>
            </div>
          ))}
          {checkpoints.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No checkpoints defined.
            </p>
          )}
        </div>

        {/* Escalation */}
        <div className="space-y-3">
          <Label>Escalation</Label>
          <Input
            placeholder="Escalation conditions"
            value={escalation.conditions || ""}
            onChange={(e) => updateField("escalation.conditions", e.target.value)}
          />
          <Input
            placeholder="Escalation channel (how escalation occurs)"
            value={escalation.channel || ""}
            onChange={(e) => updateField("escalation.channel", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
