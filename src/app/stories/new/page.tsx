"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { StoryForm } from "@/components/story-editor";
import { storyEditorActions, useStoryEditor } from "@/stores";
import { useCreateStory } from "@/hooks";
import type { AgentStory } from "@/lib/schemas";

export default function NewStoryPage() {
  const router = useRouter();
  const editor = useStoryEditor();
  const createStory = useCreateStory();

  // Initialize new story on mount
  useEffect(() => {
    storyEditorActions.initNewStory("light");
    return () => {
      storyEditorActions.clearDraft();
    };
  }, []);

  const handleSave = async () => {
    const data = editor.draft.data as Partial<AgentStory>;

    // Basic validation
    if (!data.identifier || !data.name || !data.role || !data.action || !data.outcome) {
      return;
    }

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
              <Link href="/">
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

        {/* Form */}
        <StoryForm onSave={handleSave} />
      </div>
    </AppShell>
  );
}
