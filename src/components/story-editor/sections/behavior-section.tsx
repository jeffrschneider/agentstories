"use client";

import { useState } from "react";
import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BEHAVIOR_MODEL_METADATA, PLANNING_STRATEGY_METADATA } from "@/lib/schemas/behavior";

interface Stage {
  name: string;
  purpose: string;
}

export function BehaviorSection() {
  const editor = useSnapshot(storyEditorStore);
  const behavior = (editor.draft.data.behavior as Record<string, unknown>) || {};
  const stages = (behavior.stages as Stage[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`behavior.${path}`, value);
  };

  const addStage = () => {
    const newStages = [...stages, { name: "", purpose: "" }];
    updateField("stages", newStages);
  };

  const updateStage = (index: number, field: keyof Stage, value: string) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    updateField("stages", newStages);
  };

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    updateField("stages", newStages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Model</CardTitle>
        <CardDescription>
          Define how the agent structures its work
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Behavior Type */}
        <div className="space-y-2">
          <Label>Behavior Type</Label>
          <Select
            value={(behavior.type as string) || ""}
            onValueChange={(value) => updateField("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select behavior type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BEHAVIOR_MODEL_METADATA).map(([key, meta]) => (
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

        {/* Planning Strategy */}
        <div className="space-y-2">
          <Label>Planning Strategy</Label>
          <Select
            value={(behavior.planning as string) || "none"}
            onValueChange={(value) => updateField("planning", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select planning strategy" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLANNING_STRATEGY_METADATA).map(([key, meta]) => (
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

        {/* Workflow Stages */}
        {(behavior.type === "workflow" || behavior.type === "hybrid") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Workflow Stages</Label>
              <Button variant="outline" size="sm" onClick={addStage}>
                <Plus className="mr-1 h-3 w-3" />
                Add Stage
              </Button>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Stage name"
                    value={stage.name}
                    onChange={(e) => updateStage(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Stage purpose"
                    value={stage.purpose}
                    onChange={(e) => updateStage(index, "purpose", e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {stages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No stages defined. Add stages to define the workflow.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
