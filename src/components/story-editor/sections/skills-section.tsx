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
import { SKILL_ACQUISITION_METADATA } from "@/lib/schemas/skill";

interface Skill {
  name: string;
  domain: string;
  proficiencies: string[];
  qualityBar: string;
  acquired: string;
  toolsUsed?: string[];
}

export function SkillsSection() {
  const editor = useSnapshot(storyEditorStore);
  const skills = (editor.draft.data.skills as Skill[]) || [];
  const tools = (editor.draft.data.tools as { name: string }[]) || [];

  const updateSkills = (newSkills: Skill[]) => {
    storyEditorActions.updateNestedField("skills", newSkills);
  };

  const addSkill = () => {
    updateSkills([
      ...skills,
      { name: "", domain: "", proficiencies: [], qualityBar: "", acquired: "built_in" },
    ]);
  };

  const updateSkill = (index: number, field: keyof Skill, value: unknown) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    updateSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    updateSkills(skills.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          Define the competencies this agent possesses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Skills (required for full format)</Label>
          <Button variant="outline" size="sm" onClick={addSkill}>
            <Plus className="mr-1 h-3 w-3" />
            Add Skill
          </Button>
        </div>

        {skills.map((skill, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start justify-between">
              <Input
                placeholder="Skill name"
                value={skill.name}
                onChange={(e) => updateSkill(index, "name", e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder="Domain (knowledge area)"
              value={skill.domain}
              onChange={(e) => updateSkill(index, "domain", e.target.value)}
            />

            <Textarea
              placeholder="Proficiencies (one per line)"
              value={skill.proficiencies.join("\n")}
              onChange={(e) => {
                const profs = e.target.value.split("\n").filter(Boolean);
                updateSkill(index, "proficiencies", profs);
              }}
              rows={2}
            />

            <Input
              placeholder="Quality bar (what competent execution looks like)"
              value={skill.qualityBar}
              onChange={(e) => updateSkill(index, "qualityBar", e.target.value)}
            />

            <div className="grid gap-2 md:grid-cols-2">
              <Select
                value={skill.acquired}
                onValueChange={(value) => updateSkill(index, "acquired", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Acquisition" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_ACQUISITION_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Tools used (comma-separated)"
                value={(skill.toolsUsed || []).join(", ")}
                onChange={(e) => {
                  const toolsUsed = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                  updateSkill(index, "toolsUsed", toolsUsed);
                }}
              />
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skills defined. At least one skill is required for full format stories.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
