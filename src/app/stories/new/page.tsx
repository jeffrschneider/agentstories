"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Upload, Pencil } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryForm } from "@/components/story-editor";
import { ImportPanel } from "@/components/story-preview";
import { storyEditorActions, useStoryEditor } from "@/stores";
import { useCreateStory } from "@/hooks";
import type { AgentStory } from "@/lib/schemas";

export default function NewStoryPage() {
  const router = useRouter();
  const editor = useStoryEditor();
  const createStory = useCreateStory();
  const [activeTab, setActiveTab] = useState("create");

  // Initialize new story on mount
  useEffect(() => {
    storyEditorActions.initNewStory("light");
    return () => {
      storyEditorActions.clearDraft();
    };
  }, []);

  const handleSave = async () => {
    const data = editor.draft.data as Record<string, unknown>;
    const format = editor.draft.format;

    // Basic validation based on format
    const hasBaseFields = data.identifier && data.name && data.role;

    if (format === 'light') {
      // Light format needs action and outcome
      if (!hasBaseFields || !data.action || !data.outcome) {
        return;
      }
    } else {
      // Full format needs purpose and at least one skill
      const skills = data.skills as unknown[];
      if (!hasBaseFields || !data.purpose || !skills || skills.length === 0) {
        return;
      }
    }

    try {
      storyEditorActions.setSaving(true);
      const newStory = await createStory.mutateAsync(data as Omit<AgentStory, "id" | "createdAt" | "updatedAt">);
      router.push(`/stories/${newStory.id}`);
    } finally {
      storyEditorActions.setSaving(false);
    }
  };

  const handleImport = async (importedData: Partial<AgentStory>) => {
    // Load the imported data into the editor
    const now = new Date().toISOString();
    const storyData = {
      ...importedData,
      version: importedData.version || "1.0",
      createdAt: now,
      updatedAt: now,
    };

    // Update the draft with imported data
    Object.entries(storyData).forEach(([key, value]) => {
      if (value !== undefined) {
        storyEditorActions.updateDraft(key as keyof AgentStory, value as AgentStory[keyof AgentStory]);
      }
    });

    // Switch to create tab to show the imported data
    setActiveTab("create");
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
              <h1 className="text-2xl font-bold tracking-tight">New Story</h1>
              <p className="text-sm text-muted-foreground">
                Create a new agent story specification
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={editor.isSaving || editor.draft.validationErrors.length > 0}
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

        {/* Tabs for Create/Import */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <StoryForm onSave={handleSave} />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <ImportPanel onImport={handleImport} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
