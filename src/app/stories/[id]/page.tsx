"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ValidationPanel } from "@/components/story-editor/validation-panel";
import { StoryPreview } from "@/components/story-preview";
import { TryItChat } from "@/components/story-editor/try-it-chat";
import { GeneratePanel } from "@/components/story-editor/generate-panel";
import { AgentWorkspace } from "@/components/agent-workspace";
import { storyEditorActions, useStoryEditor } from "@/stores";
import { useStory, useUpdateStory, useDeleteStory, useDuplicateStory } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AgentStory } from "@/lib/schemas";

export default function AgentWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Modal/sheet states
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const editor = useStoryEditor();
  const { data: story, isLoading } = useStory(id);
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const duplicateStory = useDuplicateStory();

  // Load story into editor when fetched
  useEffect(() => {
    if (story) {
      storyEditorActions.loadStory(story);
    }
    return () => {
      storyEditorActions.clearDraft();
    };
  }, [story]);

  const handleSave = async (updatedStory: AgentStory) => {
    try {
      storyEditorActions.setSaving(true);
      await updateStory.mutateAsync({ id, data: updatedStory });
      storyEditorActions.setLastSaved(new Date().toISOString());
      // Reload story into editor to keep in sync
      storyEditorActions.loadStory(updatedStory);
    } finally {
      storyEditorActions.setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteStory.mutateAsync({ id, name: story?.name || 'Untitled' });
    router.push("/stories");
  };

  const handleDuplicate = async () => {
    const duplicated = await duplicateStory.mutateAsync(id);
    if (duplicated) {
      router.push(`/stories/${duplicated.id}`);
    }
  };

  // Get current story data
  const currentStoryData = editor.draft.data as AgentStory;

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!story) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <h1 className="text-2xl font-bold">Story not found</h1>
          <p className="text-muted-foreground mt-2">
            The story you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/stories">Go back to stories</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Validation errors */}
        {editor.draft.validationErrors.length > 0 && (
          <div className="px-6 py-2 shrink-0">
            <ValidationPanel errors={editor.draft.validationErrors} />
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 min-h-0">
          <AgentWorkspace
            story={currentStoryData}
            onSave={handleSave}
            onTest={() => setIsTestOpen(true)}
            onGenerate={() => setIsGenerateOpen(true)}
            onPreview={() => setIsPreviewOpen(true)}
            onDuplicate={handleDuplicate}
            onDelete={() => setIsDeleteOpen(true)}
            isSaving={editor.isSaving}
          />
        </div>
      </div>

      {/* Test Agent Sheet */}
      <Sheet open={isTestOpen} onOpenChange={setIsTestOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Test Agent</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)]">
            <TryItChat story={currentStoryData} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Generate Panel Sheet */}
      <Sheet open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Generate Configurations</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GeneratePanel story={currentStoryData} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {currentStoryData.id ? (
              <StoryPreview story={currentStoryData} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Loading preview...
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{story.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
