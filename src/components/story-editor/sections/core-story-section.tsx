"use client";

import { useSnapshot } from "valtio";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTONOMY_LEVEL_METADATA, TRIGGER_TYPE_METADATA } from "@/lib/schemas";

export function CoreStorySection() {
  const editor = useSnapshot(storyEditorStore);
  const data = editor.draft.data;
  const isFullFormat = editor.draft.format === "full";

  const updateField = (field: string, value: string) => {
    storyEditorActions.updateNestedField(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Identity</CardTitle>
        <CardDescription>
          {isFullFormat
            ? "Define who this agent is and its core purpose"
            : "Define the fundamental elements of your agent story"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identifier and Name */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identifier">Identifier</Label>
            <Input
              id="identifier"
              placeholder="my-agent-id"
              value={(data.identifier as string) || ""}
              onChange={(e) => updateField("identifier", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Agent Name"
              value={(data.name as string) || ""}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Textarea
            id="role"
            placeholder="As a [role], this agent..."
            value={(data.role as string) || ""}
            onChange={(e) => updateField("role", e.target.value)}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Describe what role this agent fulfills
          </p>
        </div>

        {/* Purpose - Full format only */}
        {isFullFormat && (
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              placeholder="Why does this agent exist? What value does it provide?"
              value={(data.purpose as string) || ""}
              onChange={(e) => updateField("purpose", e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              The core reason this agent exists
            </p>
          </div>
        )}

        {/* Light format: Trigger, Action, Outcome */}
        {!isFullFormat && (
          <>
            {/* Trigger */}
            <div className="space-y-3">
              <Label>Trigger</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trigger-type" className="text-xs text-muted-foreground">Type</Label>
                  <Select
                    value={(data.trigger as { type?: string })?.type || ""}
                    onValueChange={(value) => updateField("trigger.type", value)}
                  >
                    <SelectTrigger id="trigger-type">
                      <SelectValue placeholder="Select trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_TYPE_METADATA).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger-description" className="text-xs text-muted-foreground">Description</Label>
                  <Input
                    id="trigger-description"
                    placeholder="When this happens..."
                    value={(data.trigger as { description?: string })?.description || ""}
                    onChange={(e) => updateField("trigger.description", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Textarea
                id="action"
                placeholder="I will [action/goal]..."
                value={(data.action as string) || ""}
                onChange={(e) => updateField("action", e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                What action does this agent take?
              </p>
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Textarea
                id="outcome"
                placeholder="So that [outcome]..."
                value={(data.outcome as string) || ""}
                onChange={(e) => updateField("outcome", e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                What is the expected result?
              </p>
            </div>
          </>
        )}

        {/* Autonomy Level */}
        <div className="space-y-2">
          <Label htmlFor="autonomy">Autonomy Level</Label>
          <Select
            value={(data.autonomyLevel as string) || ""}
            onValueChange={(value) => updateField("autonomyLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select autonomy level" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AUTONOMY_LEVEL_METADATA).map(([key, meta]) => (
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

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="tag1, tag2, tag3"
            value={((data.tags as string[]) || []).join(", ")}
            onChange={(e) => {
              const tags = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              storyEditorActions.updateDraft("tags", tags);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated tags for organization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
