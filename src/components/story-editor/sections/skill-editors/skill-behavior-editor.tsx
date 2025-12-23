"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible } from "@/components/ui/collapsible";
import { Skill } from "@/lib/schemas/skill";
import { BEHAVIOR_MODEL_METADATA, BehaviorModel } from "@/lib/schemas/behavior";
import { REASONING_STRATEGY_METADATA, ReasoningStrategy } from "@/lib/schemas/reasoning";

interface SkillBehaviorEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillBehaviorEditor({ skill, onUpdate }: SkillBehaviorEditorProps) {
  const behavior = skill.behavior;

  const setBehaviorModel = (model: BehaviorModel | "none") => {
    if (model === "none") {
      onUpdate({ behavior: undefined });
      return;
    }

    switch (model) {
      case "sequential":
        onUpdate({ behavior: { model: "sequential", steps: [""] } });
        break;
      case "workflow":
        onUpdate({ behavior: { model: "workflow", stages: [{ name: "", purpose: "" }] } });
        break;
      case "adaptive":
        onUpdate({ behavior: { model: "adaptive", capabilities: [""] } });
        break;
      case "iterative":
        onUpdate({ behavior: { model: "iterative", body: [""], terminationCondition: "" } });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Behavior Model</Label>
        <p className="text-xs text-muted-foreground">
          Define how this skill executes - its internal workflow or approach.
        </p>
        <Select
          value={behavior?.model || "none"}
          onValueChange={(value) => setBehaviorModel(value as BehaviorModel | "none")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select behavior model (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No behavior model</SelectItem>
            {Object.entries(BEHAVIOR_MODEL_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {behavior?.model === "sequential" && (
        <div className="space-y-2">
          <Label>Steps</Label>
          <Textarea
            placeholder="Ordered list of steps (one per line)"
            value={(behavior as { model: "sequential"; steps: string[] }).steps.join("\n")}
            onChange={(e) => {
              const steps = e.target.value.split("\n");
              onUpdate({ behavior: { model: "sequential", steps } });
            }}
            rows={4}
          />
        </div>
      )}

      {behavior?.model === "adaptive" && (
        <div className="space-y-2">
          <Label>Capabilities</Label>
          <Textarea
            placeholder="Available actions to choose from (one per line)"
            value={(behavior as { model: "adaptive"; capabilities: string[] }).capabilities.join("\n")}
            onChange={(e) => {
              const capabilities = e.target.value.split("\n");
              onUpdate({ behavior: { model: "adaptive", capabilities } });
            }}
            rows={4}
          />
        </div>
      )}

      {behavior?.model === "iterative" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Loop Body</Label>
            <Textarea
              placeholder="Actions per iteration (one per line)"
              value={(behavior as { model: "iterative"; body: string[]; terminationCondition: string }).body.join("\n")}
              onChange={(e) => {
                const body = e.target.value.split("\n");
                onUpdate({
                  behavior: {
                    ...behavior,
                    model: "iterative",
                    body
                  } as { model: "iterative"; body: string[]; terminationCondition: string }
                });
              }}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Termination Condition *</Label>
            <Input
              placeholder="When to stop iterating"
              value={(behavior as { model: "iterative"; body: string[]; terminationCondition: string }).terminationCondition}
              onChange={(e) => {
                onUpdate({
                  behavior: {
                    ...behavior,
                    model: "iterative",
                    terminationCondition: e.target.value
                  } as { model: "iterative"; body: string[]; terminationCondition: string }
                });
              }}
            />
          </div>
        </div>
      )}

      <Collapsible
        title="Reasoning Configuration"
        description="How this skill makes decisions"
        defaultOpen={!!skill.reasoning}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select
              value={skill.reasoning?.strategy || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onUpdate({ reasoning: undefined });
                } else {
                  onUpdate({
                    reasoning: {
                      ...skill.reasoning,
                      strategy: value as ReasoningStrategy
                    }
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reasoning strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No reasoning config</SelectItem>
                {Object.entries(REASONING_STRATEGY_METADATA).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label} - {meta.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
