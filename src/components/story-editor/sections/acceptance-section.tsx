"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AcceptanceSection() {
  const editor = useSnapshot(storyEditorStore);
  const acceptance = (editor.draft.data.acceptance as Record<string, unknown>) || {};
  const functional = (acceptance.functional as string[]) || [];
  const quality = (acceptance.quality as string[]) || [];
  const guardrails = (acceptance.guardrails as string[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`acceptance.${path}`, value);
  };

  const addItem = (field: string, items: string[]) => {
    updateField(field, [...items, ""]);
  };

  const updateItem = (field: string, items: string[], index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    updateField(field, newItems);
  };

  const removeItem = (field: string, items: string[], index: number) => {
    updateField(field, items.filter((_, i) => i !== index));
  };

  const CriteriaList = ({
    label,
    description,
    field,
    items,
    placeholder,
    required = false,
  }: {
    label: string;
    description: string;
    field: string;
    items: string[];
    placeholder: string;
    required?: boolean;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => addItem(field, items)}>
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(e) => updateItem(field, items, index, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(field, items, index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No criteria defined.
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acceptance Criteria</CardTitle>
        <CardDescription>
          Define what success looks like for this agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CriteriaList
          label="Functional Criteria"
          description="Observable behaviors that indicate success"
          field="functional"
          items={functional}
          placeholder="e.g., Agent responds within 5 seconds"
          required
        />

        <CriteriaList
          label="Quality Criteria"
          description="Non-functional requirements: latency, accuracy, etc."
          field="quality"
          items={quality}
          placeholder="e.g., 99.9% uptime"
        />

        <CriteriaList
          label="Guardrails"
          description="Constraints the agent must never violate"
          field="guardrails"
          items={guardrails}
          placeholder="e.g., Never share PII without authorization"
        />
      </CardContent>
    </Card>
  );
}
