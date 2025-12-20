"use client";

import { useState } from "react";
import { useSnapshot } from "valtio";
import {
  Zap,
  Users,
  Database,
  Shield,
  ChevronRight,
} from "lucide-react";
import { storyEditorStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CoreStorySection } from "./sections/core-story-section";
import { SkillsSection } from "./sections/skills-section";
import { MemorySection } from "./sections/memory-section";
import { HumanInteractionSection } from "./sections/human-interaction-section";
import { AgentCollaborationSection } from "./sections/agent-collaboration-section";
import { ValidationPanel } from "./validation-panel";

// Agent-level configuration sections (sidebar)
const AGENT_CONFIG_SECTIONS = [
  {
    id: "human",
    label: "Human Interaction",
    icon: Users,
    description: "Overall interaction mode and escalation",
    component: HumanInteractionSection,
  },
  {
    id: "collaboration",
    label: "Agent Collaboration",
    icon: Users,
    description: "Multi-agent relationships",
    component: AgentCollaborationSection,
  },
  {
    id: "memory",
    label: "Memory & State",
    icon: Database,
    description: "Shared memory across skills",
    component: MemorySection,
  },
];

interface StoryFormProps {
  onSave?: () => void;
}

export function StoryForm({ onSave }: StoryFormProps) {
  const editor = useSnapshot(storyEditorStore);
  const [activeConfigSection, setActiveConfigSection] = useState<string | null>(null);

  // Check if a config section has content
  const sectionHasContent = (sectionId: string): boolean => {
    const data = editor.draft.data as Record<string, unknown>;
    switch (sectionId) {
      case "memory":
        const mem = data.memory as Record<string, unknown>;
        return !!mem?.workingMemory || ((mem?.persistentStores as unknown[]) || []).length > 0;
      case "human":
        return !!(data.humanInteraction as Record<string, unknown>)?.mode;
      case "collaboration":
        return !!(data.collaboration as Record<string, unknown>)?.role;
      case "guardrails":
        return ((data.guardrails as unknown[]) || []).length > 0;
      default:
        return false;
    }
  };

  // Render active config section
  const renderActiveConfigSection = () => {
    const section = AGENT_CONFIG_SECTIONS.find(s => s.id === activeConfigSection);
    if (section) {
      const Component = section.component;
      return <Component />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Validation errors */}
      {editor.draft.validationErrors.length > 0 && (
        <ValidationPanel errors={editor.draft.validationErrors} />
      )}

      {/* Core story section - Agent Identity */}
      <CoreStorySection />

      {/* Skills + Agent Config */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content: Skills */}
        <div className="space-y-6">
          <SkillsSection />
        </div>

        {/* Sidebar: Agent-level configuration */}
        <div className="space-y-4">
          <div className="sticky top-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Agent Configuration
                </CardTitle>
                <CardDescription className="text-xs">
                  Settings that apply to all skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {AGENT_CONFIG_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const hasContent = sectionHasContent(section.id);
                  const isActive = activeConfigSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveConfigSection(isActive ? null : section.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{section.label}</span>
                      {hasContent && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive && "rotate-90"
                      )} />
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Active config section panel */}
            {activeConfigSection && (
              <div className="mt-4">
                {renderActiveConfigSection()}
              </div>
            )}

            {/* Architecture summary */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Agent (WHO)
                  </div>
                  <p className="text-muted-foreground pl-4">
                    Identity, relationships, memory, guardrails
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Skills (WHAT + HOW)
                  </div>
                  <p className="text-muted-foreground pl-4">
                    Triggers, tools, behavior, acceptance criteria
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
