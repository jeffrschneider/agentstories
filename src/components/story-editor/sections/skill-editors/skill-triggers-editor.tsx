"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skill } from "@/lib/schemas/skill";
import { TRIGGER_TYPE_METADATA, TriggerType, SkillTrigger } from "@/lib/schemas/trigger";

interface SkillTriggersEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillTriggersEditor({ skill, onUpdate }: SkillTriggersEditorProps) {
  const triggers = skill.triggers || [];

  const addTrigger = () => {
    onUpdate({ triggers: [...triggers, { type: "manual", description: "" }] });
  };

  const updateTrigger = (index: number, updates: Partial<SkillTrigger>) => {
    const newTriggers = [...triggers];
    newTriggers[index] = { ...newTriggers[index], ...updates };
    onUpdate({ triggers: newTriggers });
  };

  const removeTrigger = (index: number) => {
    onUpdate({ triggers: triggers.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Triggers *</Label>
          <p className="text-xs text-muted-foreground">
            Define when this skill activates. At least one trigger is required.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addTrigger}>
          <Plus className="mr-1 h-3 w-3" />
          Add Trigger
        </Button>
      </div>

      {triggers.map((trigger, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select
                value={trigger.type}
                onValueChange={(value) => updateTrigger(index, { type: value as TriggerType })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {TRIGGER_TYPE_METADATA[trigger.type as keyof typeof TRIGGER_TYPE_METADATA]?.description}
              </span>
            </div>
            {triggers.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeTrigger(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Input
              placeholder="When does this trigger fire?"
              value={trigger.description}
              onChange={(e) => updateTrigger(index, { description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Conditions</Label>
            <Textarea
              placeholder="Guard conditions (one per line)"
              value={(trigger.conditions || []).join("\n")}
              onChange={(e) => {
                const conditions = e.target.value.split("\n").filter(Boolean);
                updateTrigger(index, { conditions });
              }}
              rows={2}
            />
          </div>
        </div>
      ))}

      {triggers.length === 0 && (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">No triggers defined</p>
          <Button variant="outline" size="sm" onClick={addTrigger}>
            <Plus className="mr-1 h-3 w-3" />
            Add Trigger
          </Button>
        </div>
      )}
    </div>
  );
}
