"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2, ChevronDown, ChevronUp, Zap, Wrench } from "lucide-react";
import { useState } from "react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skill, createEmptySkill, SKILL_ACQUISITION_METADATA } from "@/lib/schemas/skill";
import {
  SkillIdentityEditor,
  SkillTriggersEditor,
  SkillToolsEditor,
  SkillBehaviorEditor,
  SkillAcceptanceEditor,
} from "./skill-editors";

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
