"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, User, Zap } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentSection, SkillsSection } from "@/components/story-editor";
import { ValidationPanel } from "@/components/story-editor/validation-panel";
import { storyEditorActions, useStoryEditor } from "@/stores";
import { useCreateStory } from "@/hooks";
import type { AgentStory } from "@/lib/schemas";
import { validateStory } from "@/lib/schemas";

export default function NewStoryPage() {
  const router = useRouter();
  const editor = useStoryEditor();
  const createStory = useCreateStory();

  // Initialize new story on mount
  useEffect(() => {
    storyEditorActions.initNewStory();
    return () => {
      storyEditorActions.clearDraft();
    };
  }, []);

  const handleSave = async () => {
    const data = editor.draft.data as Record<string, unknown>;

    // Run validation on save
    const result = validateStory(data);
    if (!result.valid) {
      storyEditorActions.setValidationErrors(
        result.errors.map((e) => ({ path: e.path, message: e.message }))
      );
      return;
    }

    // Clear any previous validation errors
    storyEditorActions.clearValidationErrors();

    try {
      storyEditorActions.setSaving(true);
      const newStory = await createStory.mutateAsync(data as Omit<AgentStory, "id" | "createdAt" | "updatedAt">);
      router.push(`/stories/${newStory.id}`);
    } finally {
      storyEditorActions.setSaving(false);
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/stories">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New Agent Story</h1>
              <p className="text-sm text-muted-foreground">
                Define your agent and its skills
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={editor.isSaving}
          >
            {editor.isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Story
              </>
            )}
          </Button>
        </div>

        {/* Validation errors */}
        {editor.draft.validationErrors.length > 0 && (
          <ValidationPanel errors={editor.draft.validationErrors} />
        )}

        {/* Agent/Skills Tabs */}
        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Agent
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Skills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-6">
            <AgentSection />
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <SkillsSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
