"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PERMISSIONS = ["read", "write", "execute", "admin"] as const;

interface Tool {
  name: string;
  purpose: string;
  permissions: string[];
  conditions?: string;
}

export function ToolsSection() {
  const editor = useSnapshot(storyEditorStore);
  const tools = (editor.draft.data.tools as Tool[]) || [];

  const updateTools = (newTools: Tool[]) => {
    storyEditorActions.updateNestedField("tools", newTools);
  };

  const addTool = () => {
    updateTools([...tools, { name: "", purpose: "", permissions: ["read"] }]);
  };

  const updateTool = (index: number, field: keyof Tool, value: unknown) => {
    const newTools = [...tools];
    newTools[index] = { ...newTools[index], [field]: value };
    updateTools(newTools);
  };

  const togglePermission = (index: number, permission: string) => {
    const tool = tools[index];
    const newPermissions = tool.permissions.includes(permission)
      ? tool.permissions.filter((p) => p !== permission)
      : [...tool.permissions, permission];
    updateTool(index, "permissions", newPermissions);
  };

  const removeTool = (index: number) => {
    updateTools(tools.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools & Integrations</CardTitle>
        <CardDescription>
          Define what tools and APIs the agent can access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Tools</Label>
          <Button variant="outline" size="sm" onClick={addTool}>
            <Plus className="mr-1 h-3 w-3" />
            Add Tool
          </Button>
        </div>

        {tools.map((tool, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start justify-between">
              <Input
                placeholder="Tool name"
                value={tool.name}
                onChange={(e) => updateTool(index, "name", e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTool(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Purpose (why the agent uses this tool)"
              value={tool.purpose}
              onChange={(e) => updateTool(index, "purpose", e.target.value)}
            />
            <div className="space-y-2">
              <Label className="text-xs">Permissions</Label>
              <div className="flex gap-2 flex-wrap">
                {PERMISSIONS.map((perm) => (
                  <Badge
                    key={perm}
                    variant={tool.permissions.includes(perm) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePermission(index, perm)}
                  >
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
            <Input
              placeholder="Conditions (optional - when tool is available)"
              value={tool.conditions || ""}
              onChange={(e) => updateTool(index, "conditions", e.target.value)}
            />
          </div>
        ))}

        {tools.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tools defined. Add tools to specify what the agent can use.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
