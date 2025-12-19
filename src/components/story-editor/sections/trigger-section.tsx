"use client";

import { useSnapshot } from "valtio";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRIGGER_TYPE_METADATA } from "@/lib/schemas/trigger";

export function TriggerSection() {
  const editor = useSnapshot(storyEditorStore);
  const trigger = (editor.draft.data.trigger as Record<string, unknown>) || {};
  const spec = (trigger.specification as Record<string, unknown>) || {};

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`trigger.${path}`, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger Specification</CardTitle>
        <CardDescription>
          Define when and how this agent is activated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trigger Type */}
        <div className="space-y-2">
          <Label>Trigger Type</Label>
          <Select
            value={(spec.type as string) || ""}
            onValueChange={(value) => updateField("specification.type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trigger type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_TYPE_METADATA).map(([key, meta]) => (
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

        {/* Source */}
        <div className="space-y-2">
          <Label htmlFor="trigger-source">Source</Label>
          <Input
            id="trigger-source"
            placeholder="Description of event source"
            value={(spec.source as string) || ""}
            onChange={(e) => updateField("specification.source", e.target.value)}
          />
        </div>

        {/* Conditions */}
        <div className="space-y-2">
          <Label htmlFor="trigger-conditions">Conditions (optional)</Label>
          <Textarea
            id="trigger-conditions"
            placeholder="Guard conditions for when the trigger fires"
            value={(spec.conditions as string) || ""}
            onChange={(e) => updateField("specification.conditions", e.target.value)}
            rows={2}
          />
        </div>

        {/* Examples */}
        <div className="space-y-2">
          <Label htmlFor="trigger-examples">Examples (optional)</Label>
          <Textarea
            id="trigger-examples"
            placeholder="Concrete examples of triggering events (one per line)"
            value={((spec.examples as string[]) || []).join("\n")}
            onChange={(e) => {
              const examples = e.target.value.split("\n").filter(Boolean);
              updateField("specification.examples", examples);
            }}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
