"use client";

import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import {
  Zap,
  Cog,
  Layers,
  Users,
  CheckCircle,
  ChevronRight,
  Circle,
  CircleDot,
} from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { validateStory } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CoreStorySection } from "./sections/core-story-section";
import { TriggerSection } from "./sections/trigger-section";
import { BehaviorSection } from "./sections/behavior-section";
import { ReasoningSection } from "./sections/reasoning-section";
import { MemorySection } from "./sections/memory-section";
import { ToolsSection } from "./sections/tools-section";
import { SkillsSection } from "./sections/skills-section";
import { HumanInteractionSection } from "./sections/human-interaction-section";
import { AgentCollaborationSection } from "./sections/agent-collaboration-section";
import { AcceptanceSection } from "./sections/acceptance-section";
import { ValidationPanel } from "./validation-panel";

// Navigation structure with groups
const NAV_GROUPS = [
  {
    id: "activation",
    label: "Activation",
    icon: Zap,
    description: "When the agent starts",
    sections: [
      { id: "trigger", label: "Trigger", component: TriggerSection },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    icon: Cog,
    description: "How the agent works",
    sections: [
      { id: "behavior", label: "Behavior", component: BehaviorSection },
      { id: "reasoning", label: "Reasoning", component: ReasoningSection },
    ],
  },
  {
    id: "capabilities",
    label: "Capabilities",
    icon: Layers,
    description: "What the agent can do",
    sections: [
      { id: "tools", label: "Tools", component: ToolsSection },
      { id: "skills", label: "Skills", component: SkillsSection },
      { id: "memory", label: "Memory", component: MemorySection },
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    icon: Users,
    description: "Who the agent works with",
    sections: [
      { id: "human", label: "Human Interaction", component: HumanInteractionSection },
      { id: "agents", label: "Agent Collaboration", component: AgentCollaborationSection },
    ],
  },
];

interface StoryFormProps {
  onSave?: () => void;
}

export function StoryForm({ onSave }: StoryFormProps) {
  const editor = useSnapshot(storyEditorStore);
  const isFullFormat = editor.draft.format === "full";
  const [activeGroup, setActiveGroup] = useState("activation");
  const [activeSection, setActiveSection] = useState("trigger");

  // Validate on changes
  useEffect(() => {
    if (Object.keys(editor.draft.data).length > 0) {
      const result = validateStory(editor.draft.data);
      if (!result.valid) {
        storyEditorActions.setValidationErrors(
          result.errors.map((e) => ({ path: e.path, message: e.message }))
        );
      } else {
        storyEditorActions.clearValidationErrors();
      }
    }
  }, [editor.draft.data]);

  // Check if a section has content
  const sectionHasContent = (sectionId: string): boolean => {
    const data = editor.draft.data as Record<string, unknown>;
    switch (sectionId) {
      case "trigger":
        return !!(data.trigger as Record<string, unknown>)?.specification?.type;
      case "behavior":
        return !!(data.behavior as Record<string, unknown>)?.type;
      case "reasoning":
        return !!(data.reasoning as Record<string, unknown>)?.strategy;
      case "tools":
        return ((data.tools as unknown[]) || []).length > 0;
      case "skills":
        return ((data.skills as unknown[]) || []).length > 0;
      case "memory":
        const mem = data.memory as Record<string, unknown>;
        return !!mem?.working || ((mem?.persistent as unknown[]) || []).length > 0;
      case "human":
        return !!(data.humanInteraction as Record<string, unknown>)?.mode;
      case "agents":
        return !!(data.collaboration as Record<string, unknown>)?.role;
      default:
        return false;
    }
  };

  // Get group completion status
  const getGroupStatus = (groupId: string): "empty" | "partial" | "complete" => {
    const group = NAV_GROUPS.find((g) => g.id === groupId);
    if (!group) return "empty";

    const hasContent = group.sections.some((s) => sectionHasContent(s.id));
    const allHaveContent = group.sections.every((s) => sectionHasContent(s.id));

    if (allHaveContent) return "complete";
    if (hasContent) return "partial";
    return "empty";
  };

  // Render active section content
  const renderActiveSection = () => {
    for (const group of NAV_GROUPS) {
      for (const section of group.sections) {
        if (section.id === activeSection) {
          const Component = section.component;
          return <Component />;
        }
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Format selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Story Format</CardTitle>
              <CardDescription>
                Choose the level of detail for your agent story
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={isFullFormat ? "outline" : "default"}
                className="cursor-pointer"
                onClick={() => storyEditorActions.changeFormat("light")}
              >
                Light
              </Badge>
              <Badge
                variant={isFullFormat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => storyEditorActions.changeFormat("full")}
              >
                Full
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isFullFormat
              ? "Full format includes all structured annotations for comprehensive agent specification."
              : "Light format captures core story elements: role, trigger, action, outcome, and autonomy level."}
          </p>
        </CardContent>
      </Card>

      {/* Validation errors */}
      {editor.draft.validationErrors.length > 0 && (
        <ValidationPanel errors={editor.draft.validationErrors} />
      )}

      {/* Core story section - always shown */}
      <CoreStorySection />

      {/* Full format sections with grouped navigation */}
      {isFullFormat && (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Navigation sidebar */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Specifications
            </div>
            {NAV_GROUPS.map((group) => {
              const Icon = group.icon;
              const status = getGroupStatus(group.id);
              const isActiveGroup = activeGroup === group.id;

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group header */}
                  <button
                    onClick={() => {
                      setActiveGroup(group.id);
                      setActiveSection(group.sections[0].id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                      isActiveGroup
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 font-medium text-sm">{group.label}</span>
                    {status === "complete" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {status === "partial" && (
                      <CircleDot className="h-4 w-4 text-yellow-500" />
                    )}
                    {status === "empty" && (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Section items (visible when group is active) */}
                  {isActiveGroup && (
                    <div className="ml-4 space-y-1">
                      {group.sections.map((section) => {
                        const hasContent = sectionHasContent(section.id);
                        const isActive = activeSection === section.id;

                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-sm transition-colors",
                              isActive
                                ? "bg-muted font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            <ChevronRight className={cn(
                              "h-3 w-3 transition-transform",
                              isActive && "rotate-90"
                            )} />
                            <span className="flex-1">{section.label}</span>
                            {hasContent && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Acceptance criteria link */}
            <div className="pt-4 border-t mt-4">
              <button
                onClick={() => {
                  setActiveGroup("");
                  setActiveSection("acceptance");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === "acceptance"
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "hover:bg-muted"
                )}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="flex-1 font-medium text-sm">Success Criteria</span>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="min-w-0">
            {activeSection === "acceptance" ? (
              <AcceptanceSection />
            ) : (
              renderActiveSection()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
