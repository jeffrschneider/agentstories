"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible } from "@/components/ui/collapsible";
import { SKILL_ACQUISITION_METADATA } from "@/lib/schemas/skill";
import { REASONING_STRATEGY_METADATA } from "@/lib/schemas/reasoning";

interface SkillReasoning {
  strategy: string;
  notes?: string;
}

interface Skill {
  name: string;
  domain: string;
  proficiencies: string[];
  qualityBar: string;
  acquired: string;
  toolsUsed?: string[];
  reasoning?: SkillReasoning;
}

export function SkillsSection() {
  const editor = useSnapshot(storyEditorStore);
  const skills = (editor.draft.data.skills as Skill[]) || [];
  const tools = (editor.draft.data.tools as { name: string }[]) || [];
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);

  const updateSkills = (newSkills: Skill[]) => {
    storyEditorActions.updateNestedField("skills", newSkills);
  };

  const addSkill = () => {
    updateSkills([
      ...skills,
      { name: "", domain: "", proficiencies: [], qualityBar: "", acquired: "built_in" },
    ]);
    setExpandedSkill(skills.length);
  };

  const updateSkill = (index: number, field: keyof Skill, value: unknown) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    updateSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    updateSkills(skills.filter((_, i) => i !== index));
    if (expandedSkill === index) setExpandedSkill(null);
  };

  const toggleSkillExpand = (index: number) => {
    setExpandedSkill(expandedSkill === index ? null : index);
  };

  // Get available tool names for reference
  const toolNames = tools.map((t) => t.name).filter(Boolean);

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
          <div>
            <Label>Skills (required for full format)</Label>
            <p className="text-xs text-muted-foreground">
              Composable units of competency that define what the agent can do
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addSkill}>
            <Plus className="mr-1 h-3 w-3" />
            Add Skill
          </Button>
        </div>

        {skills.map((skill, index) => (
          <div key={index} className="rounded-lg border overflow-hidden">
            {/* Skill header - always visible */}
            <div
              className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSkillExpand(index)}
            >
              <div className="flex items-center gap-2">
                {expandedSkill === index ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {skill.name || `Skill ${index + 1}`}
                </span>
                {skill.domain && (
                  <Badge variant="outline" className="text-xs">
                    {skill.domain}
                  </Badge>
                )}
                {skill.acquired && (
                  <Badge variant="secondary" className="text-xs">
                    {SKILL_ACQUISITION_METADATA[skill.acquired as keyof typeof SKILL_ACQUISITION_METADATA]?.label || skill.acquired}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(index);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Skill details - expandable */}
            {expandedSkill === index && (
              <div className="p-3 space-y-3 border-t">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Skill name"
                      value={skill.name}
                      onChange={(e) => updateSkill(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input
                      placeholder="Knowledge domain"
                      value={skill.domain}
                      onChange={(e) => updateSkill(index, "domain", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Proficiencies</Label>
                  <Textarea
                    placeholder="Specific competencies within this skill (one per line)"
                    value={skill.proficiencies.join("\n")}
                    onChange={(e) => {
                      const profs = e.target.value.split("\n").filter(Boolean);
                      updateSkill(index, "proficiencies", profs);
                    }}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quality Bar</Label>
                  <Textarea
                    placeholder="What competent execution looks like (measurable criteria)"
                    value={skill.qualityBar}
                    onChange={(e) => updateSkill(index, "qualityBar", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Acquisition</Label>
                    <Select
                      value={skill.acquired}
                      onValueChange={(value) => updateSkill(index, "acquired", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How acquired" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SKILL_ACQUISITION_METADATA).map(([key, meta]) => (
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
                  <div className="space-y-2">
                    <Label>Tools Used</Label>
                    {toolNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 p-2 border rounded min-h-[40px]">
                        {toolNames.map((toolName) => (
                          <Badge
                            key={toolName}
                            variant={(skill.toolsUsed || []).includes(toolName) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = skill.toolsUsed || [];
                              const newTools = current.includes(toolName)
                                ? current.filter((t) => t !== toolName)
                                : [...current, toolName];
                              updateSkill(index, "toolsUsed", newTools);
                            }}
                          >
                            {toolName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Input
                        placeholder="Tools used (comma-separated)"
                        value={(skill.toolsUsed || []).join(", ")}
                        onChange={(e) => {
                          const toolsUsed = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                          updateSkill(index, "toolsUsed", toolsUsed);
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Skill-level reasoning override */}
                <Collapsible
                  title="Skill-Level Reasoning"
                  description="Override agent-level reasoning for this skill"
                  defaultOpen={!!skill.reasoning?.strategy}
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Reasoning Strategy Override</Label>
                      <Select
                        value={skill.reasoning?.strategy || ""}
                        onValueChange={(value) => {
                          updateSkill(index, "reasoning", {
                            ...skill.reasoning,
                            strategy: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Use agent-level reasoning" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Use agent-level reasoning</SelectItem>
                          {Object.entries(REASONING_STRATEGY_METADATA).map(([key, meta]) => (
                            <SelectItem key={key} value={key}>
                              {meta.label} - {meta.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {skill.reasoning?.strategy && (
                      <div className="space-y-2">
                        <Label>Reasoning Notes</Label>
                        <Textarea
                          placeholder="Describe skill-specific reasoning approach"
                          value={skill.reasoning?.notes || ""}
                          onChange={(e) => {
                            updateSkill(index, "reasoning", {
                              ...skill.reasoning,
                              notes: e.target.value,
                            });
                          }}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </Collapsible>
              </div>
            )}
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              No skills defined. At least one skill is required for full format stories.
            </p>
            <Button variant="outline" size="sm" onClick={addSkill}>
              <Plus className="mr-1 h-3 w-3" />
              Add First Skill
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
