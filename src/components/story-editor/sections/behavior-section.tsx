"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible } from "@/components/ui/collapsible";
import { BEHAVIOR_MODEL_METADATA, PLANNING_STRATEGY_METADATA } from "@/lib/schemas/behavior";

interface Transition {
  to: string;
  when: string;
}

interface Stage {
  name: string;
  purpose: string;
  transitions?: Transition[];
}

export function BehaviorSection() {
  const editor = useSnapshot(storyEditorStore);
  const behavior = (editor.draft.data.behavior as Record<string, unknown>) || {};
  const behaviorType = behavior.type as string;
  const stages = (behavior.stages as Stage[]) || [];
  const capabilities = (behavior.capabilities as string[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`behavior.${path}`, value);
  };

  // Stage management
  const addStage = () => {
    const newStages = [...stages, { name: "", purpose: "", transitions: [] }];
    updateField("stages", newStages);
  };

  const updateStage = (index: number, field: keyof Stage, value: unknown) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    updateField("stages", newStages);
  };

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    updateField("stages", newStages);
  };

  // Transition management
  const addTransition = (stageIndex: number) => {
    const stage = stages[stageIndex];
    const newTransitions = [...(stage.transitions || []), { to: "", when: "" }];
    updateStage(stageIndex, "transitions", newTransitions);
  };

  const updateTransition = (stageIndex: number, transitionIndex: number, field: keyof Transition, value: string) => {
    const stage = stages[stageIndex];
    const newTransitions = [...(stage.transitions || [])];
    newTransitions[transitionIndex] = { ...newTransitions[transitionIndex], [field]: value };
    updateStage(stageIndex, "transitions", newTransitions);
  };

  const removeTransition = (stageIndex: number, transitionIndex: number) => {
    const stage = stages[stageIndex];
    const newTransitions = (stage.transitions || []).filter((_, i) => i !== transitionIndex);
    updateStage(stageIndex, "transitions", newTransitions);
  };

  const showStages = behaviorType === "workflow" || behaviorType === "hybrid";
  const showCapabilities = behaviorType === "adaptive" || behaviorType === "hybrid";

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
            value={behaviorType || ""}
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

        {/* Capabilities (for adaptive/hybrid) */}
        {showCapabilities && (
          <div className="space-y-2">
            <Label>Capabilities</Label>
            <Input
              placeholder="High-level capabilities (comma-separated)"
              value={capabilities.join(", ")}
              onChange={(e) => {
                const caps = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                updateField("capabilities", caps);
              }}
            />
            <p className="text-xs text-muted-foreground">
              What this agent can dynamically invoke based on context
            </p>
          </div>
        )}

        {/* Workflow Stages (for workflow/hybrid) */}
        {showStages && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Workflow Stages</Label>
                <p className="text-xs text-muted-foreground">
                  Define the stages and transitions of the workflow
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addStage}>
                <Plus className="mr-1 h-3 w-3" />
                Add Stage
              </Button>
            </div>

            {stages.map((stage, stageIndex) => (
              <div key={stageIndex} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Stage name"
                      value={stage.name}
                      onChange={(e) => updateStage(stageIndex, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Stage purpose"
                      value={stage.purpose}
                      onChange={(e) => updateStage(stageIndex, "purpose", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStage(stageIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Transitions */}
                <Collapsible
                  title="Transitions"
                  description={`${(stage.transitions || []).length} transition(s) defined`}
                  defaultOpen={(stage.transitions || []).length > 0}
                >
                  <div className="space-y-2">
                    {(stage.transitions || []).map((transition, transitionIndex) => (
                      <div key={transitionIndex} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          placeholder="Target stage"
                          value={transition.to}
                          onChange={(e) => updateTransition(stageIndex, transitionIndex, "to", e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">when</span>
                        <Input
                          placeholder="Condition"
                          value={transition.when}
                          onChange={(e) => updateTransition(stageIndex, transitionIndex, "when", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTransition(stageIndex, transitionIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTransition(stageIndex)}
                      className="w-full"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Transition
                    </Button>
                  </div>
                </Collapsible>
              </div>
            ))}

            {stages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stages defined. Add stages to define the workflow.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
