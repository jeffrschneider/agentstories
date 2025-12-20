"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2, ChevronDown, ChevronUp, Zap, Wrench, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Skill,
  createEmptySkill,
  SKILL_ACQUISITION_METADATA,
  SKILL_DOMAINS
} from "@/lib/schemas/skill";
import { TRIGGER_TYPE_METADATA, TriggerType, SkillTrigger } from "@/lib/schemas/trigger";
import { BEHAVIOR_MODEL_METADATA, BehaviorModel } from "@/lib/schemas/behavior";
import { REASONING_STRATEGY_METADATA, ReasoningStrategy } from "@/lib/schemas/reasoning";
import { TOOL_PERMISSION_METADATA, ToolPermission, SkillTool } from "@/lib/schemas/tools";

export function SkillsSection() {
  const editor = useSnapshot(storyEditorStore);
  const skills = (editor.draft.data.skills as Skill[]) || [];
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("identity");

  const updateSkills = (newSkills: Skill[]) => {
    storyEditorActions.updateNestedField("skills", newSkills);
  };

  const addSkill = () => {
    const newSkill = createEmptySkill();
    newSkill.id = crypto.randomUUID();
    updateSkills([...skills, newSkill]);
    setExpandedSkill(skills.length);
    setActiveTab("identity");
  };

  const updateSkill = (index: number, updates: Partial<Skill>) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], ...updates };
    updateSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    updateSkills(skills.filter((_, i) => i !== index));
    if (expandedSkill === index) setExpandedSkill(null);
  };

  const toggleSkillExpand = (index: number) => {
    setExpandedSkill(expandedSkill === index ? null : index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Skills
        </CardTitle>
        <CardDescription>
          Skills are the capabilities your agent possesses. Each skill owns its triggers, tools, behavior, and success criteria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {skills.length} skill{skills.length !== 1 ? "s" : ""} defined
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addSkill}>
            <Plus className="mr-1 h-3 w-3" />
            Add Skill
          </Button>
        </div>

        {skills.map((skill, index) => (
          <SkillEditor
            key={skill.id || index}
            skill={skill}
            index={index}
            isExpanded={expandedSkill === index}
            onToggle={() => toggleSkillExpand(index)}
            onUpdate={(updates) => updateSkill(index, updates)}
            onRemove={() => removeSkill(index)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ))}

        {skills.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              No skills defined. At least one skill is required.
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

interface SkillEditorProps {
  skill: Skill;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Skill>) => void;
  onRemove: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

function SkillEditor({
  skill,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  activeTab,
  setActiveTab
}: SkillEditorProps) {
  const triggerCount = skill.triggers?.length || 0;
  const toolCount = skill.tools?.length || 0;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Skill header */}
      <div
        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <span className="font-medium">
            {skill.name || `Skill ${index + 1}`}
          </span>
          {skill.domain && (
            <Badge variant="outline" className="text-xs">
              {skill.domain}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {triggerCount}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {toolCount}
          </span>
          {skill.acquired && (
            <Badge variant="secondary" className="text-xs">
              {SKILL_ACQUISITION_METADATA[skill.acquired as keyof typeof SKILL_ACQUISITION_METADATA]?.label}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Skill details */}
      {isExpanded && (
        <div className="p-4 border-t">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="triggers">Triggers</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="acceptance">Acceptance</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-4">
              <SkillIdentityEditor skill={skill} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="triggers" className="space-y-4">
              <SkillTriggersEditor skill={skill} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <SkillToolsEditor skill={skill} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <SkillBehaviorEditor skill={skill} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="acceptance" className="space-y-4">
              <SkillAcceptanceEditor skill={skill} onUpdate={onUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// Identity Tab
function SkillIdentityEditor({ skill, onUpdate }: { skill: Skill; onUpdate: (updates: Partial<Skill>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            placeholder="e.g., Request Classification"
            value={skill.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Domain *</Label>
          <Select
            value={skill.domain}
            onValueChange={(value) => onUpdate({ domain: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="What does this skill do?"
          value={skill.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Acquisition</Label>
        <Select
          value={skill.acquired}
          onValueChange={(value) => onUpdate({ acquired: value as Skill["acquired"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="How was this skill acquired?" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SKILL_ACQUISITION_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Triggers Tab
function SkillTriggersEditor({ skill, onUpdate }: { skill: Skill; onUpdate: (updates: Partial<Skill>) => void }) {
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

// Tools Tab
function SkillToolsEditor({ skill, onUpdate }: { skill: Skill; onUpdate: (updates: Partial<Skill>) => void }) {
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

// Behavior Tab
function SkillBehaviorEditor({ skill, onUpdate }: { skill: Skill; onUpdate: (updates: Partial<Skill>) => void }) {
  const behavior = skill.behavior;

  const setBehaviorModel = (model: BehaviorModel | "") => {
    if (!model) {
      onUpdate({ behavior: undefined });
      return;
    }

    switch (model) {
      case "sequential":
        onUpdate({ behavior: { model: "sequential", steps: [""] } });
        break;
      case "workflow":
        onUpdate({ behavior: { model: "workflow", stages: [{ name: "", purpose: "" }] } });
        break;
      case "adaptive":
        onUpdate({ behavior: { model: "adaptive", capabilities: [""] } });
        break;
      case "iterative":
        onUpdate({ behavior: { model: "iterative", body: [""], terminationCondition: "" } });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Behavior Model</Label>
        <p className="text-xs text-muted-foreground">
          Define how this skill executes - its internal workflow or approach.
        </p>
        <Select
          value={behavior?.model || ""}
          onValueChange={(value) => setBehaviorModel(value as BehaviorModel | "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select behavior model (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No behavior model</SelectItem>
            {Object.entries(BEHAVIOR_MODEL_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {behavior?.model === "sequential" && (
        <div className="space-y-2">
          <Label>Steps</Label>
          <Textarea
            placeholder="Ordered list of steps (one per line)"
            value={(behavior as { model: "sequential"; steps: string[] }).steps.join("\n")}
            onChange={(e) => {
              const steps = e.target.value.split("\n");
              onUpdate({ behavior: { model: "sequential", steps } });
            }}
            rows={4}
          />
        </div>
      )}

      {behavior?.model === "adaptive" && (
        <div className="space-y-2">
          <Label>Capabilities</Label>
          <Textarea
            placeholder="Available actions to choose from (one per line)"
            value={(behavior as { model: "adaptive"; capabilities: string[] }).capabilities.join("\n")}
            onChange={(e) => {
              const capabilities = e.target.value.split("\n");
              onUpdate({ behavior: { model: "adaptive", capabilities } });
            }}
            rows={4}
          />
        </div>
      )}

      {behavior?.model === "iterative" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Loop Body</Label>
            <Textarea
              placeholder="Actions per iteration (one per line)"
              value={(behavior as { model: "iterative"; body: string[]; terminationCondition: string }).body.join("\n")}
              onChange={(e) => {
                const body = e.target.value.split("\n");
                onUpdate({
                  behavior: {
                    ...behavior,
                    model: "iterative",
                    body
                  } as { model: "iterative"; body: string[]; terminationCondition: string }
                });
              }}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Termination Condition *</Label>
            <Input
              placeholder="When to stop iterating"
              value={(behavior as { model: "iterative"; body: string[]; terminationCondition: string }).terminationCondition}
              onChange={(e) => {
                onUpdate({
                  behavior: {
                    ...behavior,
                    model: "iterative",
                    terminationCondition: e.target.value
                  } as { model: "iterative"; body: string[]; terminationCondition: string }
                });
              }}
            />
          </div>
        </div>
      )}

      <Collapsible
        title="Reasoning Configuration"
        description="How this skill makes decisions"
        defaultOpen={!!skill.reasoning}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select
              value={skill.reasoning?.strategy || ""}
              onValueChange={(value) => {
                if (!value) {
                  onUpdate({ reasoning: undefined });
                } else {
                  onUpdate({
                    reasoning: {
                      ...skill.reasoning,
                      strategy: value as ReasoningStrategy
                    }
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reasoning strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No reasoning config</SelectItem>
                {Object.entries(REASONING_STRATEGY_METADATA).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label} - {meta.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

// Acceptance Tab
function SkillAcceptanceEditor({ skill, onUpdate }: { skill: Skill; onUpdate: (updates: Partial<Skill>) => void }) {
  const acceptance = skill.acceptance || { successConditions: [] };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Success Conditions *</Label>
        <p className="text-xs text-muted-foreground">
          What must be true for this skill to be considered successful?
        </p>
        <Textarea
          placeholder="Success conditions (one per line)"
          value={acceptance.successConditions.join("\n")}
          onChange={(e) => {
            const successConditions = e.target.value.split("\n");
            onUpdate({ acceptance: { ...acceptance, successConditions } });
          }}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Timeout</Label>
        <Input
          placeholder="e.g., 30 seconds, 5 minutes"
          value={acceptance.timeout || ""}
          onChange={(e) => {
            onUpdate({ acceptance: { ...acceptance, timeout: e.target.value || undefined } });
          }}
        />
      </div>

      <Collapsible
        title="Quality Metrics"
        description="Measurable performance targets"
        defaultOpen={!!acceptance.qualityMetrics?.length}
      >
        <div className="space-y-3">
          {(acceptance.qualityMetrics || []).map((metric, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Metric name"
                value={metric.name}
                onChange={(e) => {
                  const metrics = [...(acceptance.qualityMetrics || [])];
                  metrics[index] = { ...metrics[index], name: e.target.value };
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
                className="flex-1"
              />
              <Input
                placeholder="Target (e.g., >= 95%)"
                value={metric.target}
                onChange={(e) => {
                  const metrics = [...(acceptance.qualityMetrics || [])];
                  metrics[index] = { ...metrics[index], target: e.target.value };
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const metrics = (acceptance.qualityMetrics || []).filter((_, i) => i !== index);
                  onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const metrics = [...(acceptance.qualityMetrics || []), { name: "", target: "" }];
              onUpdate({ acceptance: { ...acceptance, qualityMetrics: metrics } });
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Metric
          </Button>
        </div>
      </Collapsible>

      <Collapsible
        title="Failure Handling"
        description="How to handle errors and failures"
        defaultOpen={!!skill.failureHandling}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Default Fallback</Label>
            <Input
              placeholder="Default action when no specific handler matches"
              value={skill.failureHandling?.defaultFallback || ""}
              onChange={(e) => {
                onUpdate({
                  failureHandling: {
                    notifyOnFailure: skill.failureHandling?.notifyOnFailure ?? true,
                    ...skill.failureHandling,
                    defaultFallback: e.target.value || undefined
                  }
                });
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify-on-failure"
              checked={skill.failureHandling?.notifyOnFailure !== false}
              onChange={(e) => {
                onUpdate({
                  failureHandling: {
                    ...skill.failureHandling,
                    notifyOnFailure: e.target.checked
                  }
                });
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="notify-on-failure" className="text-sm">
              Notify on failure
            </Label>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
