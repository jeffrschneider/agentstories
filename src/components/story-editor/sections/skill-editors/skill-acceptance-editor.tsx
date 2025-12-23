"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { Skill } from "@/lib/schemas/skill";

interface SkillAcceptanceEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillAcceptanceEditor({ skill, onUpdate }: SkillAcceptanceEditorProps) {
  const acceptance = skill.acceptance || { successConditions: [] };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Success Conditions *</Label>
        <p className="text-xs text-muted-foreground">
          What must be true for this skill to be considered successful?
        </p>
        <Textarea
          placeholder="Success conditions (one per line)"
          value={acceptance.successConditions.join("\n")}
          onChange={(e) => {
            const successConditions = e.target.value.split("\n");
            onUpdate({ acceptance: { ...acceptance, successConditions } });
          }}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Timeout</Label>
        <Input
          placeholder="e.g., 30 seconds, 5 minutes"
          value={acceptance.timeout || ""}
          onChange={(e) => {
            onUpdate({ acceptance: { ...acceptance, timeout: e.target.value || undefined } });
          }}
        />
      </div>

      <Collapsible
        title="Quality Metrics"
        description="Measurable performance targets"
        defaultOpen={!!acceptance.qualityMetrics?.length}
      >
        <div className="space-y-3">
          {(acceptance.qualityMetrics || []).map((metric, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Metric name"
                value={metric.name}
                onChange={(e) => {
                  const metrics = [...(acceptance.qualityMetrics || [])];
                  metrics[index] = { ...metrics[index], name: e.target.value };
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
                className="flex-1"
              />
              <Input
                placeholder="Target (e.g., >= 95%)"
                value={metric.target}
                onChange={(e) => {
                  const metrics = [...(acceptance.qualityMetrics || [])];
                  metrics[index] = { ...metrics[index], target: e.target.value };
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const metrics = (acceptance.qualityMetrics || []).filter((_, i) => i !== index);
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const metrics = [...(acceptance.qualityMetrics || []), { name: "", target: "" }];
              onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Metric
          </Button>
        </div>
      </Collapsible>

      <Collapsible
        title="Failure Handling"
        description="How to handle errors and failures"
        defaultOpen={!!skill.failureHandling}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Default Fallback</Label>
            <Input
              placeholder="Default action when no specific handler matches"
              value={skill.failureHandling?.defaultFallback || ""}
              onChange={(e) => {
                onUpdate({
                  failureHandling: {
                    notifyOnFailure: skill.failureHandling?.notifyOnFailure ?? true,
                    ...skill.failureHandling,
                    defaultFallback: e.target.value || undefined
                  }
                });
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify-on-failure"
              checked={skill.failureHandling?.notifyOnFailure !== false}
              onChange={(e) => {
                onUpdate({
                  failureHandling: {
                    ...skill.failureHandling,
                    notifyOnFailure: e.target.checked
                  }
                });
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="notify-on-failure" className="text-sm">
              Notify on failure
            </Label>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
