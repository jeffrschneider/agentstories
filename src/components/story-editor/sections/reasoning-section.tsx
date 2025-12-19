"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REASONING_STRATEGIES = {
  rule_based: { label: "Rule-based", description: "Follows predefined rules and logic" },
  llm_guided: { label: "LLM-guided", description: "Uses language model for decisions" },
  hybrid: { label: "Hybrid", description: "Combines rules and LLM reasoning" },
};

interface DecisionPoint {
  name: string;
  inputs: string;
  approach: string;
  fallback?: string;
}

export function ReasoningSection() {
  const editor = useSnapshot(storyEditorStore);
  const reasoning = (editor.draft.data.reasoning as Record<string, unknown>) || {};
  const decisionPoints = (reasoning.decisionPoints as DecisionPoint[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`reasoning.${path}`, value);
  };

  const addDecisionPoint = () => {
    const newPoints = [...decisionPoints, { name: "", inputs: "", approach: "" }];
    updateField("decisionPoints", newPoints);
  };

  const updateDecisionPoint = (index: number, field: keyof DecisionPoint, value: string) => {
    const newPoints = [...decisionPoints];
    newPoints[index] = { ...newPoints[index], [field]: value };
    updateField("decisionPoints", newPoints);
  };

  const removeDecisionPoint = (index: number) => {
    const newPoints = decisionPoints.filter((_, i) => i !== index);
    updateField("decisionPoints", newPoints);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reasoning & Decisions</CardTitle>
        <CardDescription>
          Define how the agent makes decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy */}
        <div className="space-y-2">
          <Label>Reasoning Strategy</Label>
          <Select
            value={(reasoning.strategy as string) || ""}
            onValueChange={(value) => updateField("strategy", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REASONING_STRATEGIES).map(([key, meta]) => (
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

        {/* Decision Points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Decision Points</Label>
            <Button variant="outline" size="sm" onClick={addDecisionPoint}>
              <Plus className="mr-1 h-3 w-3" />
              Add Decision Point
            </Button>
          </div>
          {decisionPoints.map((point, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between">
                <Input
                  placeholder="Decision name"
                  value={point.name}
                  onChange={(e) => updateDecisionPoint(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDecisionPoint(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Inputs (what information is considered)"
                value={point.inputs}
                onChange={(e) => updateDecisionPoint(index, "inputs", e.target.value)}
              />
              <Textarea
                placeholder="Approach (how the decision is made)"
                value={point.approach}
                onChange={(e) => updateDecisionPoint(index, "approach", e.target.value)}
                rows={2}
              />
              <Input
                placeholder="Fallback (optional - what to do if uncertain)"
                value={point.fallback || ""}
                onChange={(e) => updateDecisionPoint(index, "fallback", e.target.value)}
              />
            </div>
          ))}
          {decisionPoints.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No decision points defined.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
