"use client";

import { Plus, Trash2, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/lib/schemas/skill";
import { TOOL_PERMISSION_METADATA, ToolPermission, SkillTool } from "@/lib/schemas/tools";

interface SkillToolsEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillToolsEditor({ skill, onUpdate }: SkillToolsEditorProps) {
  const tools = skill.tools || [];

  const addTool = () => {
    onUpdate({
      tools: [...tools, { name: "", purpose: "", permissions: ["read"], required: true }]
    });
  };

  const updateTool = (index: number, updates: Partial<SkillTool>) => {
    const newTools = [...tools];
    newTools[index] = { ...newTools[index], ...updates };
    onUpdate({ tools: newTools });
  };

  const removeTool = (index: number) => {
    onUpdate({ tools: tools.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Tools</Label>
          <p className="text-xs text-muted-foreground">
            Declare the tools (MCP servers, APIs) this skill needs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addTool}>
          <Plus className="mr-1 h-3 w-3" />
          Add Tool
        </Button>
      </div>

      {tools.map((tool, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{tool.name || "New Tool"}</span>
              {tool.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeTool(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Customer Database MCP"
                value={tool.name}
                onChange={(e) => updateTool(index, { name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions *</Label>
              <div className="flex flex-wrap gap-1 p-2 border rounded min-h-[40px]">
                {(Object.keys(TOOL_PERMISSION_METADATA) as ToolPermission[]).map((perm) => (
                  <Badge
                    key={perm}
                    variant={tool.permissions?.includes(perm) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = tool.permissions || [];
                      const newPerms = current.includes(perm)
                        ? current.filter((p) => p !== perm)
                        : [...current, perm];
                      updateTool(index, { permissions: newPerms });
                    }}
                  >
                    {TOOL_PERMISSION_METADATA[perm].label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Input
              placeholder="Why does this skill use this tool?"
              value={tool.purpose}
              onChange={(e) => updateTool(index, { purpose: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`tool-required-${index}`}
              checked={tool.required !== false}
              onChange={(e) => updateTool(index, { required: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor={`tool-required-${index}`} className="text-sm">
              Required for skill execution
            </Label>
          </div>
        </div>
      ))}

      {tools.length === 0 && (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <Wrench className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            No tools required for this skill
          </p>
          <Button variant="outline" size="sm" onClick={addTool}>
            <Plus className="mr-1 h-3 w-3" />
            Add Tool
          </Button>
        </div>
      )}
    </div>
  );
}
