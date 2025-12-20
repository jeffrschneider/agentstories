"use client";

import { useSnapshot } from "valtio";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible } from "@/components/ui/collapsible";
import { TRIGGER_TYPE_METADATA } from "@/lib/schemas/trigger";

const PROTOCOLS = [
  { value: 'a2a', label: 'A2A Protocol' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'queue', label: 'Message Queue' },
];

const CHANGE_TYPES = ['create', 'update', 'delete'] as const;

export function TriggerSection() {
  const editor = useSnapshot(storyEditorStore);
  const trigger = (editor.draft.data.trigger as Record<string, unknown>) || {};
  const spec = (trigger.specification as Record<string, unknown>) || {};
  const details = (trigger.details as Record<string, unknown>) || {};
  const triggerType = spec.type as string;

  const updateSpec = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`trigger.specification.${path}`, value);
  };

  const updateDetails = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`trigger.details.${path}`, value);
    // Also set the type in details to match spec
    if (triggerType) {
      storyEditorActions.updateNestedField(`trigger.details.type`, triggerType);
    }
  };

  const toggleChangeType = (changeType: string) => {
    const current = (details.changeTypes as string[]) || [];
    const newTypes = current.includes(changeType)
      ? current.filter((t) => t !== changeType)
      : [...current, changeType];
    updateDetails("changeTypes", newTypes);
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
            value={triggerType || ""}
            onValueChange={(value) => {
              updateSpec("type", value);
              updateDetails("type", value);
            }}
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
            onChange={(e) => updateSpec("source", e.target.value)}
          />
        </div>

        {/* Conditions */}
        <div className="space-y-2">
          <Label htmlFor="trigger-conditions">Conditions (optional)</Label>
          <Textarea
            id="trigger-conditions"
            placeholder="Guard conditions for when the trigger fires"
            value={(spec.conditions as string) || ""}
            onChange={(e) => updateSpec("conditions", e.target.value)}
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
              updateSpec("examples", examples);
            }}
            rows={3}
          />
        </div>

        {/* Type-specific fields */}
        {triggerType && (
          <Collapsible
            title="Type-Specific Configuration"
            description={`Configure ${TRIGGER_TYPE_METADATA[triggerType as keyof typeof TRIGGER_TYPE_METADATA]?.label || triggerType} details`}
            defaultOpen={true}
          >
            {/* Message trigger fields */}
            {triggerType === "message" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Source Agents</Label>
                  <Input
                    placeholder="Agent IDs that can trigger this (comma-separated)"
                    value={((details.sourceAgents as string[]) || []).join(", ")}
                    onChange={(e) => {
                      const agents = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      updateDetails("sourceAgents", agents);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protocol</Label>
                  <Select
                    value={(details.protocol as string) || "a2a"}
                    onValueChange={(value) => updateDetails("protocol", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOLS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Message Format (optional)</Label>
                  <Input
                    placeholder="Expected message format or schema"
                    value={(details.messageFormat as string) || ""}
                    onChange={(e) => updateDetails("messageFormat", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Schedule trigger fields */}
            {triggerType === "schedule" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Cron Expression</Label>
                  <Input
                    placeholder="e.g., 0 9 * * 1-5 (9 AM weekdays)"
                    value={(details.cronExpression as string) || ""}
                    onChange={(e) => updateDetails("cronExpression", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input
                    placeholder="e.g., UTC, America/New_York"
                    value={(details.timezone as string) || "UTC"}
                    onChange={(e) => updateDetails("timezone", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Resource change trigger fields */}
            {triggerType === "resource_change" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <Input
                    placeholder="e.g., database_record, file, api_state"
                    value={(details.resourceType as string) || ""}
                    onChange={(e) => updateDetails("resourceType", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resource Identifier</Label>
                  <Input
                    placeholder="e.g., orders.*, users/{id}"
                    value={(details.resourceIdentifier as string) || ""}
                    onChange={(e) => updateDetails("resourceIdentifier", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Change Types</Label>
                  <div className="flex gap-2 flex-wrap">
                    {CHANGE_TYPES.map((changeType) => (
                      <Badge
                        key={changeType}
                        variant={((details.changeTypes as string[]) || []).includes(changeType) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => toggleChangeType(changeType)}
                      >
                        {changeType}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cascade trigger fields */}
            {triggerType === "cascade" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Upstream Agent ID</Label>
                  <Input
                    placeholder="Agent that triggers this one"
                    value={(details.upstreamAgentId as string) || ""}
                    onChange={(e) => updateDetails("upstreamAgentId", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Input
                    placeholder="e.g., completion, error, output_ready"
                    value={(details.eventType as string) || ""}
                    onChange={(e) => updateDetails("eventType", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Manual trigger fields */}
            {triggerType === "manual" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Required Role (optional)</Label>
                  <Input
                    placeholder="Role required to trigger manually"
                    value={(details.requiredRole as string) || ""}
                    onChange={(e) => updateDetails("requiredRole", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmation-required"
                    checked={(details.confirmationRequired as boolean) || false}
                    onChange={(e) => updateDetails("confirmationRequired", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="confirmation-required" className="text-sm font-normal">
                    Require confirmation before activation
                  </Label>
                </div>
              </div>
            )}
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
