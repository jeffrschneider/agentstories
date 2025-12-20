"use client";

import { useSnapshot } from "valtio";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTONOMY_LEVEL_METADATA } from "@/lib/schemas";

export function CoreStorySection() {
  const editor = useSnapshot(storyEditorStore);
  const data = editor.draft.data;

  const updateField = (field: string, value: string) => {
    storyEditorActions.updateNestedField(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Identity</CardTitle>
        <CardDescription>
          Define who this agent is and its core purpose
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
            <Label htmlFor="name">Name *</Label>
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

        {/* Purpose */}
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
