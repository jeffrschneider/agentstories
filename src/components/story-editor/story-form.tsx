"use client";

import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { validateStory } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoreStorySection } from "./sections/core-story-section";
import { TriggerSection } from "./sections/trigger-section";
import { BehaviorSection } from "./sections/behavior-section";
import { ReasoningSection } from "./sections/reasoning-section";
import { MemorySection } from "./sections/memory-section";
import { ToolsSection } from "./sections/tools-section";
import { SkillsSection } from "./sections/skills-section";
import { HumanInteractionSection } from "./sections/human-interaction-section";
import { AcceptanceSection } from "./sections/acceptance-section";
import { ValidationPanel } from "./validation-panel";

interface StoryFormProps {
  onSave?: () => void;
}

export function StoryForm({ onSave }: StoryFormProps) {
  const editor = useSnapshot(storyEditorStore);
  const isFullFormat = editor.draft.format === "full";

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
                variant={isFullFormat ? "outline" : "light"}
                className="cursor-pointer"
                onClick={() => storyEditorActions.changeFormat("light")}
              >
                Light
              </Badge>
              <Badge
                variant={isFullFormat ? "full-format" : "outline"}
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
              ? "Full format includes all 9 structured annotations for comprehensive agent specification."
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

      {/* Full format sections */}
      {isFullFormat && (
        <Tabs defaultValue="trigger" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="trigger">Trigger</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="human">Human</TabsTrigger>
            <TabsTrigger value="acceptance">Acceptance</TabsTrigger>
          </TabsList>

          <TabsContent value="trigger" className="mt-4">
            <TriggerSection />
          </TabsContent>

          <TabsContent value="behavior" className="mt-4">
            <BehaviorSection />
          </TabsContent>

          <TabsContent value="reasoning" className="mt-4">
            <ReasoningSection />
          </TabsContent>

          <TabsContent value="memory" className="mt-4">
            <MemorySection />
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <ToolsSection />
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <SkillsSection />
          </TabsContent>

          <TabsContent value="human" className="mt-4">
            <HumanInteractionSection />
          </TabsContent>

          <TabsContent value="acceptance" className="mt-4">
            <AcceptanceSection />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
